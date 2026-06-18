import os
import sys
import django

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "matching_portal.settings")
django.setup()

from django.db import connection, transaction
from gurobipy import Model, GRB, quicksum


def load_data():
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT paper_id, reviewer_id, final_similarity
            FROM paper_reviewer_affinity
            WHERE final_similarity IS NOT NULL
        """)
        rows = cursor.fetchall()

    papers = set()
    reviewers = set()
    weight = {}

    for p, r, s in rows:
        papers.add(int(p))
        reviewers.add(int(r))
        weight[(int(p), int(r))] = float(s)

    return sorted(papers), sorted(reviewers), weight


def save_allocation(assignments):

    assignments = list(assignments)

    with transaction.atomic():
        with connection.cursor() as cursor:

            cursor.execute("DELETE FROM final_assignment")

            cursor.executemany("""
                INSERT INTO final_assignment
                (paper_id, researcher_id, reviewer_status)
                VALUES (%s, %s, 'Pending')
            """, assignments)

            paper_ids = list(set(p for p, _ in assignments))

            cursor.execute("""
                UPDATE papers
                SET status = 'Under review'
                WHERE id = ANY(%s)
            """, [paper_ids])

    print(f"Saved {len(assignments)} assignments.")
    return assignments


def validate_remaining_graph(
    papers,
    reviewers,
    remaining_edges,
    paper_need,
    reviewer_cap
):

    for p in papers:

        if paper_need[p] == 0:
            continue

        available = sum(
            1
            for (pp, rr) in remaining_edges
            if pp == p
        )

        if available < paper_need[p]:
            raise RuntimeError(
                f"Paper {p} needs {paper_need[p]} reviewers "
                f"but only {available} edges remain."
            )

    total_need = sum(paper_need.values())
    total_capacity = sum(reviewer_cap.values())

    if total_capacity < total_need:
        raise RuntimeError(
            f"Remaining capacity {total_capacity} "
            f"is smaller than remaining need {total_need}"
        )


def iterative_rounding(
    papers,
    reviewers,
    weight,
    k=3,
    c=6
):

    remaining_edges = set(weight.keys())

    paper_need = {p: k for p in papers}
    reviewer_cap = {r: c for r in reviewers}

    selected = set()

    iteration = 0

    print("Starting Iterative Rounding...")

    while True:

        iteration += 1

        validate_remaining_graph(
            papers,
            reviewers,
            remaining_edges,
            paper_need,
            reviewer_cap
        )

        if all(v == 0 for v in paper_need.values()):
            break

        model = Model(f"IR_{iteration}")

        model.setParam("OutputFlag", 0)
        model.setParam("Seed", 42)

        edge_list = sorted(remaining_edges)

        x = model.addVars(
            edge_list,
            vtype=GRB.CONTINUOUS,
            lb=0,
            ub=1,
            name="x"
        )

        z = model.addVar(lb=0, name="z")

        for p in papers:

            if paper_need[p] == 0:
                continue

            paper_edges = [
                (pp, r)
                for (pp, r) in edge_list
                if pp == p
            ]

            model.addConstr(
                quicksum(x[e] for e in paper_edges)
                == paper_need[p]
            )

        for r in reviewers:

            if reviewer_cap[r] == 0:
                continue

            reviewer_edges = [
                (p, rr)
                for (p, rr) in edge_list
                if rr == r
            ]

            model.addConstr(
                quicksum(x[e] for e in reviewer_edges)
                <= reviewer_cap[r]
            )

        for p in papers:

            paper_edges = [
                (pp, r)
                for (pp, r) in edge_list
                if pp == p
            ]

            if not paper_edges:
                continue

            model.addConstr(
                quicksum(
                    weight[e] * x[e]
                    for e in paper_edges
                ) >= z
            )

        model.setObjective(z, GRB.MAXIMIZE)

        model.optimize()

        if model.status != GRB.OPTIMAL:
            raise RuntimeError(
                f"LP became infeasible at iteration {iteration}"
            )

        fixed_any = False

        for e in edge_list:

            if x[e].X >= 0.999999:

                p, r = e

                selected.add((p, r))

                paper_need[p] -= 1
                reviewer_cap[r] -= 1

                remaining_edges.remove(e)

                if paper_need[p] == 0:

                    remaining_edges = {
                        edge
                        for edge in remaining_edges
                        if edge[0] != p
                    }

                if reviewer_cap[r] == 0:

                    remaining_edges = {
                        edge
                        for edge in remaining_edges
                        if edge[1] != r
                    }

                fixed_any = True

        if not fixed_any:

            best_edge = max(
                edge_list,
                key=lambda e: (
                    round(x[e].X, 12),
                    round(weight[e], 12),
                    -e[0],
                    -e[1]
                )
            )

            p, r = best_edge

            selected.add((p, r))

            paper_need[p] -= 1
            reviewer_cap[r] -= 1

            remaining_edges.remove(best_edge)

            if paper_need[p] == 0:

                remaining_edges = {
                    edge
                    for edge in remaining_edges
                    if edge[0] != p
                }

            if reviewer_cap[r] == 0:

                remaining_edges = {
                    edge
                    for edge in remaining_edges
                    if edge[1] != r
                }

    assignments = {p: [] for p in papers}

    for p, r in selected:
        assignments[p].append(r)

    print("\n===== VALIDATION =====")

    reviewer_load = {}

    for p in papers:

        if len(assignments[p]) != k:
            raise RuntimeError(
                f"Paper {p} assigned "
                f"{len(assignments[p])} reviewers instead of {k}"
            )

        for r in assignments[p]:
            reviewer_load[r] = reviewer_load.get(r, 0) + 1

    for r, load in reviewer_load.items():

        if load > c:
            raise RuntimeError(
                f"Reviewer {r} load {load} exceeds cap {c}"
            )

    paper_scores = {}

    for p in papers:

        score = sum(
            weight[(p, r)]
            for r in assignments[p]
        )

        paper_scores[p] = score

    min_score = min(paper_scores.values())

    print(f"Minimum fairness score: {min_score:.6f}")
    print(f"Total assignments: {len(selected)}")

    return selected, paper_scores, min_score


def main():

    print("Loading data from DB...")

    papers, reviewers, weight = load_data()

    print(f"Papers: {len(papers)}")
    print(f"Reviewers: {len(reviewers)}")
    print(f"Edges: {len(weight)}")

    if len(papers) * 3 > len(reviewers) * 6:
        print("WARNING: Global capacity may be insufficient.")

    selected_pairs, paper_scores, min_score = iterative_rounding(
        papers,
        reviewers,
        weight
    )

    print("\nSaving assignments to DB...")

    save_allocation(selected_pairs)

    return {
        "min_score": min_score,
        "assignments": selected_pairs,
        "paper_scores": paper_scores
    }


if __name__ == "__main__":
    main()