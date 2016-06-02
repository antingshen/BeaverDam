#!/usr/bin/env python3

import os, json

from flask import Flask, request, send_from_directory
app = Flask(__name__)
app.config['DEBUG'] = True

@app.route('/')
def root():
    return app.send_static_file('index.html')

@app.route('/scene/<scene_name>', methods=['GET'])
def read_scene(scene_name):
    return send_from_directory('scene', scene_name + '.json', mimetype='application/json')

@app.route('/scene/<scene_name>', methods=['POST'])
def scene(scene_name):
    scene_json = request.get_json()
    with open(os.path.join('scene', scene_name + '.json'), 'w') as f:
        json.dump(scene_json, f)
    return 'successfully saved to {}.json'.format(scene_name)

if __name__ == '__main__':
    app.run()
