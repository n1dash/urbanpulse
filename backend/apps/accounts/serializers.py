from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from apps.accounts.models import User, UserRole

class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'name', 'email', 'phone', 'role', 'created_at')
        read_only_fields = ('id', 'username', 'role', 'created_at')

    def get_name(self, obj) -> str:
        full = f"{obj.first_name} {obj.last_name}".strip()
        return full or obj.username


class AdminRoleUpdateSerializer(serializers.Serializer):
    """
    Admin-only: change a user's role. If promoting to OFFICER/SENIOR_OFFICER,
    a Department + designation are required so a real Officer profile can be
    created — permission checks (apps.core.permissions.IsOfficer) look for an
    actual Officer row, not just this role string, so setting the role alone
    would silently NOT grant officer access.
    """
    role = serializers.ChoiceField(choices=UserRole.choices)
    department = serializers.IntegerField(required=False)
    designation = serializers.CharField(required=False, allow_blank=True)
    hierarchy_level = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if attrs['role'] in (UserRole.OFFICER, UserRole.SENIOR_OFFICER):
            if not attrs.get('department') or not attrs.get('designation'):
                raise serializers.ValidationError(
                    "department and designation are required when assigning an officer role."
                )
        return attrs

    def save(self, **kwargs):
        from apps.core.models import Department, Officer, HierarchyLevel

        user = self.instance
        role = self.validated_data['role']
        user.role = role
        # is_staff drives real admin permission checks (apps.core.permissions.IsAdmin),
        # so it must stay in sync with the role field, not just be a display label.
        user.is_staff = role == UserRole.ADMIN or user.is_superuser
        user.save()

        if role in (UserRole.OFFICER, UserRole.SENIOR_OFFICER):
            department = Department.objects.get(id=self.validated_data['department'])
            hierarchy_level = self.validated_data.get('hierarchy_level') or (
                HierarchyLevel.SENIOR_OFFICER if role == UserRole.SENIOR_OFFICER
                else HierarchyLevel.FIELD_OFFICER
            )
            Officer.objects.update_or_create(
                user=user,
                defaults={
                    'department': department,
                    'designation': self.validated_data['designation'],
                    'hierarchy_level': hierarchy_level,
                }
            )
        elif hasattr(user, 'officer_profile'):
            # Demoted away from an officer role - remove the now-inconsistent profile
            user.officer_profile.delete()

        return user

class RegisterSerializer(serializers.ModelSerializer):
    name = serializers.CharField(required=True, write_only=True)
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all(), message="A user with this email already exists.")]
    )
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        min_length=8
    )
    phone = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta:
        model = User
        fields = ('name', 'email', 'password', 'phone')

    def create(self, validated_data):
        from apps.accounts.utils import generate_unique_username, split_full_name

        first_name, last_name = split_full_name(validated_data['name'])
        # Public self-registration is always CITIZEN, regardless of anything the
        # client sends. Officer/Admin accounts can only be created through the
        # admin-only pathways (apps.core.OfficerCreateView, AdminRoleUpdateView).
        user = User.objects.create_user(
            username=generate_unique_username(validated_data['email']),
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=first_name,
            last_name=last_name,
            phone=validated_data.get('phone', ''),
            role=UserRole.CITIZEN
        )
        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims to the JWT payload
        token['username'] = user.username
        token['email'] = user.email
        token['role'] = user.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        full_name = f"{self.user.first_name} {self.user.last_name}".strip() or self.user.username
        # Include user profile info in the authentication response
        data['user'] = {
            'id': str(self.user.id),
            'username': self.user.username,
            'name': full_name,
            'email': self.user.email,
            'role': self.user.role,
            'phone': self.user.phone or '',
            'created_at': self.user.created_at.isoformat() if self.user.created_at else None
        }
        return data
