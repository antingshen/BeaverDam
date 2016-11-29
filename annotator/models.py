from django.db import models
from django.contrib.staticfiles import finders

class Video(models.Model):
    annotation = models.TextField(blank=True)
    source = models.CharField(max_length=1048, blank=True)
    filename = models.CharField(max_length=100, blank=True, unique=True)
    image_list = models.TextField(blank=True)
    host = models.CharField(max_length=1048, blank=True)
    verified = models.BooleanField(default=False)
    rejected = models.BooleanField(default=False)

    @classmethod
    def from_list(cls, path_to_list, *, source, host, filename_prefix=''):
        created = []
        for line in open(path_to_list, 'r'):
            if line:
                video = cls(source=source, filename=filename_prefix + line.strip(), host=host)
                video.save()
                created.append(video)
        return created

    def __str__(self):
        return '/video/{}'.format(self.id)

    @property
    def url(self):
        if finders.find('videos/{}.mp4'.format(self.id)):
            return '/static/videos/{}.mp4'.format(self.id)
        elif self.image_list:
            return 'Image List'
        elif self.filename and self.host:
            return self.host + self.filename
        else:
            raise Exception('Video {0} does not have a filename, host or image_list. Possible fixes: \n1) Place {0}.mp4 into static/videos to serve locally. \n2) Update the filename & host fields of the Video with id={0}'.format(self.id)) + self.filename

    def count_keyframes(self, at_time=None):
        if at_time is None:
            return self.annotation.count('"frame"')
        else:
            return self.annotation.count('"frame": {}'.format(at_time))

class Label(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(blank=True, max_length=100, unique=True)
    color = models.CharField(blank=True, max_length=6)

    def __str__(self):
        return self.name
