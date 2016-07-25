"use strict";


class Thing {
    // Constants. ES6 doesn't support class constants yet, so we'll declare
    // them this way for now:

    // Are we at a keyframe or in betwen keyframes? If we're less than
    // SAME_FRAME_THRESHOLD away from the closest keyframe, then we're at that
    // keyframe.
    get SAME_FRAME_THRESHOLD() {
        return 0.1 /* seconds */;
    }


    constructor({fill, id, keyframes, type}) {
        // Fill of thing
        this.fill = fill;

        // ID of thing
        this.id = id;

        // Keyframes of thing
        this.keyframes = keyframes;

        // Type of thing
        this.type = type;

        // Prevent adding new properties
        Misc.preventExtensions(Thing, this);
    }

    // The hacky but only way to make a Thing right now.
    static newFromCreationRect() {
        var fill = Misc.getRandomColor();
        return new Thing({
            keyframes: [],
            fill: fill,
            id: fill,
            type: document.querySelector('input[name = "object"]:checked').value,
        });
    }


    /**
     * A "frame" is the interpolation of the two closest keyframes. It tells us:
     * - The previous and next keyframes
     * - If we're "at" (<= this.SAME_FRAME_THRESHOLD away from) a keyframe
     * - The bounds for the thing at this time
     */
    getFrameAtTime(time) {
        if (!this.keyframes.length) {
            return {
                time: time,
                bounds: null,
                prevIndex: null,
                nextIndex: null,
                closestIndex: null,
            };
        }


        var prevIndex = null;
        var nextIndex = null;
        for (let i = 0; i < this.keyframes.length; i++) {
            let keyframe = this.keyframes[i];

            if (keyframe.time <= time) {
                prevIndex = i;
            }
            else if (keyframe.time >= time) {
                nextIndex = i;
                break;
            }
        }

        var bounds, closestIndex;
        // Before first keyframe
        if (prevIndex == null) {
            closestIndex = nextIndex;
            bounds = this.keyframes[nextIndex].bounds;
        }
        // After last keyframe
        else if (nextIndex == null) {
            closestIndex = prevIndex;
            bounds = this.keyframes[prevIndex].bounds;
        }
        // Between keyframes
        else {
            let prev = this.keyframes[prevIndex];
            let next = this.keyframes[nextIndex];
            let frac = (time - prev.time) / (next.time - prev.time);
            closestIndex = frac <= 0.5 ? prevIndex : nextIndex;
            bounds = Bounds.interpolate(prev.bounds, next.bounds, frac);
        }

        var closest = this.keyframes[closestIndex];
        if (Math.abs(closest.time - time) > this.SAME_FRAME_THRESHOLD)
            closestIndex = null;

        return {
            time: time,
            bounds: bounds,
            prevIndex: prevIndex,
            nextIndex: nextIndex,
            closestIndex: closestIndex,
        };
    }

    /* Insert or update keyframe at time. */
    updateKeyframe(frame) {
        var {prevIndex, nextIndex, closestIndex} = this.getFrameAtTime(frame.time);

        // Update the closestIndex-th frame
        if (closestIndex != null) {
            this.keyframes[closestIndex] = frame;
        }
        // Add a new frame
        else {
            // Protip: Shift and unshift are like push and pop except they
            // operate on the front of the array. If you ever forget which one
            // is which, just take away the "f" from their name and it'll be
            // super clear.
            if (prevIndex == null) {
                this.keyframes.unshift(frame);
            }

            // The "else" case handles this case but explicitly writing it out
            // anyway for consistency and symmertry.
            else if (nextIndex == null) {
                this.keyframes.push(frame);
            }

            else {
                this.keyframes.splice(prevIndex + 1, 0, frame);
            }

            // Trigger event
            $(this).triggerHandler('change');
        }
    }

    deleteKeyframeAtTime(time) {
        var {closestIndex} = this.getFrameAtTime(time);

        if (closestIndex == null) return false;

        this.keyframes.splice(closestIndex, 1);

        // Trigger event
        $(this).triggerHandler('change');

        return true;
    }

    // Delete the entire thing
    delete() {
        $(this).triggerHandler('delete');
    }
}

void Thing;
