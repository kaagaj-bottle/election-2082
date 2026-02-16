from rest_framework.routers import DefaultRouter

from app.apps.candidates.views import CandidateViewSet

router = DefaultRouter()
router.register("candidates", CandidateViewSet, basename="candidate")

urlpatterns = router.urls
