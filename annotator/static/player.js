"use strict";

function setupPromise(cond = {}) {
    cond.promise = new Promise((resolve, reject) => {
        cond.resolve = resolve;
        cond.reject = reject;
    });
    return cond;
}

class Player {
    constructor($container, src, name) {
        Object.assign(this, {$container, src, name});

        this.$('video').attr('src', src);
        this.video = this.$('video')[0];

        setupPromise(this.videoLoaded);
        this.$('video').on("loadedmetadata", (e) => {
            this.initPaper();
            this.setVideoHandlers();
            this.videoLoaded.resolve();
        }).on("abort", (e) => {
            this.videoLoaded.reject();
        });

        setupPromise(this.annotationsLoaded);
        this.loadAnnotations().then(
            this.annotationsLoaded.resolve,
            this.annotationsLoaded.reject
        );
    }

    loadAnnotations() {
        return fetch(`/annotation/${this.name}`, {method: 'get'}).then((response) => {
            return response.json();
        }).then((json) => {
            this.things = json.map((json) => Thing.fromJson(json, this));
            return this.videoLoaded().then(() => {
                this.drawAnnotations();
                return Promise.resolve();
            });
        });
    }

    saveAnnotations() {
        var json = this.things.map(Thing.toJson);
        return fetch(`/annotation/${this.name}`, {
            headers: new Headers({'Content-Type': 'application/json'}),
            method: 'post',
            body: JSON.stringify(json),
        }).then((response) => {
            if (response.status == 200)
                return Promise.resolve('State saved successfully.');
            else
                return Promise.reject(`Error code ${response.status}`);
        });
    }

    drawAnnotations() {
        var video = this.$('video')[0];

        for (let i = 0; i < this.things.length; i++) {
            let thing = this.things[i];
            thing.drawAtTime(video.currentTime);
        }        
    }


    initPaper() {
        var video = this.$('video')[0];
        this.paper = Raphael(this.$('paper')[0], video.videoWidth, video.videoHeight);   
    }

    setVideoHandlers() {
        var $video = this.$('video');
        var video = $video[0];

        // control-play => video, control-pause => video
        this.$('control-play').on('click', (e) => video.play());
        this.$('control-pause').on('click', (e) => video.pause());

        // video <=> control-time
        this.$('control-time').on('change', (e) => video.currentTime = parseFloat(this.$('control-time').val()));
        $video.on('timeupdate', (e) => this.$('control-time:not(:focus)').val(video.currentTime.toFixed(2)));

        // video <=> control-scrubber
        this.$('control-scrubber').on('change input', (e) => video.currentTime = parseFloat(this.$('control-scrubber').val()) / 10000 * video.duration);
        $video.on('timeupdate', (e) => this.$('control-scrubber:not(:focus)').val(video.currentTime * 10000 / video.duration));

        $video.on('timeupdate', (e) => {
            this.drawAnnotations();
        });
    }

    $(selector) {
        return this.$container.find(`.player-${selector}`);
    }

    videoLoaded() {
        return this.videoLoaded.promise;
    }

    annotationsLoaded() {
        return this.annotationsLoaded.promise;
    }

    loaded() {
        return Promise.all([this.videoLoaded(), this.annotationsLoaded()]);
    }
}

