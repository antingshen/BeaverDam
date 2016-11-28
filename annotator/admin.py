from django.contrib import admin
from django.contrib.admin import SimpleListFilter
from .models import Video
from .models import Label
from mturk.models import FullVideoTask
from mturk.queries import get_active_video_turk_task
from django.db.models import Count, Sum, Q, Case, When, IntegerField
#from services import *
import logging

logger = logging.getLogger() 

def publish(modeladmin, request, videos):
    #publish_videos_to_turk(queryset)

    for video in videos:
        video_task = get_active_video_turk_task(video.id)

        if video_task != None:
            raise Exception('video {} already has an active FullVideoTask'.format(id))

        video_task = FullVideoTask(video = video)
        video_task.publish()
    
    #self.message_user(request, "Published {} videos".format(videos.Count()))

    #rows_updated = queryset.update(status='p')
    #if rows_updated == 1:
    #    message_bit = "1 story was"
    #else:
    #    message_bit = "%s stories were" % rows_updated
    #self.message_user(request, "%s successfully marked as published." % message_bit)

class PublishedFilter(SimpleListFilter):
    title = 'Published' # or use _('country') for translated title
    parameter_name = 'Published'
    default_value = 2

    def lookups(self, request, model_admin):
        return (
        (2, 'All'),
        (1, 'Yes'),
        (0, 'No'),
    )
        # You can also use hardcoded model name like "Country" instead of 
        # "model_admin.model" if this is not direct foreign key filter

    def queryset(self, request, queryset):
        if self.value() is None:
            return queryset
        else:
            self.used_parameters[self.parameter_name] = int(self.value())

        if self.value() == 0:
            return queryset.annotate(num_video_tasks=
                Sum(
                    Case(
                        When(Q(fullvideotask__id=None) | Q(fullvideotask__closed=True), then=0),
                        default=1,
                        output_field=IntegerField())
                    )).filter(num_video_tasks = 0)

        elif self.value() == 1:
            return queryset.annotate(num_video_tasks=
                Sum(
                    Case(
                        When(Q(fullvideotask__id=None) | Q(fullvideotask__closed=True), then=0),
                        default=1,
                        output_field=IntegerField())
                    )).filter(num_video_tasks__gt = 0)
        else:
            return queryset

class VideoAdmin(admin.ModelAdmin):
    list_display =('id','filename','verified', 'is_published')
    list_filter=[PublishedFilter, 'verified']
    search_fields=['filename']
    actions=[publish]

    def is_published(self, obj):
        task = get_active_video_turk_task(obj.id)
        if task == None:
            return False
        if task.hit_id == '':
            return False
        return True

    is_published.short_description = "Published"
        
    
admin.site.register(Video, VideoAdmin)
admin.site.register(Label)
