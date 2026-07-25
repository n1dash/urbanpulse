import logging
from django.core.mail import send_mail
from django.conf import settings
from apps.notifications.models import Notification

logger = logging.getLogger(__name__)

def send_email_notification(recipient_email, subject, body):
    """
    Utility function to send an email using Django's email configuration.
    """
    if not recipient_email:
        logger.warning("Attempted to send email but no recipient email was provided.")
        return False
        
    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient_email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {recipient_email}: {str(e)}")
        return False

def trigger_complaint_notification(complaint, event_type, extra_context=None):
    """
    Triggers database and email notifications for complaint lifecycle events.
    """
    notifications_to_send = []
    
    citizen = complaint.user
    officer = complaint.assigned_officer
    
    if event_type == 'CREATED':
        msg = f"Your complaint '{complaint.title}' (ID: #{complaint.id}) has been created successfully."
        notifications_to_send.append((citizen, msg, 'CREATED'))
        
    elif event_type == 'ASSIGNED':
        # Notify citizen
        msg_citizen = f"Your complaint '{complaint.title}' (ID: #{complaint.id}) has been assigned to an officer."
        if officer:
            msg_citizen += f" Assigned Officer: {officer.user.get_full_name() or officer.user.username}."
        notifications_to_send.append((citizen, msg_citizen, 'ASSIGNED'))
        
        # Notify officer
        if officer:
            msg_officer = f"You have been assigned complaint '{complaint.title}' (ID: #{complaint.id})."
            notifications_to_send.append((officer.user, msg_officer, 'ASSIGNED'))
            
    elif event_type == 'STATUS_CHANGED':
        old_status = extra_context.get('old_status', '') if extra_context else ''
        status_disp = complaint.get_status_display()
        msg = f"The status of your complaint '{complaint.title}' (ID: #{complaint.id}) has changed from {old_status} to {status_disp}."
        notifications_to_send.append((citizen, msg, 'STATUS_CHANGED'))
        if officer:
            msg_officer = f"The status of complaint '{complaint.title}' (ID: #{complaint.id}) which is assigned to you has changed to {status_disp}."
            notifications_to_send.append((officer.user, msg_officer, 'STATUS_CHANGED'))
            
    elif event_type == 'RESOLVED':
        msg = f"Your complaint '{complaint.title}' (ID: #{complaint.id}) has been resolved. Thank you!"
        notifications_to_send.append((citizen, msg, 'RESOLVED'))
        if officer:
            msg_officer = f"Complaint '{complaint.title}' (ID: #{complaint.id}) assigned to you has been marked as resolved."
            notifications_to_send.append((officer.user, msg_officer, 'RESOLVED'))
            
    elif event_type == 'ESCALATED':
        msg = f"Your complaint '{complaint.title}' (ID: #{complaint.id}) has been escalated for review."
        notifications_to_send.append((citizen, msg, 'ESCALATED'))
        if officer:
            msg_officer = f"Complaint '{complaint.title}' (ID: #{complaint.id}) assigned to you has been escalated."
            notifications_to_send.append((officer.user, msg_officer, 'ESCALATED'))

    # Save to database and trigger emails
    for user, message, notif_type in notifications_to_send:
        # Create database notification
        Notification.objects.create(
            user=user,
            complaint=complaint,
            message=message,
            notification_type=notif_type
        )
        
        # Dispatch email if user has a valid email address
        if user.email:
            subject = f"[UrbanPulse] {dict(Notification.NOTIFICATION_TYPES).get(notif_type)}: #{complaint.id}"
            send_email_notification(user.email, subject, message)
