from django.contrib.auth import get_user_model
from django.urls import reverse
from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.test import APITestCase
from apps.core.models import (
    Department,
    Officer,
    Complaint,
    ComplaintTimeline,
    ComplaintVote,
    StatusChoices,
    HierarchyLevel,
    CategoryChoices,
)

User = get_user_model()


class UrbanPulseCoreTests(APITestCase):

    def setUp(self):
        # 1. Create Departments
        self.water_dept = Department.objects.create(
            name="Water Department",
            description="Manages water supply and pipeline leakages.",
        )
        self.elec_dept = Department.objects.create(
            name="Electricity Department",
            description="Manages power lines and power cuts.",
        )

        # 2. Create Users
        self.citizen1 = User.objects.create_user(
            username="citizen1", password="password123"
        )
        self.citizen2 = User.objects.create_user(
            username="citizen2", password="password123"
        )

        self.officer_user_water = User.objects.create_user(
            username="officer_water", password="password123"
        )
        self.officer_user_elec = User.objects.create_user(
            username="officer_elec", password="password123"
        )
        self.admin_user = User.objects.create_superuser(
            username="admin_user", password="password123"
        )

        # 3. Create Officer Profiles
        self.officer_water = Officer.objects.create(
            user=self.officer_user_water,
            department=self.water_dept,
            designation="Junior Water Engineer",
            hierarchy_level=HierarchyLevel.JUNIOR_OFFICER,
        )
        self.officer_elec = Officer.objects.create(
            user=self.officer_user_elec,
            department=self.elec_dept,
            designation="Electricity Department Head",
            hierarchy_level=HierarchyLevel.DEPARTMENT_HEAD,
        )

    def test_complaint_creation_and_priority(self):
        """
        Verify that a citizen can create a complaint, which calculates priority
        and creates a timeline entry.
        """
        self.client.force_authenticate(user=self.citizen1)
        url = reverse("complaint-list")

        data = {
            "title": "Water leakage in sector 4",
            "description": "Clean drinking water is leaking from a main pipe in sector 4 street 2.",
            "department": self.water_dept.id,
            "latitude": "19.076000",
            "longitude": "72.877700",
            "address": "Sector 4, Near Water Tank",
            "category": CategoryChoices.WATER,
            "severity": 3,  # High severity
        }

        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify database
        complaint = Complaint.objects.get(id=response.data["id"])
        self.assertEqual(complaint.user, self.citizen1)
        self.assertEqual(complaint.status, StatusChoices.REPORTED)
        self.assertEqual(complaint.category, CategoryChoices.WATER)
        self.assertEqual(complaint.is_duplicate, False)

        # Verify priority calculation (severity 3 * 15 = 45 points, age = 0)
        self.assertEqual(complaint.priority_score, 45)

        # Verify timeline entry
        timeline_entries = ComplaintTimeline.objects.filter(complaint=complaint)
        self.assertEqual(timeline_entries.count(), 1)
        self.assertEqual(timeline_entries.first().status, StatusChoices.REPORTED)
        self.assertIn("Complaint created", timeline_entries.first().description)

    def test_duplicate_detection(self):
        """
        Verify that creating a complaint close to an existing one with a similar
        description sets it as a duplicate and closes it.
        """
        # Create base complaint
        complaint_base = Complaint.objects.create(
            user=self.citizen1,
            title="Sector 4 pipe burst",
            description="Huge water leakage pipe burst sector 4 main road.",
            department=self.water_dept,
            latitude="19.076000",
            longitude="72.877700",
            address="Sector 4 road",
            category=CategoryChoices.WATER,
            severity=3,
        )

        self.client.force_authenticate(user=self.citizen2)
        url = reverse("complaint-list")

        # Create similar complaint (distance ~ 10 meters, description tokens overlap)
        data = {
            "title": "Water leakage on sector 4 road",
            "description": "Huge water leakage burst pipe sector 4 street.",
            "department": self.water_dept.id,
            "latitude": "19.076050",
            "longitude": "72.877750",
            "address": "Sector 4 street",
            "category": CategoryChoices.WATER,
            "severity": 2,
        }

        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify duplicate flag and closing status
        complaint_dup = Complaint.objects.get(id=response.data["id"])
        self.assertTrue(complaint_dup.is_duplicate)
        self.assertEqual(complaint_dup.duplicate_of, complaint_base)
        self.assertEqual(complaint_dup.status, StatusChoices.CLOSED)

        # Verify timeline log
        timeline = ComplaintTimeline.objects.filter(
            complaint=complaint_dup, status=StatusChoices.CLOSED
        )
        self.assertTrue(timeline.exists())
        self.assertIn("Marked as duplicate", timeline.first().description)

    def test_upvote_and_priority_increase(self):
        """
        Verify that citizens can vote on a complaint (only once), which increases the priority score.
        """
        complaint = Complaint.objects.create(
            user=self.citizen1,
            title="Sector 4 pipe burst",
            description="Huge water leakage pipe burst sector 4 main road.",
            department=self.water_dept,
            latitude="19.076000",
            longitude="72.877700",
            address="Sector 4 road",
            category=CategoryChoices.WATER,
            severity=3,
        )
        # Initial priority score: severity 3 * 15 = 45 points
        complaint.priority_score = 45
        complaint.save()

        self.client.force_authenticate(user=self.citizen2)
        vote_url = reverse("complaint-vote", kwargs={"pk": complaint.id})

        # Cast first vote
        response = self.client.post(vote_url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        complaint.refresh_from_db()
        # New priority score: vote 1 * 10 + severity 3 * 15 = 55 points
        self.assertEqual(complaint.priority_score, 55)
        self.assertEqual(ComplaintVote.objects.filter(complaint=complaint).count(), 1)

        # Attempt to cast second vote (must fail)
        response2 = self.client.post(vote_url)
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already voted", response2.data["error"])

    def test_status_lifecycle_transitions(self):
        """
        Verify status workflow lifecycle:
        - Reported -> Verified is valid (and triggers auto-escalation/assignment)
        - Reported -> Resolved is invalid
        """
        complaint = Complaint.objects.create(
            user=self.citizen1,
            title="Power failure in block A",
            description="Electric transformer blew up, no electricity in block A.",
            department=self.elec_dept,
            latitude="19.100000",
            longitude="72.900000",
            address="Block A street 5",
            category=CategoryChoices.ELECTRICITY,
            severity=4,  # Severity 4 * 15 = 60 points -> Escalation to DEPARTMENT_HEAD
        )

        # Test Invalid Transition directly via model clean
        complaint.status = StatusChoices.RESOLVED
        with self.assertRaises(ValidationError):
            complaint.save()

        # Revert status
        complaint.status = StatusChoices.REPORTED
        complaint.save()

        # Test valid transition: Reported -> Verified via Officer endpoint
        # authenticated as officer of electricity department (officer_elec)
        self.client.force_authenticate(user=self.officer_user_elec)
        status_url = reverse("complaint-update-status", kwargs={"pk": complaint.id})

        response = self.client.put(
            status_url,
            {
                "status": StatusChoices.VERIFIED,
                "description": "Verified by Electric Dept Head",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        complaint.refresh_from_db()
        # Verify it transitions automatically from Verified -> Assigned because of auto-assignment
        self.assertEqual(complaint.status, StatusChoices.ASSIGNED)
        self.assertEqual(complaint.assigned_officer, self.officer_elec)

        # Verify timeline log
        self.assertTrue(
            ComplaintTimeline.objects.filter(
                complaint=complaint, status=StatusChoices.ASSIGNED
            ).exists()
        )

    def test_granular_permissions(self):
        """
        Verify citizens cannot update status, officers can only update status for their department,
        and unauthorized access is blocked.
        """
        complaint_water = Complaint.objects.create(
            user=self.citizen1,
            title="Leaking pipeline",
            description="Leaking water pipeline.",
            department=self.water_dept,
            latitude="19.076000",
            longitude="72.877700",
            address="Sector 4 road",
            category=CategoryChoices.WATER,
            severity=2,
        )

        status_url = reverse(
            "complaint-update-status", kwargs={"pk": complaint_water.id}
        )

        # 1. Citizen tries to update status (should fail)
        self.client.force_authenticate(user=self.citizen1)
        response = self.client.put(status_url, {"status": StatusChoices.VERIFIED})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # 2. Electricity officer tries to update status of Water complaint (should fail)
        self.client.force_authenticate(user=self.officer_user_elec)
        response = self.client.put(status_url, {"status": StatusChoices.VERIFIED})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # 3. Water officer tries to update status of Water complaint (should succeed)
        self.client.force_authenticate(user=self.officer_user_water)
        response = self.client.put(status_url, {"status": StatusChoices.VERIFIED})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
