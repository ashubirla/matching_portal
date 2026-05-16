from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Paper
from .serializers import PaperSerializer, PaperCreateSerializer
from accounts.models import Researcher


STATUS_SUBMITTED = "submitted"
STATUS_UNDER_REVIEW = "Under review"


class PaperCreateView(generics.CreateAPIView):
    serializer_class = PaperCreateSerializer
    permission_classes = [IsAuthenticated]


class PaperListView(generics.ListAPIView):
    serializer_class = PaperSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Paper.objects.all()
        return Paper.objects.filter(author=user)

    def list(self, request, *args, **kwargs):
        try:
            queryset = self.get_queryset()
            serializer = self.get_serializer(queryset, many=True)

            reviewer_count = Researcher.objects.filter(is_reviewer=True).count()

            return Response({
                "status": True,
                "papers": serializer.data,
                "counts": {
                    "total": queryset.count(),
                    "submitted": queryset.filter(status=STATUS_SUBMITTED).count(),
                    "assigned": queryset.filter(status=STATUS_UNDER_REVIEW).count(),
                    "reviewers": reviewer_count,
                }
            })

        except Exception as e:
            return Response({
                "status": False,
                "message": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PaperDetailView(generics.RetrieveAPIView):
    serializer_class = PaperSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Paper.objects.all()
        return Paper.objects.filter(author=self.request.user)