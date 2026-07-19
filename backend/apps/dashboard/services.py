from django.db import models
from django.db.models import F, Avg, Count, ExpressionWrapper, DurationField
from apps.core.models import Complaint, Department

def format_seconds_to_duration(seconds):
    """
    Format seconds into a human-readable duration string (e.g. '2d 4h 15m').
    """
    if seconds <= 0:
        return "N/A"
    
    days = int(seconds // 86400)
    hours = int((seconds % 86400) // 3600)
    minutes = int((seconds % 3600) // 60)
    
    parts = []
    if days > 0:
        parts.append(f"{days}d")
    if hours > 0:
        parts.append(f"{hours}h")
    if minutes > 0 or (hours > 0 and days == 0) or not parts:
        parts.append(f"{minutes}m")
        
    return " ".join(parts)

def get_dashboard_stats():
    """
    Computes analytics statistics for the dashboard:
    - Total complaints
    - Pending complaints
    - Resolved complaints
    - Active complaints (Pending + Assigned + Escalated)
    - Department-wise complaint counts
    - Average resolution time
    """
    total = Complaint.objects.count()
    pending = Complaint.objects.filter(status='Reported').count()
    resolved = Complaint.objects.filter(status='Resolved').count()
    active = Complaint.objects.exclude(status__in=['Resolved', 'Closed']).count()
    
    # Department-wise complaint count
    dept_counts = {}
    depts = Department.objects.annotate(complaint_count=Count('complaints'))
    for dept in depts:
        dept_counts[dept.name] = dept.complaint_count
        
    # Unassigned complaints
    unassigned = Complaint.objects.filter(department__isnull=True).count()
    if unassigned > 0:
        dept_counts['Unassigned'] = unassigned

    # Average resolution time calculation
    resolved_qs = Complaint.objects.filter(status='Resolved', resolved_at__isnull=False, created_at__isnull=False)
    avg_resolution_time_seconds = 0.0

    if resolved_qs.exists():
        try:
            # Perform database level duration aggregation
            duration_expr = ExpressionWrapper(F('resolved_at') - F('created_at'), output_field=DurationField())
            avg_res = resolved_qs.annotate(duration=duration_expr).aggregate(Avg('duration'))
            avg_duration = avg_res['duration__avg']
            
            if avg_duration is not None:
                # Depending on DB backend, Avg might return a timedelta, a float (seconds/microseconds), or a string
                if hasattr(avg_duration, 'total_seconds'):
                    avg_resolution_time_seconds = avg_duration.total_seconds()
                else:
                    avg_resolution_time_seconds = float(avg_duration)
            else:
                # Queryset exists but avg is None? Fallback to Python iteration.
                total_diff = sum((c.resolved_at - c.created_at).total_seconds() for c in resolved_qs)
                avg_resolution_time_seconds = total_diff / resolved_qs.count()
        except Exception:
            # Fallback to Python calculation if database expression fails
            total_diff = sum((c.resolved_at - c.created_at).total_seconds() for c in resolved_qs)
            avg_resolution_time_seconds = total_diff / resolved_qs.count()

    return {
        'total_complaints': total,
        'pending_complaints': pending,
        'resolved_complaints': resolved,
        'active_complaints': active,
        'department_wise_complaints': dept_counts,
        'average_resolution_time': {
            'seconds': round(avg_resolution_time_seconds, 2),
            'hours': round(avg_resolution_time_seconds / 3600, 2),
            'formatted': format_seconds_to_duration(avg_resolution_time_seconds)
        }
    }
