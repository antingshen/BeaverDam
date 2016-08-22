from django.test import TestCase

from .models import Video

class VideoTestCase(TestCase):
	def setUp(self):
		Video.objects.create(filename='test/video1')

	def test_count_keyframes(self):
		v = Video.objects.get(filename='test/video1')
		v.annotation = '{"color": "#137819", "keyframes": [{"h": 43.50453172205437, "frame": 0, "x": 919, "y": 694, "w": 84}], "type": "car"},]'
		self.assertEqual(v.count_keyframes(), 1)
		self.assertEqual(v.count_keyframes(at_time=0), 1)
		self.assertEqual(v.count_keyframes(at_time=0.5), 0)

