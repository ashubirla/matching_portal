import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'matching_portal.settings')
django.setup()

from collections import deque, defaultdict
from django.db import connection, transaction

def load_paper_reviewer_edges():
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT paper_id, researcher_id, similarity_score
            FROM paper_to_reviewer
            WHERE similarity_score IS NOT NULL
        """)
        rows = cursor.fetchall()
    return [(int(row[0]), int(row[1]), float(row[2])) for row in rows]

def build_data_structures(pr_edges):
    papers = sorted({p for p, _, _ in pr_edges})
    reviewers = sorted({r for _, r, _ in pr_edges})
    paper_to_reviewers = defaultdict(list)
    for p, r, w in pr_edges:
        paper_to_reviewers[p].append((r, w))
    return papers, reviewers, paper_to_reviewers

class MaxFlow:
    def __init__(self):
        self.graph = defaultdict(dict)
        self.original = defaultdict(dict)

    def add_edge(self, u, v, cap):
        if v not in self.graph[u]:
            self.graph[u][v] = 0
        if u not in self.graph[v]:
            self.graph[v][u] = 0
        self.graph[u][v] += cap
        self.original[u][v] = self.graph[u][v]

    def bfs(self, s, t, parent):
        visited = set([s])
        queue = deque([s])
        while queue:
            u = queue.popleft()
            for v in self.graph[u]:
                if v not in visited and self.graph[u][v] > 0:
                    visited.add(v)
                    parent[v] = u
                    queue.append(v)
                    if v == t:
                        return True
        return False

    def max_flow(self, s, t):
        flow = 0
        while True:
            parent = {}
            if not self.bfs(s, t, parent):
                break
            path_flow = float('inf')
            v = t
            while v != s:
                u = parent[v]
                path_flow = min(path_flow, self.graph[u][v])
                v = u
            v = t
            while v != s:
                u = parent[v]
                self.graph[u][v] -= path_flow
                self.graph[v][u] += path_flow
                v = u
            flow += path_flow
        return flow

def solve_with_threshold(papers, reviewers, paper_to_reviewers, k, c, threshold):
    mf = MaxFlow()
    SOURCE, SINK = "S", "T"
    for p in papers:
        mf.add_edge(SOURCE, p, k)
        for r, w in paper_to_reviewers[p]:
            if w >= threshold:
                mf.add_edge(p, r, 1)
    for r in reviewers:
        mf.add_edge(r, SINK, c)
    flow = mf.max_flow(SOURCE, SINK)
    if flow != len(papers) * k:
        return False, None
    assignment = defaultdict(list)
    for p in papers:
        for r, _ in paper_to_reviewers[p]:
            if r in mf.original[p] and mf.graph[p][r] == 0:
                assignment[p].append(r)
    return True, assignment

def solve(papers, reviewers, paper_to_reviewers, k, c):
    lo, hi = 0.0, 1.0
    best_score, best_assignment = 0.0, None
    for _ in range(30):
        mid = (lo + hi) / 2
        feasible, assignment = solve_with_threshold(papers, reviewers, paper_to_reviewers, k, c, mid)
        if feasible:
            best_score, best_assignment, lo = mid, assignment, mid
        else:
            hi = mid
    return best_score, best_assignment

def save_iterative_allocation(assignments):
    rows = []
    for paper, reviewers in assignments.items():
        for reviewer in reviewers:
            rows.append((paper, reviewer))
    with transaction.atomic():
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM final_assignment")
            cursor.executemany("""
                INSERT INTO final_assignment (paper_id, researcher_id, reviewer_status)
                VALUES (%s, %s, 'pending')
            """, rows)
            cursor.execute("UPDATE papers SET status = 'Under review'")
    print(f"Saved {len(rows)} assignments.")
    return rows

def main():
    pr_edges = load_paper_reviewer_edges()
    weight_lookup = {(p, r): w for p, r, w in pr_edges}
    papers, reviewers, paper_to_reviewers = build_data_structures(pr_edges)
    k, c = 3, 6
    score, assignment = solve(papers, reviewers, paper_to_reviewers, k, c)
    if assignment:
        paper_sums = [sum(weight_lookup[(p, r)] for r in reviewers) for p, reviewers in assignment.items()]
        min_sum = min(paper_sums)
        print(f"Max-Min Fair Score: {round(score, 4)}")
        print(f"Minimum Sum assigned to a paper: {round(min_sum, 4)}")
        save_iterative_allocation(assignment)
    else:
        print("No feasible assignment found.")

if __name__ == "__main__":
    main()