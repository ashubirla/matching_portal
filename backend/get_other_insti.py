import json
import time
import requests

BASE_URL = "https://api.openalex.org"
INPUT_FILE = "final_assigned_research_interests.json"
OUTPUT_FILE = "researchers_with_institutions.json"

HEADERS = {
    "User-Agent": "Institution-Fetcher/1.0"
}


def normalize(text):
    return text.strip().lower()


def find_author(name, current_affiliation):
    url = f"{BASE_URL}/authors"

    params = {
        "search": name,
        "per-page": 25
    }

    response = requests.get(url, params=params, headers=HEADERS)

    if response.status_code != 200:
        print(f"Failed author search for {name}")
        return None

    results = response.json().get("results", [])

    if not results:
        return None

    current_affiliation_norm = normalize(current_affiliation)

    best_match = None
    best_score = -1

    for author in results:
        score = 0

        display_name = author.get("display_name", "")

        if normalize(display_name) == normalize(name):
            score += 5

        elif normalize(name) in normalize(display_name):
            score += 3

        institutions = author.get("last_known_institutions") or []

        for inst in institutions:
            inst_name = inst.get("display_name", "")

            if current_affiliation_norm in normalize(inst_name):
                score += 10

        works_count = author.get("works_count", 0)
        cited_by_count = author.get("cited_by_count", 0)

        score += min(works_count / 100, 5)
        score += min(cited_by_count / 1000, 5)

        if score > best_score:
            best_score = score
            best_match = author

    return best_match


def fetch_all_institutions(author_id):
    institutions = {}
    cursor = "*"

    while True:
        url = f"{BASE_URL}/works"

        params = {
            "filter": f"author.id:{author_id}",
            "per-page": 200,
            "cursor": cursor
        }

        response = requests.get(url, params=params, headers=HEADERS)

        if response.status_code != 200:
            print(f"Failed works fetch for {author_id}")
            break

        data = response.json()

        for work in data.get("results", []):
            publication_year = work.get("publication_year")

            for authorship in work.get("authorships", []):
                author = authorship.get("author", {})

                author_openalex_id = author.get("id")

                if not author_openalex_id:
                    continue

                if author_id not in author_openalex_id:
                    continue

                for inst in authorship.get("institutions", []):
                    inst_id = inst.get("id")
                    inst_name = inst.get("display_name")

                    if not inst_name:
                        continue

                    if inst_id not in institutions:
                        institutions[inst_id] = {
                            "name": inst_name,
                            "years": set(),
                            "paper_count": 0
                        }

                    institutions[inst_id]["paper_count"] += 1

                    if publication_year:
                        institutions[inst_id]["years"].add(publication_year)

        cursor = data.get("meta", {}).get("next_cursor")

        if not cursor:
            break

        time.sleep(0.1)

    formatted = []

    for inst_id, info in institutions.items():
        formatted.append({
            "institution_id": inst_id,
            "institution_name": info["name"],
            "paper_count": info["paper_count"],
            "years": sorted(list(info["years"]))
        })

    formatted.sort(
        key=lambda x: x["paper_count"],
        reverse=True
    )

    return formatted


def main():
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        researchers = json.load(f)

    output = []

    total = len(researchers)

    for idx, researcher in enumerate(researchers, start=1):
        name = researcher.get("name", "").strip()
        affiliation = researcher.get("affiliation", "").strip()

        print(f"\n[{idx}/{total}] Processing: {name}")

        try:
            author = find_author(name, affiliation)

            if not author:
                print("Author not found")

                output.append({
                    "name": name,
                    "current_affiliation": affiliation,
                    "openalex_author_id": None,
                    "all_institutions": []
                })

                continue

            author_id = author["id"].split("/")[-1]

            print(f"Matched Author ID: {author_id}")

            institutions = fetch_all_institutions(author_id)

            output.append({
                "name": name,
                "current_affiliation": affiliation,
                "openalex_author_id": author_id,
                "all_institutions": institutions
            })

            time.sleep(0.2)

        except Exception as e:
            print(f"Error processing {name}: {e}")

            output.append({
                "name": name,
                "current_affiliation": affiliation,
                "openalex_author_id": None,
                "all_institutions": [],
                "error": str(e)
            })

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=4)

    print(f"\nSaved results to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()