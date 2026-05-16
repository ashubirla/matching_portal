import json
import time
import requests

# =========================================================
# CONFIG
# =========================================================

HF_TOKEN = "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"

INPUT_FILE = "reviewers.json"
OUTPUT_FILE = "reviewers_with_work.json"

MODEL_URL = "https://router.huggingface.co/v1/chat/completions"

HEADERS = {
    "Authorization": f"Bearer {HF_TOKEN}",
    "Content-Type": "application/json",
}


# =========================================================
# RECONSTRUCT ABSTRACT
# =========================================================

def reconstruct_abstract(inverted_index):

    if not inverted_index:
        return ""

    words = []

    for word, positions in inverted_index.items():
        for pos in positions:
            words.append((pos, word))

    words.sort()

    return " ".join(word for pos, word in words)


# =========================================================
# FETCH PAPERS
# =========================================================

def fetch_author_papers(author_id):

    url = "https://api.openalex.org/works"

    params = {
        "filter": f"authorships.author.id:{author_id}",
        "per-page": 30,
        "sort": "cited_by_count:desc"
    }

    response = requests.get(url, params=params)

    if response.status_code != 200:
        print(f"Failed fetching papers for {author_id}")
        return []

    data = response.json()

    return data.get("results", [])


# =========================================================
# BUILD RESEARCH TEXT
# =========================================================

def build_research_text(papers):

    full_text = ""

    for i, paper in enumerate(papers):

        title = paper.get("display_name", "")

        abstract = reconstruct_abstract(
            paper.get("abstract_inverted_index")
        )

        primary_topic = paper.get("primary_topic", {})

        topic = primary_topic.get(
            "display_name", ""
        )

        subfield = primary_topic.get(
            "subfield", {}
        ).get("display_name", "")

        field = primary_topic.get(
            "field", {}
        ).get("display_name", "")

        domain = primary_topic.get(
            "domain", {}
        ).get("display_name", "")

        concepts = []

        for concept in paper.get("concepts", [])[:15]:

            concept_name = concept.get("display_name")

            if concept_name:
                concepts.append(concept_name)

        concept_text = ", ".join(concepts)

        full_text += f"""
==================================================

PAPER {i+1}

TITLE:
{title}

DOMAIN:
{domain}

FIELD:
{field}

SUBFIELD:
{subfield}

PRIMARY TOPIC:
{topic}

CONCEPTS:
{concept_text}

ABSTRACT:
{abstract}

==================================================
"""

    return full_text


# =========================================================
# GENERATE SUMMARY
# =========================================================

def generate_summary(research_text):

    research_text = research_text[:35000]

    prompt = f"""
You are analyzing a researcher's publication history.

Infer the EXACT technical research areas
the researcher has worked on.

IMPORTANT:
DO NOT give broad fields like:
- databases
- machine learning
- AI
- networking

Instead identify SPECIFIC areas such as:
- query optimization
- graph neural networks
- federated learning
- distributed systems optimization
- transaction processing
- cloud scheduling
- recommendation systems
- retrieval augmented generation

Write ONE detailed academic paragraph.

Do NOT use bullet points.
Do NOT mention paper titles.
Be highly technical and specific.

Research Papers:
{research_text}
"""

    payload = {
        "model": "Qwen/Qwen2.5-7B-Instruct",
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
        "max_tokens": 500,
        "temperature": 0.2
    }

    response = requests.post(
        MODEL_URL,
        headers=HEADERS,
        json=payload,
        timeout=300
    )

    if response.status_code != 200:
        print("HF API Error:")
        print(response.text)
        return ""

    result = response.json()

    return result["choices"][0]["message"]["content"]


# =========================================================
# MAIN
# =========================================================

def main():

    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        reviewers = json.load(f)

    output = []

    total = len(reviewers)

    for idx, reviewer in enumerate(reviewers, start=1):

        name = reviewer.get("name")
        author_id = reviewer.get("openalex_author_id")

        print(f"\n[{idx}/{total}] Processing: {name}")

        if not author_id:
            print("No OpenAlex author ID")

            reviewer["work"] = ""

            output.append(reviewer)

            continue

        try:
            papers = fetch_author_papers(author_id)

            print(f"Fetched {len(papers)} papers")

            if not papers:
                reviewer["work"] = ""
                output.append(reviewer)
                continue

            research_text = build_research_text(papers)

            summary = generate_summary(research_text)

            reviewer["work"] = summary

            output.append(reviewer)

            time.sleep(1)

        except Exception as e:

            print(f"Error: {e}")

            reviewer["work"] = ""

            output.append(reviewer)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(
            output,
            f,
            indent=4,
            ensure_ascii=False
        )

    print(f"\nSaved output to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()