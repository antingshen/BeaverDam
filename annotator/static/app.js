"use strict";

$(() => {
    window.p = new Player({
        $container: $("#player"),
        videoSrc: window.video.location,
        annotationsId: window.video.id,
    });
});
