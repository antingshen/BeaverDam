video_name = "test_vid";
total_frames = 99;

var images = [];
function frame_path(frame) {
    block_0 = Math.floor(frame / 10000);
    block_1 = Math.floor(frame / 100);
    return `/static/videos/${video_name}/${block_0}/${block_1}/${frame}.jpg`;
}
function frame_url(frame) {
    return `url(` + frame_path(frame) + `)`;
}
function preload(endFrame) {
    for (var i = 0; i < endFrame; i++) {
        images[i] = new Image();
        images[i].src = frame_path(i);
    }
}

preload(500);

