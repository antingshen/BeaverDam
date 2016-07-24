from django.db import models
from django.contrib.staticfiles import finders


class Video(models.Model):
    annotation = models.TextField(blank=True)
    source = models.CharField(max_length=1048, blank=True)
    filename = models.CharField(max_length=100, blank=True, unique=True)
    host = models.CharField(max_length=1048, blank=True)
    
    def __str__(self):
        if self.filename:
            return self.filename
        return 'video_{}'.format(self.id)

    @property
    def url(self):
        if finders.find('videos/{}.mp4'.format(self.id)):
            return '/static/videos/{}.mp4'.format(self.id)
        elif not (video.filename and video.host):
            raise Exception('Video {0} does not have a filename or host. Possible fixes: \n1) Place {0}.mp4 into static/videos to serve locally. \n2) Update the filename & host fields of the Video with id={0}'.format(self.id))
        else:
            return self.filename + self.host
