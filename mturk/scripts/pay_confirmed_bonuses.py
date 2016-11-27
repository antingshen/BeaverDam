from mturk.models import FullVideoTask
from mturk.mturk_api import Server
from beaverdam import settings

mturk = Server(settings.AWS_ID, settings.AWS_KEY, settings.URL_ROOT, settings.MTURK_SANDBOX)

tasks = FullVideoTask.objects.filter(paid = False, video__verified = True).exclude(hit_id = '')

def calc_bonus(task):
    res = mturk.request('GetAssignmentsForHIT', {"HITId":tasks[0].hit_id})
    if res.has_path("GetAssignmentsForHITResult/Assignment") :
        res.store("GetAssignmentsForHITResult/Request/IsValid", "IsValid", bool)
        res.store("GetAssignmentsForHITResult/Assignment/AssignmentId", "AssignmentId")
        res.store("GetAssignmentsForHITResult/Assignment/WorkerId", "WorkerId")
        print("Is valid = " + str(res.IsValid)) 
        print("Assignment id = " + res.AssignmentId)
        print("worker id = " + res.WorkerId)
        task.complete(res.WorkerId, res.AssignmentId, 'Thanks for completing this - your bonus has been paid as {}'.format(task.calculate_bonus()))

def calc_bonuses(tasks):
    print("{} tasks to process".format(len(tasks)))
    for task in tasks:
        print("Paying {}".format(task.video.filename))
        calc_bonus(task)

calc_bonuses(tasks)
