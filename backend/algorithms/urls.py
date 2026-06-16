from django.urls import path
from .views import (
    run_matching_with_ILP,
    run_similarity_api,
    run_similarity_hard_api,
    run_reviewer_edge_weights_api,
    check_edge_weight_table,
    run_matching_with_iterative_rounding,
    run_iterative_assignment,
    run_network_flow_algo,
)

urlpatterns = [
    path('run_ilp/', run_matching_with_ILP),
    path('check_edge_weight_table/', check_edge_weight_table),
    path('run_edge_weights/', run_similarity_api),
    path('run_edge_weights_hard/', run_similarity_hard_api),
    path('run_reviewer_edge_weights/', run_reviewer_edge_weights_api),
    path('run_lp_with_iterative_rounding/', run_matching_with_iterative_rounding),
    path('iterative_assignment/', run_iterative_assignment),
    path('run_network_flow/', run_network_flow_algo),
]