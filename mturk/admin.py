from django.contrib import admin
from .models import *
import logging


logger = logging.getLogger()

class FullVideoTaskAdmin(admin.ModelAdmin):
    list_display =('id','hit_id','video', 'bonus', 'closed', 'paid')
   

admin.site.register(FullVideoTask, FullVideoTaskAdmin)
admin.site.register(SingleFrameTask)
