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

    thing: {
        fromJson: function(json) {
            var thing = Thing.newFromCreationRect();
            thing.keyframes = json.keyframes.map(DataSources.frame.fromJson);
            thing.type = json.type;
            thing.fill = json.color || Misc.getRandomColor();
            return thing;
        },

        toJson: function(thing) {
            return {
                keyframes: thing.keyframes.map(DataSources.frame.toJson),
                type: thing.type,
                color: thing.fill,
            };
        },
    },

    annotations: {
        fromJson: function(json) {
            return json.map(DataSources.thing.fromJson);
        },

        toJson: function(things) {
            return things.map(DataSources.thing.toJson);
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
                var things = DataSources.annotations.fromJson(json);

                return Promise.resolve(things);
            });
        },

        save: function(id, things, mturk) {
            var json = DataSources.annotations.toJson(things);
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
