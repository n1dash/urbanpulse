from django.urls import reverse
from django.test import RequestFactory
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken
from apps.accounts.models import User, UserRole
from apps.accounts.permissions import (
    IsCitizen,
    IsOfficer,
    IsSeniorOfficer,
    IsAdmin,
    IsOfficerOrAbove,
    IsSeniorOfficerOrAbove
)

class AuthenticationAPITests(APITestCase):
    def setUp(self):
        self.register_url = reverse('accounts:register')
        self.login_url = reverse('accounts:login')
        self.profile_url = reverse('accounts:profile')

        self.user_data = {
            'username': 'testcitizen',
            'email': 'citizen@urbanpulse.gov',
            'password': 'StrongPassword123!',
            'phone': '1234567890'
        }

        self.officer_data = {
            'username': 'testofficer',
            'email': 'officer@urbanpulse.gov',
            'password': 'StrongPassword123!',
            'phone': '0987654321',
            'role': UserRole.OFFICER
        }

    def test_user_registration_success(self):
        """Test successful registration with default role (CITIZEN)"""
        response = self.client.post(self.register_url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('username', response.data)
        self.assertIn('email', response.data)
        self.assertNotIn('password', response.data)
        self.assertEqual(response.data['role'], UserRole.CITIZEN)

        # Check DB
        user = User.objects.get(username=self.user_data['username'])
        self.assertEqual(user.email, self.user_data['email'])
        self.assertTrue(user.check_password(self.user_data['password']))
        self.assertEqual(user.role, UserRole.CITIZEN)

    def test_user_registration_custom_role(self):
        """Test registration specifying a non-default role"""
        response = self.client.post(self.register_url, self.officer_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['role'], UserRole.OFFICER)

        # Check DB
        user = User.objects.get(username=self.officer_data['username'])
        self.assertEqual(user.role, UserRole.OFFICER)

    def test_user_registration_duplicate_username(self):
        """Test registration fails with a duplicate username"""
        self.client.post(self.register_url, self.user_data)
        duplicate_data = self.user_data.copy()
        duplicate_data['email'] = 'otheremail@urbanpulse.gov'

        response = self.client.post(self.register_url, duplicate_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', response.data)

    def test_user_registration_duplicate_email(self):
        """Test registration fails with a duplicate email"""
        self.client.post(self.register_url, self.user_data)
        duplicate_data = self.user_data.copy()
        duplicate_data['username'] = 'otherusername'

        response = self.client.post(self.register_url, duplicate_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_user_registration_password_too_short(self):
        """Test registration validation errors for short password"""
        invalid_data = self.user_data.copy()
        invalid_data['password'] = 'short'
        response = self.client.post(self.register_url, invalid_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    def test_user_login_success(self):
        """Test that login returns valid JWT tokens and user details"""
        # Create user
        user = User.objects.create_user(
            username=self.user_data['username'],
            email=self.user_data['email'],
            password=self.user_data['password'],
            role=UserRole.CITIZEN
        )

        login_payload = {
            'username': self.user_data['username'],
            'password': self.user_data['password']
        }

        response = self.client.post(self.login_url, login_payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)

        # Check user details in response
        user_info = response.data['user']
        self.assertEqual(user_info['username'], user.username)
        self.assertEqual(user_info['email'], user.email)
        self.assertEqual(user_info['role'], UserRole.CITIZEN)

        # Decode & verify claims in access token
        access_token = AccessToken(response.data['access'])
        self.assertEqual(access_token['username'], user.username)
        self.assertEqual(access_token['email'], user.email)
        self.assertEqual(access_token['role'], UserRole.CITIZEN)

    def test_user_login_failure(self):
        """Test login fails with incorrect credentials"""
        User.objects.create_user(
            username=self.user_data['username'],
            email=self.user_data['email'],
            password=self.user_data['password']
        )

        invalid_payload = {
            'username': self.user_data['username'],
            'password': 'WrongPassword123'
        }

        response = self.client.post(self.login_url, invalid_payload)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_profile_authenticated(self):
        """Test retrieving user profile when authenticated"""
        user = User.objects.create_user(
            username=self.user_data['username'],
            email=self.user_data['email'],
            password=self.user_data['password'],
            phone=self.user_data['phone'],
            role=UserRole.CITIZEN
        )

        # Authenticate by adding bearer token
        self.client.force_authenticate(user=user)

        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], user.username)
        self.assertEqual(response.data['email'], user.email)
        self.assertEqual(response.data['phone'], user.phone)
        self.assertEqual(response.data['role'], UserRole.CITIZEN)

    def test_user_profile_unauthenticated(self):
        """Test profile access is denied for unauthenticated users"""
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class RolePermissionTests(APITestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.citizen = User.objects.create_user(username='citizen', email='c@up.gov', password='pwd', role=UserRole.CITIZEN)
        self.officer = User.objects.create_user(username='officer', email='o@up.gov', password='pwd', role=UserRole.OFFICER)
        self.senior_officer = User.objects.create_user(username='senior', email='so@up.gov', password='pwd', role=UserRole.SENIOR_OFFICER)
        self.admin = User.objects.create_user(username='admin', email='a@up.gov', password='pwd', role=UserRole.ADMIN)

        class DummyView:
            pass
        self.view = DummyView()

    def test_is_citizen_permission(self):
        perm = IsCitizen()
        
        req = self.factory.get('/')
        req.user = self.citizen
        self.assertTrue(perm.has_permission(req, self.view))

        for user in [self.officer, self.senior_officer, self.admin]:
            req.user = user
            self.assertFalse(perm.has_permission(req, self.view))

    def test_is_officer_permission(self):
        perm = IsOfficer()

        req = self.factory.get('/')
        req.user = self.officer
        self.assertTrue(perm.has_permission(req, self.view))

        for user in [self.citizen, self.senior_officer, self.admin]:
            req.user = user
            self.assertFalse(perm.has_permission(req, self.view))

    def test_is_senior_officer_permission(self):
        perm = IsSeniorOfficer()

        req = self.factory.get('/')
        req.user = self.senior_officer
        self.assertTrue(perm.has_permission(req, self.view))

        for user in [self.citizen, self.officer, self.admin]:
            req.user = user
            self.assertFalse(perm.has_permission(req, self.view))

    def test_is_admin_permission(self):
        perm = IsAdmin()

        req = self.factory.get('/')
        req.user = self.admin
        self.assertTrue(perm.has_permission(req, self.view))

        for user in [self.citizen, self.officer, self.senior_officer]:
            req.user = user
            self.assertFalse(perm.has_permission(req, self.view))

    def test_is_officer_or_above_permission(self):
        perm = IsOfficerOrAbove()

        req = self.factory.get('/')
        for user in [self.officer, self.senior_officer, self.admin]:
            req.user = user
            self.assertTrue(perm.has_permission(req, self.view))

        req.user = self.citizen
        self.assertFalse(perm.has_permission(req, self.view))

    def test_is_senior_officer_or_above_permission(self):
        perm = IsSeniorOfficerOrAbove()

        req = self.factory.get('/')
        for user in [self.senior_officer, self.admin]:
            req.user = user
            self.assertTrue(perm.has_permission(req, self.view))

        for user in [self.citizen, self.officer]:
            req.user = user
            self.assertFalse(perm.has_permission(req, self.view))
