from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from apps.accounts.models import User

class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ['username', 'email', 'phone', 'role', 'is_staff', 'is_active', 'created_at']
    list_filter = ['role', 'is_staff', 'is_active']
    fieldsets = UserAdmin.fieldsets + (
        ('UrbanPulse Fields', {'fields': ('phone', 'role')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('UrbanPulse Fields', {
            'classes': ('wide',),
            'fields': ('email', 'phone', 'role'),
        }),
    )
    ordering = ('-created_at',)

admin.site.register(User, CustomUserAdmin)
