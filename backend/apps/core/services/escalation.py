import logging
from django.db.models import Count, Q
from apps.core.models import Complaint, Officer, HierarchyLevel, StatusChoices

logger = logging.getLogger("urbanpulse")


def assign_or_escalate_complaint(complaint: Complaint) -> Officer:
    """
    Escalates/assigns a complaint to an officer in the same department based on priority score.
    Rules:
    - Low priority (score < 30): FIELD_OFFICER, JUNIOR_OFFICER
    - Medium priority (30 <= score < 70): SENIOR_OFFICER
    - High priority (score >= 70): DEPARTMENT_HEAD

    Returns the assigned Officer (or None if no officer is found).
    """
    score = complaint.priority_score

    # Determine desired hierarchy levels
    if score < 30:
        target_levels = [HierarchyLevel.FIELD_OFFICER, HierarchyLevel.JUNIOR_OFFICER]
    elif score < 70:
        target_levels = [HierarchyLevel.SENIOR_OFFICER]
    else:
        target_levels = [HierarchyLevel.DEPARTMENT_HEAD]

    # Filter officers in the same department
    officers = Officer.objects.filter(department=complaint.department)
    if not officers.exists():
        logger.warning(
            f"No officers found in department '{complaint.department.name}' for assignment."
        )
        return None

    # Try to find officers at target level
    assigned_officer = _get_best_officer(officers, target_levels)
    if assigned_officer:
        logger.info(
            f"Assigned complaint '{complaint.title}' to officer {assigned_officer.user.username} "
            f"({assigned_officer.hierarchy_level}) based on priority score {score}."
        )
        return assigned_officer

    # Fallback to any other officer in the department (sorted by level similarity)
    all_levels = [
        HierarchyLevel.FIELD_OFFICER,
        HierarchyLevel.JUNIOR_OFFICER,
        HierarchyLevel.SENIOR_OFFICER,
        HierarchyLevel.DEPARTMENT_HEAD,
    ]
    assigned_officer = _get_best_officer(officers, all_levels)
    if assigned_officer:
        logger.info(
            f"Fallback: Assigned complaint '{complaint.title}' to officer {assigned_officer.user.username} "
            f"({assigned_officer.hierarchy_level}) since target hierarchy levels {target_levels} were unavailable."
        )
        return assigned_officer

    return None


def _get_best_officer(officers_queryset, target_levels) -> Officer:
    """
    Selects the officer in the queryset with the target hierarchy levels who has the lowest active workload.
    """
    target_officers = officers_queryset.filter(hierarchy_level__in=target_levels)
    if not target_officers.exists():
        return None

    # Annotate with count of active complaints (not Resolved, not Closed)
    workload_query = target_officers.annotate(
        active_workload=Count(
            "assigned_complaints",
            filter=~Q(
                assigned_complaints__status__in=[
                    StatusChoices.RESOLVED,
                    StatusChoices.CLOSED,
                ]
            )
            & Q(assigned_complaints__deleted_at__isnull=True),
        )
    )

    # Order by active workload, and return the one with the lowest workload
    best_officer = workload_query.order_by("active_workload").first()
    return best_officer
