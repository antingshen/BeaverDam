from django.conf import settings

from .models import Task

def authenticate_hit(request):
    assignment_id = request.GET.get('assignmentId', None) or request.GET.get('mturk', None)
    if assignment_id == 'ASSIGNMENT_ID_NOT_AVAILABLE':
        preview = True
        assignment_id = None
    else:
        preview = bool(request.GET.get('preview', False))

    hit_id = request.GET.get('hitId', '')
    worker_id = request.GET.get('workerId', '')
    if not preview:
        if assignment_id is not None:
            if not Task.valid_hit_id(hit_id):
                # TODO: Log this error
                return {'error': 'No HIT found with ID {}. Please return this HIT. Sorry for the inconvenience.'.format(hit_id)}
        else:
            return {'authenticated': False, 'preview': False}

    return {
        'authenticated': True,
        'preview': preview,
        'assignment_id': assignment_id,
        'hit_id': hit_id,
        'worker_id': worker_id,
        'sandbox': settings.MTURK_SANDBOX,
    }
