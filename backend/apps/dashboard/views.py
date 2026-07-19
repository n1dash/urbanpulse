from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from apps.dashboard.services import get_dashboard_stats

class IsOfficerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow officers or admin users to access analytics.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.role in ['OFFICER', 'SENIOR_OFFICER', 'ADMIN'] or 
            request.user.is_staff or 
            request.user.is_superuser
        )

class DashboardStatsView(APIView):
    """
    API endpoint that returns aggregate statistics for complaints.
    """
    permission_classes = [IsOfficerOrAdmin]

    def get(self, request, format=None):
        try:
            stats = get_dashboard_stats()
            return Response(stats, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": "Failed to calculate dashboard statistics.", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
