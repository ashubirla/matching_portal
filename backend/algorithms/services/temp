from collections import defaultdict
from django.db import connection, transaction
from tqdm import tqdm



def load_paper_reviewer_edges():
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT paper_id, reviewer_id, final_similarity
            FROM paper_reviewer_affinity
            WHERE final_similarity IS NOT NULL
        """)
        rows = cursor.fetchall()


    return [(str(row[0]), str(row[1]), float(row[2])) for row in rows]


def load_reviewer_reviewer_edges():
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT reviewer_id_left, reviewer_id_right, edge_weight
            FROM reviewer_to_reviewer
            WHERE edge_weight IS NOT NULL
        """)
        rows = cursor.fetchall()


    return [(str(row[0]), str(row[1]), float(row[2])) for row in rows]


class FordFulkersonGraph:

    def __init__(self):
        self.cap = defaultdict(lambda: defaultdict(float))
        self.adj = defaultdict(set)
        self._pr_edges = []

    def add_edge(self, u, v, capacity):
        self.cap[u][v] += capacity
        self.adj[u].add(v)
        self.adj[v].add(u)

    def _push_path(self, source, paper, reviewer, sink):
        if (self.cap[source][paper] >= 1 and
            self.cap[paper][reviewer] > 1e-9 and
            self.cap[reviewer][sink] >= 1):

            self.cap[source][paper] -= 1
            self.cap[paper][source] += 1

            self.cap[paper][reviewer] -= self.cap[paper][reviewer]
            self.cap[reviewer][paper] += 1

            self.cap[reviewer][sink] -= 1
            self.cap[sink][reviewer] += 1

            return 1
        return 0

    def max_flow_ordered(self, source, sink):
        total = 0.0

        sorted_edges = sorted(
            self._pr_edges,
            key=lambda x: (x[0], x[1], x[2]),
            reverse=True
        )

        for weight, paper, reviewer in sorted_edges:
            total += self._push_path(source, paper, reviewer, sink)

        return total




def _try_assignment(papers, reviewers, pr_weight, closest_neighbour,
                    k, c, threshold):

    SOURCE, SINK = "__source__", "__sink__"

    assignments  = {p: [] for p in papers}
    load_used    = defaultdict(int)
    blocked      = set()
    total_weight = defaultdict(float)

    for _ in range(k):
        g = FordFulkersonGraph()

        eligible = []
        for (p, r), w in pr_weight.items():
            if (p, r) in blocked:
                continue
            if r in assignments[p]:
                continue
            if load_used[r] >= c:
                continue
            eligible.append((p, r, w))

        reviewer_sink_added = set()
        paper_source_added  = set()

        for p, r, w in eligible:
            if p not in paper_source_added:
                g.add_edge(SOURCE, p, 1)
                paper_source_added.add(p)

            if r not in reviewer_sink_added:
                g.add_edge(r, SINK, c - load_used[r])
                reviewer_sink_added.add(r)

            g._pr_edges.append((w, p, r))
            g.add_edge(p, r, w)

        g.max_flow_ordered(SOURCE, SINK)

        new_assignments = {}
        for p, r, w in sorted(eligible, key=lambda x: (x[2], x[0], x[1]), reverse=True):
            used = w - g.cap[p][r]
            if used > 1e-9 and p not in new_assignments and r not in new_assignments.values():
                new_assignments[p] = (r, w)

        for paper, (reviewer, w) in new_assignments.items():
            assignments[paper].append(reviewer)
            load_used[reviewer] += 1
            total_weight[paper] += w

        for paper, (reviewer, _) in new_assignments.items():
            neighbour = closest_neighbour.get(reviewer)
            if neighbour:
                blocked.add((paper, neighbour))

    feasible = all(
        len(assignments[p]) == k and total_weight[p] >= threshold - 1e-9
        for p in papers
    )

    return feasible, assignments, dict(total_weight)


class MaxMinReviewerAssignment:

    def __init__(self, paper_reviewer_edges, reviewer_reviewer_edges,k, c, binary_search_steps=40):

        self.k = k
        self.c = c
        self.steps = binary_search_steps

        self.papers    = sorted({p for p, _, _ in paper_reviewer_edges})
        self.reviewers = sorted({r for _, r, _ in paper_reviewer_edges})

        self.pr_weight = {(p, r): w for p, r, w in paper_reviewer_edges}

        self.rr_sim = defaultdict(float)
        for a, b, w in reviewer_reviewer_edges:
            self.rr_sim[(a, b)] = w
            self.rr_sim[(b, a)] = w

        self.closest_neighbour = {}
        for r in self.reviewers:
            candidates = [
                (self.rr_sim[(r, n)], n)
                for n in self.reviewers
                if n != r and (r, n) in self.rr_sim
            ]
            if candidates:
                self.closest_neighbour[r] = max(candidates)[1]

        all_weights = list(self.pr_weight.values())
        self._lo = 0.0
        self._hi = sum(sorted(all_weights, reverse=True)[:k])


    def run(self):
        lo, hi = self._lo, self._hi
        best_assignments = None
        best_total_weights = None

        print("Running Max-Min Optimization...")

        for _ in tqdm(range(self.steps), desc="Binary Search Progress"):
            mid = (lo + hi) / 2

            feasible, assignments, total_weights = _try_assignment(
                self.papers, self.reviewers, self.pr_weight,
                self.closest_neighbour, self.k, self.c, mid
            )

            if feasible:
                lo = mid
                best_assignments = assignments
                best_total_weights = total_weights
            else:
                hi = mid

        best_min = min(best_total_weights.values()) if best_total_weights else 0.0

        return best_assignments, best_total_weights, best_min




def save_iterative_allocation(assignments):
    rows = []

    for paper, reviewers in assignments.items():
        for reviewer in reviewers:
            rows.append((int(paper), int(reviewer)))

    with transaction.atomic():
        with connection.cursor() as cursor:


            cursor.execute("DELETE FROM final_assignment")

            cursor.executemany("""
                INSERT INTO final_assignment (paper_id, researcher_id,reviewer_status)
                VALUES (%s, %s,'pending')
            """, rows)

            cursor.execute("""
                UPDATE final_assignment
                SET reviewer_status = 'pending'
            """)

            cursor.execute("""
                UPDATE papers
                SET status = 'Under review'
            """)

    print(f" Saved {len(rows)} assignments.")
    return rows



def main():
    print("Loading data from database...")

    pr_edges = load_paper_reviewer_edges()
    rr_edges = load_reviewer_reviewer_edges()

    print(f" Loaded {len(pr_edges)} paper-reviewer edges")
    print(f" Loaded {len(rr_edges)} reviewer-reviewer edges")

    solver = MaxMinReviewerAssignment(
        pr_edges,
        rr_edges,
        k=3,
        c=6
    )

    assignments, total_weights, best_min = solver.run()

    print(f"\nMax-Min Score = {best_min:.4f}")

    save_iterative_allocation(assignments)

    return {
        "assignments": assignments,
        "total_weights": total_weights,
        "score": best_min,
    }


if __name__ == "__main__":
    main()