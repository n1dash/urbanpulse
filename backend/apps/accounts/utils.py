import re
from django.contrib.auth import get_user_model


def generate_unique_username(email: str) -> str:
    """
    Derives a unique username from an email's local part.
    e.g. 'rahul.sharma@gmail.com' -> 'rahulsharma' (or 'rahulsharma1' if taken).
    """
    User = get_user_model()
    base = re.sub(r'[^a-zA-Z0-9_]', '', email.split('@')[0]).lower() or 'user'
    username = base
    counter = 1
    while User.objects.filter(username=username).exists():
        username = f"{base}{counter}"
        counter += 1
    return username


def split_full_name(name: str):
    """Splits 'Rahul Sharma' into ('Rahul', 'Sharma'); handles single-word names."""
    parts = name.strip().split(maxsplit=1)
    first = parts[0] if parts else ''
    last = parts[1] if len(parts) > 1 else ''
    return first, last
