from django.contrib.auth import get_user_model, authenticate
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.serializers import (
    RegisterSerializer,
    LoginSerializer,
    ResearcherSerializer,
    UpdateReviewerStatusSerializer,
)
from accounts.models import Researcher

User = get_user_model()


@api_view(["POST"])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        if "email" in serializer.errors:
            return Response({"status": False, "message": "Email already registered."}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"status": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    user = serializer.save()
    refresh = RefreshToken.for_user(user)
    return Response({
        "status": True,
        "message": "User registered successfully",
        "refresh": str(refresh),
        "access": str(refresh.access_token),
        "is_admin": user.is_staff,
    }, status=status.HTTP_201_CREATED)

@api_view(["POST"])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            "status": False,
            "message": serializer.errors.get("non_field_errors", ["Invalid credentials"])[0]
        }, status=status.HTTP_401_UNAUTHORIZED)

    user = serializer.validated_data["user"]
    refresh = RefreshToken.for_user(user)
    return Response({
        "status": True,
        "message": "Login successful",
        "refresh": str(refresh),
        "access": str(refresh.access_token),
        "is_admin": user.is_staff,
    }, status=status.HTTP_200_OK)

@api_view(["POST"])
def admin_login_view(request):
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({"status": False, "message": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

    user = serializer.validated_data["user"]
    if not user.is_staff: 
        return Response({"status": False, "message": "Not an admin account"}, status=status.HTTP_403_FORBIDDEN)

    refresh = RefreshToken.for_user(user)
    return Response({
        "status": True,
        "message": "Admin login successful",
        "refresh": str(refresh),
        "access": str(refresh.access_token),
        "is_admin": True,
    }, status=status.HTTP_200_OK)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    refresh_token = request.data.get("refresh")
    if not refresh_token:
        return Response({"status": False, "message": "Refresh token required"}, status=status.HTTP_400_BAD_REQUEST)
    try:
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({"status": True, "message": "Logged out successfully"}, status=status.HTTP_200_OK)
    except Exception:
        return Response({"status": False, "message": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def verify_token(request):
    return Response({
        "status": True,
        "message": "Token is valid",
        "email": request.user.email,
        "is_admin": request.user.is_staff,
    }, status=status.HTTP_200_OK)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def profile(request):
    try:
        researcher = request.user.researcher
        return Response({
            "status": True,
            "profile": ResearcherSerializer(researcher).data,
            "is_admin": request.user.is_staff,
        }, status=status.HTTP_200_OK)
    except Researcher.DoesNotExist:
        return Response({"status": False, "message": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_reviewer_status(request):
    try:
        researcher = request.user.researcher
        serializer = UpdateReviewerStatusSerializer(researcher, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "status": True,
                "message": "Status updated",
                "is_reviewer": serializer.data["is_reviewer"]
            }, status=status.HTTP_200_OK)
        return Response({"status": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    except Researcher.DoesNotExist:
        return Response({"status": False, "message": "Researcher profile not found"}, status=status.HTTP_404_NOT_FOUND)


class ReviewerListView(generics.ListAPIView):
    """
    API view to retrieve all researchers marked as reviewers.
    Restricted to Admin users (is_staff=True).
    """
    serializer_class = ResearcherSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        # Matches your model's field 'is_reviewer'
        return Researcher.objects.filter(is_reviewer=True).select_related('user')

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        # Wrapping in "reviewers" key for the frontend ReviewerList.js
        return Response({
            "status": True,
            "reviewers": serializer.data
        }, status=status.HTTP_200_OK)