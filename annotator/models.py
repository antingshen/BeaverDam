from django.db import models
from django.contrib.staticfiles import finders

class Video(models.Model):
    annotation = models.TextField(blank=True,
        help_text="A JSON blob containing all user annotation sent from client.")
    source = models.CharField(max_length=1048, blank=True,
        help_text=("Name of video source or type, for easier grouping/searching of videos."
            "This field is not used by BeaverDam and only facilitates querying on videos by type."))
    filename = models.CharField(max_length=100, blank=True,
        help_text=("Name of the video file."
            "The video should be publically accessible by at <host><filename>."))
    image_list = models.TextField(blank=True,
        help_text=("List of filenames of images to be used as video frames, in JSON format."
            "When present, image list is assumed and <filename> is ignored."))
    host = models.CharField(max_length=1048, blank=True,
        help_text="Path to prepend to filenames to form the url for this video or the images in `image_list`.")
    verified = models.BooleanField(default=False, help_text="Verified as correct by expert.")
    rejected = models.BooleanField(default=False, help_text="Rejected by expert.")

    @classmethod
    def from_list(cls, path_to_list, *, source, host, filename_prefix=''):
        created = []
        for line in open(path_to_list, 'r'):
            if line:
                video = cls(source=source, filename=filename_prefix + line.strip(), host=host)
                video.save()
                created.append(video)
        return created

    def __str__(self):
        return '/video/{}'.format(self.id)

    @property
    def url(self):
        if self.image_list:
            return 'Image List'
        elif finders.find('videos/{}.mp4'.format(self.id)):
            return '/static/videos/{}.mp4'.format(self.id)
        elif self.filename and self.host:
            return self.host + self.filename
        else:
            raise Exception('Video {0} does not have a filename, host or image_list. Possible fixes: \n1) Place {0}.mp4 into static/videos to serve locally. \n2) Update the filename & host fields of the Video with id={0}'.format(self.id)) + self.filename

    def count_keyframes(self, at_time=None):
        if at_time is None:
            return self.annotation.count('"frame"')
        else:
            return self.annotation.count('"frame": {}'.format(at_time))

class Label(models.Model):
    """The classes available for workers to choose from for each object."""
    id = models.AutoField(primary_key=True)
    name = models.CharField(blank=True, max_length=100, unique=True,
        help_text="Name of class label option.")
    color = models.CharField(blank=True, max_length=6,
        help_text="6 digit hex.")

    def __str__(self):
        return self.name
