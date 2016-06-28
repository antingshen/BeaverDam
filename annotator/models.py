from django.db import models


class Video(models.Model):
    name = models.CharField(max_length=100, primary_key=True)
    annotation = models.TextField()
