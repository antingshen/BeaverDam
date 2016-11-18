from django.contrib import admin

from .models import Video
from .models import Label

admin.site.register(Video)
admin.site.register(Label)
