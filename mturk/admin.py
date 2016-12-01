from django.contrib import admin
from .models import *
import logging


logger = logging.getLogger()


def recalculate_bonus(modeladmin, request, videos):
    logger.error("racalcing bonuses")
    for video_task in videos:
        logger.error("calc bonus for {}".format(video_task.id))
        video_task.bonus = video_task.calculate_bonus()
        logger.error("new bonus is {}".format(video_task.bonus))
        video_task.save()

class FullVideoTaskAdmin(admin.ModelAdmin):
    list_display =('id','video_url','worker_id', 'hit_id', 'bonus', 'closed', 'paid', 'last_email_sent_date')
    search_fields=['id', 'worker_id', 'hit_id', 'assignment_id']
    list_filter=['paid', 'closed', 'worker_id']
    actions=[recalculate_bonus]

    def video_url(self, obj):
        return '<a target="_" href="/video/{}/">/video/{}/</a>'.format(obj.video.id, obj.video.id)
    video_url.allow_tags = True
    video_url.short_description = 'Video'
   

admin.site.register(FullVideoTask, FullVideoTaskAdmin)
admin.site.register(SingleFrameTask)
