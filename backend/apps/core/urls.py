from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.core.views import (
    DepartmentViewSet,
    ComplaintViewSet,
    OfficerComplaintsViewSet,
)

router = DefaultRouter()
router.register(r"departments", DepartmentViewSet, basename="department")
router.register(r"complaints", ComplaintViewSet, basename="complaint")
router.register(
    r"officer/complaints", OfficerComplaintsViewSet, basename="officer-complaint"
)

urlpatterns = [
    path("", include(router.urls)),
]
