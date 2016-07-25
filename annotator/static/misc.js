"use strict";

var Misc = {
    // Styling

    getRandomColor: function() {
        var letters = '012345'.split('');
        var color = '#';
        color += letters[Math.round(Math.random() * 5)];
        letters = '0123456789ABCDEF'.split('');
        for (var i = 0; i < 5; i++) {
            color += letters[Math.round(Math.random() * 15)];
        }
        return color;
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
            // Prevent adding new properties
            $(obj).on('dummy', $.noop);
            $(obj).data('dummy', null);
            Object.preventExtensions(obj);
            // $(obj).off('dummy', $.noop);
        }
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
};

void Misc;
