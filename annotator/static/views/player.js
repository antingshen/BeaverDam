"use strict";


class PlayerView {
    // Constants. ES6 doesn't support class constants yet, so we'll declare
    // them this way for now:

    // Value of .player-control-scrubber[max]
    get CONTROL_SCRUBBER_GRANULARITY() {
        return 10000;
    }

    // How often the UI updates the displayed time
    get TIME_UPDATE_DELAY() {
        return 30 /* ms */;
    }

    //

    constructor({$container, videoSrc}) {
        // This container of the player
        this.$container = $container;

        // The Raphael paper (canvas) for annotations
        this.$paper = null;

        // The invisible rect that receives drag events not targeted at speciifc 
        this.creationRect = null;

        // The keyframebar
        this.keyframebar = null;

        // Timer id used to increate <video>.on('timeupdate') frequency
        this.manualTimeupdateTimerId = null;

        // The rects
        this.rects = null;

        // The <video> object
        this.video = null;

        // Video URL
        this.videoSrc = videoSrc;

        // Promises
        this.keyframebarReady = Misc.CustomPromise();
        this.paperReady = Misc.CustomPromise();
        this.videoReady = Misc.CustomPromise();

        // We're ready when all the components are ready.
        this.ready = Promise.all([
            this.keyframebarReady(),
            this.paperReady(),
            this.videoReady(),
        ]);

        // Prevent adding new properties
        Object.seal(this);

        this.initHandlers();
        this.initPaper();
        this.initVideo();
        this.initKeyframebar();
    }


    // Init ALL the things!

    initKeyframebar() {
        this.keyframebar = new Keyframebar(this.className('keyframebar-keyframe'));
        this.keyframebar.attach(this.$('keyframebar'));
        this.keyframebarReady.resolve();
    }

    initPaper() {
        // Depents on this.videoReady for this.video.videoWidth/Height
        this.videoReady().then(() => {
            this.$paper = Raphael(this.$('paper')[0], this.video.videoWidth, this.video.videoHeight);
            this.creationRect = new CreationRect(this);
            this.creationRect.addToPaper();

            $(this.creationRect).on('create', (e, bounds) => {
                var rect = this.addRect();
                rect.bounds = bounds;
                $(this).trigger('create', rect);
            });

            this.paperReady.resolve();
        });
    }

    initVideo() {
        // Set video props
        var $video = this.$('video');
        $video.attr('src', this.src);
        this.video = $video[0];

        // updates time more frequently by using setInterval
        $video.on('playing', () => {
            this.manualTimeupdateTimerId = setInterval(() => {
                this.$('video').trigger('timeupdate');
            }, this.TIME_UPDATE_DELAY);
        }).on('pause', () => {
            clearInterval(this.manualTimeupdateTimerId);
        });

        $video.on("loadedmetadata", () => {
            this.videoReady.resolve();
            this.initPaper();
        }).on("abort", () => {
            this.videoLoaded.reject();
        });
    }

    initHandlers() {
        this.ready().then(() => {
            // control-play => video
            // control-pause => video
            this.$on('control-play', 'click', () => this.video.play());
            this.$on('control-pause', 'click', () => this.video.pause());
            this.$on('control-delete-keyframe', 'click', () => this.deleteSelectedKeyframe());

            // control-time <=> video
            this.$on('control-time', 'change', () => this.video.currentTime = this.controlTime);
            this.$on('video', 'timeupdate', () => this.controlTimeUnfocused = this.video.currentTime);

            // control-scrubber <=> video
            this.$on('control-scrubber', 'change input', () => this.video.currentTime = this.controlScrubber);
            this.$on('video', 'timeupdate', () => this.controlScrubberUnfocused = this.video.currentTime);

            // keyframebar => video
            this.$on('keyframebar', 'jump-to-time', (e, time) => this.video.currentTime = time);
        });
    }


    // Rect control

    addRect() {
        var rect = new Rect();
        rect.attach(this.$paper);
        this.rects.push(rect);
        return rect;
    }

    deleteRect(rect) {
        if (rect == null) return false;

        for (let i = 0; i < this.rects.length; i++) {
            if (this.rects[i] === rect) {
                rect.detach();
                this.rects.splice(i, 1);
                return true;
            }
        }
        throw new Error("PlayerView.deleteRect: rect not found", rect);
    }


    // UI getters and setters

    get controlTime() {
        return parseFloat(this.$('control-time').val());
    }

    get controlTimeUnfocused() {
        return this.controlTime;
    }

    set controlTimeUnfocused(value) {
        this.$('control-time:not(:focus)').val(value.toFixed(2));
    }

    get controlScrubber() {
        return parseFloat(this.$('control-scrubber').val()) / this.CONTROL_SCRUBBER_GRANULARITY * this.video.duration;
    }

    get controlScrubberUnfocused() {
        return this.controlScrubber;
    }

    set controlScrubberUnfocused(value) {
        this.$('control-scrubber:not(:focus)').val(value * this.CONTROL_SCRUBBER_GRANULARITY / this.video.duration);
    }


    // DOM/jQuery helpers

    className(selector) {
        return `player-${selector}`;
    }

    $(selector) {
        return this.$container.find(`.${this.className(selector)}`);
    }

    $on(selector, eventName, callback) {
        return this.$container.on(eventName, `.${this.className(selector)}`, callback);
    }
}

void PlayerView;
