from django.test import TestCase, RequestFactory
from django.contrib.auth.models import AnonymousUser, User

from .utils import authenticate_hit
from .models import FullVideoTask
from annotator.models import Video


class AuthenticateHitTest(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        video = Video.objects.create()
        FullVideoTask.objects.create(hit_id='real_hit_id', video=video)

    def test_normal_hit(self):
        request = self.factory.get('/?foo=bar&assignmentId=real_asmt_id&hitId=real_hit_id&workerId=real_worker_id')
        data = authenticate_hit(request)
        self.assertEqual(data['authenticated'], True)
        self.assertEqual(data['preview'], False)
        self.assertEqual(data['assignment_id'], 'real_asmt_id')

    def test_preview(self):
        mturk_request = self.factory.get('/?assignmentId=ASSIGNMENT_ID_NOT_AVAILABLE')
        test_request = self.factory.get('/?preview=True')
        for request in (mturk_request, test_request):
            data = authenticate_hit(request)
            self.assertEqual(data['authenticated'], True)
            self.assertEqual(data['preview'], True)

    def test_error(self):
        request = self.factory.get('/?foo=bar&assignmentId=real_asmt_id&hitId=fake_hit_id&workerId=real_worker_id')
        data = authenticate_hit(request)
        self.assertEqual('error' in data, True)

    def test_non_mturk(self):
        request = self.factory.get('/')
        data = authenticate_hit(request)
        self.assertEqual(data['authenticated'], False)
        self.assertEqual(data['preview'], False)
