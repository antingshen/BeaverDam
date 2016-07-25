"use strict";


class Keyframebar {
    constructor({classBaseName}) {
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

    keyframeSvg() {
        return `
        <svg height="100" width="100" class="${this.classBaseName.add('keyframe')}" style="left: 0%;" viewBox="0 0 100 100" preserveAspectRatio="xMaxYMax">
            <circle cx="50" cy="50" r="30" stroke="black" stroke-width="0" fill="orange"></circle>
        </svg>`;
    }

    resetWithDuration(duration) {
        this.$container.empty();

        this.duration = duration;
    }

    addKeyframeAt(time) {
        let frac = time / this.duration;

        $(this.keyframeSvg()).click(() => {
            $(this).triggerHandler('jump-to-time', time);
        }).css({
            'left': `${frac * 100}%`
        }).appendTo(this.$container);
    }
}

void Keyframebar;
