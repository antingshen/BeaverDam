"use strict";


$(() => {
    // Just a sanity check
    Misc.preventExtensions(document);
    // Ideally I'd like to do this to window too but a lot of Chrome
    // extensions rely on window being extensible

    // Make the player
    window.p = new Player({
        $container: $("#player"),
        videoSrc: window.video.location,
        videoId: window.video.id,
        videoStart: window.video.start_time,
        videoEnd: window.video.end_time,
    });
});
