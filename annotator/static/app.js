"use strict";


$(() => {
    // Some sanity checks that can't be used

    // Firefox doesn't allow this
    // Misc.preventExtensions(document);

    // Chrome extensions rely on window being extensible
    // Misc.preventExtensions(window);

    // Make the player
    window.p = new Player({
        $container: $("#player"),
        videoSrc: window.video.location,
        videoId: window.video.id,
        videoStart: window.video.start_time,
        videoEnd: window.video.end_time,
        isImageSequence: window.video.is_image_sequence,
        turkMetadata: window.full_video_task_data,
    });
   console.log("task data = " + window.full_video_task_data);
});
