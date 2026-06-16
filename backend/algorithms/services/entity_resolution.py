
import pandas as pd
import numpy as np
import faiss
import re

from rapidfuzz import fuzz
from sentence_transformers import SentenceTransformer

sample_data = [
    {
        "id": "I136199984",
        "display_name": "Indian Institute of Technology Bombay"
    },
    {
        "id": "I84522148",
        "display_name": "Indian Institute of Technology Delhi"
    },
    {
        "id": "I201448701",
        "display_name": "Massachusetts Institute of Technology"
    },
    {
        "id": "I157725928",
        "display_name": "Carnegie Mellon University"
    },
    {
        "id": "I27837315",
        "display_name": "Stanford University"
    },
    {
        "id": "I41060848",
        "display_name": "Harvard University"
    },
    {
        "id": "I129142515",
        "display_name": "University of Oxford"
    },
    {
        "id": "I98306876",
        "display_name": "University of Cambridge"
    },
    {
        "id": "I71267560",
        "display_name": "University of California, Berkeley"
    }
]

df = pd.DataFrame(sample_data)

df.to_csv(
    "openalex_institutions.csv",
    index=False
)

print("\nSample institution CSV created")

def normalize(text):

    text = str(text).lower()

    text = re.sub(r"[^a-z0-9\s]", " ", text)

    text = re.sub(r"\s+", " ", text)

    return text.strip()


def generate_acronym(name):

    stopwords = {
        "of",
        "the",
        "and",
        "for",
        "at",
        "in"
    }

    tokens = name.split()

    acronym = ""

    for token in tokens:

        if token.lower() not in stopwords:

            acronym += token[0].upper()

    return acronym


def generate_short_forms(name):

    aliases = set()

    aliases.add(name)

    if "Indian Institute of Technology" in name:

        short = name.replace(
            "Indian Institute of Technology",
            "IIT"
        )

        aliases.add(short)

    if name == "Massachusetts Institute of Technology":

        aliases.add("MIT")

    if name == "Carnegie Mellon University":

        aliases.add("CMU")

    if name == "Stanford University":

        aliases.add("Stanford Univ")

    if "University" in name:

        aliases.add(
            name.replace(
                "University",
                "Univ"
            )
        )

    return aliases

print("\nGenerating aliases...")

all_aliases = []

for _, row in df.iterrows():

    name = row["display_name"]

    aliases = set()

    aliases.add(name)

    aliases.add(
        generate_acronym(name)
    )

    short_forms = generate_short_forms(name)

    aliases.update(short_forms)

    aliases = {
        normalize(a)
        for a in aliases
        if a.strip()
    }

    alias_string = ";".join(sorted(aliases))

    all_aliases.append(alias_string)

df["aliases"] = all_aliases

df.to_csv(
    "openalex_institutions_with_aliases.csv",
    index=False
)

print("\nAlias CSV created")

print(df[[
    "display_name",
    "aliases"
]])


alias_to_row = {}

for idx, row in df.iterrows():

    aliases = str(row["aliases"]).split(";")

    for alias in aliases:

        alias = normalize(alias)

        alias_to_row[alias] = idx


print("\nLoading embedding model...")

model = SentenceTransformer(
    "BAAI/bge-small-en-v1.5"
)

print("Model loaded")


print("\nCreating embeddings...")

embedding_texts = []

embedding_to_row = []

for idx, row in df.iterrows():

    aliases = str(row["aliases"]).split(";")

    for alias in aliases:

        alias = normalize(alias)

        embedding_texts.append(alias)

        embedding_to_row.append(idx)

embeddings = model.encode(
    embedding_texts,
    batch_size=32,
    show_progress_bar=True,
    normalize_embeddings=True
)

embeddings = np.array(
    embeddings
).astype("float32")

print("Embeddings ready")


print("\nBuilding FAISS index...")

dimension = embeddings.shape[1]

index = faiss.IndexFlatIP(dimension)

index.add(embeddings)

print("FAISS index built")


def resolve_institution(
    query,
    top_k=5,
    threshold=0.75
):

    normalized_query = normalize(query)

    if normalized_query in alias_to_row:

        row_idx = alias_to_row[normalized_query]

        row = df.iloc[row_idx]

        return {
            "query": query,
            "matched_name":
                row["display_name"],
            "openalex_id":
                row["id"],
            "method":
                "alias_match",
            "score":
                1.0
        }

    query_embedding = model.encode(
        [normalized_query],
        normalize_embeddings=True
    )

    query_embedding = np.array(
        query_embedding
    ).astype("float32")

    scores, indices = index.search(
        query_embedding,
        top_k
    )

    candidates = []

    for semantic_score, emb_idx in zip(
        scores[0],
        indices[0]
    ):

        row_idx = embedding_to_row[emb_idx]

        row = df.iloc[row_idx]

        candidate_name = row["display_name"]

        candidate_id = row["id"]

        fuzzy_score = fuzz.token_set_ratio(
            normalized_query,
            normalize(candidate_name)
        ) / 100.0

        final_score = (
            0.7 * float(semantic_score)
            +
            0.3 * fuzzy_score
        )

        candidates.append({

            "candidate":
                candidate_name,

            "openalex_id":
                candidate_id,

            "semantic_score":
                round(float(semantic_score), 4),

            "fuzzy_score":
                round(fuzzy_score, 4),

            "final_score":
                round(final_score, 4)
        })

    candidates = sorted(
        candidates,
        key=lambda x: x["final_score"],
        reverse=True
    )

    best = candidates[0]

    if best["final_score"] < threshold:

        return {
            "query": query,
            "status": "manual_review_needed",
            "best_candidate": best
        }

    return {
        "query": query,
        "matched_name":
            best["candidate"],
        "openalex_id":
            best["openalex_id"],
        "method":
            "embedding+fuzzy",
        "score":
            best["final_score"]
    }

test_queries = [

    "IITB",
    "IIT Bombay",
    "MIT",
    "CMU",
    "Stanford Univ",
    "Harvard",
    "Oxford University",
    "UC Berkeley"
]

print("\n")
print("=" * 80)
print("ENTITY RESOLUTION RESULTS")
print("=" * 80)

for query in test_queries:

    result = resolve_institution(query)

    print("\n" + "-" * 80)

    print(f"QUERY: {query}")

    for k, v in result.items():

        print(f"{k}: {v}")