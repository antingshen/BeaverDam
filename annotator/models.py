from django.db import models


class Video(models.Model):
    name = models.CharField(max_length=100, blank=True)
    annotation = models.TextField(blank=True)
    source = models.CharField(max_length=1048, blank=True)
    url = models.CharField(max_length=1048, blank=True)
    
    def __str__(self):
        if self.name:
            return self.name
        return 'video_{}'.format(self.id)
