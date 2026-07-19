from django.contrib import admin
from apps.core.models import (
    Department,
    Officer,
    Complaint,
    ComplaintTimeline,
    ComplaintVote,
)


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "created_at")
    search_fields = ("name", "description")


@admin.register(Officer)
class OfficerAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user_username",
        "department",
        "designation",
        "hierarchy_level",
    )
    list_filter = ("department", "hierarchy_level")
    search_fields = ("user__username", "designation")

    def user_username(self, obj):
        return obj.user.username

    user_username.short_description = "Username"


@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "title",
        "user_username",
        "department",
        "status",
        "priority_score",
        "assigned_officer_username",
        "category",
        "is_duplicate",
        "created_at",
    )
    list_filter = ("status", "department", "category", "is_duplicate")
    search_fields = ("title", "description", "address")
    readonly_fields = ("created_at", "updated_at", "resolved_at", "deleted_at")

    def user_username(self, obj):
        return obj.user.username

    user_username.short_description = "Reporter"

    def assigned_officer_username(self, obj):
        return (
            obj.assigned_officer.user.username if obj.assigned_officer else "Unassigned"
        )

    assigned_officer_username.short_description = "Assigned Officer"


@admin.register(ComplaintTimeline)
class ComplaintTimelineAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "complaint_title",
        "status",
        "updated_by_username",
        "timestamp",
    )
    list_filter = ("status", "timestamp")
    search_fields = ("complaint__title", "description")

    def complaint_title(self, obj):
        return obj.complaint.title

    complaint_title.short_description = "Complaint"

    def updated_by_username(self, obj):
        return obj.updated_by.username

    updated_by_username.short_description = "Updated By"


@admin.register(ComplaintVote)
class ComplaintVoteAdmin(admin.ModelAdmin):
    list_display = ("id", "complaint_title", "user_username", "created_at")
    list_filter = ("created_at",)
    search_fields = ("complaint__title", "user__username")

    def complaint_title(self, obj):
        return obj.complaint.title

    complaint_title.short_description = "Complaint"

    def user_username(self, obj):
        return obj.user.username

    user_username.short_description = "Voter"
