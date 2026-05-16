import os
import sys
import django
import json
import hashlib

from django.contrib.auth import get_user_model

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "matching_portal.settings")
django.setup()

from papers.models import Paper
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


def create_user_and_researcher(name, affiliation, paper_keywords):

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
            "research_interests": paper_keywords,
            "is_reviewer": False
        }
    )

    if not r_created:
        existing = set(researcher.research_interests or [])
        new_keywords = set(paper_keywords)

        updated_interests = list(existing.union(new_keywords))[:15]

        researcher.research_interests = updated_interests

        if affiliation and affiliation not in researcher.institutions:
            researcher.institutions.append(affiliation)

        researcher.save()

    return user

def main():

    with open("final_papers.json", "r", encoding="utf-8") as f:
        papers = json.load(f)

    paper_count = 0
    user_count = 0
    seen_users = set()

    for paper in papers:

        authors = paper.get("authors", [])
        if not authors:
            continue

        keywords = paper.get("keywords", [])

        # ✅ FIRST AUTHOR
        first_author = authors[0]
        first_name = first_author.get("name")

        affiliations = first_author.get("affiliations", [])
        first_affiliation = affiliations[0] if affiliations else ""

        user = create_user_and_researcher(
            first_name,
            first_affiliation,
            keywords
        )

        if user.email not in seen_users:
            user_count += 1
            seen_users.add(user.email)
        author_names = []
        affiliations_set = set()

        for a in authors:
            name = a.get("name")
            author_names.append(name)

            for aff in a.get("affiliations", []):
                if aff and aff.strip():
                    affiliations_set.add(aff.strip())

        affiliations_list = list(affiliations_set)

        Paper.objects.create(
            title=paper.get("title"),
            abstract=paper.get("abstract"),
            keywords=keywords,
            pdf_url=f"https://doi.org/{paper.get('doi')}",
            author=user,
            author_names=author_names,
            paper_affiliations=affiliations_list,
            status="submitted"
        )

        paper_count += 1

    print("Data Insertion Complete")
    print(f"Papers Inserted: {paper_count}")
    print(f"Unique Users: {user_count}")


if __name__ == "__main__":
    main()