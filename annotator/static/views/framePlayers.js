"use strict";

class AbstractFramePlayer {
    constructor(src, element) {
        this.videoElement = element;
        this.videoElement.src = src;
    }

    static newFramePlayer(src, element, type) {
        if (type == 'video')
            return new VideoFramePlayer(src, element);
        else if (type == 'image')
            return new ImageFramePlayer(src, slement);
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

    /**
     * Events:
     *  - playing
     *  - pause
     *  - loadedmetadata
     *  - abort
     *  - timeupdate
     */
    onPlaying(callback) {
        
    }
    onPause(callback) {
        
    }
    onLoadedMetadata(callback) {
        
    }
    onAbort(callback) {
        
    }
    onTimeUpdate(callback) {
        
    }
    triggerTimerUpdateHandler() {
        
    }
}

class VideoFramePlayer extends AbstractFramePlayer {

    get videoWidth() {
        return this.videoElement.videoWidth;
    }
    get videoHeight() {
        return this.videoElement.videoHeight;
    }
    get duration() {
        return this.videoElement.duration;
    }
    get currentTime() {
        return this.videoElement.currentTime; 
    }
    set currentTime(val) {
        this.videoElement.currentTime = val;
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
    onTimeUpdate(callback) {
        $(this.videoElement).on('timeupdate', callback);
    }
    triggerTimerUpdateHandler() {
        $(this.videoElement).triggerHandler('timeupdate');
    }
}
class ImgFramePlayer extends AbstractFramePlayer{
    constructor(src, element) {
        
    }
    get duration() {

    }
    get currentTime() {

    }
    set currentTime(val) {

    }

    get paused() {
        return true;
    }

    pause() {

    }

    play() {

    }

    /**
     * Events:
     *  - playing
     *  - pause
     *  - loadedmetadata
     *  - abort
     */
    playingCallback() {

    }
}

void ImgFramePlayer;
void AbstractFramePlayer;
void VideoFramePlayer;