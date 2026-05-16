import json

INPUT_FILE = "1.json"
OUTPUT_FILE = "2.json"


def clean_text(text):
    if not isinstance(text, str):
        return text

    replacements = {
        "\u2013": "-",   # en dash
        "\u2014": "-",   # em dash
        "\u2019": "'",   # apostrophe
        "\u2018": "'",   # left apostrophe
        "\u201c": '"',   # left quote
        "\u201d": '"',   # right quote
        "\u00a0": " ",   # non-breaking space
    }

    for old, new in replacements.items():
        text = text.replace(old, new)

    return text


with open(INPUT_FILE, "r", encoding="utf-8") as f:
    data = json.load(f)

for researcher in data:
    researcher["name"] = clean_text(
        researcher.get("name", "")
    )

    researcher["current_affiliation"] = clean_text(
        researcher.get("current_affiliation", "")
    )

    researcher["other_affiliations"] = [
        clean_text(aff)
        for aff in researcher.get("other_affiliations", [])
    ]

    if "matched_openalex_name" in researcher:
        researcher["matched_openalex_name"] = clean_text(
            researcher.get("matched_openalex_name", "")
        )

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(
        data,
        f,
        indent=4,
        ensure_ascii=False
    )

print(f"Cleaned JSON saved to {OUTPUT_FILE}")