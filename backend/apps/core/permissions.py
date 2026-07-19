from rest_framework import permissions


class IsCitizen(permissions.BasePermission):
    """
    Allows access only to citizens (authenticated users who do not have an officer profile).
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and not hasattr(request.user, "officer_profile")
        )


class IsOfficer(permissions.BasePermission):
    """
    Allows access only to officers.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, "officer_profile")
        )


class IsDepartmentHead(permissions.BasePermission):
    """
    Allows access only to department heads.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, "officer_profile")
            and request.user.officer_profile.hierarchy_level == "DEPARTMENT_HEAD"
        )


class IsAdmin(permissions.BasePermission):
    """
    Allows access only to administrators/staff.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and (request.user.is_staff or request.user.is_superuser)
        )


class IsOfficerOfDepartment(permissions.BasePermission):
    """
    Allows access only to officers who belong to the same department as the complaint.
    """

    def has_object_permission(self, request, view, obj):
        if not (
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, "officer_profile")
        ):
            return False

        # Access department from object (e.g. Complaint or other core entities)
        obj_department = getattr(obj, "department", None)
        return obj_department == request.user.officer_profile.department
