# This works similarly with ffmpeg, just replace avconv with ffmpeg
# Example for converting folder: 
# for i in *; do path/to/convert_to_h264.sh "$i"; done

avconv -y -i $1 -c:v libx264 /tmp/converting.mp4
mv /tmp/converting.mp4 $1
