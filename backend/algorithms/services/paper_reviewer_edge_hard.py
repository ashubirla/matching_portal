import os
import sys
import django
import re
import faiss
from rapidfuzz import fuzz

from tqdm import tqdm
from django.db import connection
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

sys.path.append(
    os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            "../../"
        )
    )
)

os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "matching_portal.settings"
)

django.setup()

from papers.models import Paper
from accounts.models import Researcher


# --------------------------------------------------
# Load embedding model
# --------------------------------------------------

print("Loading embedding model...")

model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)
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

def build_institution_registry(
    papers,
    reviewers
):

    institutions = set()

    for p in papers:
        institutions.update(
            p.paper_affiliations or []
        )

    for r in reviewers:
        institutions.update(
            r.institutions or []
        )

    institutions = list(institutions)

    embeddings = model.encode(
        [normalize(x) for x in institutions],
        normalize_embeddings=True
    ).astype("float32")

    index = faiss.IndexFlatIP(
        embeddings.shape[1]
    )

    index.add(embeddings)

    return institutions, index


inst_cache = {}

def resolve_institution(
    inst,
    institutions,
    index
):

    if not inst:
        return None, 0.0

    if inst in inst_cache:
        return inst_cache[inst]

    emb = model.encode(
        [normalize(inst)],
        normalize_embeddings=True
    ).astype("float32")

    scores, idx = index.search(
        emb,
        1
    )

    best_score = float(
        scores[0][0]
    )

    best_entity = institutions[
        int(idx[0][0])
    ]

    result = (
        best_entity,
        best_score
    )

    inst_cache[inst] = result

    return result
print("Model loaded")


# --------------------------------------------------
# Table setup
# --------------------------------------------------

def create_and_prepare_affinity_table():

    with connection.cursor() as cursor:

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS paper_reviewer_affinity (
                id SERIAL PRIMARY KEY,

                paper_id INTEGER NOT NULL,
                reviewer_id INTEGER NOT NULL,

                abstract_work_similarity DOUBLE PRECISION NOT NULL,
                institution_similarity DOUBLE PRECISION NOT NULL,
                final_similarity DOUBLE PRECISION NOT NULL,

                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT unique_paper_reviewer
                UNIQUE (paper_id, reviewer_id),

                CONSTRAINT fk_paper
                FOREIGN KEY (paper_id)
                REFERENCES papers(id)
                ON DELETE CASCADE,

                CONSTRAINT fk_reviewer
                FOREIGN KEY (reviewer_id)
                REFERENCES researchers(id)
                ON DELETE CASCADE
            );
        """)

        cursor.execute("""
            TRUNCATE TABLE paper_reviewer_affinity
            RESTART IDENTITY;
        """)

    print(
        "paper_reviewer_affinity table ready and truncated"
    )


# --------------------------------------------------
# Embeddings
# --------------------------------------------------

def generate_embedding(text):

    if not text:
        return None

    text = str(text).strip()

    if not text:
        return None

    return model.encode(text)


def compute_cosine_similarity(
    vec1,
    vec2
):

    if vec1 is None or vec2 is None:
        return 0.0

    raw_score = cosine_similarity(
        [vec1],
        [vec2]
    )[0][0]

    normalized_score = (
        raw_score + 1
    ) / 2

    return float(
        normalized_score
    )


# --------------------------------------------------
# Hard institution conflict
# --------------------------------------------------

def has_institution_conflict(
    paper_affiliations,
    reviewer_institutions,
    institutions,
    index
):

    if (
        not paper_affiliations
        or
        not reviewer_institutions
    ):
        return False

    for p in paper_affiliations:

        for r in reviewer_institutions:

            p_entity, p_score = (
                resolve_institution(
                    p,
                    institutions,
                    index
                )
            )

            r_entity, r_score = (
                resolve_institution(
                    r,
                    institutions,
                    index
                )
            )

            if (
                p_entity == r_entity
                and p_score > 0.85
                and r_score > 0.85
            ):
                return True

            fuzzy_score = (
                fuzz.token_set_ratio(
                    normalize(p),
                    normalize(r)
                ) / 100.0
            )

            if fuzzy_score > 0.95:
                return True

    return False


# --------------------------------------------------
# Insert affinity
# --------------------------------------------------

def insert_affinity(
    paper_id,
    reviewer_id,
    abstract_work_similarity,
    institution_similarity,
    final_similarity
):

    with connection.cursor() as cursor:

        cursor.execute("""
            INSERT INTO paper_reviewer_affinity
            (
                paper_id,
                reviewer_id,
                abstract_work_similarity,
                institution_similarity,
                final_similarity
            )

            VALUES
            (
                %s,
                %s,
                %s,
                %s,
                %s
            );
        """, [
            paper_id,
            reviewer_id,
            abstract_work_similarity,
            institution_similarity,
            final_similarity
        ])


# --------------------------------------------------
# Main
# --------------------------------------------------

def main():

    create_and_prepare_affinity_table()

    papers = (
        Paper.objects
        .exclude(abstract__isnull=True)
        .exclude(abstract="")
    )

    reviewers = (
        Researcher.objects
        .filter(is_reviewer=True)
        .exclude(work__isnull=True)
        .exclude(work="")
    )

    print(
        f"\nTotal Papers: {papers.count()}"
    )

    print(
        f"Total Reviewers: {reviewers.count()}"
    )
    print(
        "\nBuilding institution registry..."
    )
    
    institutions, index = (
        build_institution_registry(
           papers,
           reviewers
        )
    )

    reviewer_embeddings = {}

    print(
        "\nGenerating reviewer embeddings..."
    )

    for reviewer in tqdm(
        reviewers,
        desc="Reviewers"
    ):

        reviewer_embeddings[
            reviewer.id
        ] = generate_embedding(
            reviewer.work
        )

    pair_count = 0
    excluded_pairs = 0

    print(
        "\nComputing affinities..."
    )

    for paper in tqdm(
        papers,
        desc="Papers"
    ):

        paper_embedding = generate_embedding(
            paper.abstract
        )

        paper_affiliations = (
            paper.paper_affiliations
            or []
        )

        for reviewer in reviewers:

            reviewer_embedding = (
                reviewer_embeddings.get(
                    reviewer.id
                )
            )

            reviewer_institutions = (
                reviewer.institutions
                or []
            )

            # ----------------------------------
            # HARD CONFLICT CHECK
            # ----------------------------------

            if has_institution_conflict(
             paper_affiliations,
             reviewer_institutions,
             institutions,
              index
            ):

                excluded_pairs += 1
                continue

            # ----------------------------------
            # Semantic similarity
            # ----------------------------------

            abstract_work_similarity = (
                compute_cosine_similarity(
                    paper_embedding,
                    reviewer_embedding
                )
            )

            final_similarity = (
                abstract_work_similarity
            )

            insert_affinity(
                paper.id,
                reviewer.id,
                abstract_work_similarity,
                0.0,
                final_similarity
            )

            pair_count += 1

    print(
        "\nAffinity computation complete"
    )

    print(
        f"Total inserted pairs: {pair_count}"
    )

    print(
        f"Excluded pairs due to institution conflicts: {excluded_pairs}"
    )


if __name__ == "__main__":
    main()