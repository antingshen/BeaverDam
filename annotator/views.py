from django.shortcuts import render, redirect
from django.conf import settings
from django.http import HttpResponse, Http404, HttpResponseBadRequest, HttpResponseForbidden
from django.views.generic import View
from django.views.decorators.clickjacking import xframe_options_exempt
from django.contrib.admin.views.decorators import staff_member_required
from django.core.exceptions import ObjectDoesNotExist

import os
import json

from .models import *
from mturk.models import Task


def home(request):
    need_annotating = Video.objects.filter(id__gt=0, verified=False)[:25]
    return render(request, 'video_list.html', context={
        'videos': need_annotating,
    })

def next_unannotated(request, video_id):
    id = Video.objects.filter(id__gt=video_id, annotation='')[0].id
    return redirect('video', id)

@xframe_options_exempt
def video(request, video_id):
    try:
        video = Video.objects.get(id=video_id)
    except Video.DoesNotExist:
        raise Http404('No video with id "{}". Possible fixes: \n1) Download an up to date DB, see README. \n2) Add this video to the DB via /admin'.format(video_id))

    assignment_id = request.GET.get('assignmentId', None) or request.GET.get('mturk', None)
    if assignment_id == 'ASSIGNMENT_ID_NOT_AVAILABLE':
        preview = True
        assignment_id = None
    else:
        preview = bool(request.GET.get('preview', False))

    hit_id = request.GET.get('hitId', '')
    worker_id = request.GET.get('workerId', '')
    if not preview:
        if assignment_id is not None:
            if not Task.valid_hit_id(hit_id):
                # TODO: Log this error
                return HttpResponseForbidden('No HIT found with ID {}. Please return this HIT. Sorry for the inconvenience.'.format(hit_id))
        elif not request.user.is_authenticated():
            return redirect('/login/?next=' + request.path)

    start_time = float(request.GET['s']) if 's' in request.GET else None
    end_time = float(request.GET['e']) if 'e' in request.GET else None

    video_data = json.dumps({
        'id': video.id,
        'location': video.url,
        'annotated': video.annotation != '',
        'verified': video.verified,
        'start_time': start_time,
        'end_time' : end_time,
    })

    iframe_mode = assignment_id or preview
    response = render(request, 'video.html', context={
        'video_data': video_data,
        'iframe_mode': iframe_mode,
        'preview': preview,
        'assignment_id': assignment_id,
        'hit_id': hit_id,
        'worker_id': worker_id,
        'MTURK_SANDBOX': settings.MTURK_SANDBOX,
        'survey': False,
    })
    if not iframe_mode:
        response['X-Frame-Options'] = 'SAMEORIGIN'
    return response


class AnnotationView(View):
    
    def get(self, request, video_id):
        video = Video.objects.get(id=video_id)
        return HttpResponse(video.annotation, content_type='application/json')
    
    def post(self, request, video_id):
        data = json.loads(request.body.decode('utf-8'))
        hit_id = data.get('hitId', None)
        if not (request.user.is_authenticated()):
            if not Task.valid_hit_id(hit_id):
                return HttpResponseForbidden('Not authenticated')
            else:
                try:
                    worker_id = data.get('workerId', '')
                    task = Task.get_by_hit_id(hit_id)
                    task.worker_id = worker_id
                    task.metrics = data['metrics']
                    task.save()
                except ObjectDoesNotExist:
                    assert settings.DEBUG
        video = Video.objects.get(id=video_id)
        video.annotation = json.dumps(data['annotation'])
        video.save()
        return HttpResponse('success')


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
