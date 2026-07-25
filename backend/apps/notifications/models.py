from django.db import models
from django.conf import settings

class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('CREATED', 'Complaint Created'),
        ('ASSIGNED', 'Complaint Assigned'),
        ('STATUS_CHANGED', 'Complaint Status Changed'),
        ('RESOLVED', 'Complaint Resolved'),
        ('ESCALATED', 'Complaint Escalated'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )

    complaint = models.ForeignKey(
        "core.Complaint",
        on_delete=models.CASCADE,
        related_name="notifications",
        null=True,
        blank=True,
    )
    
    message = models.TextField()
    notification_type = models.CharField(
        max_length=20,
        choices=NOTIFICATION_TYPES
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification ({self.notification_type}) for {self.user.username}: {self.message[:30]}..."
