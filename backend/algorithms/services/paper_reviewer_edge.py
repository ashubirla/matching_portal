import os
import sys
import django
import re
import numpy as np
import faiss
 
from tqdm import tqdm
from django.db import connection
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from rapidfuzz import fuzz
 
 
# --------------------------------------------------
# Django setup
# --------------------------------------------------
 
sys.path.append(
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
)
 
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "matching_portal.settings")
django.setup()
 
from papers.models import Paper
from accounts.models import Researcher
 
 
# --------------------------------------------------
# Model
# --------------------------------------------------
 
model = SentenceTransformer("all-MiniLM-L6-v2")
 
 
# --------------------------------------------------
# NORMALIZATION
# --------------------------------------------------
 
def normalize(text):
    text = str(text).lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()
 
 
# --------------------------------------------------
# INSTITUTION REGISTRY
# --------------------------------------------------
 
def build_institution_registry(papers, reviewers):
 
    institutions = set()
 
    for p in papers:
        institutions.update(p.paper_affiliations or [])
 
    for r in reviewers:
        institutions.update(r.institutions or [])
 
    institutions = list(institutions)
 
    embeddings = model.encode(
        [normalize(x) for x in institutions],
        normalize_embeddings=True
    ).astype("float32")
 
    index = faiss.IndexFlatIP(embeddings.shape[1])
    index.add(embeddings)
 
    return institutions, index
 
 
# --------------------------------------------------
# CACHE (CRITICAL FIX)
# --------------------------------------------------
 
inst_cache = {}
 
def resolve_institution(inst, institutions, index):
 
    if not inst:
        return None, 0.0
 
    if inst in inst_cache:
        return inst_cache[inst]
 
    inst_norm = normalize(inst)
 
    emb = model.encode(
        [inst_norm],
        normalize_embeddings=True
    ).astype("float32")
 
    scores, idx = index.search(emb, 1)
 
    best_score = float(scores[0][0])
    best_entity = institutions[int(idx[0][0])]
 
    result = (best_entity, best_score)
    inst_cache[inst] = result
 
    return result
 
 
# --------------------------------------------------
# SIMILARITY (UNCHANGED LOGIC)
# --------------------------------------------------
 
def compute_institution_similarity(
    paper_affils,
    reviewer_affils,
    institutions,
    index
):

    if not paper_affils or not reviewer_affils:
        return 0.0

    best_score = 0.0

    for p in paper_affils:
        for r in reviewer_affils:

            p_entity, p_score = resolve_institution(
                p,
                institutions,
                index
            )

            r_entity, r_score = resolve_institution(
                r,
                institutions,
                index
            )

            if p_entity is None or r_entity is None:
                continue

            # STRICT MATCH
            if (
                p_entity == r_entity
                and p_score > 0.85
                and r_score > 0.85
            ):
                return 1.0

            # SOFT MATCH
            soft_score = fuzz.token_set_ratio(
                normalize(p),
                normalize(r)
            ) / 100.0

            best_score = max(best_score, soft_score)

    return normalize_institution_score(best_score)
 
 

 
def cos_sim(a, b):
    return float((cosine_similarity([a], [b])[0][0] + 1) / 2)
 

def normalize_institution_score(score):
    if score < 0.95:
        return 0.0

    return min(1.0, (score - 0.95) / 0.05)
# --------------------------------------------------
# BATCH INSERT
# --------------------------------------------------
 
def batch_insert(rows):
    with connection.cursor() as cursor:
        cursor.executemany("""
            INSERT INTO paper_reviewer_affinity
            (paper_id, reviewer_id, abstract_work_similarity,
             institution_similarity, final_similarity)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (paper_id, reviewer_id)
            DO UPDATE SET
                abstract_work_similarity = EXCLUDED.abstract_work_similarity,
                institution_similarity = EXCLUDED.institution_similarity,
                final_similarity = EXCLUDED.final_similarity;
        """, rows)
 
 
# --------------------------------------------------
# MAIN
# --------------------------------------------------
 
def main():
 
    papers = list(Paper.objects.exclude(abstract__isnull=True).exclude(abstract=""))
    reviewers = list(Researcher.objects.filter(is_reviewer=True).exclude(work__isnull=True).exclude(work=""))
 
    institutions, index = build_institution_registry(papers, reviewers)
 
    print("Encoding embeddings...")
 
    paper_emb = {p.id: model.encode(p.abstract) for p in tqdm(papers)}
    reviewer_emb = {r.id: model.encode(r.work) for r in tqdm(reviewers)}
 
    batch = []
    BATCH_SIZE = 2000
 
    print("Computing affinities...")
 
    for p in tqdm(papers):
 
        p_vec = paper_emb[p.id]
 
        for r in reviewers:
 
            r_vec = reviewer_emb[r.id]
 
            a_sim = cos_sim(p_vec, r_vec)
 
            i_sim = compute_institution_similarity(
                p.paper_affiliations or [],
                r.institutions or [],
                institutions,
                index
            )
 
            final = a_sim * (1 - i_sim)
 
            batch.append((p.id, r.id, a_sim, i_sim, final))
 
            if len(batch) >= BATCH_SIZE:
                batch_insert(batch)
                batch.clear()
 
    if batch:
        batch_insert(batch)
 
    print("Done!")
 
 
if __name__ == "__main__":
    main()