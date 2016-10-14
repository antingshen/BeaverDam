"use strict";


class Player {
    constructor({$container, videoSrc, videoId, videoStart, videoEnd}) {
        this.$container = $container;
        
        this.videoId = videoId;

        this.selectedAnnotation = null;

        this.annotations = null;

        this.annotationRectBindings = [];

        this.videoSrc = videoSrc;

        this.view = null;

        this.videoStart = videoStart;

        this.videoEnd = videoEnd;

        this.metrics = {
            playerStartTimes: Date.now(),
            annotationsStartTime: null,
            annotationsEndTime: null,
        };

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


    // Init ALL the annotations!
    
    initView() {
        var {$container, videoSrc, videoStart, videoEnd} = this;

        this.view = new PlayerView({$container, videoSrc, videoStart, videoEnd});

        this.view.ready().then(this.viewReady.resolve);
    }

    initAnnotations() {
        DataSources.annotations.load(this.videoId).then((annotations) => {
            this.annotations = annotations;
            this.annotationsDataReady.resolve();
        });

        // When this.annotations is loaded AND view is ready for drawing...
        Promise.all([this.annotationsDataReady(), this.viewReady()]).then(() => {
            for (let annotation of this.annotations) {
                let rect = this.view.addRect();
                rect.fill = annotation.fill;
                this.initBindAnnotationAndRect(annotation, rect);
            }

            $(this).triggerHandler('change-onscreen-annotations');
            $(this).triggerHandler('change-keyframes');

            this.annotationsReady.resolve();
        });
    }

    initBindAnnotationAndRect(annotation, rect) {
        // On PlayerView...

        this.annotationRectBindings.push({annotation, rect});


        // On Rect...

        $(rect).on('discrete-change', (e, bounds) => {
            annotation.updateKeyframe({
                time: this.view.video.currentTime,
                bounds: bounds,
            });
            $(this).triggerHandler('change-onscreen-annotations');
            $(this).triggerHandler('change-keyframes');
        });

        $(rect).on('select', () => {
            this.selectedAnnotation = annotation;
            $(this).triggerHandler('change-keyframes');
        });

        $(rect).on('drag-start', () => {
            this.view.video.pause();
        });

        $(rect).on('focus', () => {
            this.selectedAnnotation = annotation;
            $(this).triggerHandler('change-onscreen-annotations');
            $(this).triggerHandler('change-keyframes');
        });


        // On Annotation...

        $(annotation).on('change delete', () => {
            rect.appear({singlekeyframe: annotation.keyframes.length === 1});
        });
        $(annotation).triggerHandler('change');

        $(annotation).on('delete', () => {
            $(annotation).off();
            $(rect).off();
            this.view.deleteRect(rect);
        });
    }

    initHandlers() {
        // Drawing annotations
        $(this).on('change-onscreen-annotations', () => {
            this.drawOnscreenAnnotations();
        });

        $(this).on('change-keyframes', () => {
            this.drawKeyframes();
        });


        // Submitting
        // TODO doesn't respect scope
        $('#submit-btn').click(this.submitAnnotations.bind(this));
        $('#submit-survey-btn').click(this.submitSurvey.bind(this));

        $(this).on('change-verification', this.updateVerifiedButton.bind(this));
        $(this).triggerHandler('change-verification');

        $('#verified-btn').click(this.submitVerified.bind(this));


        // On drawing changed
        this.viewReady().then(() => {
            $(this.view.creationRect).on('drag-start', () => {
                this.view.video.pause();
            });

            $(this.view.creationRect).on('focus', () => {
               this.selectedAnnotation = null;
                $(this).triggerHandler('change-onscreen-annotations');
                $(this).triggerHandler('change-keyframes');
            });

            $(this.view.video).on('timeupdate', () => {
                $(this).triggerHandler('change-onscreen-annotations');
            });

            $(this.view).on('create-rect', (e, rect) => {
                this.addAnnotationAtCurrentTimeFromRect(rect);
                rect.focus();
                $(this).triggerHandler('change-keyframes');
            });

            $(this.view).on('delete-keyframe', () => {
                this.view.video.pause();
                this.deleteSelectedKeyframe();
                $(this).triggerHandler('change-onscreen-annotations');
                $(this).triggerHandler('change-keyframes');
            });

            $(this.view).on('step-forward-keyframe', () => {
                var time = this.view.video.currentTime;
                for (let [i, kf] of this.selectedAnnotation.keyframes.entries()) {
                    if (time == kf.time) {
                        if (i != this.selectedAnnotation.keyframes.length - 1) {
                            var nf = this.selectedAnnotation.keyframes[i + 1];
                            this.view.video.currentTime = nf.time;
                            break;
                        }
                    }
                }
            });

            $(this.view).on('step-backward-keyframe', () => {
                var time = this.view.video.currentTime;
                for (let [i, kf] of this.selectedAnnotation.keyframes.entries()) {
                    if (time == kf.time) {
                        if (i !== 0) {
                            var nf = this.selectedAnnotation.keyframes[i - 1];
                            this.view.video.currentTime = nf.time;
                            break;
                        }
                    }
                }
            });

        });
    }


    // Draw something

    drawOnscreenAnnotations() {
        for (let {annotation, rect} of this.annotationRectBindings) {
            this.drawAnnotationOnRect(annotation, rect);
        }
    }

    drawKeyframes() {
        this.view.keyframebar.resetWithDuration(this.view.video.duration);
        for (let annotation of this.annotations) {
            for (let keyframe of annotation.keyframes) {
                let selected = (annotation == this.selectedAnnotation);
                this.view.keyframebar.addKeyframeAt(keyframe.time, {selected});
            }
        }
    }

    drawAnnotationOnRect(annotation, rect) {
        if (this.metrics.annotationsStartTime == null) {
            this.metrics.annotationsStartTime = Date.now();
        }
        var time = this.view.video.currentTime;
        var {bounds, prevIndex, nextIndex, closestIndex} = annotation.getFrameAtTime(time);

        rect.appear({
            real: closestIndex != null || (prevIndex != null && nextIndex != null),
            selected: this.selectedAnnotation === annotation,
        });

        // Don't mess up our drag
        if (rect.isBeingDragged()) return;

        rect.bounds = bounds;
    }


    // Actions

    submitAnnotations(e) {
        e.preventDefault();
        this.metrics.annotationsEndTime = Date.now();
        if (this.metrics.annotationsStartTime == null) {
            this.metrics.annotationsStartTime = this.metrics.annotationsEndTime;
        }
        if (this.annotations.length === 0 && !confirm('Confirm that there are no objects in the video?')) {
            return;
        }
        DataSources.annotations.save(this.videoId, this.annotations, this.metrics, window.mturk).then((response) => {
            $('.submit-result').html(response + (numberOfSurveyQuestions ? "<br />Optional feedback on your experience: " : ''));
        });
        $('#myModal').modal();
    }

    submitSurvey() {
        var results = [];
        for (let i = 1; i <= numberOfSurveyQuestions; i++) {
            results.push($(`input[name='survey-q${i}']:checked`).val());
        }
        console.log(results);
        //TODO: Store results in datasources
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

    addAnnotationAtCurrentTimeFromRect(rect) {
        var annotation = Annotation.newFromCreationRect();
        annotation.updateKeyframe({
            time: this.view.video.currentTime,
            bounds: rect.bounds
        });
        this.annotations.push(annotation);
        rect.fill = annotation.fill;
        this.initBindAnnotationAndRect(annotation, rect);
    }

    deleteAnnotation(annotation) {
        if (annotation == null) return false;

        if (annotation == this.selectedAnnotation) {
            this.selectedAnnotation = null;
        }

        for (let i = 0; i < this.annotations.length; i++) {
            if (this.annotations[i] === annotation) {
                annotation.delete();
                this.annotations.splice(i, 1);
                this.annotationRectBindings.splice(i, 1);
                return true;
            }
        }

        throw new Error("Player.deleteAnnotation: annotation not found");
    }

    deleteSelectedKeyframe() {
        if (this.selectedAnnotation == null) return false;

        this.selectedAnnotation.deleteKeyframeAtTime(this.view.video.currentTime);

        if (this.selectedAnnotation.keyframes.length === 0) {
            this.deleteAnnotation(this.selectedAnnotation);
        }

        return true;
    }
}

void Player;
