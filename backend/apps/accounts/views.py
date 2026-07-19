from rest_framework import generics, permissions
from rest_framework_simplejwt.views import TokenObtainPairView
from apps.accounts.models import User
from apps.accounts.serializers import (
    UserSerializer,
    RegisterSerializer,
    CustomTokenObtainPairSerializer
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
