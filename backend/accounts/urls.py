from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from accounts.views import (
    register,
    login_view,
    admin_login_view,
    verify_token,
    profile,
    logout_view,
    update_reviewer_status,
    ReviewerListView,
    reviewer_detail,   # NEW
)

urlpatterns = [
    path("register/", register),
    path("login/", login_view),
    path("admin-login/", admin_login_view),
    path("verify-token/", verify_token),
    path("profile/", profile),
    path("logout/", logout_view),
    path("update-reviewer-status/", update_reviewer_status),

    path(
        "reviewers/",
        ReviewerListView.as_view(),
        name="reviewer-list"
    ),

    # NEW
    path(
        "reviewer/<int:reviewer_id>/",
        reviewer_detail,
        name="reviewer-detail"
    ),

    path(
        "token/refresh/",
        TokenRefreshView.as_view()
    ),
]