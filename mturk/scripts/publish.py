from mturk.models import FullVideoTask
from beaverdam import settings


print(settings.MTURK_SANDBOX)

def publish(arr):
    count = 0
    total = 0
    for x in arr:
        print("Publishing {}".format(x.video.filename))
        if x.sandbox :
            x.sandbox = False;
            x.save()
        x.publish()

arr = FullVideoTask.objects.filter(video__pk__in = [1541,1676,1774,1812,2010], video__verified = False)
publish(arr)
