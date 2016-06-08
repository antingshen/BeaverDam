class Thing {
    constructor(fill = 'rgba(0,255,0,.6)') {
        this.keyframes = []; // List of boxes corresponding to keyframes
        this.fill = fill
    }

    /* gets keyframe for current frame if exists, otherwise construct a fake/interpolated one */
    getKeyframe(frame) {
        // TODO
    }

    /* replace existing ones if necessary */
    insertKeyframe(keyframe) {
        // TODO
    }

    /* returns true if the last keyframe was deleted, else false */
    deleteKeyframe(keyframe) {
        // TODO
    }
}
