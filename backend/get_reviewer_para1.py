import time
import requests

# =========================================================
# CONFIG
# =========================================================

HF_TOKEN = "token here"

AUTHOR_ID = "A5100376569"

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

    print("\nOPENALEX STATUS:")
    print(response.status_code)

    if response.status_code != 200:
        print("Failed fetching papers")
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

        # -------------------------------------------------
        # ABSTRACT
        # -------------------------------------------------

        abstract = reconstruct_abstract(
            paper.get("abstract_inverted_index")
        )

        # -------------------------------------------------
        # PRIMARY TOPIC
        # -------------------------------------------------

        primary_topic = paper.get("primary_topic") or {}

        topic = primary_topic.get(
            "display_name", ""
        )

        subfield = (
            primary_topic.get("subfield") or {}
        ).get("display_name", "")

        field = (
            primary_topic.get("field") or {}
        ).get("display_name", "")

        domain = (
            primary_topic.get("domain") or {}
        ).get("display_name", "")

        # -------------------------------------------------
        # CONCEPTS
        # -------------------------------------------------

        concepts = []

        for concept in paper.get("concepts", [])[:15]:

            concept_name = concept.get("display_name")

            if concept_name:
                concepts.append(concept_name)

        concept_text = ", ".join(concepts)

        # -------------------------------------------------
        # BUILD PAPER TEXT
        # -------------------------------------------------

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

Focus heavily on:
1. Exact subtopics
2. Technical methodologies
3. Algorithms used
4. Architectures/frameworks
5. Optimization techniques
6. Research problems solved
7. Application domains
8. Systems developed
9. Data analysis techniques
10. Computational methods

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

    print("\nMODEL STATUS:")
    print(response.status_code)

    if response.status_code != 200:
        print("\nERROR RESPONSE:")
        print(response.text)
        return ""

    result = response.json()

    return result["choices"][0]["message"]["content"]


# =========================================================
# MAIN
# =========================================================

def main():

    print(f"\nProcessing Author ID: {AUTHOR_ID}")

    try:
        papers = fetch_author_papers(AUTHOR_ID)

        print(f"\nTOTAL PAPERS FETCHED: {len(papers)}")

        if not papers:
            print("No papers found")
            return

        research_text = build_research_text(papers)

        summary = generate_summary(research_text)

        print("\n========================")
        print("FINAL AUTHOR SUMMARY")
        print("========================\n")

        print(summary)

    except Exception as e:
        print(f"\nERROR: {e}")


if __name__ == "__main__":
    main()