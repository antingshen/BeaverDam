from django.contrib import admin
from django.contrib.admin import SimpleListFilter
from .models import Video
from .models import Label
from mturk.models import FullVideoTask
from mturk.queries import get_active_video_turk_task
from django.db.models import Count, Sum, Q, Case, When, IntegerField
import logging

logger = logging.getLogger() 

def publish_to_turk(modeladmin, request, videos):
    for video in videos:
        video_task = get_active_video_turk_task(video.id)

        if video_task != None:
            raise Exception('video {} already has an active FullVideoTask'.format(id))

        video_task = FullVideoTask(video = video)
        video_task.publish()

class PublishedFilter(SimpleListFilter):
    title = 'Currently Published' # or use _('country') for translated title
    parameter_name = 'Published'
    default_value = 2

    def lookups(self, request, model_admin):
        return (
        ("1", 'Yes'),
        ("0", 'No'),
    )
 
    def queryset(self, request, queryset):
        if self.value() is None:
            return queryset
        else:
            self.used_parameters[self.parameter_name] = self.value()

        if self.value() == "0":
            return queryset.annotate(num_video_tasks=
                Sum(
                    Case(
                        When(Q(fullvideotask__id=None) | Q(fullvideotask__closed=True), then=0),
                        default=1,
                        output_field=IntegerField())
                    )).filter(num_video_tasks = 0)

        elif self.value() == "1":
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
    list_display =('id', 'video_url','filename','verified', 'is_published')
    list_filter=[PublishedFilter, 'verified']
    search_fields=['filename', 'id']
    actions=[publish_to_turk]

    def is_published(self, obj):
        task = get_active_video_turk_task(obj.id)
        if task == None:
            return False
        if task.hit_id == '':
            return False
        return True

    is_published.short_description = "Currently Published"
    is_published.boolean = True

    def video_url(self, obj):
        return '<a target="_" href="/video/{}/">/video/{}/</a>'.format(obj.id, obj.id)
    video_url.allow_tags = True
    video_url.short_description = 'Video'
        
    
admin.site.register(Video, VideoAdmin)
admin.site.register(Label)
