from django.core.management.base import BaseCommand, CommandError
from annotator.models import Video
import os
import json
import re
import os
import shutil
import subprocess
import math


class Command(BaseCommand):
	help = r'''Exports video annotations

This command creates JSON annotation files from video annotations. Besides keyframe annotations
this script also creates dense annotations, i.e interpolates between keyframes. To do so, the 
FPS of the video is required, which can be deduced automatically by video probing (requires ffmpeg).

	python manage.py export_annotations

Will create JSON annotation files for each video that has annotations. Use `--filter-` arguments
to limit the number of matching video files. For example

	python manage.py export_annotations --filter-ids 1 5 --filter-verified 

would limit export to videos 1 and 5 if they are verified. 

A note on dense annotations: Dense annotations will be created between the first and last keyframe.
Between keyframes linear interpolation is used to advance bounding rectangle information. State 
information is always copied from the earlier of two keyframes involved in interpolation. 
Interpolation will be replaced by a direct keyframe copy if the keyframe timestamp is within `eps` of
the current timestamp.
'''

	def add_arguments(self, parser):	
		parser.add_argument('--fps', type=float, help='Number of frames / second. If omitted, video will be probed for fps.')
		parser.add_argument('--out-dir', help='Output directory', default='./exported_annotations')
		parser.add_argument('--out-use-filename', action='store_true', help='Use filename property instead of video id when exporting.')
		parser.add_argument('--field', help='JSON field name to hold dense annotations', default='frames')
		parser.add_argument('--eps', type=float, help='Approximate key frame matching threshold. If omitted will computed based on fps.')
		parser.add_argument('--filter-ids', type=int, nargs='+', help='Only export these video ids.')		
		parser.add_argument('--filter-verified', action='store_true', help='Only export verified annotations.')		
		parser.add_argument('--sparse', action='store_true', help='Do not create dense annotations.')
		parser.add_argument('--probe-seconds', type=int, help='Limit video probing to first n seconds of video.', default=2)

	def handle(self, *args, **options):
		os.makedirs(options['out_dir'], exist_ok=True)

		# Filter videos
		filter_set = Video.objects.filter(annotation__gt='')
		if options['filter_ids']:
			filter_set &= Video.objects.filter(id__in=options['filter_ids'])
		if options['filter_verified']:
			filter_set &= Video.objects.filter(verified=True)

		print('Found {} videos matching filter query'.format(len(filter_set)))

		for vid in filter_set:
			print('Processing video {}'.format(vid))
			self.export_annotations(vid, options)

	def export_annotations(self, video, options):		
		content = json.loads(video.annotation)

		if not options['sparse']:
		
			fps = options['fps']
			if fps is None:
				print('--Probing video {}'.format(video.id))
				fps = self.probe_video(video, probesecs=options['probe_seconds'])
				if fps is None:
					print('--Failed to probe.')
					return
				print('--Estimated fps {:.2f}'.format(fps))

			eps = options['eps']
			if eps is None:
				eps = (1 / fps) * 0.5
				print('--Computing eps as {:.2f}'.format(eps))

			for obj in content:				
				frames = self.create_dense_annotations(obj, eps, fps)
				obj[options['field']] = frames
				print('--Created {} dense annotations for object {}'.format(len(frames), obj['id']))
		
		filename = str(video.id) + '.json'
		if options['out_use_filename'] and len(video.filename) > 0:
			filename = str(video.filename) + '.json'
		outpath = os.path.normpath(os.path.join(options['out_dir'], filename))
		with open(outpath, 'w') as fh:
			json.dump(content, fh, indent=4)
		print('--Saved annotations to {}'.format(outpath))

	def probe_video(self, video, probesecs):
		'''Probe video file or image directory for FPS and number of frames.'''
		url = video.url

		if url == 'Image List':
			return 1 # 1 FPS
		else:
			ROOT = os.path.join(os.path.dirname(__file__), '..', '..', '..')
			
			cmd = [
				'ffprobe', 
				'-hide_banner',				
				'-print_format', 'json',
				'-read_intervals', '%+{}'.format(probesecs),
				'-show_streams', 
				'-count_frames',
				'-select_streams', 'v:0'
			]
			
			if not url.startswith('http'):	
				# Local file path, relative to serving directory			
				url = os.path.normpath(os.path.join(ROOT, 'annotator', url.strip('/')))
			else:
				# Timeout for reaching remote file
				cmd.extend(['-timeout', str(int(5e6))])
			
			cmd.extend(['-i', url])

			try:   
				p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)    
				out, err =  p.communicate()
				if p.returncode != 0:
					print('--Failed to probe video with error {}'.format(err))
					return None
				
				content = json.loads(out.decode('utf-8'))
				stream = content['streams'][0]
				return eval(stream['r_frame_rate'])
			except FileNotFoundError:
				print('--Failed to find `ffprobe`. Make sure to have `ffmpeg` in your PATH.')
				return None
			


	def create_dense_annotations(self, obj, eps, fps):
		'''Creates dense annotations for a BeaverDam JSON object.
		
		Dense annotations will be created between the first and last keyframe.
		Between keyframes linear interpolation is used to advance bounding rectangle
		information. State information is always copied from the earlier of two
		keyframes involved in interpolation. Interpolation will be replaced by a
		direct keyframe copy if the keyframe timestamp is within `eps` of
		the current timestamp.
		
		The following information is stored within generated annotations:
			- `frameid` : Zero based frame index.
			- `frame`: timestamp of current frame, computed as `framerate * frameid`.
			- `state`: State set during labeling. See BeaverDam documentation.
			- `x,y,w,h`: Bounds information.
			- `refid`: Keyframe reference index if direct keyframe copy is applied.
		'''

		keyframes = sorted(obj['keyframes'], key=lambda x: x['frame'])
			
		newframes = []
		if len(keyframes) == 0:
			return newframes

		framerate = 1. / fps
		fidx = int(math.floor(keyframes[0]['frame'] / framerate))
		knext = 0
		
		while knext < len(keyframes):        

			tnext = keyframes[knext]['frame']
			t = fidx * framerate
			td = tnext - t
			
			isinrange = abs(td) <= eps

			if isinrange:
				frame = dict(keyframes[knext])
				frame['frame'] = t
				frame['frameid'] = fidx    
				frame['refid'] = knext   
				newframes.append(frame)
			elif knext > 0:
				kprev = knext - 1
				frac = (t - keyframes[kprev]['frame']) / (tnext - keyframes[kprev]['frame'])
				closer = kprev if frac <= 0.5 else knext
				b = self.interpolate(
					self.bounds_from_json(keyframes[kprev]), 
					self.bounds_from_json(keyframes[knext]), 
					frac)

				frame = dict(keyframes[closer])
				frame['frame'] = t
				frame['state'] = keyframes[kprev]['state']
				frame['frameid'] = fidx
				frame.update(self.bounds_to_json(b))
				newframes.append(frame)

			if t + framerate > tnext:
				knext += 1

			fidx += 1

		return newframes

	def bounds_from_json(self, e):
		'''Reads bounds from BeaverDam JSON.'''
		return [e['x'], e['x'] + e['w'], e['y'], e['y'] + e['h']]

	def bounds_to_json(self, b):
		'''Converts array format to BeaverDam JSON.'''
		return {'x' : b[0], 'y' : b[2], 'w' : b[1] - b[0], 'h' : b[3] - b[2]}

	def interpolate(self, src, dst, frac):
		'''Linear interpolation of rectangles.'''
		ifrac = 1.0 - frac
		return [s*ifrac + d*frac for s,d in zip(src, dst)]
