from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone


class Department(models.Model):
    """
    Department responsible for resolving specific types of complaints.
    """

    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class HierarchyLevel(models.TextChoices):
    DEPARTMENT_HEAD = "DEPARTMENT_HEAD", "Department Head"
    SENIOR_OFFICER = "SENIOR_OFFICER", "Senior Officer"
    JUNIOR_OFFICER = "JUNIOR_OFFICER", "Junior Officer"
    FIELD_OFFICER = "FIELD_OFFICER", "Field Officer"


HIERARCHY_LEVEL_NUMERIC = {
    HierarchyLevel.DEPARTMENT_HEAD: 2,
    HierarchyLevel.SENIOR_OFFICER: 3,
    HierarchyLevel.JUNIOR_OFFICER: 4,
    HierarchyLevel.FIELD_OFFICER: 5,
}


class Officer(models.Model):
    """
    Officer profile linked to a User, associated with a Department and has a Hierarchy Level.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="officer_profile",
    )
    department = models.ForeignKey(
        Department, on_delete=models.PROTECT, related_name="officers"
    )
    designation = models.CharField(max_length=100)
    hierarchy_level = models.CharField(
        max_length=30,
        choices=HierarchyLevel.choices,
        default=HierarchyLevel.FIELD_OFFICER,
    )

    @property
    def hierarchy_numeric(self):
        return HIERARCHY_LEVEL_NUMERIC.get(self.hierarchy_level, 5)

    def __str__(self):
        return f"{self.user.username} ({self.designation} - {self.department.name})"


class StatusChoices(models.TextChoices):
    REPORTED = "Reported", "Reported"
    VERIFIED = "Verified", "Verified"
    ASSIGNED = "Assigned", "Assigned"
    IN_PROGRESS = "In Progress", "In Progress"
    RESOLVED = "Resolved", "Resolved"
    CLOSED = "Closed", "Closed"


class CategoryChoices(models.TextChoices):
    WATER = "Water", "Water"
    ROAD = "Road", "Road"
    ELECTRICITY = "Electricity", "Electricity"
    WASTE_MANAGEMENT = "Waste Management", "Waste Management"
    OTHER = "Other", "Other"


class SoftDeleteQuerySet(models.QuerySet):
    def delete(self):
        return super().update(deleted_at=timezone.now())

    def hard_delete(self):
        return super().delete()


class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db).filter(
            deleted_at__isnull=True
        )


class Complaint(models.Model):
    """
    Complaint submitted by a citizen, processed by officers.
    """

    VALID_TRANSITIONS = {
        StatusChoices.REPORTED: [StatusChoices.VERIFIED, StatusChoices.CLOSED],
        StatusChoices.VERIFIED: [StatusChoices.ASSIGNED, StatusChoices.CLOSED],
        StatusChoices.ASSIGNED: [StatusChoices.IN_PROGRESS, StatusChoices.CLOSED],
        StatusChoices.IN_PROGRESS: [StatusChoices.RESOLVED, StatusChoices.CLOSED],
        StatusChoices.RESOLVED: [StatusChoices.CLOSED, StatusChoices.IN_PROGRESS],
        StatusChoices.CLOSED: [],
    }

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="complaints"
    )
    title = models.CharField(max_length=150)
    description = models.TextField()
    department = models.ForeignKey(
        Department, on_delete=models.PROTECT, related_name="complaints"
    )
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    address = models.TextField()
    image = models.ImageField(upload_to="complaints/", blank=True, null=True)
    status = models.CharField(
        max_length=20, choices=StatusChoices.choices, default=StatusChoices.REPORTED
    )
    severity = models.IntegerField(
        choices=(
            (1, "Low"),
            (2, "Medium"),
            (3, "High"),
            (4, "Critical"),
            (5, "Disaster"),
        ),
        default=2,
    )
    priority_score = models.IntegerField(default=0)
    assigned_officer = models.ForeignKey(
        Officer,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="assigned_complaints",
    )
    category = models.CharField(
        max_length=50, choices=CategoryChoices.choices, default=CategoryChoices.OTHER
    )
    is_duplicate = models.BooleanField(default=False)
    duplicate_of = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="duplicates",
    )
    resolution_image = models.ImageField(
        upload_to="resolutions/", blank=True, null=True
    )
    resolved_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(blank=True, null=True)

    objects = SoftDeleteManager()
    all_objects = models.Manager()

    def delete(self, *args, **kwargs):
        self.deleted_at = timezone.now()
        self.save()

    def clean(self):
        super().clean()
        if self.pk:
            try:
                original = Complaint.all_objects.get(pk=self.pk)
                if original.status != self.status:
                    allowed_next = self.VALID_TRANSITIONS.get(original.status, [])
                    if self.status not in allowed_next:
                        raise ValidationError(
                            f"Invalid status transition from '{original.status}' to '{self.status}'."
                        )
            except Complaint.DoesNotExist:
                pass

    def save(self, *args, **kwargs):
        self.full_clean()

        # Automatically update resolved_at if status becomes Resolved
        if self.status == StatusChoices.RESOLVED and not self.resolved_at:
            self.resolved_at = timezone.now()
        elif self.status != StatusChoices.RESOLVED:
            self.resolved_at = None

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} ({self.status})"


class ComplaintTimeline(models.Model):
    """
    Log track of all transitions and updates for a complaint.
    """

    complaint = models.ForeignKey(
        Complaint, on_delete=models.CASCADE, related_name="timeline"
    )
    status = models.CharField(max_length=50)
    description = models.TextField()
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="timeline_updates",
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return (
            f"Timeline for {self.complaint.title} - {self.status} at {self.timestamp}"
        )


class ComplaintVote(models.Model):
    """
    Upvote model representing citizen support for a complaint to increase priority.
    """

    complaint = models.ForeignKey(
        Complaint, on_delete=models.CASCADE, related_name="votes"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="complaint_votes",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("complaint", "user")

    def __str__(self):
        return f"Vote by {self.user.username} for {self.complaint.title}"
