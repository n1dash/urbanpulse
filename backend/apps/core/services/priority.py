from django.utils import timezone
from apps.core.models import Complaint


def calculate_priority_score(complaint: Complaint) -> int:
    """
    Calculates the priority score for a complaint.
    Formula: (upvotes * 10) + (severity * 15) + min(25, int(age_in_hours * 0.2))
    Capped at 100.
    """
    # 1. Number of upvotes
    upvotes_count = complaint.votes.count() if complaint.pk else 0

    # 2. Severity value (choices 1-5, default 2)
    severity = complaint.severity

    # 3. Complaint age in hours
    if complaint.created_at:
        age_in_hours = (timezone.now() - complaint.created_at).total_seconds() / 3600.0
    else:
        age_in_hours = 0.0

    # Calculate components
    vote_points = upvotes_count * 10
    severity_points = severity * 15
    age_points = min(25, int(age_in_hours * 0.2))

    score = vote_points + severity_points + age_points

    # Bound score between 0 and 100
    final_score = max(0, min(100, score))
    return final_score
