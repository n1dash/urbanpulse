from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth (apps.accounts) — register, login, profile, token refresh
    path('api/auth/', include('apps.accounts.urls')),

    # Core complaint domain (apps.core) — departments, complaints, officer views
    path('api/v1/', include('apps.core.urls')),

    # Notifications (apps.notifications)
    path('api/notifications/', include('apps.notifications.urls')),

    # Dashboard / analytics (apps.dashboard)
    path('api/dashboard/', include('apps.dashboard.urls')),

    # OpenAPI schema & docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
