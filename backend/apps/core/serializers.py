from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.core.models import (
    Department,
    Officer,
    Complaint,
    ComplaintTimeline,
    ComplaintVote,
)

User = get_user_model()


class UserShortSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name")


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = "__all__"


class OfficerSerializer(serializers.ModelSerializer):
    user = UserShortSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source="user", write_only=True
    )
    department_name = serializers.CharField(source="department.name", read_only=True)

    class Meta:
        model = Officer
        fields = (
            "id",
            "user",
            "user_id",
            "department",
            "department_name",
            "designation",
            "hierarchy_level",
            "hierarchy_numeric",
        )


class ComplaintTimelineSerializer(serializers.ModelSerializer):
    updated_by_username = serializers.CharField(
        source="updated_by.username", read_only=True
    )

    class Meta:
        model = ComplaintTimeline
        fields = (
            "id",
            "complaint",
            "status",
            "description",
            "updated_by",
            "updated_by_username",
            "timestamp",
        )
        read_only_fields = ("updated_by",)


class ComplaintSerializer(serializers.ModelSerializer):
    user = UserShortSerializer(read_only=True)
    department_name = serializers.CharField(source="department.name", read_only=True)
    assigned_officer_name = serializers.CharField(
        source="assigned_officer.user.username", default=None, read_only=True
    )
    votes_count = serializers.SerializerMethodField()
    timeline = ComplaintTimelineSerializer(many=True, read_only=True)
    duplicate_of_title = serializers.CharField(
        source="duplicate_of.title", default=None, read_only=True
    )

    class Meta:
        model = Complaint
        fields = (
            "id",
            "user",
            "title",
            "description",
            "department",
            "department_name",
            "latitude",
            "longitude",
            "address",
            "image",
            "status",
            "severity",
            "priority_score",
            "assigned_officer",
            "assigned_officer_name",
            "category",
            "is_duplicate",
            "duplicate_of",
            "duplicate_of_title",
            "resolution_image",
            "resolved_at",
            "created_at",
            "updated_at",
            "votes_count",
            "timeline",
        )
        read_only_fields = (
            "user",
            "priority_score",
            "is_duplicate",
            "duplicate_of",
            "resolved_at",
            "created_at",
            "updated_at",
        )

    def get_votes_count(self, obj) -> int:
        return obj.votes.count()

    def validate(self, data):
        # Retrieve the new status if being updated
        new_status = data.get("status")

        # Enforce status transitions on update
        if self.instance and new_status and self.instance.status != new_status:
            allowed_transitions = self.instance.VALID_TRANSITIONS.get(
                self.instance.status, []
            )
            if new_status not in allowed_transitions:
                raise serializers.ValidationError(
                    {
                        "status": f"Invalid status transition from '{self.instance.status}' to '{new_status}'."
                    }
                )
        return data


class ComplaintVoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplaintVote
        fields = ("id", "complaint", "user", "created_at")
        read_only_fields = ("user",)
