from django.conf.urls import url
from django.contrib import admin
from django.contrib.auth.views import login, logout
from django.views.generic.base import RedirectView

from annotator.views import *
from annotator.services import *

admin.site.site_header = 'BeaverDam'

urlpatterns = [
    url(r'^$', home),
    url(r'^verify/$', verify_list),
    url(r'^verified/$', verified_list),
    url(r'^readytopay/$', ready_to_pay),

    url(r'^video/(\d+)/$', video, name='video'),
    url(r'^video/(\d+)/next/$', next_unannotated),
    url(r'^video/(\d+)/verify/$', verify),
    url(r'^annotation/(\d+)/$', AnnotationView.as_view()),
    url(r'^accept\-annotation/(\d+)/$', ReceiveCommand.as_view()),
    url(r'^reject\-annotation/(\d+)/$', ReceiveCommand.as_view()),
    url(r'^email-worker/(\d+)/$', ReceiveCommand.as_view()),

    url(r'^login/$', login,
        {'template_name': 'admin/login.html',
            'extra_context': {'site_header': 'BeaverDam Login'}
        }, name='login'),
    url(r'^logout/$', logout),
    url(r'^accounts/', RedirectView.as_view(url='/')),
    url(r'^admin/', admin.site.urls),
]
