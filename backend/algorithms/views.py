from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.db import connection, transaction
from django.http import JsonResponse

from papers.models import Paper
from .services.ILP import main as run_ilp
from .services.paper_reviewer_edge import main as run_similarity
from .services.reviewer_reviewer_edge import main as run_reviewer_edge 
from .services.lp_with_iterative_rounding import main as run_lp_with_iterative_rounding
from .services.Iterative_max_flow_fair import main as run_iterative_assignment_algo
from .services.network_flow import main as run_network_flow
from .services.paper_reviewer_edge_hard import main as run_similarity_hard


STATUS_SUBMITTED = "submitted"
STATUS_UNDER_REVIEW = "Under review"


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def run_network_flow_algo(request):
    try:
        with transaction.atomic():
            result = run_network_flow()
            Paper.objects.filter(status=STATUS_SUBMITTED).update(status=STATUS_UNDER_REVIEW)
        return Response(result)
    except Exception as e:
        return Response({"status": "error", "message": str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def run_matching_with_ILP(request):
    try:
        return Response(run_ilp())
    except Exception as e:
        return Response({"status": "error", "message": str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def run_iterative_assignment(request):
    try:
        with transaction.atomic():
            result = run_iterative_assignment_algo()
            Paper.objects.filter(status=STATUS_SUBMITTED).update(status=STATUS_UNDER_REVIEW)
        return Response(result)
    except Exception as e:
        return Response({"status": "error", "message": str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def run_matching(request):
    try:
        return Response(run_ilp())
    except Exception as e:
        return Response({"status": "error", "message": str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def run_similarity_api(request):
    try:
        with transaction.atomic():
            result = run_similarity()
            Paper.objects.filter(status=STATUS_SUBMITTED).update(status=STATUS_UNDER_REVIEW)
        return Response(result)
    except Exception as e:
        return Response({"status": "error", "message": str(e)}, status=500)
    
   
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def run_similarity_hard_api(request):
    try:
        with transaction.atomic():
            result = run_similarity_hard()
            Paper.objects.filter(status=STATUS_SUBMITTED).update(status=STATUS_UNDER_REVIEW)
        return Response(result)
    except Exception as e:
        return Response({"status": "error", "message": str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def run_reviewer_edge_weights_api(request):
    try:
        with transaction.atomic():
            result = run_reviewer_edge()
        return Response(result)
    except Exception as e:
        return Response({"status": "error", "message": str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def run_matching_with_iterative_rounding(request):
    try:
        with transaction.atomic():
            result = run_lp_with_iterative_rounding()
            Paper.objects.filter(status=STATUS_SUBMITTED).update(status=STATUS_UNDER_REVIEW)
        return Response(result)
    except Exception as e:
        return Response({"status": "error", "message": str(e)}, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def check_edge_weight_table(request):
    try:
        tables = connection.introspection.table_names()

        if 'paper_to_reviewer' not in tables:
            return JsonResponse({"doesExist": False})

        with connection.cursor() as cursor:
            cursor.execute(
                'SELECT EXISTS (SELECT 1 FROM paper_to_reviewer LIMIT 1);'
            )
            has_data = cursor.fetchone()[0]

        return JsonResponse({"doesExist": bool(has_data)})

    except Exception as e:
        return JsonResponse({"doesExist": False, "error": str(e)}, status=500)