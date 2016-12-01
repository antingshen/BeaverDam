"use strict";
/* globals randomColor */

var Misc = {
    // Styling
    numberOfColorsPerType: 25,
    typeToColorSet: {},
    colorSet: ['red', 'blue', 'green', 'purple', 'yellow', 'monochrome'],
    getRandomColor: function(type) {
        var numberOfObjects = Object.keys(this.typeToColorSet).length;
        var numberOfColors = this.colorSet.length;
        if (this.typeToColorSet[type] === undefined) {
          this.typeToColorSet[type] = randomColor({hue: this.colorSet[numberOfObjects % numberOfColors], count: this.numberOfColorsPerType});
        }
        return this.typeToColorSet[type][parseInt(Math.random() * this.numberOfColorsPerType)];
    },

    ClassNameGenerator: class {
        constructor(className) {
            this.className = className;
        }

        add(classNameExtension) {
            var This = this.constructor;
            return new This(`${this.className}-${classNameExtension}`);
        }

        toString() {
            return this.className;
        }

        toSelector() {
            return `.${this.className}`;
        }
    },

    // This function looks complicated but the idea isn't. Here's what it does:
    //  If we call this.setClassNameExts({selected: true, active: false})
    //  Then this.classNameExtBooleans would change this way:
    //      old: this.classNameExtBooleans = {real: true, selected: false}
    //      new: this.classNameExtBooleans = {real: true, selected: true, active: false}
    // 
    // And this will have the the following DOM class:
    //      player-rect player-rect-real player-rect-selected player-rect-noactive
    getClassNamesFromExts(classNames, classBaseName, classNameExtBooleans) {
        for (let ext of Object.keys(classNameExtBooleans)) {
            switch (classNameExtBooleans[ext]) {
                case true:
                    classNames.push(classBaseName.add(ext));
                    break;
                case false:
                    classNames.push(classBaseName.add('no' + ext));
                    break;
                default:
                    throw new TypeError(`Misc.getClassNamesFromExts: invalid key ${ext}`);
            }
        }
        return classNames;
    },


    // Objects and hashes

    assignNonNull: function(target, obj) {
        for (let key of Object.keys(obj)) {
            if (obj[key] == null) continue;
            target[key] = obj[key];
        }
        return target;
    },

    hashEnsure: function(obj, spec) {
        for (let key of Object.keys(spec)) {
            switch (spec[key]) {
                case 'exists':
                    if (key in obj) break;
                    throw new Error(`Misc.hashEnsure: ${obj} doesn't have key ${key}`);
                case 'notnull':
                    if (obj[key] != null) break;
                    throw new Error(`Misc.hashEnsure: ${obj} has null key ${key}`);
                default:
                    throw new Error(`Misc.hashEnsure: spec ${spec} has invalid key ${key}`);
            }
        }
        return obj;
    },

    preventExtensions: function(obj, classObj) {
        if (obj == null) {
            throw new TypeError("Misc.preventExtensions: invalid arguments");
        }

        if (classObj != null && !(obj instanceof classObj)) {
            throw new TypeError("Misc.preventExtensions: You probably passed in the wrong classObj");
        }

        if (classObj == null || obj.constructor == classObj) {
            try {
                // Prevent adding new properties
                $(obj).on('dummy', $.noop);
                $(obj).data('dummy', null);
                Object.preventExtensions(obj);
                // $(obj).off('dummy', $.noop);
            }
            catch (e) {
                window.$0 = obj;
                console.error("Could not prevent this object ($0) from being extended:", obj);
                throw e;
            }
        }
    },

    customAssign: function(target, constants, settings) {
        for (let key of Object.keys(constants)) {
          let value = constants[key];
                    Object.defineProperty(target, key, Object.assign({value}, settings));
        }
        return target;
    },

    mixinClassConstants: function(target, constants) {
      var configurable = false;
      var writable = false;
      Misc.customAssign(target, constants, {configurable, writable, enumerable: true});
      Misc.customAssign(target.prototype, constants, {configurable, writable, enumerable: false});
    },


    // Control flow

    CustomPromise: function() {
        var promise;

        function cond() {
            return promise;
        }

        cond.state = 'pending';

        promise = new Promise((resolve, reject) => {
            cond.resolve = () => {
                cond.state = 'fulfilled-ish';
                resolve(...arguments);
                cond.state = 'fulfilled';
            };
            cond.reject = () => {
                cond.state = 'rejected-ish';
                reject(...arguments);
                cond.state = 'rejected';
            };

            Object.seal(cond);
        });

        return cond;
    },

    CustomPromiseAll: function(...promises) {
        var cond = Misc.CustomPromise();
        Promise.all(promises).then(cond.resolve, cond.reject);
        return cond;
    },


    // UI

    metaKeyIsCmd: function() {
        return !!navigator.platform.match(/^(Mac|iPhone|iPod|iPad)/i);
    },

    fireEventByKeyCode: function(e) {

        if (e === window || e === Misc) {
            throw new Error("Misc.fireEventByKeyCode: incorrectly bound");
        }

        var keyName = Misc.keyNamesByCode[e.keyCode];
        if (keyName == null) return;
        var eventType = e.type.replace(/^keydown$/, 'keydn');

        var alreadyDown = false;
        // Prevent the browser from firing multiple keydown events
        if (eventType === 'keydn') {
            alreadyDown = ($(this).data('preventKeydownFor') === keyName);

            $(this).data('preventKeydownFor', keyName);
        }
        else if (eventType === 'keyup') {
            $(this).data('preventKeydownFor', null);
        }


        let words = [];
        if (e.ctrlKey)  words.push('ctrl');
        if (e.altKey)   words.push('alt');
        if (e.shiftKey) words.push('shift');
        if (e.metaKey)  words.push('meta');
        words.push(keyName);
        if (alreadyDown)
            Misc.fireSubEvent.call(this, e, `${eventType}r-${words.join('-')}`);
        else
            Misc.fireSubEvent.call(this, e, `${eventType}-${words.join('-')}`);

        var cmdKey = Misc.metaKeyIsCmd() ? e.metaKey : e.ctrlKey;
        if (cmdKey) {
            let words = [];
            if (e.altKey)   words.push('alt');
            if (e.shiftKey) words.push('shift');
            words.push('cmd');
            words.push(keyName);
            Misc.fireSubEvent.call(this, e, `${eventType}-${words.join('-')}`);
        }
    },

    fireSubEvent(originalEvent, eventType) {
        var event = $.Event(eventType);
        $(this).triggerHandler(event);
        if (event.isDefaultPrevented()) {
            originalEvent.preventDefault();
        }
    },

    keyNamesByCode: {
          8: "backspace",
          9: "tab",
         13: "enter",
         32: "space",
         37: "arrowleft",
         38: "arrowup",
         39: "arrowright",
         40: "arrowdown",
         46: "delete",
         48: "0",
         49: "1",
         50: "2",
         51: "3",
         52: "4",
         53: "5",
         54: "6",
         55: "7",
         56: "8",
         57: "9",
         65: "a",
         66: "b",
         67: "c",
         68: "d",
         69: "e",
         70: "f",
         71: "g",
         72: "h",
         73: "i",
         74: "j",
         75: "k",
         76: "l",
         77: "m",
         78: "n",
         79: "o",
         80: "p",
         81: "q",
         82: "r",
         83: "s",
         84: "t",
         85: "u",
         86: "v",
         87: "w",
         88: "x",
         89: "y",
         90: "z",
        186: "semicolon",
        187: "equals",
        188: "comma",
        189: "dash",
        190: "period",
        191: "slash",
        192: "grave",
        219: "bracketleft",
        220: "backslash",
        221: "bracketright",
        222: "singlequote",
    },
};

void Misc;
