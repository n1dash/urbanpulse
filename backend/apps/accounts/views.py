from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from apps.accounts.models import User
from apps.accounts.permissions import IsAdmin
from apps.accounts.serializers import (
    UserSerializer,
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
    AdminRoleUpdateSerializer
)

class RegisterView(generics.CreateAPIView):
    """
    Registers a new user in the system.
    """
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

class LoginView(TokenObtainPairView):
    """
    Authenticates a user and returns an access/refresh JWT token pair.
    """
    permission_classes = (permissions.AllowAny,)
    serializer_class = CustomTokenObtainPairSerializer

class ProfileView(generics.RetrieveAPIView):
    """
    Retrieves the profile of the currently authenticated user.
    """
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user

class UserListView(generics.ListAPIView):
    """
    Admin-only: list all users in the system.
    """
    queryset = User.objects.all().order_by('-created_at')
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated, IsAdmin)


class AdminRoleUpdateView(generics.UpdateAPIView):
    """
    Admin-only: change a user's role. When promoting to OFFICER/SENIOR_OFFICER,
    creates the matching Officer profile (department + designation required);
    when demoting away from an officer role, removes the now-stale profile.
    """
    queryset = User.objects.all()
    serializer_class = AdminRoleUpdateSerializer
    permission_classes = (permissions.IsAuthenticated, IsAdmin)

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(user, data=request.data)
        serializer.is_valid(raise_exception=True)
        updated_user = serializer.save()
        return Response(UserSerializer(updated_user).data)
