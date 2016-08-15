from django.db import models
from django.conf import settings
from django.core.urlresolvers import reverse
from django.core.exceptions import ObjectDoesNotExist, MultipleObjectsReturned

from .mturk_api import Server
from annotator.models import Video


mturk = Server(settings.AWS_ID, settings.AWS_KEY, settings.URL_ROOT, settings.MTURK_SANDBOX)


class Task(models.Model):
    hit_id = models.CharField(max_length=64, blank=True)
    hit_group = models.CharField(max_length=64, blank=True)
    metrics = models.TextField(blank=True)
    duration = 7200 # 2 hours
    lifetime = 60*15 # 2592000 # 30 days
    worker_id = models.CharField(max_length=64, blank=True)

    class Meta:
        abstract = True

    def publish(self):
        response = mturk.create_hit(self.title, self.description, self.url, 
            self.pay, self.duration, self.lifetime)
        self.hit_id = response.values['hitid']
        self.hit_group = response.values['hittypeid']
        self.save()

    @classmethod
    def valid_hit_id(cls, id):
        if id is None:
            return False
        try:
            item = cls.get_by_hit_id(id)
            return True
        except ObjectDoesNotExist:
            return settings.DEBUG

    @classmethod
    def get_by_hit_id(cls, id):
        items = []
        for task_type in cls.__subclasses__():
            try:
                items.append(task_type.objects.get(hit_id=id))
            except ObjectDoesNotExist:
                pass
        if len(items) > 1:
            raise MultipleObjectsReturned()
        elif len(items) == 0:
            raise ObjectDoesNotExist()
        else:
            return items[0]


class FullVideoTask(Task):
    video = models.ForeignKey(Video)
    title = "Video Annotation"
    description = "Draw boxes around objects in a video"
    pay = 0.00

    @property
    def url(self):
        return reverse('video', args=[self.video.id])

    def __str__(self):
        return self.video.name
