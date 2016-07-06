from django.db import models


class Video(models.Model):
    name = models.CharField(max_length=100, primary_key=True)
    annotation = models.TextField(blank=True)
    source = models.CharField(max_length=1048, blank=True)
    
    def __str__(self):
        return self.name
