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
            };
        },

        toJson: function(frame) {
            var attr = Bounds.toAttrs(frame.bounds);
            return {
                x: attr.x,
                y: attr.y,
                w: attr.width,
                h: attr.height,
                frame: frame.time,
            };
        },
    },

    annotation: {
        fromJson: function(json) {
            var annotation = Annotation.newFromCreationRect();
            annotation.keyframes = json.keyframes.map(DataSources.frame.fromJson);
            annotation.type = json.type;
            annotation.fill = json.color || Misc.getRandomColor();
            return annotation;
        },

        toJson: function(annotation) {
            return {
                keyframes: annotation.keyframes.map(DataSources.frame.toJson),
                type: annotation.type,
                color: annotation.fill,
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
                method: 'get'
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

        save: function(id, annotations, mturk) {
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
                    hitId: window.hitId,
                }),
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
    },
};

void DataSources;
