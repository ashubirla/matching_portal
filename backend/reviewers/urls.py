from django.urls import path

from reviewers.views import (
    reviewer_profile,
    assigned_papers,
    submit_review,
    reviewer_paper_detail,
    assignment_dashboard,
)

urlpatterns = [
    # Reviewer APIs
    path(
        "me/",
        reviewer_profile,
        name="reviewer_profile"
    ),

    path(
        "my-papers/",
        assigned_papers,
        name="assigned_papers"
    ),

    path(
        "submit-review/<int:paper_id>/",
        submit_review,
        name="submit_review"
    ),

    path(
        "paper/<int:paper_id>/",
        reviewer_paper_detail,
        name="reviewer_paper_detail"
    ),

    # Admin Assignment Dashboard
    path(
        "assignment-dashboard/",
        assignment_dashboard,
        name="assignment_dashboard"
    ),
]