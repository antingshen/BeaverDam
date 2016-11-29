from django.shortcuts import render, redirect
from django.conf import settings
from django.http import HttpResponse, Http404, HttpResponseBadRequest, HttpResponseForbidden
from django.views.generic import View
from django.views.decorators.clickjacking import xframe_options_exempt
from django.contrib.admin.views.decorators import staff_member_required
from django.core.exceptions import ObjectDoesNotExist

import os
import json
import sys

import mturk.utils
from mturk.queries import get_active_video_turk_task

from .models import *

from .services import *

import logging
import ast

logger = logging.getLogger()


def home(request):
    need_annotating = Video.objects.filter(id__gt=0, verified=False)[:25]
    return render(request, 'video_list.html', context={
        'videos': need_annotating,
        'thumbnail': True,
        'test' : settings.AWS_ID
    })

def verify_list(request):
    need_verification = Video.objects.filter(id__gt=0, verified=False).exclude(annotation='')[:100]
    return render(request, 'video_list.html', context={
        'videos': need_verification
    })

def verified_list(request):
    verified = Video.objects.filter(id__gt=0, verified=True).exclude(annotation='')[:100]
    return render(request, 'video_list.html', context={
        'videos': verified,
    })

def next_unannotated(request, video_id):
    id = Video.objects.filter(id__gt=video_id, annotation='')[0].id
    return redirect('video', id)

# status of Not Published, Published, Awaiting Approval, Verified
# this is a bit convoluted as there's status stored on 
# video (approved) as well as FullVideoTask (closed, paid, etc.)
def get_mturk_status(video, full_video_task):
    if video.verified:
        return "Verified"
    if full_video_task == None:
        return "Not Published"
    if full_video_task.worker_id == '':
        return "Published"
    if full_video_task.worker_id != '':
        return "Awaiting Approval"

@xframe_options_exempt
def video(request, video_id):
    try:
        video = Video.objects.get(id=video_id)
        labels = Label.objects.all()
    except Video.DoesNotExist:
        raise Http404('No video with id "{}". Possible fixes: \n1) Download an up to date DB, see README. \n2) Add this video to the DB via /admin'.format(video_id))

    mturk_data = mturk.utils.authenticate_hit(request)
    if 'error' in mturk_data:
        return HttpResponseForbidden(mturk_data['error'])
    if not (mturk_data['authenticated'] or request.user.is_authenticated()):
        return redirect('/login/?next=' + request.path)

    start_time = float(request.GET['s']) if 's' in request.GET else None
    end_time = float(request.GET['e']) if 'e' in request.GET else None

    turk_task = get_active_video_turk_task(video.id)

    if turk_task != None:
        if turk_task.metrics != '':
            metricsDictr = ast.literal_eval(turk_task.metrics)
        else:
            metricsDictr = {}

        full_video_task_data = {
            'id': turk_task.id,
            'storedMetrics': metricsDictr,
            'bonus': float(turk_task.bonus),
            'bonusMessage': turk_task.message,
            'rejectionMessage': settings.MTURK_REJECTION_MESSAGE,
            'isComplete': turk_task.worker_id != ''
        }
    else:
        full_video_task_data = None

    mturk_data['status'] = get_mturk_status(video, turk_task)    

    logger.error("full task = {}".format(full_video_task_data))

    video_data = json.dumps({
        'id': video.id,
        'location': video.url,
        'path': video.host,
        'is_video': not video.image_list,
        'annotated': video.annotation != '',
        'verified': video.verified,
        'rejected': video.rejected,
        'start_time': start_time,
        'end_time' : end_time,
        'turk_task' : full_video_task_data
    })

    label_data = []
    for l in labels:
        label_data.append({'name': l.name, 'color': l.color})

    response = render(request, 'video.html', context={
        'label_data': label_data,
        'video_data': video_data,
        'image_list': json.loads(video.image_list) if video.image_list else 0,
        'image_list_path': video.host,
        'help_url': settings.HELP_URL,
        'mturk_data': mturk_data,
        'iframe_mode': mturk_data['authenticated'],
        'survey': False,
    })
    if not mturk_data['authenticated']:
        response['X-Frame-Options'] = 'SAMEORIGIN'
    return response


class AnnotationView(View):

    def get(self, request, video_id):
        video = Video.objects.get(id=video_id)
        return HttpResponse(video.annotation, content_type='application/json')

    def post(self, request, video_id):
        data = json.loads(request.body.decode('utf-8'))
        
        video = Video.objects.get(id=video_id)
        video.annotation = json.dumps(data['annotation'])
        video.save()

        hit_id = data.get('hitId', None)
        if hit_id != None:
            if not Task.valid_hit_id(hit_id):
                return HttpResponseForbidden('Not authenticated')
            else:
                try:
                    worker_id = data.get('workerId', '')
                    assignment_id = data.get('assignmentId', '')
                    task = Task.get_by_hit_id(hit_id)
                    task.complete(worker_id, assignment_id, data['metrics'])
                except ObjectDoesNotExist:
                    if not settings.DEBUG:
                        raise
        return HttpResponse('success')


class AcceptRejectView(View):
    def post(self, request, video_id):
        data = json.loads(request.body.decode('utf-8'))

        try:
            if data['type'] == "accept":
                accept_video(request, int(video_id), data['bonus'], data['message'] )
            elif data['type'] == "reject":
                reject_video(request, int(video_id), data['message'], data['reopen'], data['deleteBoxes'])
            return HttpResponse(status=200)
        except Exception as e:
            logger.exception(e)
            response = HttpResponse(status=500)
            response['error-message'] = str(e)
            return response
