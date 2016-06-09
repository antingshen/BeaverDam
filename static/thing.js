class Thing {
    constructor(fill = Thing.getRandomColor()) {
        this.keyframes = []; // List of boxes corresponding to keyframes
        this.fill = fill;
        this.id = this.fill;
        document.getElementById("shape-list").innerHTML +=
            `<li class="list-group-item col-xs-6" id=${this.fill} style="color: azure; background-color: ${this.fill}; width: 57px">Car</li>`;
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

    /* gets keyframe for current frame if exists, otherwise construct a fake/interpolated one */
    getKeyframe(frame) {
        var prevFrame = null;
        var prevBox = null;
        for (var currBox of this.keyframes) {
            let currFrame = currBox.frame;
            if (frame == currFrame) {
                return currBox;
            } else if (prevFrame == null && frame < currFrame) {
                return null;
            } else if (prevFrame < frame && frame < currFrame) {
                return this.interpolate(prevBox, currBox, frame);
            }
            prevFrame = currFrame;
            prevBox = currBox;
        }
        return currBox.interpolated_copy(frame);
    }

    /* returns a linear interpolation between two boxes at frame. */
    interpolate(box1, box2, frame) {
        var x, y, w, h, delta;
        delta = (frame - box1.frame) / (box2.frame - box1.frame);
        x = box1.x + (box2.x - box1.x) * delta;
        y = box1.y + (box2.y - box1.y) * delta;
        h = box1.h + (box2.h - box1.h) * delta;
        w = box1.w + (box2.w - box1.w) * delta;
        return new Box(this, frame, x, y, w, h, true);
    }

    /* replace existing ones if necessary */
    insertKeyframe(keyframe) {
        var prevFrame = null;
        for (let [idx, box] of this.keyframes.entries()) {
            if (box.frame == keyframe.frame) {
                this.keyframes[idx] = keyframe;
                return;
            } else if ((prevFrame == null && keyframe.frame < box.frame) 
                    || (prevFrame < keyframe.frame && keyframe < box.frame)) {
                this.keyframes.splice(idx, 0, keyframe);
                return;
            }
        }
        this.keyframes.push(keyframe);
    }

    /* returns true if this.keyframes is emptied, else false */
    deleteKeyframe(keyframe) {
        for (let [idx, box] of this.keyframes.entries()) {
            if (box === keyframe) {
                this.keyframes.splice(idx, 1);
            }
        }
        return this.keyframes.length == 0;
    }
}
