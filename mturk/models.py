from django.db import models
from django.conf import settings
from django.core.urlresolvers import reverse

from .mturk_api import Server
from annotator.models import Video


mturk = Server(settings.MTURK_ID, settings.MTURK_KEY, settings.URL_ROOT, settings.MTURK_SANDBOX)


class Task(models.Model):
    hit_id = models.CharField(max_length=64)
    hit_group = models.CharField(max_length=64)
    duration = 7200 # 2 hours
    lifetime = 60*15 # 2592000 # 30 days

    class Meta:
        abstract = True

    def publish(self):
        response = mturk.create_hit(self.title, self.description, self.url, 
            self.pay, self.duration, self.lifetime)
        self.hit_id = response.values['hitid']
        self.hit_group = response.values['hittypeid']


class FullVideoTask(Task):
    video = models.ForeignKey(Video)
    title = "Video Annotation"
    description = "Draw boxes around objects in a video"
    pay = 0.00

    @property
    def url(self):
        return reverse('video', args=[self.video.name])
