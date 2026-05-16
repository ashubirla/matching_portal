import os
import sys
import django
import json
import hashlib

from tqdm import tqdm
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


def create_user_and_researcher(
    name,
    current_affiliation,
    other_affiliations,
    work
):

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

    # Build institutions list
    institutions = []

    # Current affiliation always first
    if current_affiliation:
        institutions.append(current_affiliation)

    # Add other affiliations after it
    if other_affiliations:
        for inst in other_affiliations:
            if inst and inst != current_affiliation:
                institutions.append(inst)

    # Remove duplicates while preserving order
    institutions = list(dict.fromkeys(institutions))

    researcher, r_created = Researcher.objects.get_or_create(
        user=user,
        defaults={
            "name": name,
            "institutions": institutions,
            "is_reviewer": True,
            "work": work
        }
    )

    if not r_created:

        existing_institutions = researcher.institutions or []

        # Keep current affiliation first
        if current_affiliation:

            if current_affiliation in existing_institutions:
                existing_institutions.remove(current_affiliation)

            existing_institutions.insert(0, current_affiliation)

        # Add remaining affiliations
        for inst in other_affiliations or []:

            if inst and inst not in existing_institutions:
                existing_institutions.append(inst)

        # Remove duplicates preserving order
        researcher.institutions = list(dict.fromkeys(existing_institutions))

        researcher.is_reviewer = True

        # Update work field
        if work:
            researcher.work = work

        researcher.save()

    return user


def main():

    with open("reviewers.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    user_count = 0
    seen_users = set()

    for entry in tqdm(data, desc="Processing Reviewers"):

        name = entry.get("name")
        current_affiliation = entry.get("current_affiliation")
        other_affiliations = entry.get("other_affiliations", [])
        work = entry.get("work")

        if not name:
            continue

        user = create_user_and_researcher(
            name,
            current_affiliation,
            other_affiliations,
            work
        )

        if user.email not in seen_users:
            user_count += 1
            seen_users.add(user.email)

    print("\nData Insertion Complete")
    print(f"Unique Users Created: {user_count}")


if __name__ == "__main__":
    main()