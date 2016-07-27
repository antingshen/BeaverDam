"use strict";


class Player {
    constructor({$container, videoSrc, videoId}) {
        this.$container = $container;
        
        this.videoId = videoId;

        this.selectedThing = null;

        this.things = null;

        this.thingRectBindings = [];

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

        // Prevent adding new properties
        Misc.preventExtensions(this, Player);

        this.initAnnotations();
        this.initView();
        this.initHandlers();
    }


    // Init ALL the things!
    
    initView() {
        var {$container, videoSrc} = this;

        this.view = new PlayerView({$container, videoSrc});

        this.view.ready().then(this.viewReady.resolve);
    }

    initAnnotations() {
        DataSources.annotations.load(this.videoId).then((things) => {
            this.things = things;
            this.annotationsDataReady.resolve();
        });

        // When this.things is loaded AND view is ready for drawing...
        Promise.all([this.annotationsDataReady(), this.viewReady()]).then(() => {
            for (let thing of this.things) {
                let rect = this.view.addRect();
                rect.fill = thing.fill;
                this.initBindThingAndRect(thing, rect);
            }

            $(this).triggerHandler('change-onscreen-annotations');
            $(this).triggerHandler('change-keyframes');

            this.annotationsReady.resolve();
        });
    }

    initBindThingAndRect(thing, rect) {
        // On PlayerView...

        this.thingRectBindings.push({thing, rect});


        // On Rect...

        $(rect).on('discrete-change', (e, bounds) => {
            thing.updateKeyframe({
                time: this.view.video.currentTime,
                bounds: bounds,
            });
            $(this).triggerHandler('change-onscreen-annotations');
            $(this).triggerHandler('change-keyframes');
        });

        $(rect).on('select', () => {
            this.selectedThing = thing;
            $(this).triggerHandler('change-keyframes');
        });

        $(rect).on('drag-start', () => {
            this.view.video.pause();
        });

        $(rect).on('focus', () => {
            this.selectedThing = thing;
            $(this).triggerHandler('change-onscreen-annotations');
            $(this).triggerHandler('change-keyframes');
        });


        // On Thing...

        $(thing).on('change delete', () => {
            rect.appear({singlekeyframe: thing.keyframes.length === 1});
        });
        $(thing).triggerHandler('change');

        $(thing).on('delete', () => {
            $(thing).off();
            $(rect).off();
            this.view.deleteRect(rect);
        });
    }

    initHandlers() {
        // Drawing things
        $(this).on('change-onscreen-annotations', () => {
            this.drawOnscreenAnnotations();
        });

        $(this).on('change-keyframes', () => {
            this.drawKeyframes();
        });


        // Submitting
        // TODO doesn't respect scope
        $('#submit-btn').click(this.submitAnnotations.bind(this));

        $(this).on('change-verification', this.updateVerifiedButton.bind(this));
        $(this).triggerHandler('change-verification');

        $('#verified-btn').click(this.submitVerified.bind(this));


        // On drawing changed
        this.viewReady().then(() => {
            $(this.view.creationRect).on('drag-start', () => {
                this.view.video.pause();
            });

            $(this.view.video).on('timeupdate', () => {
                $(this).triggerHandler('change-onscreen-annotations');
            });

            $(this.view).on('create-rect', (e, rect) => {
                this.addThingAtCurrentTimeFromRect(rect);
                rect.focus();
                $(this).triggerHandler('change-keyframes');
            });

            $(this.view).on('delete-keyframe', () => {
                this.view.video.pause();
                this.deleteSelectedKeyframe();
                $(this).triggerHandler('change-onscreen-annotations');
                $(this).triggerHandler('change-keyframes');
            });

        });
    }


    // Draw something

    drawOnscreenAnnotations() {
        for (let {thing, rect} of this.thingRectBindings) {
            this.drawThingOnRect(thing, rect);
        }
    }

    drawKeyframes() {
        this.view.keyframebar.resetWithDuration(this.view.video.duration);
        if (this.selectedThing != null) {
            for (let keyframe of this.selectedThing.keyframes) {
                this.view.keyframebar.addKeyframeAt(keyframe.time);
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

        var mturk = window.assignmentId != null;
        e.preventDefault();
        DataSources.annotations.save(this.videoId, this.things, mturk).then((response) => {
            window.alert(response);
        });
    }

    updateVerifiedButton() {
        if (window.video.verified) {
            $('#verified-btn').text('Verified').addClass('btn btn-success').removeClass('btn-danger');
        }
        else {
            $('#verified-btn').text('Not Verified').addClass('btn btn-danger').removeClass('btn-success');
        }
    }

    submitVerified() {
        return fetch(`/video/${this.videoId}/verify/`, {
            headers: {
                'X-CSRFToken': window.CSRFToken,
                'Content-Type': 'application/json',
            },
            credentials: 'same-origin',
            method: 'post',
            body: (!window.video.verified).toString(),
        }).then((response) => {
            if (response.ok) {
                window.video.verified = !window.video.verified;
                $(this).triggerHandler('change-verification');
            }
            return response.text();
        }).then((text) => console.log(text));
    }

    addThingAtCurrentTimeFromRect(rect) {
        var thing = Thing.newFromCreationRect();
        thing.updateKeyframe({
            time: this.view.video.currentTime,
            bounds: rect.bounds
        });
        this.things.push(thing);
        rect.fill = thing.fill;
        this.initBindThingAndRect(thing, rect);
    }

    deleteThing(thing) {
        if (thing == null) return false;

        if (thing == this.selectedThing) {
            this.selectedThing = null;
        }

        for (let i = 0; i < this.things.length; i++) {
            if (this.things[i] === thing) {
                thing.delete();
                this.things.splice(i, 1);
                this.thingRectBindings.splice(i, 1);
                return true;
            }
        }

        throw new Error("Player.deleteThing: thing not found");
    }

    deleteSelectedKeyframe() {
        if (this.selectedThing == null) return false;

        this.selectedThing.deleteKeyframeAtTime(this.view.video.currentTime);

        if (this.selectedThing.keyframes.length === 0) {
            this.deleteThing(this.selectedThing);
        }

        return true;
    }
}

void Player;
