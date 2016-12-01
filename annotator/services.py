import mturk.queries
import logging
from django.http import HttpResponse, Http404 

from django.contrib.admin.views.decorators import staff_member_required
from mturk.models import Task, FullVideoTask
from .models import *
from mturk.queries import *
from decimal import Decimal

logger = logging.getLogger()

@staff_member_required
def publish_videos_to_turk(videos):
    for video in videos:
        video_task = get_active_video_turk_task(id)

        if video_task != None:
            raise Exception('video {} already has an active FullVideoTask'.format(id))

        video_task = FullVideoTask(video = video)
        video_task.publish()

@staff_member_required
def verify(request, video_id):
    body = request.body.decode('utf-8')
    video = Video.objects.get(id=video_id)
    if body == 'true':
        video.verified = True
    elif body == 'false':
        video.verified = False
    else:
        print(body)
        return HttpResponseBadRequest()
    video.save()
    return HttpResponse('video verification state saved')

@staff_member_required    
def accept_video(request, video_id, bonus, message, reopen, clear_boxes, blockWorker, updatedAnnotation):
    video = Video.objects.get(pk=video_id)
    video.verified = True

    video_task = get_active_video_turk_task(video.id)

    if video_task != None:
        # accept on turk
        video_task.approve_assignment(bonus, message)

        if blockWorker:
            video_task.blockWorker()

        # delete from Turk
        video_task.archive_turk_hit()

        video_task.bonus = Decimal(bonus)
        video_task.message = message
        video_task.paid = True
        video_task.closed = True
        video_task.save()

         # create a new HIT for this instaed
        if reopen:
            new_task = FullVideoTask(video = video)
            new_task.publish()

            # now mark the video as unverified as we're asking somebody else to fill this in
            # why would we do this? Sometimes it's a better strategy to accept somebody's work, 
            # and block the worker but then get somebody else to do the work 
            video.verified = False

  # clear the boxes as specified
    if clear_boxes:
        video.annotation = ''
    else:
        video.annotation = updatedAnnotation
    
    video.rejected = False
    video.save()

@staff_member_required
def reject_video(request, video_id, message, reopen, clear_boxes, blockWorker, updatedAnnotation):
    video = Video.objects.get(pk=video_id)
    video_task = get_active_video_turk_task(video.id)
    
    if video_task != None:
        # reject on turk
        video_task.reject_assignment(message)

        if blockWorker:
            video_task.blockWorker()

        # update the task 
        video_task.message = message
        video_task.rejected = True
        video_task.bonus = 0
        video_task.closed = True
        video_task.save()

        # delete from Turk
        video_task.archive_turk_hit()

        # create a new HIT for this instaed
        if reopen:
            new_task = FullVideoTask(video = video)
            new_task.publish()

    # clear the boxes as specified
    if clear_boxes:
        video.annotation = ''
    else:
        video.annotation = updatedAnnotation

    video.verified = False
    video.rejected = True
    video.save()


@staff_member_required
def email_worker(request, video_id, subject, message):
    video = Video.objects.get(pk=video_id)
    video_task = get_active_video_turk_task(video.id)
    
    if video_task == None:
        raise Exception("No video task to send email for {}".format(video_id))

    video_task.send_email(subject, message)