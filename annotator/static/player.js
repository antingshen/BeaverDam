"use strict";


const PLAYER_KEYFRAMEBAR_KEYFRAME_SVG = `
<svg height="100" width="100" class="player-keyframebar-keyframe" style="left: 0%;" viewBox="0 0 100 100" preserveAspectRatio="xMaxYMax">
    <circle cx="50" cy="50" r="30" stroke="black" stroke-width="0" fill="orange"></circle>
</svg>`;



function makeCustomPromise() {
    function cond() {
        return cond.promise;
    }
    cond.promise = new Promise((resolve, reject) => {
        cond.resolve = resolve;
        cond.reject = reject;
    });
    return cond;
}

/**
 * Player has the following promises:
 *     player.videoLoaded.then(() => {code to run when video is loaded})
 *     player.annotationsLoaded.then(() => {code to run when annotations are loaded})
 *     player.loaded.then(() => {code to run when video AND annotations are loaded})
 */
class Player {
    constructor($container, src, video_id) {
        Object.assign(this, {$container, src, video_id});

        this.selectedThing = null;

        // Set video props
        this.$('video').attr('src', src);
        this.video = this.$('video')[0];

        this.setVideoHandlers();

        // Promise: player.videoLoaded
        this.videoLoaded = makeCustomPromise();
        this.$('video').on("loadedmetadata", () => {
            this.initPaper();
            this.videoLoaded.resolve();
        }).on("abort", () => {
            this.videoLoaded.reject();
        });

        // Promise: player.annotationsLoaded
        this.annotationsLoaded = makeCustomPromise();
        this.loadAnnotations().then(
            this.annotationsLoaded.resolve,
            this.annotationsLoaded.reject
        );

        // Promise: player.loaded
        this.loaded = Promise.all([this.videoLoaded(), this.annotationsLoaded()]);
    }


    // Annotations helpers

    initPaper() {
        this.paper = Raphael(this.$('paper')[0], this.video.videoWidth, this.video.videoHeight);   
    }

    loadAnnotations() {
        return fetch(`/annotation/${this.video_id}`, {method: 'get'}).then((response) => {
            if (!response.ok) {
                return Promise.reject("Player.loadAnnotations failed: fetch");
            }
            return response.text();
        }).then((text) => {
            var json = (text === '') ? [] : JSON.parse(text);

            this.things = json.map((json) => Thing.fromJson(json, this));
            return this.videoLoaded().then(() => {
                this.drawAnnotations();
                return Promise.resolve();
            });
        });
    }

    saveAnnotations(mturk = false) {
        var json = this.things.map(Thing.toJson);
        return fetch(`/annotation/${this.video_id}`, {
            headers: {
                'X-CSRFToken': window.CSRFToken,
                'Content-Type': 'application/json',
            },
            credentials: 'same-origin',
            method: 'post',
            body: JSON.stringify(json),
        }).then((response) => {
            if (response.ok) {
                if (mturk) {
                    $('#turk-form').submit();
                }
                return Promise.resolve('State saved successfully.');
            } else {
                return Promise.resolve(`Error code ${response.status}`);
            }
        });
    }

    drawAnnotations() {
        for (let thing of this.things) {
            thing.drawAtTime(this.video.currentTime);
        }
    }

    drawKeyframebar() {
        var container = this.$('keyframebar');

        container.empty();
        if (this.selectedThing == null) return;

        for (let keyframe of this.selectedThing.keyframes) {
            // TODO magic number
            let frac = keyframe.time / 1000 / this.video.duration;
            $(PLAYER_KEYFRAMEBAR_KEYFRAME_SVG).css({'left': `${frac * 100}%`}).appendTo(container);
        }
    }

    setupNewThing(x, y) {
        var thing = new Thing(this);
        this.things.push(thing);
        thing.drawing.setBounds({
            xMin: x,
            xMax: x,
            yMin: y,
            yMax: y,
        });
        thing.drawing.onDragStart();
    }

    submitAnnotations(e) {
        e.preventDefault();
        // TODO magic number
        this.saveAnnotations(window.assignmentId.length > 4).then((response) => {
            $('#response').html(response);
        });
    }


    // Video control helpers

    setVideoHandlers() {
        var $video = $(this.video);

        // updates time more frequently by using setInterval
        $video.on('playing', () => {
            this.manualTimeupdateTimerId = setInterval(() => {
                this.$('video').trigger('timeupdate');
            }, 30);
        }).on('pause', () => {
            clearInterval(this.manualTimeupdateTimerId);
        });

        // control-play => video
        // control-pause => video
        this.$on('control-play', 'click', () => this.video.play());
        this.$on('control-pause', 'click', () => this.video.pause());

        // video <=> control-time
        this.$on('control-time', 'change', () => this.videoTime = this.controlTime);
        $video.on('timeupdate', () => this.controlTimeUnfocused = this.videoTime);

        // video <=> control-scrubber
        this.$on('control-scrubber', 'change input', () => this.videoTime = this.controlScrubber);
        $video.on('timeupdate', () => this.controlScrubberUnfocused = this.videoTime);

        // video => (annotations)
        $video.on('timeupdate', () => {
            this.drawAnnotations();
        });

        // TODO doesn't respect scope
        $('#submit-btn').click(this.submitAnnotations.bind(this));
    }

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
        // TODO magic number
        return parseFloat(this.$('control-scrubber').val()) / 10000 * this.video.duration;
    }
    get controlScrubberUnfocused() {
        return this.controlScrubber;
    }

    set controlScrubberUnfocused(value) {
        // TODO magic number
        this.$('control-scrubber:not(:focus)').val(value * 10000 / this.video.duration);
    }

    get videoTime() {
        return this.video.currentTime;
    }

    set videoTime(value) {
        this.video.currentTime = value;
    }


    // DOM/jQuery helpers

    $(selector) {
        return this.$container.find(`.player-${selector}`);
    }

    $on(selector, eventName, callback) {
        return this.$container.on(eventName, `.player-${selector}`, callback);
    }
}

void Player;
