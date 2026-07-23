#!/usr/bin/env python3
"""Extract short-surah Tafsir decks into source and app data artifacts."""

from __future__ import annotations

import csv
import json
import re
import shutil
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = Path(
    "/Users/muazsadique/Library/Mobile Documents/com~apple~CloudDocs/Alimiyyah"
)
CONTENT_DIR = ROOT / "content" / "Tafsir"
RAW_DIR = CONTENT_DIR / "_raw_text"
ATTACHMENTS_DIR = ROOT / "content" / "_attachments"
APP_DIR = ROOT / "qasas-practice" / "src" / "data" / "tafsir"

CANONICAL_ARABIC_SOURCE = "https://api.quran.com/api/v4/quran/verses"


SURAH_SPECS = [
    {
        "code": "FIL",
        "surah_number": 105,
        "surah_name": "Al-Fil",
        "title": "Surah Al-Fil",
        "pdf": "Surah Feel.pdf",
        "topic_label": "Surah Al-Fil",
        "revelation": "Makki",
        "ayat": [
            {
                "ayah": 1,
                "translation": "Have you not seen how your Lord dealt with the Army of the Elephant?",
                "commentary": [
                    "Scholars discussed whether Allah is addressing the People of Makkah or Allah's Messenger ﷺ.",
                ],
            },
            {
                "ayah": 2,
                "translation": "Did He not make their plan go astray?",
                "commentary": [
                    "Their kayd was a carefully prepared attack on the Ka'bah.",
                    "Allah made it tadlil: completely failed, wasted, and misdirected.",
                ],
            },
            {
                "ayah": 3,
                "translation": "For He sent against them flocks of birds",
                "commentary": [
                    "The use of 'ala often appears when Allah sends punishment from above, showing His overwhelming power and dominance.",
                    "The indefinite form tayran suggests great numbers, different kinds of birds, and a sense of awe and terror.",
                ],
            },
            {
                "ayah": 4,
                "translation": "that pelted them with stones of baked clay",
                "commentary": [
                    "Rama / yarmi means to throw from a distance or cast something toward a specific target.",
                    "Each bird carried three stones: two in its claws and one in its beak.",
                    "The stone would land on a person, hit their head, and come out from the other side.",
                ],
            },
            {
                "ayah": 5,
                "translation": "leaving them like chewed up straw",
                "commentary": [
                    "The image shows complete, humiliating destruction through something Arabs would immediately recognize.",
                ],
            },
        ],
    },
    {
        "code": "QUR",
        "surah_number": 106,
        "surah_name": "Quraysh",
        "title": "Surah Quraysh",
        "pdf": "Surah Quraish.pdf",
        "topic_label": "Surah Quraysh",
        "revelation": "Makki",
        "ayat": [
            {
                "ayah": 1,
                "translation": "For the familiarity of the Quraysh",
                "commentary": [
                    "Surah Al-Fil shows Allah removing harm: He destroyed the army of Abraha, protected the Ka'bah, and secured Makkah from fear.",
                    "Surah Quraysh shows Allah granting benefit: trade journeys prospered, provisions increased, and safety and stability were established.",
                    "The phrase can be connected to Surah Al-Fil, understood through hadhf (ellipsis), or connected to verse 3.",
                    "Allah gave Quraysh special virtues, including the Prophet ﷺ being from them, prophethood among them, custodianship of the Ka'bah, providing water to pilgrims, and victory over the People of the Elephant.",
                ],
            },
            {
                "ayah": 2,
                "translation": "Secure in their trading journeys in the winter and in the summer",
                "commentary": [
                    "Rihlah is a journey involving merchandise, baggage, and trade.",
                    "Quraysh travelled with large caravans loaded with goods.",
                    "Despite carrying valuable merchandise, they enjoyed unusual security.",
                ],
            },
            {
                "ayah": 3,
                "translation": "let them worship the Lord of this House",
                "commentary": [
                    "The highest form of gratitude is servitude and obedience to Allah.",
                    "The Ka'bah was the source of their honor among the Arabs, the House Allah protected from Abraha, the center around which Arabs gathered, and the reason tribes respected their caravans.",
                    "Five essential aspects of ibadah are ubudiyyah, rida bil-qada, khawf and khashyah, hubb, and tawakkul.",
                ],
            },
            {
                "ayah": 4,
                "translation": "Who has fed them against hunger and made them secure against fear",
                "commentary": [
                    "Makkah was a barren valley with no agriculture, yet Allah brought provisions to its people from every direction.",
                    "Al-Zamakhshari explains that the indefinite forms of hunger and fear indicate severe forms of both.",
                ],
            },
        ],
    },
    {
        "code": "MAU",
        "surah_number": 107,
        "surah_name": "Al-Maun",
        "title": "Surah Al-Ma'un",
        "pdf": "Surah Maun.pdf",
        "topic_label": "Surah Al-Ma'un",
        "revelation": "Makki",
        "ayat": [
            {
                "ayah": 1,
                "translation": "Have you seen the one who denies the Judgment?",
                "commentary": [
                    "Al-Din can refer to the commands of Allah or the Day of Qiyamah.",
                ],
            },
            {
                "ayah": 2,
                "translation": "That is the one who repulses the orphan",
                "commentary": [
                    "Yadu'u means pushes away or treats harshly.",
                    "Yatim is a child who lost their father before puberty.",
                ],
            },
            {
                "ayah": 3,
                "translation": "And does not encourage the feeding of the poor",
                "commentary": [
                    "La yahuddu means does not encourage, urge, or motivate others.",
                    "The problem is not only action but mindset: if I encourage others, I will also be expected to give.",
                ],
            },
            {
                "ayah": 4,
                "translation": "So woe to those who pray",
                "commentary": [
                    "Wayl means woe, destruction, and ruin.",
                    "Wayl can also refer to a valley or place within Hell.",
                    "Al-musallin means those who pray.",
                ],
            },
            {
                "ayah": 5,
                "translation": "Those who are unmindful of their prayers",
                "commentary": [
                    "Being unmindful includes delaying prayer past its time and being negligent or careless about it.",
                ],
            },
            {
                "ayah": 6,
                "translation": "those who show off",
                "commentary": [
                    "Showing off includes acting out of embarrassment, social pressure, or for display.",
                    "Signs of ikhlas include consistency in private and public, dislike of praise, accepting advice, dislike of leadership, and self-awareness.",
                ],
            },
            {
                "ayah": 7,
                "translation": "And they refuse to show small acts of kindness",
                "commentary": [
                    "Ibn Mas'ud said that in the time of the Prophet ﷺ, al-Ma'un was understood as lending a bucket, cooking pot, or small household tools.",
                    "Ibn Abbas interpreted it as zakat.",
                ],
            },
        ],
    },
    {
        "code": "KAW",
        "surah_number": 108,
        "surah_name": "Al-Kawthar",
        "title": "Surah Al-Kawthar",
        "pdf": "Surah Kawthar.pdf",
        "topic_label": "Surah Al-Kawthar",
        "revelation": "Makki",
        "ayat": [
            {
                "ayah": 1,
                "translation": "Indeed, We have granted you abundant goodness",
                "commentary": [
                    "Al-Kawthar refers to the river of Al-Kawthar in Jannah and to abundant goodness.",
                ],
            },
            {
                "ayah": 2,
                "translation": "So pray and sacrifice to your Lord",
                "commentary": [
                    "The verse mentions two acts of shukr: salah as worship of the body and nahr as worship through wealth.",
                ],
            },
            {
                "ayah": 3,
                "translation": "Indeed your enemy is truly cut off",
                "commentary": [
                    "The Quraysh thought the Prophet ﷺ would be forgotten.",
                    "His enemies are remembered only because of their opposition to him.",
                ],
            },
        ],
    },
    {
        "code": "KAF",
        "surah_number": 109,
        "surah_name": "Al-Kafirun",
        "title": "Surah Al-Kafirun",
        "pdf": "Surah Kafirun.pdf",
        "topic_label": "Surah Al-Kafirun",
        "revelation": "Makki",
        "ayat": [
            {
                "ayah": 1,
                "translation": "Say, \"O you disbelievers!\"",
                "commentary": [
                    "Three major terms related to disbelief are kufr, shirk, and nifaq.",
                ],
            },
            {
                "ayah": 2,
                "translation": "I do not worship what you worship,",
                "commentary": [
                    "Ibadah is a comprehensive term for everything Allah loves and is pleased with from statements and actions, whether inward or outward.",
                    "Ibadah entails unconditional obedience, love for Allah above all else, khashyah, sincerity, and accordance with the Sunnah.",
                ],
            },
            {
                "ayah": 3,
                "translation": "nor do you worship what I worship.",
                "commentary": [
                    "Allah rejects the proposal completely.",
                    "Even if the disbelievers performed acts directed to Allah, their worship would not be accepted because it was corrupted by shirk.",
                ],
            },
            {
                "ayah": 4,
                "translation": "I will never worship what you worship,",
                "commentary": [
                    "The repetition emphasizes rejection across present and future, action and acceptance, and action and methodology.",
                ],
            },
            {
                "ayah": 5,
                "translation": "nor will you ever worship what I worship.",
                "commentary": [
                    "The repetition emphasizes rejection across present and future, action and acceptance, and action and methodology.",
                ],
            },
            {
                "ayah": 6,
                "translation": "You have your way, and I have my Way",
                "commentary": [
                    "By placing lakum and li first, the Qur'an conveys exclusivity (hasr).",
                    "Your religion is only for you and my religion is only for me; there will be no exchange, compromise, or mixing between the two.",
                    "This is not indifference or permission to believe whatever one wants, but a final declaration.",
                ],
            },
        ],
    },
    {
        "code": "ASR",
        "surah_number": 103,
        "surah_name": "Al-Asr",
        "title": "Surah Al-Asr",
        "pdf": "Surah Asr.pdf",
        "topic_label": "Surah Al-Asr",
        "revelation": "Makki",
        "ayat": [
            {
                "ayah": 1,
                "translation": "By the passage of time!",
                "commentary": [
                    "Asr can mean the time of Asr, time in general, the era or passing ages, or the lifetime of the Prophet ﷺ.",
                ],
            },
            {
                "ayah": 2,
                "translation": "Surely humanity is in loss",
                "commentary": [
                    "The greatest loss includes loss in time, opportunities, and the Hereafter.",
                ],
            },
            {
                "ayah": 3,
                "translation": "except those who have faith, do good, and urge each other to the truth, and urge each other to perseverance.",
                "commentary": [
                    "The saved group combines iman, righteous deeds, urging each other to truth, and urging each other to perseverance.",
                ],
            },
        ],
    },
]


