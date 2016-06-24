#!/usr/bin/env python3

import os, json

from flask import Flask, request
from flask import render_template, send_from_directory, abort
app = Flask(__name__)
app.config['DEBUG'] = True

@app.route('/')
def root():
    return video('test_vid')

@app.route('/video/<video_name>')
def video(video_name):
    video_data = {
        'name': video_name,
    }
    return render_template('video.html', video_data=video_data)

@app.route('/scene/<scene_name>', methods=['GET'])
def read_scene(scene_name):
    return send_from_directory('scene', scene_name + '.json', mimetype='application/json')

@app.route('/scene/<scene_name>', methods=['POST'])
def write_scene(scene_name):
    scene_json = request.get_json()
    if scene_json is None:
        abort(400) 
    with open(os.path.join('scene', scene_name + '.json'), 'w') as f:
        json.dump(scene_json, f)
    return 'successfully saved to {}.json'.format(scene_name)

if __name__ == '__main__':
    app.run(host='0.0.0.0')
