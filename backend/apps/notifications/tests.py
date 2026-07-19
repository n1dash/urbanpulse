from django.core import mail
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from apps.core.models import Department, Officer, Complaint
from apps.core.services import create_complaint, assign_complaint, update_complaint_status
from apps.notifications.models import Notification

User = get_user_model()

class NotificationTriggerTestCase(APITestCase):
    def setUp(self):
        # Create users
        self.citizen = User.objects.create_user(
            username='citizen_john',
            password='password123',
            email='john@example.com',
            role='CITIZEN'
        )
        self.officer_user = User.objects.create_user(
            username='officer_smith',
            password='password123',
            email='smith@example.com',
            role='OFFICER'
        )
        self.department = Department.objects.create(
            name='Sanitation',
            description='Waste and sanitation management'
        )
        self.officer = Officer.objects.create(
            user=self.officer_user,
            department=self.department
        )

    def test_complaint_created_notification(self):
        # 1. Create complaint using service
        complaint = create_complaint(
            citizen=self.citizen,
            title='Pothole in front yard',
            description='Large pothole block passage.'
        )

        # 2. Assert notification is created in DB
        citizen_notifs = Notification.objects.filter(user=self.citizen)
        self.assertEqual(citizen_notifs.count(), 1)
        notif = citizen_notifs.first()
        self.assertEqual(notif.notification_type, 'CREATED')
        self.assertIn('created successfully', notif.message)

        # 3. Assert email was sent (placed in outbox)
        self.assertEqual(len(mail.outbox), 1)
        sent_email = mail.outbox[0]
        self.assertEqual(sent_email.to, [self.citizen.email])
        self.assertIn("Complaint Created", sent_email.subject)
        self.assertIn("created successfully", sent_email.body)

    def test_complaint_assignment_notification(self):
        complaint = create_complaint(
            citizen=self.citizen,
            title='Water leak',
            description='Water pipe broken.'
        )
        mail.outbox.clear()  # Clear initial creation email
        Notification.objects.all().delete()  # Clear DB

        # Assign complaint
        assign_complaint(complaint, self.officer)

        # Verify DB Notifications: 1 for citizen, 1 for officer
        citizen_notifs = Notification.objects.filter(user=self.citizen)
        officer_notifs = Notification.objects.filter(user=self.officer_user)
        self.assertEqual(citizen_notifs.count(), 1)
        self.assertEqual(officer_notifs.count(), 1)
        
        self.assertEqual(citizen_notifs.first().notification_type, 'ASSIGNED')
        self.assertEqual(officer_notifs.first().notification_type, 'ASSIGNED')

        # Verify email dispatch (2 emails sent)
        self.assertEqual(len(mail.outbox), 2)
        recipients = [email.to[0] for email in mail.outbox]
        self.assertIn(self.citizen.email, recipients)
        self.assertIn(self.officer_user.email, recipients)

    def test_complaint_resolution_notification(self):
        complaint = create_complaint(
            citizen=self.citizen,
            title='Power outage',
            description='Streetlights are out.'
        )
        mail.outbox.clear()
        Notification.objects.all().delete()

        # Update status to RESOLVED
        update_complaint_status(complaint, 'RESOLVED')

        # Verify resolution notification
        citizen_notif = Notification.objects.filter(user=self.citizen, notification_type='RESOLVED')
        self.assertEqual(citizen_notif.count(), 1)
        self.assertIsNotNone(complaint.resolved_at)

        # Verify email
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, [self.citizen.email])
        self.assertIn("resolved", mail.outbox[0].body)


class NotificationAPIPermissionTestCase(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username='user1', password='pwd', email='u1@example.com', role='CITIZEN'
        )
        self.user2 = User.objects.create_user(
            username='user2', password='pwd', email='u2@example.com', role='CITIZEN'
        )
        
        # Create some notifications
        self.notif_user1 = Notification.objects.create(
            user=self.user1, message="Hello User 1", notification_type='CREATED'
        )
        self.notif_user2 = Notification.objects.create(
            user=self.user2, message="Hello User 2", notification_type='CREATED'
        )

    def test_unauthenticated_access_denied(self):
        # Accessing endpoint without auth should be 403 Forbidden
        response = self.client.get('/api/notifications/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_authenticated_user_only_sees_own_notifications(self):
        self.client.login(username='user1', password='pwd')
        response = self.client.get('/api/notifications/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.notif_user1.id)

    def test_mark_read_endpoint(self):
        self.client.login(username='user1', password='pwd')
        
        # Verify initial state
        self.assertFalse(self.notif_user1.is_read)
        
        # Call API mark-read
        response = self.client.post(f'/api/notifications/{self.notif_user1.id}/mark-read/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_read'])
        
        # Reload DB
        self.notif_user1.refresh_from_db()
        self.assertTrue(self.notif_user1.is_read)

    def test_mark_all_read_endpoint(self):
        self.client.login(username='user1', password='pwd')
        # Create another notification for user1
        Notification.objects.create(
            user=self.user1, message="Another Msg", notification_type='CREATED'
        )
        
        # Call mark-all-read
        response = self.client.post('/api/notifications/mark-all-read/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify all user1 notifications are read
        user1_unread = Notification.objects.filter(user=self.user1, is_read=False)
        self.assertEqual(user1_unread.count(), 0)
        
        # Verify user2 notification remains unread
        self.notif_user2.refresh_from_db()
        self.assertFalse(self.notif_user2.is_read)
