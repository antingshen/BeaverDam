from mturk.models import FullVideoTask
from annotator.models import Video
from mturk.mturk_api import Server
from beaverdam import settings

mturk = Server(settings.AWS_ID, settings.AWS_KEY, settings.URL_ROOT, settings.MTURK_SANDBOX)

def get_hit_for_video(full_video_task):
    res = mturk.request('GetHIT', {"HITId":full_video_task.hit_id})
    res.store("HIT/HITStatus", "status")
    res.store("HIT/HITId", "hitID")
    print(full_video_task.video.filename)
    print("   - status={}, hitid={}".format(res.status, res.hitID))
    # if res.has_path("GetAssignmentsForHITResult/Assignment") :
    #     res.store("GetAssignmentsForHITResult/Request/IsValid", "IsValid", bool)
    #     res.store("GetAssignmentsForHITResult/Assignment/AssignmentId", "AssignmentId")
    #     res.store("GetAssignmentsForHITResult/Assignment/WorkerId", "WorkerId")
    #     print("Is valid = " + str(res.IsValid)) 
    #     print("Assignment id = " + res.AssignmentId)
    #     print("worker id = " + res.WorkerId)
    #     task.complete(res.WorkerId, res.AssignmentId, 'Thanks for completing this - your bonus has been paid as {}'.format(task.calculate_bonus()))

def get_hits_for_video(video_tasks):
    print("{} tasks to process".format(len(video_tasks)))
    for task in video_tasks:
        get_hit_for_video(task)

def get_completed_videos():
    vids = Video.objects.filter(verified=True)
    for vid in vids:
        print(vid.id)

def get_tasks_by_hit_id(hitid):
    fvs = FullVideoTask.objects.filter(hit_id = hitid)
    print("Returned: " + str(len(fvs)))

def dump_all_tasks():
    fvs = FullVideoTask.objects.exclude(hit_id = '')
    for x in fvs:
        print(x.hit_id)

tasks = FullVideoTask.objects.filter(sandbox = False).exclude(hit_id = '')
get_hits_for_video(tasks)
#get_completed_videos()

#get_tasks_by_hit_id("3DQYSJDTYL1LBN7L0I2B6FA1K3YXEA")
#dump_all_tasks()
