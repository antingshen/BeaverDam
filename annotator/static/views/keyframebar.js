"use strict";


class Keyframebar {
    constructor({className}) {
        // Prevent adding new properties after this thread finishes.
        // Note: If the setTimeout is removed, child classes will error.
        setTimeout(() => Object.seal(this), 0);

        this.className = className;

        // Duration of the video
        this.duration = 0;
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
        <svg height="100" width="100" class="${this.className}" style="left: 0%;" viewBox="0 0 100 100" preserveAspectRatio="xMaxYMax">
            <circle cx="50" cy="50" r="30" stroke="black" stroke-width="0" fill="orange"></circle>
        </svg>`;
    }

    resetWithDuration(duration) {
        this.$container.empty();

        this.duration = duration;
    }

    addKeyframeAt(time) {
        let frac = time / this.duration;

        $(this.KEYFRAME_SVG).click(() => {
            $(this).triggerHandler('jump-to-time', time);
        }).css({
            'left': `${frac * 100}%`
        }).appendTo(this.$container);
    }
}

void Keyframebar;