def run_pdftotext(pdf_path: Path) -> str:
    tool = shutil.which("pdftotext")
    if not tool:
        raise RuntimeError("pdftotext is required to extract raw Tafsir text")
    result = subprocess.run(
        [tool, "-layout", str(pdf_path), "-"],
        check=True,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return result.stdout.replace("\r\n", "\n")


def fetch_quran_script(script: str, surah_number: int) -> dict[int, str]:
    url = f"{CANONICAL_ARABIC_SOURCE}/{script}?chapter_number={surah_number}"
    result = subprocess.run(
        ["curl", "-fsSL", url],
        check=True,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    payload = json.loads(result.stdout)
    key = f"text_{script}"
    return {
        int(verse["verse_key"].split(":", 1)[1]): clean_arabic(verse[key])
        for verse in payload["verses"]
    }


def clean_arabic(value: str) -> str:
    without_artifacts = re.sub(
        r"[\u200e\u200f\u202a-\u202e\ue000-\uf8ff\ufb50-\ufdff\ufe70-\ufeff]",
        "",
        value,
    )
    return re.sub(r"\s+", " ", without_artifacts).strip()


def js_string(value) -> str:
    return json.dumps(value, ensure_ascii=False, indent=2)


def markdown_for_surah(spec: dict, records: list[dict]) -> str:
    deck_id = f"Tafsir-{spec['surah_number']}"
    lines = [
        "---",
        "subject: Tafsir",
        f"deck: {deck_id}",
        f"title: \"{spec['title']}\"",
        f"source_pdf: \"[[_attachments/{deck_id}.pdf]]\"",
        "status: extracted",
        "tags: [tafsir]",
        "---",
        "",
        f"# {deck_id} - {spec['title']}",
        "",
        f"## Topic: {spec['topic_label']} #tafsir/{spec['code'].lower()}",
        "",
        f"- Revelation: {spec['revelation']}",
        f"- Arabic source: Quran.com Quran Foundation API ({CANONICAL_ARABIC_SOURCE}/uthmani and /indopak)",
        "",
    ]
    for record in records:
        lines.extend(
            [
                f"### Ayah {record['ayah']}",
                "",
                f"- **[{record['sourceIds'][0]}]** {record['referenceTranslation']} · src: {deck_id} \"Ayah {record['ayah']}\" ^{record['sourceIds'][0]}",
                f"- Uthmani: {record['arabicTextUthmani']}",
                f"- IndoPak: {record['arabicTextIndopak']}",
                "- Notes:",
            ]
        )
        for note in record["commentary"]:
            lines.append(f"  - {note}")
        lines.append("")
    lines.extend(["## Flags", "", "- Arabic ayat were not extracted from the Canva PDF text layer; the PDF text stream drops/fragments IndoPak and Madani glyphs, so canonical Quran.com Uthmani and IndoPak text is used for Arabic fields.", "", "---", "Back to [[_Tafsir-MOC]]"])
    return "\n".join(lines).rstrip() + "\n"


def build_records() -> list[dict]:
    all_records: list[dict] = []
    for spec in SURAH_SPECS:
        pdf_path = SOURCE_DIR / spec["pdf"]
        if not pdf_path.exists():
            raise FileNotFoundError(pdf_path)

        raw_text = run_pdftotext(pdf_path)
        RAW_DIR.mkdir(parents=True, exist_ok=True)
        (RAW_DIR / f"Tafsir-{spec['surah_number']}.txt").write_text(raw_text, encoding="utf-8")

        uthmani = fetch_quran_script("uthmani", spec["surah_number"])
        indopak = fetch_quran_script("indopak", spec["surah_number"])

        deck_id = f"Tafsir-{spec['surah_number']}"
        shutil.copyfile(pdf_path, ATTACHMENTS_DIR / f"{deck_id}.pdf")

        surah_records = []
        for ayah_spec in spec["ayat"]:
            ayah = ayah_spec["ayah"]
            source_id = f"TFS-{spec['code']}-{ayah:02d}"
            record = {
                "id": f"TFS-{spec['code']}-{ayah:03d}",
                "sourceIds": [source_id],
                "topic": spec["code"],
                "surahNumber": spec["surah_number"],
                "surahName": spec["surah_name"],
                "ayah": ayah,
                "arabicText": uthmani[ayah],
                "arabicTextUthmani": uthmani[ayah],
                "arabicTextIndopak": indopak[ayah],
                "referenceTranslation": ayah_spec["translation"],
                "acceptableVariants": [],
                "commentary": ayah_spec["commentary"],
                "sourcePdf": spec["pdf"],
                "canonicalArabicSource": "Quran.com Quran Foundation API",
            }
            surah_records.append(record)
            all_records.append(record)

        (CONTENT_DIR / f"{deck_id} {spec['surah_name']}.md").write_text(
            markdown_for_surah(spec, surah_records),
            encoding="utf-8",
        )
    return all_records


def write_csv(records: list[dict]) -> None:
    fieldnames = [
        "id",
        "source_id",
        "topic",
        "surah_number",
        "surah_name",
        "ayah",
        "arabic_text_uthmani",
        "arabic_text_indopak",
        "reference_translation",
        "commentary",
        "source_pdf",
        "canonical_arabic_source",
    ]
    with (CONTENT_DIR / "tafsir-source-verses.csv").open("w", newline="", encoding="utf-8") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        writer.writeheader()
        for record in records:
            writer.writerow(
                {
                    "id": record["id"],
                    "source_id": record["sourceIds"][0],
                    "topic": record["topic"],
                    "surah_number": record["surahNumber"],
                    "surah_name": record["surahName"],
                    "ayah": record["ayah"],
                    "arabic_text_uthmani": record["arabicTextUthmani"],
                    "arabic_text_indopak": record["arabicTextIndopak"],
                    "reference_translation": record["referenceTranslation"],
                    "commentary": " | ".join(record["commentary"]),
                    "source_pdf": record["sourcePdf"],
                    "canonical_arabic_source": record["canonicalArabicSource"],
                }
            )


def write_json(records: list[dict]) -> None:
    (CONTENT_DIR / "tafsir-source-verses.json").write_text(
        json.dumps(records, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def write_moc() -> None:
    lines = [
        "---",
        "subject: Tafsir",
        "status: extracted",
        "tags: [tafsir]",
        "---",
        "",
        "# Tafsir MOC",
        "",
    ]
    for spec in sorted(SURAH_SPECS, key=lambda item: item["surah_number"]):
        deck_id = f"Tafsir-{spec['surah_number']}"
        lines.append(f"- [[{deck_id} {spec['surah_name']}]]")
    (CONTENT_DIR / "_Tafsir-MOC.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def distractors_for(record: dict, records: list[dict]) -> list[str]:
    same_surah = [
        item["referenceTranslation"]
        for item in records
        if item["surahNumber"] == record["surahNumber"] and item["id"] != record["id"]
    ]
    others = [
        item["referenceTranslation"]
        for item in records
        if item["surahNumber"] != record["surahNumber"]
    ]
    return (same_surah + others)[:3]


def write_app_module(records: list[dict]) -> None:
    APP_DIR.mkdir(parents=True, exist_ok=True)
    questions = []
    for record in records:
        options = [record["referenceTranslation"], *distractors_for(record, records)]
        questions.append(
            {
                "id": f"{record['id']}-MCQ",
                "type": "mcq",
                "sourceIds": record["sourceIds"],
                "topic": record["topic"],
                "surahNumber": record["surahNumber"],
                "surahName": record["surahName"],
                "ayah": record["ayah"],
                "arabicText": record["arabicText"],
                "arabicTextUthmani": record["arabicTextUthmani"],
                "arabicTextIndopak": record["arabicTextIndopak"],
                "correctTranslation": record["referenceTranslation"],
                "options": options,
                "answerIndex": 0,
                "sourcePdf": record["sourcePdf"],
            }
        )

    module = f"""// Tafsir verse records generated from content/Tafsir/tafsir-source-verses.json.
// Arabic text is sourced from the Quran.com Quran Foundation API, not the Canva PDF text layer.

export const tafsirVerseRecords = {js_string(records)};

export const tafsirMcqQuestions = {js_string(questions)};

export function getTafsirVerseRecords(topic = 'all') {{
  if (topic === 'all') return tafsirVerseRecords;
  return tafsirVerseRecords.filter((record) => record.topic === topic);
}}

export function getTafsirQuestions(topic = 'all') {{
  if (topic === 'all') return tafsirMcqQuestions;
  return tafsirMcqQuestions.filter((question) => question.topic === topic);
}}
"""
    (APP_DIR / "index.js").write_text(module, encoding="utf-8")


def main() -> None:
    CONTENT_DIR.mkdir(parents=True, exist_ok=True)
    ATTACHMENTS_DIR.mkdir(parents=True, exist_ok=True)
    records = build_records()
    records.sort(key=lambda item: (item["surahNumber"], item["ayah"]))
    write_csv(records)
    write_json(records)
    write_moc()
    write_app_module(records)
    print(f"Wrote {len(records)} Tafsir verse records from {len(SURAH_SPECS)} PDFs")


if __name__ == "__main__":
    main()
