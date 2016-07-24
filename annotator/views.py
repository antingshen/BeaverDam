from django.shortcuts import render
from django.conf import settings
from django.http import HttpResponse, Http404
from django.views.generic import View
from django.views.decorators.clickjacking import xframe_options_exempt

import os
import json

from .models import *


def home(request):
    return video(request, 0)

@xframe_options_exempt
def video(request, video_id):
    try:
        video = Video.objects.get(id=video_id)
    except Video.DoesNotExist:
        raise Http404('No video with id "{}". Possible fixes: \n1) Download an up to date DB, see README. \n2) Add this video to the DB via /admin'.format(video_id))

    assignment_id = request.GET.get('assignmentId', None)
    preview = (assignment_id == 'ASSIGNMENT_ID_NOT_AVAILABLE')
    iframe_mode = assignment_id is not None
    if assignment_id is not None and assignment_id != 'ASSIGNMENT_ID_NOT_AVAILABLE' and (settings.DEBUG == False):
        hit_id = request.GET['hitId']
        worker = request.GET['workerId']

    video_data = json.dumps({
        'id': video.id,
        'location': video.url,
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
    
    def get(self, request, video_id):
        video = Video.objects.get(id=video_id)
        return HttpResponse(video.annotation, content_type='application/json')
    
    def post(self, request, video_id):
        annotation = request.body.decode('utf-8')
        video = Video.objects.get(id=video_id)
        video.annotation = annotation
        video.save()
        return HttpResponse('success')
