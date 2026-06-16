from rest_framework import serializers
from .models import FinalAssignment


class ReviewerSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        fields = [
            "id",
            "reviewer_name",
            "email",
            "institutes",
            "research_domains",
            "keywords",
        ]


class AssignedPaperSerializer(serializers.ModelSerializer):
    # Use 'paper_id' (the model field name) instead of 'paper'
    paper_title = serializers.CharField(source="paper_id.title", read_only=True)
    paper_abstract = serializers.CharField(source="paper_id.abstract", read_only=True)
    pdf_url = serializers.CharField(source="paper_id.pdf_url", read_only=True)

    class Meta:
        model = FinalAssignment
        fields = [
            "id",
            "paper_id", # This will return the actual ID of the paper
            "paper_title",
            "paper_abstract",
            "reviewer_status",
            "pdf_url",
            "paper_score", # Ensure this matches your model field 'paper_score'
            "comments"
        ]

class SubmitReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinalAssignment
        fields = ["paper_score", "comments"]

class AssignmentDashboardSerializer(serializers.ModelSerializer):

    paper_id = serializers.IntegerField(
        source="paper_id.id",
        read_only=True
    )

    paper_title = serializers.CharField(
        source="paper_id.title",
        read_only=True
    )

    reviewer_id = serializers.IntegerField(
        source="reviewer_id.id",
        read_only=True
    )

    reviewer_email = serializers.EmailField(
        source="reviewer_id.email",
        read_only=True
    )

    reviewer_name = serializers.SerializerMethodField()

    def get_reviewer_name(self, obj):
        try:
            return obj.reviewer_id.researcher.name
        except Exception:
            return obj.reviewer_id.email

    class Meta:
        model = FinalAssignment

        fields = [
            "id",

            "paper_id",
            "paper_title",

            "reviewer_id",
            "reviewer_name",
            "reviewer_email",

            "reviewer_status",
            "paper_score",
            "comments",
        ]