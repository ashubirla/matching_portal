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
        if s is not None:
            papers.add(p)
            reviewers.add(r)
            weight[(p, r)] = float(s)

    return list(papers), list(reviewers), weight


def save_allocation(assignments):
    assignments = list(assignments)

    with transaction.atomic():
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM final_assignment")

            cursor.executemany("""
                INSERT INTO final_assignment (paper_id, researcher_id, reviewer_status)
                VALUES (%s, %s, 'pending')
            """, assignments)

            cursor.execute("""
                UPDATE papers
                SET status = 'Under review'
            """)

    print(f"Saved {len(assignments)} assignments.")
    return assignments


def iterative_rounding(papers, reviewers, weight, k=3, c=6):

    remaining_edges = set(weight.keys())

    paper_need = {p: k for p in papers}
    reviewer_cap = {r: c for r in reviewers}

    selected = set()

    print("Starting Iterative Rounding...")

    while True:

        model = Model("IterativeRounding")
        model.setParam("OutputFlag", 0)

        x = model.addVars(list(remaining_edges),
                          vtype=GRB.CONTINUOUS,
                          lb=0, ub=1,
                          name="x")

        z = model.addVar(lb=0, name="z")

        for p in papers:
            model.addConstr(
                quicksum(x[p, r] for (pp, r) in remaining_edges if pp == p)
                == paper_need[p]
            )

        for r in reviewers:
            model.addConstr(
                quicksum(x[p, r] for (p, rr) in remaining_edges if rr == r)
                <= reviewer_cap[r]
            )

        for p in papers:
            model.addConstr(
                quicksum(weight[(p, r)] * x[p, r]
                         for (pp, r) in remaining_edges if pp == p)
                >= z
            )

        model.setObjective(z, GRB.MAXIMIZE)
        model.optimize()

        if model.status != GRB.OPTIMAL:
            print("LP infeasible")
            break

        fixed_any = False

        for (p, r) in list(remaining_edges):

            val = x[p, r].X

            if val >= 0.999:
                selected.add((int(p), int(r)))

                paper_need[p] -= 1
                reviewer_cap[r] -= 1

                remaining_edges = {
                    (pp, rr)
                    for (pp, rr) in remaining_edges
                    if not (pp == p and rr == r)
                }

                fixed_any = True

        if not fixed_any:

            best_edge = max(
                remaining_edges,
                key=lambda e: x[e].X * weight[e]
            )

            p, r = best_edge

            selected.add((int(p), int(r)))
            paper_need[p] -= 1
            reviewer_cap[r] -= 1

            remaining_edges.remove(best_edge)

        if all(v == 0 for v in paper_need.values()):
            break

    assignments = {p: [] for p in papers}

    for p, r in selected:
        assignments[p].append(r)

    paper_scores = {}
    for p in papers:
        total = sum(weight.get((p, r), 0.0) for r in assignments[p])
        paper_scores[p] = total

    min_score = min(paper_scores.values()) if paper_scores else 0.0

    print("\n===== FINAL RESULTS =====")
    print(f"Minimum total edge weight (fairness score): {min_score:.4f}")

    return selected, paper_scores, min_score


def main():

    print("Loading data from DB...")
    papers, reviewers, weight = load_data()

    print(f"Papers: {len(papers)}")
    print(f"Reviewers: {len(reviewers)}")
    print(f"Edges: {len(weight)}")

    if len(papers) * 3 > len(reviewers) * 6:
        print("WARNING: Problem may be infeasible!")

    selected_pairs, paper_scores, min_score = iterative_rounding(
        papers, reviewers, weight
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