from django.conf.urls import url, include
from django.contrib import admin
from django.views.generic.base import RedirectView

from annotator.views import *

admin.site.site_header = 'BeaverDam'

urlpatterns = [
    url(r'^$', home),
    url(r'^video/(\d+)/?$', video, name='video'),
    url(r'^video/(\d+)/verify/$', verify),
    url(r'^annotation/(\d+)', AnnotationView.as_view()),

    url(r'^login/$', 'django.contrib.auth.views.login', 
        {'template_name': 'admin/login.html', 
            'extra_context': {'site_header': 'BeaverDam Login'}
        }),
    url(r'^logout/$', 'django.contrib.auth.views.logout'),
    url(r'^accounts/', RedirectView.as_view(url='/')),
    url(r'^admin/', admin.site.urls),
]
