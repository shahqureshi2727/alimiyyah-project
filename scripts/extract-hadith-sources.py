#!/usr/bin/env python3
"""Extract Hadith slide PDFs into source artifacts for quiz generation."""

from __future__ import annotations

import csv
import json
import re
import subprocess
from dataclasses import dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = Path(
    "/Users/muazsadique/Library/Mobile Documents/com~apple~CloudDocs/Alimiyyah"
)
OUTPUT_DIR = ROOT / "content" / "Hadith"
RAW_DIR = OUTPUT_DIR / "_raw_text"

PDF_NAMES = [
    "Hadith 1.pdf 3.pdf",
    "Hadith 2.pdf 2.pdf",
    "Hadith 3.pdf",
    "Hadith 4.pdf",
    "Hadith 5.pdf",
    "Copy of Hadith 6 .pdf",
    "Hadith 7 .pdf",
    "Hadith 9.pdf",
    "Hadith 10.pdf",
    "Hadith 11.pdf",
    "Hadith 12 .pdf",
    "Hadith 13 .pdf",
    "Hadith 14 .pdf",
    "Hadith 15.pdf",
    "Hadith 16.pdf",
    "Hadith 17.pdf",
    "Hadith 18.pdf",
    "Hadith 19 .pdf",
    "Hadith 20 .pdf",
    "Hadith 21.pdf",
    "Hadith 22.pdf",
    "Hadith 23 (1).pdf",
    "Hadith 24.pdf",
    "Hadith 26.pdf",
    "Hadith 27.pdf",
]


@dataclass
class Slide:
    number: int
    title: str
    category: str
    body: str


def deck_number(filename: str) -> int:
    match = re.search(r"Hadith\s+(\d+)", filename, flags=re.IGNORECASE)
    if not match:
        raise ValueError(f"Could not infer Hadith number from {filename}")
    return int(match.group(1))


def extract_text(pdf_path: Path) -> str:
    result = subprocess.run(
        ["pdftotext", "-layout", str(pdf_path), "-"],
        check=True,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return result.stdout.replace("\r\n", "\n")


def clean_lines(text: str) -> list[str]:
    lines = []
    for raw_line in text.splitlines():
        line = re.sub(r"[ \t]+", " ", raw_line).strip()
        if line:
            lines.append(line)
    return lines


def classify_slide(title: str, body: str) -> str:
    title_lower = title.lower()
    body_lower = body.lower()
    if title_lower.startswith("assignment"):
        return "assignment"
    if "narrator of this hadith" in title_lower:
        return "narrator"
    if "preview of the hadith" in title_lower:
        return "preview"
    if "core aspects" in title_lower or "context" in title_lower:
        return "context"
    if re.fullmatch(r"hadith\s+\d+", title_lower):
        return "hadith_text"
    if "meaning" in title_lower or "explanation" in title_lower:
        return "explanation"
    if "hadith" in body_lower and "memorize" not in body_lower:
        return "source_note"
    return "note"


def parse_slides(text: str) -> list[Slide]:
    pages = [page for page in text.split("\f") if page.strip()]
    slides: list[Slide] = []
    for index, page in enumerate(pages, start=1):
        lines = clean_lines(page)
        if not lines:
            continue
        title = lines[0]
        body = "\n".join(lines[1:]).strip()
        slides.append(
            Slide(
                number=index,
                title=title,
                category=classify_slide(title, body),
                body=body,
            )
        )
    return slides


def markdown_for_deck(deck: int, filename: str, slides: list[Slide]) -> str:
    deck_id = f"Hadith-{deck:02d}"
    title = f"Hadith {deck}"
    lines = [
        "---",
        "subject: Hadith",
        f"deck: {deck_id}",
        f'title: "{title}"',
        f'source_pdf: "{filename}"',
        "status: extracted",
        "tags: [hadith]",
        "---",
        "",
        f"# {deck_id} - {title}",
        "",
    ]
    for slide in slides:
        source_id = f"HDT-{deck:02d}-S{slide.number:02d}"
        lines.extend(
            [
                f"## {slide.number}. {slide.title}",
                "",
                f"- source_id: {source_id}",
                f"- category: {slide.category}",
            ]
        )
        if slide.body:
            lines.extend(["", slide.body])
        lines.extend(["", f"^{source_id}", ""])
    return "\n".join(lines).rstrip() + "\n"


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    records = []
    missing = []

    for filename in PDF_NAMES:
        pdf_path = SOURCE_DIR / filename
        if not pdf_path.exists():
            missing.append(str(pdf_path))
            continue
        deck = deck_number(filename)
        deck_id = f"Hadith-{deck:02d}"
        text = extract_text(pdf_path)
        slides = parse_slides(text)

        (RAW_DIR / f"{deck_id}.txt").write_text(text, encoding="utf-8")
        (OUTPUT_DIR / f"{deck_id}.md").write_text(
            markdown_for_deck(deck, filename, slides),
            encoding="utf-8",
        )

        for slide in slides:
            source_id = f"HDT-{deck:02d}-S{slide.number:02d}"
            text_value = "\n".join(
                part for part in [slide.title, slide.body] if part
            ).strip()
            records.append(
                {
                    "source_id": source_id,
                    "subject": "Hadith",
                    "deck": deck_id,
                    "deck_number": deck,
                    "slide_number": slide.number,
                    "category": slide.category,
                    "title": slide.title,
                    "text": text_value,
                    "source_pdf": filename,
                }
            )

    csv_path = OUTPUT_DIR / "hadith-source-facts.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=list(records[0].keys()))
        writer.writeheader()
        writer.writerows(records)

    json_path = OUTPUT_DIR / "hadith-source-facts.json"
    json_path.write_text(
        json.dumps(records, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    moc_lines = [
        "---",
        "subject: Hadith",
        "status: extracted",
        "tags: [hadith]",
        "---",
        "",
        "# Hadith MOC",
        "",
    ]
    for filename in PDF_NAMES:
        deck = deck_number(filename)
        deck_id = f"Hadith-{deck:02d}"
        if (OUTPUT_DIR / f"{deck_id}.md").exists():
            moc_lines.append(f"- [[{deck_id}]]")
    (OUTPUT_DIR / "_Hadith-MOC.md").write_text("\n".join(moc_lines) + "\n", encoding="utf-8")

    if missing:
        raise SystemExit("Missing PDFs:\n" + "\n".join(missing))

    print(f"Wrote {len(records)} source records from {len(PDF_NAMES)} PDFs to {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
