"use strict";

var DataSources = {
    frame: {
        fromJson: function(json) {
            return {
                bounds: Bounds.fromAttrs({
                    x: json.x,
                    y: json.y,
                    width: json.w,
                    height: json.h,
                }),
                time: json.frame,
                continueInterpolation: json.continueInterpolation === false ? false : true,
                state: json.state,
            };
        },

        toJson: function(frame) {
            var attr = Bounds.toAttrs(frame.bounds);
            return {
                x: attr.x,
                y: attr.y,
                w: attr.width,
                h: attr.height,
                continueInterpolation: frame.continueInterpolation,
                frame: frame.time,
                state: frame.state,
            };
        },
    },

    annotation: {
        fromJson: function(json) {
            var annotation = Annotation.newFromCreationRect();
            annotation.keyframes = json.keyframes.map(DataSources.frame.fromJson);
            annotation.type = json.type;
            annotation.fill = json.color || Misc.getRandomColor();
            annotation.id = json.id;
            return annotation;
        },

        toJson: function(annotation) {
            return {
                keyframes: annotation.keyframes.map(DataSources.frame.toJson),
                type: annotation.type,
                color: annotation.fill,
                id: annotation.id,
            };
        },
    },

    annotations: {
        fromJson: function(json) {
            return json.map(DataSources.annotation.fromJson);
        },

        toJson: function(annotations) {
            return annotations.map(DataSources.annotation.toJson);
        },

        load: function(id) {
            return fetch(`/annotation/${id}`, {
                method: 'get',
                credentials: 'same-origin'
            }).then((response) => {
                if (!response.ok) {
                    return Promise.reject("DataSources.annotations.load failed: fetch");
                }
                return response.text();
            }).then((text) => {
                var json = (text === '') ? [] : JSON.parse(text);
                var annotations = DataSources.annotations.fromJson(json);

                return Promise.resolve(annotations);
            });
        },

        save: function(id, annotations, metrics, mturk) {
            var json = DataSources.annotations.toJson(annotations);
            return fetch(`/annotation/${id}/`, {
                headers: {
                    'X-CSRFToken': window.CSRFToken,
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin',
                method: 'post',
                body: JSON.stringify({
                    annotation: json,
                    metrics: metrics,
                    hitId: window.hitId,
                    workerId: window.workerId,
                    assignmentId: window.assignmentId,
                }),
            }).then((response) => {
                if (response.ok) {
                    if (mturk) {
                        $('#turk-form').submit();
                    }
                    return Promise.resolve('State saved successfully.');
                } else {
                    response.text().then(t => console.log(t));
                    return Promise.resolve(`Error code ${response.status}`);
                }
            });
        },

        acceptAnnotation: function(id, bonus, message,  reopen, deleteBoxes, blockWorker, updatedAnnotations) {
            return fetch(`/accept-annotation/${id}/`, {
                headers: {
                    'X-CSRFToken': window.CSRFToken,
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin',
                method: 'post',
                body: JSON.stringify({
                    bonus: bonus,
                    message: message,
                    type: 'accept',
                    reopen: reopen,
                    deleteBoxes: deleteBoxes,
                    blockWorker: blockWorker,
                    updatedAnnotations: DataSources.annotations.toJson(updatedAnnotations),
                }),
            }).then((response) => {
                if (!response.ok)
                    return Promise.reject(response.headers.get('error-message'));
                return null;
            });
        },

        rejectAnnotation: function(id, message, reopen, deleteBoxes, blockWorker, updatedAnnotations) {
            return fetch(`/reject-annotation/${id}/`, {
                headers: {
                    'X-CSRFToken': window.CSRFToken,
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin',
                method: 'post',
                body: JSON.stringify({
                    message: message,
                    type: 'reject',
                    reopen: reopen,
                    deleteBoxes: deleteBoxes,
                    blockWorker: blockWorker,
                    updatedAnnotations: DataSources.annotations.toJson(updatedAnnotations)
                }),
            }).then((response) => {
                if (!response.ok) {
                    return Promise.reject(response.headers.get('error-message'));
                }
                return null;
            });
        },

        emailWorker: function(id, subject, message) {
            return fetch(`/email-worker/${id}/`, {
                headers: {
                    'X-CSRFToken': window.CSRFToken,
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin',
                method: 'post',
                body: JSON.stringify({
                    message: message,
                    subject: subject,
                    type: "email"
                }),
            }).then((response) => {
                if (!response.ok) {
                    return Promise.reject(response.headers.get('error-message'));
                }
                return null;
            });
        }
    },
};

void DataSources;
