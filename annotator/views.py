from django.shortcuts import render
from django.conf import settings
from django.http import HttpResponse, Http404
from django.views.generic import View
from django.contrib.staticfiles import finders
from django.views.decorators.clickjacking import xframe_options_exempt

import os
import json

from .models import *


def home(request):
    return video(request, 'test_vid')

@xframe_options_exempt
def video(request, video_name):
    try:
        video = Video.objects.get(name=video_name)
    except Video.DoesNotExist:
        raise Http404('No video named "{}". Possible fixes: 1) Download an up to date DB, see README. 2) Add this video to the DB via /admin'.format(video_name))

    if finders.find('videos/{}/0/0/0.jpg'.format(video_name)):
        video_location = 'static'
    else:
        video_location = 's3'

    assignment_id = request.GET.get('assignmentId', None)
    preview = (assignment_id == 'ASSIGNMENT_ID_NOT_AVAILABLE')
    iframe_mode = assignment_id is not None
    if assignment_id is not None and assignment_id != 'ASSIGNMENT_ID_NOT_AVAILABLE':
        hit_id = request.GET['hitId']
        worker = request.GET['workerId']

    video_data = json.dumps({
        'name': video_name,
        'location': video_location,
        'annotated': video.annotation != '',
    })

    return render(request, 'video.html', context={
        'video_data': video_data,
        'iframe_mode': iframe_mode,
        'preview': preview,
        'assignment_id': assignment_id,
        'MTURK_SANDBOX': settings.MTURK_SANDBOX,
    })


class AnnotationView(View):
    
    def get(self, request, video_name):
        video = Video.objects.get(name=video_name)
        return HttpResponse(video.annotation, content_type='application/json')
    
    def post(self, request, video_name):
        annotation = request.body.decode('utf-8')
        video = Video.objects.get(name=video_name)
        video.annotation = annotation
        video.save()
        return HttpResponse('success')
