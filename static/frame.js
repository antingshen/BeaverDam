video_name = "test_vid"
total_frames = 99

function frame_url(frame) {
    return `url(` + frame_path(frame)`)`;
}

function frame_path(frame) {
    block_0 = Math.floor(frame / 10000)
    block_1 = Math.floor(frame / 100)
    return `/static/videos/${video_name}/${block_0}/${block_1}/${frame}.jpg`
}

