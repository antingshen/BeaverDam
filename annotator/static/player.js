"use strict";


class Player {
    constructor({$container, videoSrc, annotationsId}) {
        this.$container = $container;
        
        this.annotationsId = annotationsId;

        this.selectedThing = null;

        this.things = null;

        this.videoSrc = videoSrc;

        this.view = null;

        // Promises
        this.annotationsDataReady = Misc.CustomPromise();
        this.annotationsReady = Misc.CustomPromise();
        this.viewReady = Misc.CustomPromise();

        // We're ready when all the components are ready.
        this.ready = Misc.CustomPromiseAll(
            this.annotationsReady(),
            this.viewReady()
        );

        // Prevent adding new properties after this thread finishes.
        $(this).on('dummy', $.noop);
        Object.seal(this);


        this.initAnnotations();
        this.initView();
    }


    // Init ALL the things!
    
    initView() {
        var {$container, videoSrc} = this;

        this.view = new PlayerView({$container, videoSrc});

        this.view.ready().then(this.viewReady.resolve);
    }

    initAnnotations() {
        DataSources.annotations.load(this.annotationsId).then((things) => {
            this.things = things;
            this.annotationsDataReady.resolve();
        });

        // When this.things is loaded AND view is ready for drawing...
        Promise.all([this.annotationsDataReady(), this.viewReady()]).then(() => {
            for (let thing of this.things) {
                let rect = this.view.addRect();
                this.initBindThingAndRect(thing, rect);
            }

            $(this.video).triggerHandler('timeupdate');

            this.annotationsReady.resolve();
        });
    }

    initBindThingAndRect(thing, rect) {
        $(rect).on('discrete-change', (e, bounds) => {
            thing.updateKeyframe({
                time: this.view.video.currentTime,
                bounds: bounds,
            });
            $(this).triggerHandler('change-onscreen-annotations');
        });

        $(rect).on('select', () => {
            this.selectedThing = thing;
            $(this).triggerHandler('change-keyframes');
        });

        $(this).on('change-onscreen-annotations', () => {
            this.drawThingOnRect(thing, rect);
        });

        $(thing).on('delete', () => {
            this.view.deleteRect(rect);
        });
    }

    initHandlers() {
        $(this.view).$on('video', 'timeupdate', () => {
            $(this).triggerHandler('change-onscreen-annotations');
        });

        $(this).on('change-keyframes', () => {
            $(this).drawKeyframes();
        });
    }


    // Draw something

    drawKeyframes() {
        this.keyframebar.resetWithDuration(this.view.video.duration);
        if (this.selectedThing != null) {
            for (let keyframe of this.selectedThing.keyframes) {
                this.keyframebar.addKeyframeAt(keyframe.time);
            }
        }
    }

    drawThingOnRect(thing, rect) {
        var time = this.view.video.currentTime;
        var {bounds, prevIndex, nextIndex, closestIndex} = thing.getFrameAtTime(time);

        rect.appear({
            real: closestIndex != null || (prevIndex != null && nextIndex != null),
            selected: this.selectedThing === thing,
        });

        // Don't fuck up our drag
        if (rect.isBeingDragged()) return;

        rect.bounds = bounds;
    }


    // Actions

    submitAnnotations(e) {
        e.preventDefault();

        // TODO magic number
        this.saveAnnotations(window.assignmentId.length > 4).then((response) => {
            $('#response').html(response);
        });
    }

    deleteThing(thing) {
        if (thing == null) return false;

        for (let i = 0; i < this.things.length; i++) {
            if (this.things[i] === thing) {
                thing.delete();
                this.things.splice(i, 1);
                return true;
            }
        }

        // throw new Error()
    }

    deleteSelectedKeyframe() {
        if (this.selectedThing == null) return false;

        this.selectedThing.deleteKeyframeAtTime(this.video.currentTime);
        return true;
    }
}

void Player;
