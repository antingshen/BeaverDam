from django.shortcuts import render, redirect
from django.conf import settings
from django.http import HttpResponse, Http404, HttpResponseBadRequest, HttpResponseForbidden
from django.views.generic import View
from django.views.decorators.clickjacking import xframe_options_exempt
from django.contrib.admin.views.decorators import staff_member_required
from django.core.exceptions import ObjectDoesNotExist

import os
import json
import urllib.request
import markdown

import mturk.utils
from .models import *
from mturk.models import Task, FullVideoTask, SingleFrameTask

def home(request):
    need_annotating = Video.objects.filter(id__gt=0, verified=False)
    return render(request, 'video_list.html', context={
        'videos': need_annotating,
        'thumbnail': True,
    })

def verify_list(request):
    need_verification = Video.objects.filter(id__gt=0, verified=False).exclude(annotation='')[:100]
    return render(request, 'video_list.html', context={
        'videos': need_verification,
    })

def verified_list(request):
    verified = Video.objects.filter(id__gt=0, verified=True).exclude(annotation='')[:100]
    return render(request, 'video_list.html', context={
        'videos': verified,
    })

def ready_to_pay(request):
    #tasks = FullVideoTask.objects.filter(paid = False, video__verified = True).exclude(hit_id = '')
    tasks = FullVideoTask.objects.all()#filter(paid = False, video__verified = True).exclude(hit_id = '')
    print("there are {} tasks".format(len(tasks)))
    return render(request, 'turk_ready_to_pay.html', context={
        'tasks': tasks,
    })

def next_unannotated(request, video_id):
    id = Video.objects.filter(id__gt=video_id, annotation='')[0].id
    return redirect('video', id)

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

    video_data = json.dumps({
        'id': video.id,
        'location': video.url,
        'path': video.host,
        'is_image_sequence': True if video.image_list else False,
        'annotated': video.annotation != '',
        'verified': video.verified,
        'start_time': start_time,
        'end_time' : end_time,
    })

    label_data = []
    for l in labels:
        label_data.append({'name': l.name, 'color': l.color})

    help_content = ''
    if settings.HELP_URL and settings.HELP_USE_MARKDOWN:
        help_content = urllib.request.urlopen(settings.HELP_URL).read().decode('utf-8')
        help_content = markdown.markdown(help_content)

    response = render(request, 'video.html', context={
        'label_data': label_data,
        'video_data': video_data,
        'image_list': json.loads(video.image_list) if video.image_list else 0,
        'image_list_path': video.host.replace('#', '%23'),
        'help_url': settings.HELP_URL,
        'help_embed': settings.HELP_EMBED,
        'mturk_data': mturk_data,
        'iframe_mode': mturk_data['authenticated'],
        'survey': False,
        'help_content': help_content
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
        hit_id = data.get('hitId', None)
        if not (request.user.is_authenticated()):
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
