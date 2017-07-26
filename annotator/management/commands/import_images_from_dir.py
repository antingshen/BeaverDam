from django.core.management.base import BaseCommand, CommandError
from annotator.models import Video
import os
import json
import re
import os
import shutil

# referring to https://stackoverflow.com/questions/5967500/how-to-correctly-sort-a-string-with-a-number-inside for "human sorting"
def atoi(text):
	    return int(text) if text.isdigit() else text

def natural_keys(text):
	    return [ atoi(c) for c in re.split('(\d+)', text) ]

class Command(BaseCommand):
	help = "Imports a directory of images as a new view object"

	def add_arguments(self, parser):
		parser.add_argument('directory')

	def handle(self, *args, **options):
		if (options['directory']):
			self.create_entry_from_dir(options['directory'])

	def create_entry_from_dir(self, directory):
		working_dir = os.getcwd()
		if os.path.basename(working_dir) != "BeaverDam":
			self.stdout.write(f"Make the working directory BeaverDam root. Current working directory is {working_dir}")
		i = 1
		host = f'/static/image_import{i}'
		dest_folder = 'annotator'+host
		while os.path.isdir(dest_folder):
			i+=1
			host = f'/static/image_import{i}'
			dest_folder = 'annotator'+host

		os.makedirs(dest_folder)
		dir_list = os.listdir(directory)
		file_list = []
		for file in dir_list:
			file_path = os.path.join(directory, file)
			if (os.path.isfile(file_path)):
				file_list.append(file)
				shutil.copy(file_path, dest_folder)

		file_list.sort(key = natural_keys)
		image_list_json = json.dumps(file_list)
		v = Video(image_list = image_list_json, host = host)
		v.save()
		self.stdout.write(f"Video {v.id} was made")
