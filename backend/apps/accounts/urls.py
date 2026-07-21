from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from apps.accounts.views import RegisterView, LoginView, ProfileView, UserListView, AdminRoleUpdateView

app_name = 'accounts'

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/<uuid:pk>/role/', AdminRoleUpdateView.as_view(), name='user-role-update'),
]
