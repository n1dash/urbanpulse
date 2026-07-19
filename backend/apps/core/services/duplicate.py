import math
import logging
from django.conf import settings
from apps.core.models import Complaint

logger = logging.getLogger("urbanpulse")


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance between two points on the Earth
    in meters.
    """
    R = 6371000.0  # Earth's radius in meters
    phi1 = math.radians(float(lat1))
    phi2 = math.radians(float(lat2))
    delta_phi = math.radians(float(lat2 - lat1))
    delta_lambda = math.radians(float(lon2 - lon1))

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


def get_jaccard_similarity(text1: str, text2: str) -> float:
    """
    Calculates word-token Jaccard similarity between two text descriptions.
    """
    if not text1 or not text2:
        return 0.0
    words1 = set(text1.lower().split())
    words2 = set(text2.lower().split())
    if not words1 or not words2:
        return 0.0
    intersection = words1.intersection(words2)
    union = words1.union(words2)
    return len(intersection) / len(union)


def check_for_duplicate(complaint: Complaint) -> Complaint:
    """
    Scans existing complaints in the same department to find potential duplicates.
    Configured via settings:
    - DUPLICATE_RADIUS_METERS (default 100.0)
    - DESCRIPTION_SIMILARITY_THRESHOLD (default 0.6)
    """
    radius_meters = getattr(settings, "DUPLICATE_RADIUS_METERS", 100.0)
    similarity_threshold = getattr(settings, "DESCRIPTION_SIMILARITY_THRESHOLD", 0.6)

    # Only look for active complaints in the same department
    candidates = Complaint.objects.filter(department=complaint.department)
    if complaint.pk:
        candidates = candidates.exclude(pk=complaint.pk)

    for candidate in candidates:
        # 1. Compare location distance
        distance = haversine_distance(
            complaint.latitude,
            complaint.longitude,
            candidate.latitude,
            candidate.longitude,
        )
        if distance <= radius_meters:
            # 2. Compare descriptions
            similarity = get_jaccard_similarity(
                complaint.description, candidate.description
            )
            if similarity >= similarity_threshold:
                logger.info(
                    f"Possible duplicate detected: Complaint '{complaint.title}' matches "
                    f"existing Complaint '{candidate.title}' (distance: {distance:.2f}m, similarity: {similarity:.2f})"
                )
                return candidate

    return None
