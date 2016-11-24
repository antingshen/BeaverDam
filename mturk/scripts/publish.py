from mturk.models import FullVideoTask

arr = FullVideoTask.objects.filter(hit_id = "")[1:5]

def publish(arr):
    print("{} tasks to publish".format(len(arr)))
    for x in arr:
        #x.publish()
        print("publishing {}".format(x.video.filename))

publish(arr)
