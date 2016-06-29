from django.shortcuts import render
from django.conf import settings
from django.http import HttpResponse, Http404
from django.views.generic import View
from django.contrib.staticfiles import finders

import os
import json

from .models import *


def home(request):
    return video(request, 'test_vid')

def video(request, video_name):
    try:
        video = Video.objects.get(name=video_name)
    except Video.DoesNotExist:
        raise Http404('No video named "{}".'.format(video_name))
    if finders.find('videos/{}/0/0/0.jpg'.format(video_name)):
        video_location = 'static'
    else:
        video_location = 's3'
    video_data = json.dumps({
        'name': video_name,
        'location': video_location,
        'annotated': video.annotation != '',
    })
    return render(request, 'video.html', context={'video_data': video_data})

class AnnotationView(View):
    directory = os.path.join(settings.BASE_DIR, 'annotations')
    
    def get(self, request, video_name):
        video = Video.objects.get(name=video_name)
        return HttpResponse(video.annotation, content_type='application/json')
    
    def post(self, request, video_name):
        annotation = request.body.decode('utf-8')
        Video.objects.get(name=video_name).annotation = annotation
        return HttpResponse('success')
