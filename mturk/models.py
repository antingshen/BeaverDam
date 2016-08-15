from django.db import models
from django.conf import settings
from django.core.urlresolvers import reverse
from django.core.exceptions import ObjectDoesNotExist, MultipleObjectsReturned

from tqdm import tqdm

from .mturk_api import Server
from annotator.models import Video


mturk = Server(settings.AWS_ID, settings.AWS_KEY, settings.URL_ROOT, settings.MTURK_SANDBOX)


class Task(models.Model):
    hit_id = models.CharField(max_length=64, blank=True)
    hit_group = models.CharField(max_length=64, blank=True)
    metrics = models.TextField(blank=True)
    duration = 7200 # 2 hours
    lifetime = 2592000 # 30 days
    worker_id = models.CharField(max_length=64, blank=True)
    sandbox = models.BooleanField(default=settings.MTURK_SANDBOX)


    class Meta:
        abstract = True

    def publish(self):
        if settings.MTURK_SANDBOX != self.sandbox:
            raise Exception("settings.MTURK_SANDBOX != self.sandbox")
        if self.video.verified:
            self.video.verified = False
            self.video.save()
        response = mturk.create_hit(self.title, self.description, self.url, 
            self.pay, self.duration, self.lifetime)
        self.hit_id = response.values['hitid']
        self.hit_group = response.values['hittypeid']
        self.save()

    @classmethod
    def batch_create_and_publish(cls, videos, **kwargs):
        created = []
        for video in tqdm(videos):
            task = cls(video=video, **kwargs)
            task.save()
            task.publish()
        return created

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
        return self.video.filename


class SingleFrameTask(Task):
    video = models.ForeignKey(Video)
    time = models.FloatField()
    title = "Image Annotation"
    description = "Draw boxes around all objects of interest in an image, with bonus per object"
    pay = 0.01

    @property
    def url(self):
        return reverse('video', args=[self.video.id]) + '?s={0}&amp;e={0}'.format(self.time)

    def __str__(self):
        return '{:.2f} of {}'.format(self.time, self.video.filename)
