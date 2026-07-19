from rest_framework.permissions import BasePermission
from apps.accounts.models import UserRole

class IsCitizen(BasePermission):
    """
    Allows access only to CITIZEN users.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == UserRole.CITIZEN
        )

class IsOfficer(BasePermission):
    """
    Allows access only to OFFICER users.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == UserRole.OFFICER
        )

class IsSeniorOfficer(BasePermission):
    """
    Allows access only to SENIOR_OFFICER users.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == UserRole.SENIOR_OFFICER
        )

class IsAdmin(BasePermission):
    """
    Allows access to ADMIN users, standard staff, or superusers.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (
                request.user.role == UserRole.ADMIN or
                request.user.is_staff or
                request.user.is_superuser
            )
        )

class IsOfficerOrAbove(BasePermission):
    """
    Allows access to OFFICER, SENIOR_OFFICER, and ADMIN users.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in [UserRole.OFFICER, UserRole.SENIOR_OFFICER, UserRole.ADMIN]
        )

class IsSeniorOfficerOrAbove(BasePermission):
    """
    Allows access only to SENIOR_OFFICER and ADMIN users.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in [UserRole.SENIOR_OFFICER, UserRole.ADMIN]
        )
