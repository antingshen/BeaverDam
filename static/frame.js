video_name = "test_vid"
total_frames = 99

function frame_url(frame) {
    block_0 = Math.floor(frame / 10000)
    block_1 = Math.floor(frame / 100)
    return `url(/static/videos/${video_name}/${block_0}/${block_1}/${frame}.jpg)`
}

function frame_path(frame) {
    block_0 = Math.floor(frame / 10000)
    block_1 = Math.floor(frame / 100)
    return `videos/${video_name}/${block_0}/${block_1}/${frame}.jpg`
}

function frame_width() {
    return img.naturalWidth;
}

function frame_height() {
    return img.naturalHeight;
}

var img = new Image();
img.onload = function() {
    alert(this.width + 'x' + this.height);
}
img.src = frame_path(1);
console.log(frame_width());