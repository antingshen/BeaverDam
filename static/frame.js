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
function frame_preload(endFrame) {
    if (!images[endFrame]) {
        for (var i = endFrame - 500; i < endFrame; i++) {
            images[i] = new Image();
            images[i].src = frame_path(i);
        }
    }
    return images[0];
}
function update_frame(state, val) {
    frame_preload(val);
    document.getElementById("range").innerHTML=val;
    state.frame = val;
    document.getElementById("frame").style.backgroundImage = frame_url(state.frame);
    state.valid = false;
}
document.addEventListener("DOMContentLoaded", function() {
    var scroll = false;
    var img = frame_preload(500);
    img.onload = function () {
        var canvas = new Canvas(document.getElementById('frame'));
        var scrollBar = document.getElementById("scroll-bar");
        scrollBar.addEventListener("mouseup", function(){
            scroll = false;
        });
        scrollBar.addEventListener("click", function(){
            scroll = true;
            update_frame(canvas, scrollBar.value);
        });
        scrollBar.addEventListener("mousemove", function() {
            if (scroll) {
                update_frame(canvas, scrollBar.value);
            }
        });
    };


});

