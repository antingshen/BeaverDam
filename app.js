
video_name = "test_vid"
total_frames = 99

function frame_url(frame) {
    block_0 = Math.floor(frame / 10000)
    block_1 = Math.floor(frame / 100)
    return `videos/${video_name}/${block_0}/${block_1}/${frame}.jpg`
}


