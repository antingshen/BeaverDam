total_frames = 99;
PREFETCH_NUMBER = 500;

var images = [];

function frame_path(frame) {
    if (video.location == 'static') {
        var urlRoot = '/static';
    } else if (video.location == 's3') {
        var urlRoot = 'https://s3-us-west-2.amazonaws.com/beaverdam';
    } else {
        var urlRoot = video.location;
    }
    block_0 = Math.floor(frame / 10000);
    block_1 = Math.floor(frame / 100);
    return `${urlRoot}/videos/${video.name}/${block_0}/${block_1}/${frame}.jpg`;
}

function frame_url(frame) {
    return `url(${frame_path(frame)}`;
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

document.addEventListener("DOMContentLoaded", function() {
    var img = frame_preload(PREFETCH_NUMBER);
    img.onload = function () {
        canvas = new Canvas(document.getElementById('frame'));
        var scrollBar = document.getElementById("scroll-bar");
        var playButton = document.getElementById("play-button");
        scrollBar.addEventListener("click", function(){
            canvas.frame = scrollBar.value;
        });

        scrollBar.addEventListener("input", function() {
            canvas.frame = scrollBar.value;
        });
        document.addEventListener("keypress", function(event) {
            if (event.keyCode === 13) { //If Enter is pressed
                scrollBar.value = document.getElementById("frame-number").value;
                canvas.frame = scrollBar.value;
            }
        });
        playButton.addEventListener("click", function(){
            canvas.play = !canvas.play;
            playButton.className = `glyphicon glyphicon-${canvas.play ? 'pause' : 'play'}`;
        });
        canvas.frame = 0;
    };

});
