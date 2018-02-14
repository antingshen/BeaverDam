"use strict";

// Constants. ES6 doesn't support class constants yet, thus this hack.
var AnnotationbarConstants = {
    ANNOTATION_DIV: 
        `<div> </div>`,
};

class Annotationbar {
    constructor({classBaseName}) {
        // This container of the annotation bar
        this.$container = null;

        // Namespaced className generator
        this.classBaseName = classBaseName.add('annotationbar');

        // Duration of the video
        this.duration = 0;

        // Prevent adding new properties
        $(this).on('dummy', $.noop);
        Object.preventExtensions(this, Annotationbar);
    }

    attach($container) {
        // Don't add twice
        if (this.$container != null) {
            throw new Error("Annotationbar.attach: already attached to container");
        }

        // Actually do the attaching
        this.$container = $container;

        // Apply appearance
        this.resetWithDuration(0);

        // Trigger event
        $(this).triggerHandler('attach', this.$container);

        return this;
    }

    detach() {
        this.$container.empty();

        // Trigger event
        $(this).triggerHandler('detach', this.$container);

        this.$container = undefined;

        return this;
    }

    resetWithDuration(duration) {
        this.$container.empty();

        this.duration = duration;
    }

    addAnnotation(annotation, classNameExtBooleans) {
        var classBaseName = this.classBaseName.add('annotation');
        var classNames = Misc.getClassNamesFromExts([classBaseName], classBaseName, classNameExtBooleans);

        var id = 'collapse' + annotation.id;
        var selected = classNameExtBooleans.selected ? ' in" aria-expanded="true' : '';

        var html = $.parseHTML(
            '<div class="panel panel-default">'
            + '<div class="panel-heading">'
            + '<h4 class="panel-title">'
            + '<a data-toggle="collapse" data-parent="#accordion" href="#' + id + '">'
            + annotation.type
            + '</a>'
            + '</h4>'
            + '</div>'
            + '<div id="' + id + '" class="panel-collapse collapse' + selected + '">'
            + '<ul class="list-group"> </ul>'            
            + '</div>'
            + '</div>');

        var editLabel = $("<span class='control-edit-label glyphicon glyphicon-edit' \
                        role='button' class='btn' data-toggle='modal' data-target='#edit-label-modal'></span>")
                        .click(() => { $(this).triggerHandler('control-edit-label', {"annotation": annotation}); });

        var deleteAnnotation = $("<span class='control-delete-annotation glyphicon glyphicon-trash' \
                        role='button' class='btn' data-toggle='modal' data-target='#delete-annotation-modal'></span>")
                        .click(() => { $(this).triggerHandler('control-delete-annotation', {"annotation": annotation}); });

        $(html).find('h4').append(editLabel);
        $(html).find('h4').append(deleteAnnotation);

        var keyframesList = $(html).find("ul");
        
        for (let keyframe of annotation.keyframes) {
            var editState = $("<span class='control-edit-state glyphicon glyphicon-edit' \
                        role='button' class='btn' data-toggle='modal' data-target='#edit-state-modal'></span>")
                        .click(() => { $(this).triggerHandler('control-edit-state', {"annotation": annotation, "keyframe": keyframe}); });

            var link = $("<li class='list-group-item'><a>" + keyframe.time + ": " + keyframe.state + "</a></li>");
            $(link).find('a').click(() => { $(this).triggerHandler('jump-to-time', keyframe.time); });

            $(keyframesList).append(link);
            $(keyframesList).find("li:last").append(editState);
        }

        $(html).addClass(classNames.join(' ')).appendTo(this.$container);
    }
}

// Mix-in constants
Misc.mixinClassConstants(Annotationbar, AnnotationbarConstants);
void Annotationbar;
