from rest_framework.routers import DefaultRouter

from app.apps.elections.views import (
    ConstituencyViewSet,
    DistrictViewSet,
    ElectionViewSet,
    ProvinceViewSet,
)

router = DefaultRouter()
router.register("elections", ElectionViewSet, basename="election")
router.register("provinces", ProvinceViewSet, basename="province")
router.register("districts", DistrictViewSet, basename="district")
router.register("constituencies", ConstituencyViewSet, basename="constituency")

urlpatterns = router.urls
