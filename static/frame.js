video_name = "test_vid";
total_frames = 99;
PREFETCH_NUMBER = 500;

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
    if (!images[endFrame - endFrame % PREFETCH_NUMBER]) {
        for (var i = endFrame - PREFETCH_NUMBER; i < endFrame; i++) {
            images[i] = new Image();
            images[i].src = frame_path(i);
        }
    }
    return images[0];
}
function update_frame(state, val) {
    frame_preload(val);
    var num = document.getElementById("frame-number");
    document.getElementById("scroll-bar").value = val;
    num.setAttribute("value", val);
    state.frame = parseInt(val);
    document.getElementById("frame").style.backgroundImage = frame_url(state.frame);
    state.valid = false;
}



document.addEventListener("DOMContentLoaded", function() {
    var img = frame_preload(PREFETCH_NUMBER);
    img.onload = function () {
        var canvas = new Canvas(document.getElementById('frame'));
        var scrollBar = document.getElementById("scroll-bar");
        var playButton = document.getElementById("play-button");
        scrollBar.addEventListener("click", function(){
            update_frame(canvas, scrollBar.value);
        });

        scrollBar.addEventListener("input", function() {
            update_frame(canvas, scrollBar.value);
        });
        document.addEventListener("keypress", function(event) {
            if (event.keyCode === 13) { //If Enter is pressed
                scrollBar.value = document.getElementById("frame-number").value;
                update_frame(canvas, scrollBar.value);
            }
        });
        playButton.addEventListener("click", function(){
            canvas.play = !canvas.play;
        })

    };



});

