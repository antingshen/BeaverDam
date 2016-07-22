"use strict";

var Misc = {
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

    CustomPromise: function() {
        function cond() {
            return cond.promise;
        }
        cond.promise = new Promise((resolve, reject) => {
            cond.resolve = resolve;
            cond.reject = reject;
        });
        return cond;
    },
};

void Misc;
