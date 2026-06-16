from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password
from django.db import transaction

from rest_framework import serializers

from accounts.models import Researcher

User = get_user_model()


class ResearcherSerializer(serializers.ModelSerializer):
    """
    Serializer for displaying researcher/reviewer data.
    """
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = Researcher
        fields = [
            "id",
            "name",
            "email",
            "institutions",
            "work",
            "is_reviewer",
        ]


class RegisterSerializer(serializers.Serializer):
    """
    Registration serializer matching the current Researcher model.
    """

    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)

    name = serializers.CharField(required=True)

    institutions = serializers.ListField(
        child=serializers.CharField(),
        allow_empty=False
    )

    work = serializers.CharField(
        required=False,
        allow_blank=True
    )

    is_reviewer = serializers.BooleanField(
        required=False,
        default=False
    )

    def validate_email(self, value):
        value = value.strip().lower()

        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "Email already registered"
            )

        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def _clean_list(self, values):
        cleaned = [v.strip() for v in values if v.strip()]
        return list(dict.fromkeys(cleaned))

    @transaction.atomic
    def create(self, validated_data):
        email = validated_data["email"]

        user = User.objects.create_user(
            username=email,
            email=email,
            password=validated_data["password"]
        )

        Researcher.objects.create(
            user=user,
            name=validated_data["name"],
            institutions=self._clean_list(
                validated_data["institutions"]
            ),
            work=validated_data.get("work", ""),
            is_reviewer=validated_data.get(
                "is_reviewer",
                False
            )
        )

        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        write_only=True,
        required=True
    )

    def validate(self, data):
        email = data.get("email", "").strip().lower()
        password = data.get("password")

        user_obj = User.objects.filter(
            email__iexact=email
        ).first()

        if not user_obj:
            raise serializers.ValidationError(
                "Invalid credentials"
            )

        user = authenticate(
            username=user_obj.username,
            password=password
        )

        if not user or not user.is_active:
            raise serializers.ValidationError(
                "Invalid credentials"
            )

        data["user"] = user
        return data


class UpdateReviewerStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Researcher
        fields = ["is_reviewer"]