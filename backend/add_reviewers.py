import os
import sys
import django
import json
import hashlib

from django.contrib.auth import get_user_model

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "matching_portal.settings")
django.setup()

from accounts.models import Researcher

User = get_user_model()

COMMON_PASSWORD = "StrongPass123!"




def generate_email(name):
    unique = hashlib.md5(name.encode()).hexdigest()[:6]
    return f"{name.lower().replace(' ', '.')}.{unique}@research.com"


def split_name(full_name):
    parts = full_name.strip().split()

    if len(parts) == 1:
        return parts[0], ""

    return parts[0], " ".join(parts[1:])


def create_user_and_researcher(name, affiliation, interests):

    email = generate_email(name)
    first_name, last_name = split_name(name)

    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            "username": email,
            "first_name": first_name,
            "last_name": last_name
        }
    )

    if created:
        user.set_password(COMMON_PASSWORD)
        user.save()

    if not created:
        updated = False
        if not user.first_name:
            user.first_name = first_name
            updated = True
        if not user.last_name:
            user.last_name = last_name
            updated = True
        if updated:
            user.save()

    researcher, r_created = Researcher.objects.get_or_create(
        user=user,
        defaults={
            "name": name,
            "institutions": [affiliation] if affiliation else [],
            "research_interests": interests,
            "is_reviewer": True 
        }
    )


    if not r_created:
        existing = set(researcher.research_interests or [])
        new = set(interests or [])

        researcher.research_interests = list(existing.union(new))[:15]

        if affiliation and affiliation not in researcher.institutions:
            researcher.institutions.append(affiliation)

        researcher.is_reviewer = True

        researcher.save()

    return user

def main():

    with open("final_assigned_research_interests.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    user_count = 0
    seen_users = set()

    for entry in data:

        name = entry.get("name")
        affiliation = entry.get("affiliation")
        interests = entry.get("research_interest", [])

        if not name:
            continue

        user = create_user_and_researcher(
            name,
            affiliation,
            interests
        )

        if user.email not in seen_users:
            user_count += 1
            seen_users.add(user.email)

    print("Data Insertion Complete")
    print(f"Unique Users Created: {user_count}")


if __name__ == "__main__":
    main()