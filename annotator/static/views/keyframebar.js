"use strict";


// Constants. ES6 doesn't support class constants yet, thus this hack.
var KeyframebarConstants = {
    KEYFRAME_SVG: 
        `<svg viewBox="0 0 100 100" preserveAspectRatio="xMaxYMax">
            <circle cx="50" cy="50" r="30"></circle>
        </svg>`,
};


class Keyframebar {
    constructor({classBaseName}) {
        // This container of the keyframe bar
        this.$container = null;

        // Namespaced className generator
        this.classBaseName = classBaseName.add('keyframebar');

        // Duration of the video
        this.duration = 0;

        // Prevent adding new properties
        $(this).on('dummy', $.noop);
        Object.preventExtensions(this, Keyframebar);
    }

    attach($container) {
        // Don't add twice
        if (this.$container != null) {
            throw new Error("Keyframebar.attach: already attached to container");
        }

        // Actually do the attaching
        this.$container = $container;

        // Apply appearance
        this.resetWithDuration(0);

        // Trigger event
        $(this).triggerHandler('attach', this.$container);

        return this;
    }

    detach() {
        this.$container.empty();

        // Trigger event
        $(this).triggerHandler('detach', this.$container);

        this.$container = undefined;

        return this;
    }

    resetWithDuration(duration) {
        this.$container.empty();

        this.duration = duration;
    }

    addKeyframeAt(time, classNameExtBooleans) {
        var frac = time / this.duration;
        var classBaseName = this.classBaseName.add('keyframe');
        var classNames = Misc.getClassNamesFromExts([classBaseName], classBaseName, classNameExtBooleans);

        $(this.KEYFRAME_SVG)
        .attr({class: classNames.join(' ')})
        .css({'left': `${frac * 100}%`})
        .click(() => { $(this).triggerHandler('jump-to-time', time); })
        .appendTo(this.$container);
    }
}

// Mix-in constants
Misc.mixinClassConstants(Keyframebar, KeyframebarConstants);
void Keyframebar;
