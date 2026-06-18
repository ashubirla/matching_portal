from rest_framework import serializers
from papers.models import Paper


class PaperSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paper
        fields = "__all__"


class AuthorInputSerializer(serializers.Serializer):
    name = serializers.CharField()


class PaperCreateSerializer(serializers.ModelSerializer):

    authors = AuthorInputSerializer(
        many=True,
        write_only=True
    )

    affiliations = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Paper

        fields = [
            "title",
            "abstract",
            "pdf_url",
            "authors",
            "affiliations",
        ]

    def validate_affiliations(self, value):
        return list(
            dict.fromkeys(
                [
                    affiliation.strip()
                    for affiliation in value
                    if affiliation.strip()
                ]
            )
        )

    def create(self, validated_data):

        authors_data = validated_data.pop(
            "authors",
            []
        )

        affiliations = validated_data.pop(
            "affiliations",
            []
        )

        request = self.context.get(
            "request"
        )

        author_names = [
            author["name"].strip()
            for author in authors_data
            if author.get("name")
        ]

        return Paper.objects.create(
            author=request.user,
            author_names=author_names,
            paper_affiliations=affiliations,
            **validated_data
        )