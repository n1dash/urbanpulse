import logging
from django.db import transaction
from django.db.models import Count
from django.utils import timezone
from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from apps.core.models import (
    Department,
    Officer,
    Complaint,
    ComplaintTimeline,
    ComplaintVote,
    StatusChoices,
)
from apps.core.serializers import (
    DepartmentSerializer,
    ComplaintSerializer,
    OfficerSerializer,
)
from apps.core.permissions import (
    IsCitizen,
    IsOfficer,
    IsOfficerOfDepartment,
    IsAdmin,
)
from apps.core.services.priority import calculate_priority_score
from apps.core.services.duplicate import check_for_duplicate
from apps.core.services.escalation import assign_or_escalate_complaint
from apps.notifications.services import trigger_complaint_notification

logger = logging.getLogger("urbanpulse")


class DepartmentViewSet(viewsets.ModelViewSet):
    """
    API endpoint for departments. Anyone authenticated can view;
    only admins can create/update/delete.
    """

    queryset = Department.objects.all().order_by("name")
    serializer_class = DepartmentSerializer

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [permissions.IsAuthenticated(), IsAdmin()]
        return [permissions.IsAuthenticated()]


class OfficerViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin-only: list officers (for the admin dashboard).
    """

    queryset = Officer.objects.select_related("user", "department").order_by(
        "department__name"
    )
    serializer_class = OfficerSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]


class OfficerCreateView(generics.CreateAPIView):
    """
    Admin-only: create a new officer account (User + Officer profile together).
    """

    queryset = Officer.objects.all()
    serializer_class = OfficerSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]


class ComplaintViewSet(viewsets.ModelViewSet):
    """
    API endpoint for complaint management.
    Citizens can create and view complaints.
    """

    serializer_class = ComplaintSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = {
        "department": ["exact"],
        "status": ["exact"],
        "category": ["exact"],
        "priority_score": ["exact", "gte", "lte"],
        "created_at": ["exact", "gte", "lte"],
    }
    search_fields = ["title", "description", "address"]
    ordering_fields = ["created_at", "priority_score", "upvote_count"]

    def get_queryset(self):
        # Annotate with upvote_count to support sorting by votes count
        queryset = Complaint.objects.annotate(upvote_count=Count("votes"))
        return queryset.order_by("-created_at")

    def perform_create(self, serializer):
        with transaction.atomic():
            complaint = serializer.save(
                user=self.request.user, status=StatusChoices.REPORTED
            )

            # 1. Run Duplicate detection
            duplicate = check_for_duplicate(complaint)
            if duplicate:
                complaint.is_duplicate = True
                complaint.duplicate_of = duplicate
                complaint.status = StatusChoices.CLOSED
                complaint.save()

                # Log timeline
                ComplaintTimeline.objects.create(
                    complaint=complaint,
                    status=StatusChoices.CLOSED,
                    description=f"Closed automatically. Marked as duplicate of Complaint ID: {duplicate.id} ({duplicate.title}).",
                    updated_by=self.request.user,
                )
                logger.info(
                    f"Complaint '{complaint.title}' (ID: {complaint.id}) closed automatically as duplicate of ID: {duplicate.id}."
                )
            else:
                # 2. Priority calculation
                complaint.priority_score = calculate_priority_score(complaint)
                complaint.save()

                # Log timeline
                ComplaintTimeline.objects.create(
                    complaint=complaint,
                    status=StatusChoices.REPORTED,
                    description="Complaint created and registered in system.",
                    updated_by=self.request.user,
                )
                logger.info(
                    f"Complaint '{complaint.title}' (ID: {complaint.id}) created by citizen {self.request.user.username}."
                )
                trigger_complaint_notification(complaint, "CREATED")

    def perform_update(self, serializer):
        # Ensure only creator or officers can update.
        complaint = self.get_object()

        # Citizens can only edit their own complaints if status is still Reported
        is_officer = (
            hasattr(self.request.user, "officer_profile")
            or self.request.user.is_superuser
        )
        if not is_officer:
            if complaint.user != self.request.user:
                self.permission_denied(
                    self.request, message="You do not own this complaint."
                )
            if complaint.status != StatusChoices.REPORTED:
                self.permission_denied(
                    self.request,
                    message="You cannot edit a complaint once it is verified/processed.",
                )

        with transaction.atomic():
            old_status = complaint.status
            updated_complaint = serializer.save()
            new_status = updated_complaint.status

            # If status changed, log to timeline
            if old_status != new_status:
                description = self.request.data.get(
                    "status_description",
                    f"Status transitioned from {old_status} to {new_status}.",
                )
                ComplaintTimeline.objects.create(
                    complaint=updated_complaint,
                    status=new_status,
                    description=description,
                    updated_by=self.request.user,
                )
                logger.info(
                    f"Complaint '{updated_complaint.title}' status updated from {old_status} to {new_status} by {self.request.user.username}."
                )
                trigger_complaint_notification(
                    updated_complaint, "STATUS_CHANGED", extra_context={"old_status": old_status}
                )
                if new_status == StatusChoices.RESOLVED:
                    trigger_complaint_notification(updated_complaint, "RESOLVED")

                # Auto-assign if status changes to Verified and no officer is assigned
                if (
                    new_status == StatusChoices.VERIFIED
                    and not updated_complaint.assigned_officer
                ):
                    officer = assign_or_escalate_complaint(updated_complaint)
                    if officer:
                        updated_complaint.assigned_officer = officer
                        # Auto transition verified -> assigned
                        updated_complaint.status = StatusChoices.ASSIGNED
                        updated_complaint.save()

                        ComplaintTimeline.objects.create(
                            complaint=updated_complaint,
                            status=StatusChoices.ASSIGNED,
                            description=f"Automatically assigned and escalated to officer: {officer.user.username} ({officer.designation}).",
                            updated_by=self.request.user,
                        )
                        logger.info(
                            f"Complaint '{updated_complaint.title}' automatically assigned to officer {officer.user.username}."
                        )
                        trigger_complaint_notification(updated_complaint, "ASSIGNED")

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[permissions.IsAuthenticated, IsCitizen],
    )
    def vote(self, request, pk=None):
        """
        Upvote a complaint. Ensures a user can only vote once per complaint.
        Recalculates priority score on successful vote.
        """
        complaint = self.get_object()

        # Check if already voted
        if ComplaintVote.objects.filter(
            complaint=complaint, user=request.user
        ).exists():
            return Response(
                {"error": "You have already voted for this complaint."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            # Save vote
            ComplaintVote.objects.create(complaint=complaint, user=request.user)

            # Recalculate priority
            old_score = complaint.priority_score
            complaint.priority_score = calculate_priority_score(complaint)
            complaint.save()

            # Log to timeline
            ComplaintTimeline.objects.create(
                complaint=complaint,
                status=complaint.status,
                description=f"Upvoted by user. Priority score increased from {old_score} to {complaint.priority_score}.",
                updated_by=request.user,
            )

            # Check if escalation is triggered due to priority change
            if complaint.status in [
                StatusChoices.REPORTED,
                StatusChoices.VERIFIED,
                StatusChoices.ASSIGNED,
            ]:
                new_officer = assign_or_escalate_complaint(complaint)
                if new_officer and new_officer != complaint.assigned_officer:
                    old_officer_name = (
                        complaint.assigned_officer.user.username
                        if complaint.assigned_officer
                        else "None"
                    )
                    complaint.assigned_officer = new_officer
                    if complaint.status == StatusChoices.VERIFIED:
                        complaint.status = StatusChoices.ASSIGNED
                    complaint.save()

                    ComplaintTimeline.objects.create(
                        complaint=complaint,
                        status=complaint.status,
                        description=f"Escalation: Reassigned from {old_officer_name} to {new_officer.user.username} ({new_officer.designation}) due to priority increase.",
                        updated_by=request.user,
                    )
                    logger.info(
                        f"Complaint '{complaint.title}' escalated/reassigned to officer {new_officer.user.username} due to vote priority change."
                    )
                    trigger_complaint_notification(complaint, "ASSIGNED")

            logger.info(
                f"User {request.user.username} voted for complaint '{complaint.title}' (ID: {complaint.id})."
            )

        return Response(
            {
                "success": "Upvote registered successfully.",
                "priority_score": complaint.priority_score,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(
        detail=True,
        methods=["put"],
        url_path="status",
        permission_classes=[
            permissions.IsAuthenticated,
            IsOfficer,
            IsOfficerOfDepartment,
        ],
    )
    def update_status(self, request, pk=None):
        """
        API endpoint to transition a complaint's status.
        Requires the officer to belong to the complaint's department.
        Mapped to: PUT /api/v1/complaints/{id}/status/
        """
        complaint = self.get_object()
        new_status = request.data.get("status")
        description = request.data.get(
            "description",
            f"Status updated to {new_status} by officer {request.user.username}.",
        )
        resolution_image = request.FILES.get("resolution_image")

        if not new_status:
            return Response(
                {"error": "Status field is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Enforce transitions logic (delegated to serializer/clean method)
        serializer = self.get_serializer(
            complaint, data={"status": new_status}, partial=True
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            old_status = complaint.status
            complaint.status = new_status

            if new_status == StatusChoices.RESOLVED:
                if resolution_image:
                    complaint.resolution_image = resolution_image
                complaint.resolved_at = timezone.now()
                logger.info(
                    f"Complaint '{complaint.title}' (ID: {complaint.id}) marked as Resolved by officer {request.user.username}."
                )

            complaint.save()

            # Record in timeline
            ComplaintTimeline.objects.create(
                complaint=complaint,
                status=new_status,
                description=description,
                updated_by=request.user,
            )
            trigger_complaint_notification(
                complaint, "STATUS_CHANGED", extra_context={"old_status": old_status}
            )
            if new_status == StatusChoices.RESOLVED:
                trigger_complaint_notification(complaint, "RESOLVED")

            # Auto-escalation trigger when transitioning to Verified (if no officer assigned yet)
            if new_status == StatusChoices.VERIFIED and not complaint.assigned_officer:
                officer = assign_or_escalate_complaint(complaint)
                if officer:
                    complaint.assigned_officer = officer
                    complaint.status = StatusChoices.ASSIGNED
                    complaint.save()

                    ComplaintTimeline.objects.create(
                        complaint=complaint,
                        status=StatusChoices.ASSIGNED,
                        description=f"Automatically assigned and escalated to officer: {officer.user.username} ({officer.designation}).",
                        updated_by=request.user,
                    )
                    logger.info(
                        f"Complaint '{complaint.title}' automatically assigned to officer {officer.user.username}."
                    )
                    trigger_complaint_notification(complaint, "ASSIGNED")

        return Response(self.get_serializer(complaint).data, status=status.HTTP_200_OK)


class OfficerComplaintsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for officers to view complaints assigned to them or in their department.
    Mapped to: GET /api/v1/officer/complaints/
    """

    serializer_class = ComplaintSerializer
    permission_classes = [permissions.IsAuthenticated, IsOfficer]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["status", "priority_score", "category"]
    search_fields = ["title", "description", "address"]

    def get_queryset(self):
        officer = self.request.user.officer_profile
        # Return complaints that are in their department
        return Complaint.objects.filter(department=officer.department).order_by(
            "-priority_score", "-created_at"
        )
