from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
import datetime
import time

from apps.core.models import Department, Officer, Complaint
from apps.core.services import create_complaint, assign_complaint, update_complaint_status

User = get_user_model()

class DashboardTestCase(APITestCase):
    def setUp(self):
        # Create users with different roles
        self.citizen = User.objects.create_user(
            username='citizen_jerry', password='password123', email='citizen@example.com', role='CITIZEN'
        )
        self.officer_user = User.objects.create_user(
            username='officer_nancy', password='password123', email='officer@example.com', role='OFFICER'
        )
        self.admin_user = User.objects.create_user(
            username='admin_boss', password='password123', email='admin@example.com', role='ADMIN'
        )
        
        self.dept_water = Department.objects.create(name='Water & Sewerage', description='Water department')
        self.dept_roads = Department.objects.create(name='Roads & Traffic', description='Roads department')
        
        self.officer = Officer.objects.create(user=self.officer_user, department=self.dept_water)

    def test_permission_handling(self):
        # 1. Unauthenticated gets 403
        response = self.client.get('/api/dashboard/stats/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # 2. Citizen gets 403
        self.client.login(username='citizen_jerry', password='password123')
        response = self.client.get('/api/dashboard/stats/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.client.logout()
        
        # 3. Officer gets 200
        self.client.login(username='officer_nancy', password='password123')
        response = self.client.get('/api/dashboard/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client.logout()

        # 4. Admin gets 200
        self.client.login(username='admin_boss', password='password123')
        response = self.client.get('/api/dashboard/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_dashboard_statistics_payload(self):
        # Create complaints
        # 1. Pending (unassigned)
        create_complaint(self.citizen, 'Water leak in Sector 4', 'Big leak.', department=self.dept_water)
        
        # 2. Assigned (active)
        comp_assigned = create_complaint(self.citizen, 'Traffic light broken', 'Light is stuck on red.', department=self.dept_roads)
        assign_complaint(comp_assigned, self.officer)
        
        # 3. Resolved
        # We will create one directly with customized created_at and resolved_at to verify resolution time
        now = timezone.now()
        created_time = now - datetime.timedelta(hours=5)
        
        comp_resolved = Complaint.objects.create(
            citizen=self.citizen,
            title='Garbage piled up',
            description='Trash bin overflowing.',
            department=self.dept_water,
            status='RESOLVED',
            created_at=created_time,
            resolved_at=now
        )
        # Note: auto_now_add makes overriding created_at directly in create() ignored on some DBs,
        # so we will use filter+update or save overriding
        Complaint.objects.filter(id=comp_resolved.id).update(created_at=created_time, resolved_at=now)

        self.client.login(username='officer_nancy', password='password123')
        response = self.client.get('/api/dashboard/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.data
        self.assertEqual(data['total_complaints'], 3)
        self.assertEqual(data['pending_complaints'], 1)
        self.assertEqual(data['resolved_complaints'], 1)
        self.assertEqual(data['active_complaints'], 2)  # 1 Pending + 1 Assigned
        
        # Department wise counts:
        # Water & Sewerage has 2 (1 pending, 1 resolved)
        # Roads & Traffic has 1 (assigned)
        self.assertEqual(data['department_wise_complaints']['Water & Sewerage'], 2)
        self.assertEqual(data['department_wise_complaints']['Roads & Traffic'], 1)

        # Average resolution time:
        # 5 hours difference = 18000 seconds
        avg_res = data['average_resolution_time']
        self.assertAlmostEqual(avg_res['hours'], 5.0, places=1)
        self.assertAlmostEqual(avg_res['seconds'], 18000.0, places=1)
        self.assertEqual(avg_res['formatted'], '5h 0m')
