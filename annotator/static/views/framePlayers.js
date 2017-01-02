"use strict";

class AbstractFramePlayer {
    constructor(src, element) {
        this.onTimeUpdates = [];
    }

    static newFramePlayer(element, options) {
        if (options.images)
            return new ImageFramePlayer(options.images, element);
        else if (options.videoSrc)
            return new VideoFramePlayer(options.videoSrc, element);
        else throw new Error("Unknown Frame Player specified - [" + type + "], currently only support 'video' and 'image'");
    }
    get videoWidth() {
        return 0;
    }
    get videoHeight() {
        return 0;
    }
    get duration() {
        return 0;
    }
    get currentTime() {
        return 0;
    }

    set currentTime(val) {

    }

    get paused() {
        return false
    }

    pause() {

    }

    play() {

    }

    rewindStep() {}

    /**
     * Events:
     *  - playing
     *  - pause
     *  - loadedmetadata
     *  - abort
     *  - timeupdate
     *  - buffering
     */
    onPlaying(callback) {}
    onPause(callback) {}
    onLoadedMetadata(callback) {}
    onAbort(callback) {}
    onBuffering(callback) {}

    nextFrame() {}
    previousFrame() {}

    fit() {}


    onTimeUpdate(callback) {
        this.onTimeUpdates.push(callback);
    }
    triggerTimerUpdateHandler() {
        this.triggerCallbacks(this.onTimeUpdates);
    }

    triggerCallbacks(handlers) {
        for (var i = 0; i < handlers.length; i++) {
            handlers[i]();
        }
    }
}

class VideoFramePlayer extends AbstractFramePlayer {
    constructor(src, element) {
        super(src, element);
        this.videoElement = element;
        this.videoElement.src = src;
    }

    get videoWidth() {
        return this.videoElement.videoWidth;
    }
    get videoHeight() {
        return this.videoElement.videoHeight;
    }
    get viewWidth() {
        return $(this.videoElement).width();
    }
    get viewHeight() {
        return $(this.videoElement).height();
    }

    get duration() {
        return this.videoElement.duration;
    }
    get currentTime() {
        return this.videoElement.currentTime;
    }
    set currentTime(val) {
        this.videoElement.currentTime = val;
        this.triggerTimerUpdateHandler();
    }

    get paused() {
        return this.videoElement.paused;
    }

    pause() {
        this.videoElement.pause();
    }

    play() {
        this.videoElement.play();
    }

    rewindStep() {
        this.currentTime = this.currentTime - 0.1;
    }

    // We can't skip single frames in html video, so we'll assume a low FPS
    nextFrame() {
        var frameRate = 1/20;
        var newTime = this.currentTime + frameRate;
        newTime = Math.min(newTime, this.duration);
        newTime = Math.max(0, newTime);

        return this.currentTime = newTime;
    }

    previousFrame() {
        var frameRate = 1/10;
        var newTime = this.currentTime + frameRate * -1;
        newTime = Math.min(newTime, this.duration);
        newTime = Math.max(0, newTime);

        return this.currentTime = newTime;
    }

    /**
     * Events:
     *  - playing
     *  - pause
     *  - loadedmetadata
     *  - abort
     *  - timeupdate
     */
    onPlaying(callback) {
        $(this.videoElement).on('playing', callback);
    }
    onPause(callback) {
        $(this.videoElement).on('pause', callback);
    }
    onLoadedMetadata(callback) {
        $(this.videoElement).on('loadedmetadata', callback);
    }
    onAbort(callback) {
        $(this.videoElement).on('abort', callback);
    }
}

class ImageFramePlayer extends AbstractFramePlayer {
    constructor(images, element) {
        super(images, element);
        // image list
        $(element).imgplay({rate: 15, controls: false, pageSize: 100, center: false, onLoading: (isLoading) => {
            if (this.onBuffering)
                this.onBuffering(isLoading);
        }});
        this.imgPlayer = $(element).data('imgplay');
        this.imgPlayer.toFrame(0);
        this.onPauseHandlers = [];
        this.onPlayingHandlers = [];
        // hack but we don't want to trigger ready until we have frame 0 loaded and can read the height
        var image = new Image();
        image.onload = () => {
            if (this.onLoadedMetadata) {
                this.onLoadedMetadata();
                this.hasInit = true;
            }
            var css = {
                width: '100%'
            };
            $(element).css(css);
            this.imgPlayer.fitCanvas();
            this.imgPlayer.toFrame(0);
        }
        image.src = this.imgPlayer.frames[0].src;
    }
    get videoWidth() {
        return this.imgPlayer.frames[0].width;
    }
    get videoHeight() {
        return this.imgPlayer.frames[0].height;
    }

    get viewWidth() {
        return this.imgPlayer.getDrawnWidth();
    }
    get viewHeight() {
        return this.imgPlayer.getDrawnHeight();
    }

    get duration() {
        return this.imgPlayer.getTotalFrames() - 1;
    }

    get currentTime() {
        return this.imgPlayer.getCurrentFrame();
    }

    set currentTime(val) {
        val = Math.min(this.duration, val);
        val = Math.max(0, val);
        this.imgPlayer.toFrame(Math.floor(val));
        this.triggerTimerUpdateHandler();
    }

    get paused() {
        return !this.imgPlayer.isPlaying();
    }

    pause() {
        this.imgPlayer.pause();
        this.triggerCallbacks(this.onPauseHandlers);
    }

    play() {
        this.imgPlayer.play();
        this.triggerCallbacks(this.onPlayingHandlers);
    }

    rewindStep() {
        this.previousFrame();
    }

    nextFrame() {
        this.currentTime  = Math.min(this.duration, this.currentTime + 1)
    }

    previousFrame() {
        return this.currentTime = Math.max(0, this.currentTime - 1);
    }

    fit() {
        this.imgPlayer.fitCanvas();
    }

    /**
     * Events:
     *  - playing
     *  - pause
     *  - loadedmetadata
     *  - abort
     *  - timeupdate
     */
    onPlaying(callback) {
        this.onPlayingHandlers.push(callback);
        if (!this.paused && callback)
            callback();

    }
    onPause(callback) {
        this.onPauseHandlers.push(callback);
    }

    onLoadedMetadata(callback) {
        this.onLoadedMetadata = callback;
        if (this.hasInit)
            callback();
    }
    onAbort(callback) {
        this.onAbort = callback;
    }
    onBuffering(callback) {
        this.onBuffering = callback;
    }
}

void ImageFramePlayer;
void AbstractFramePlayer;
void VideoFramePlayer;