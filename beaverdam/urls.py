from django.conf.urls import url
from django.contrib import admin

from annotator.views import AnnotationView
from annotator.views import home, verify, video
from django.contrib.auth.views import login, logout
from django.views.generic.base import RedirectView

admin.site.site_header = 'BeaverDam'

urlpatterns = [
    url(r'^$', home),
    url(r'^video/(\d+)/?$', video, name='video'),
    url(r'^video/(\d+)/verify/$', verify),
    url(r'^annotation/(\d+)', AnnotationView.as_view()),

    url(r'^login/$', login, 
        {'template_name': 'admin/login.html', 
            'extra_context': {'site_header': 'BeaverDam Login'}
        }),
    url(r'^logout/$', logout),
    url(r'^accounts/', RedirectView.as_view(url='/')),
    url(r'^admin/', admin.site.urls),
]
