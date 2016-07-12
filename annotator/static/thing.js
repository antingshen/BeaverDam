"use strict";

class Thing {
    constructor(player, fill = Thing.getRandomColor()) {
        this.keyframes = []; // List of boxes corresponding to keyframes
        this.fill = fill;
        this.id = this.fill;
        this.type = document.querySelector('input[name = "object"]:checked').value;
        this.player = player;
        this.drawing = new ThingDrawing(player, this);
    }

    static frameFromJson(json) {
        return {
            bounds: Bounds.fromAttrs({
                x: json.x,
                y: json.y,
                width: json.w,
                height: json.h,
            }),
            time: json.frame,
        };
    }

    static fromJson(json, player) {
        var thing = new Thing(player);
        thing.keyframes = json.keyframes.map(this.frameFromJson);
        thing.type = json.type;
        return thing;
    }

    static frameToJson(frame) {
        var attr = Bounds.toAttrs(frame.bounds);
        return {
            x: attr.x,
            y: attr.y,
            w: attr.width,
            h: attr.height,
            frame: frame.time,
        };
    }

    static toJson(thing) {
        return {
            keyframes: thing.keyframes.map(this.frameToJson),
            type: thing.type,
        };
    }

    static getRandomColor() {
        var letters = '012345'.split('');
        var color = '#';
        color += letters[Math.round(Math.random() * 5)];
        letters = '0123456789ABCDEF'.split('');
        for (var i = 0; i < 5; i++) {
            color += letters[Math.round(Math.random() * 15)];
        }
        return color;
    }

    drawAtTime(time) {
        this.player.videoLoaded().then(() => this.drawing.addToPaper());
        var {bounds} = this.getFrameAtTime(time * 1000);

        // Don't fuck up our drag
        if (this.drawing.isBeingDragged()) return;

        this.drawing.setBounds(bounds);
        this.drawing.setSelected(this.player.selectedThing === this);
    }


    /**
     * A "frame" is the interpolation of the two closest keyframes. It tells us:
     * - The previous and next keyframes
     * - If there is a keyframe close enough (<= sameFrameThreshold away) to be considered the same frame
     * - The bounds for the thing at this time
     */
    getFrameAtTime(time) {
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

        var sameFrameThreshold = 0.1;

        var closest = this.keyframes[closestIndex];
        if (Math.abs(closest.time - time) > sameFrameThreshold)
            closestIndex = null;

        return {
            time: time,
            bounds: bounds,
            prevIndex: prevIndex,
            nextIndex: nextIndex,
            closestIndex: closestIndex,
            closest: (closestIndex == null) ? null : this.keyframes[closestIndex]
        };
    }

    /* Insert or update keyframe at time. */
    updateKeyframeAtTime(frame) {
        console.info("update", this.id, frame);

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
                this.keyframes.splice(prevIndex, 0, frame);
            }

            this.player.drawKeyframebar();
        }
    }

    deleteKeyframeAtTime(frame) {
        var {closestIndex} = this.getFrameAtTime(frame.time);

        if (closestIndex == null) return false;

        this.keyframes.splice(closestIndex, 1);

        this.player.drawKeyframebar();
        return true;
    }
}

void Thing;
