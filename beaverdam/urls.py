from django.conf.urls import url, include
from django.contrib import admin

from annotator.views import *

admin.site.site_header = 'BeaverDam Admin'

urlpatterns = [
    url(r'^$', home),
    url(r'^video/(\d+)', video, name='video'),
    url(r'^annotation/(\d+)', AnnotationView.as_view()),

    url(r'^admin/', admin.site.urls),
]
