"use strict";


$(() => {
    // Just a sanity check
    Misc.preventExtensions(document);

    setTimeout(() => {
        Misc.preventExtensions(window);
    }, 0);

    // Make the player
    window.p = new Player({
        $container: $("#player"),
        videoSrc: window.video.location,
        videoId: window.video.id,
    });
});
