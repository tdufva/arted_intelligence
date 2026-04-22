#!/usr/bin/env python3

from __future__ import annotations

import json
import math
import re
import subprocess
from collections import Counter, defaultdict
from pathlib import Path
from statistics import mean

ROOT = Path(__file__).resolve().parents[1]
PDF_DIR = ROOT / "All Intelligence article in Studies"
DATA_DIR = ROOT / "site" / "data"
RAW_PATH = DATA_DIR / "raw_corpus.json"
OUTPUT_PATH = DATA_DIR / "corpus.json"
OUTPUT_JS_PATH = DATA_DIR / "corpus-data.js"
EXTRACTOR = ROOT / "scripts" / "extract_pdfs.swift"


INTELLIGENCE_TYPES = [
    {
        "id": "creative",
        "label": "Creative",
        "description": "Creativity, artistic invention, creative practice, and divergent production.",
        "cues": ["creativity", "imagination", "divergent production", "innovation"],
        "keywords": [
            r"\bcreativ",
            r"\bdivergent\b",
            r"\bimagin",
            r"\binnovation\b",
            r"\bartistic creativity\b",
        ],
    },
    {
        "id": "cognitive",
        "label": "Cognitive / Conceptual",
        "description": "Thinking, concept formation, cognition, intellect, and meaning-making as mental process.",
        "cues": ["cognition", "concept formation", "thinking", "meaning-making"],
        "keywords": [
            r"\bcognit",
            r"\bconceptual\b",
            r"\bconcept\b",
            r"\bintellect",
            r"\bthinking\b",
            r"\bmental functioning\b",
            r"\bdecision-making\b",
            r"\bunderstanding\b",
        ],
    },
    {
        "id": "perceptual",
        "label": "Perceptual / Visual",
        "description": "Visual-spatial ability, perceptual differentiation, attention, aesthetic sensitivity, and seeing.",
        "cues": ["perception", "visual-spatial reasoning", "attention", "aesthetic sensitivity"],
        "keywords": [
            r"\bpercept",
            r"\bvisual-spatial\b",
            r"\bvisual spatial\b",
            r"\baesthetic perception\b",
            r"\baesthetic sensitivity\b",
            r"\battention\b",
            r"\bstyle\b",
            r"\bseeing\b",
            r"\bviewer\b",
        ],
    },
    {
        "id": "affective",
        "label": "Affective / Embodied",
        "description": "Emotion, self-efficacy, mindfulness, resilience, stress, embodiment, and tacit knowing.",
        "cues": ["emotion", "embodiment", "self-efficacy", "tacit knowing"],
        "keywords": [
            r"\bemotion",
            r"\baffect",
            r"\bembod",
            r"\bmindful",
            r"\bself-efficacy\b",
            r"\bresilien",
            r"\bstress\b",
            r"\btacit\b",
            r"\bhumor\b",
        ],
    },
    {
        "id": "social",
        "label": "Social / Cultural",
        "description": "Intelligence as relational, communal, identity-based, or culturally situated practice.",
        "cues": ["culture", "community", "identity", "social justice"],
        "keywords": [
            r"\bsocial\b",
            r"\bcultural\b",
            r"\bcommunity\b",
            r"\brelational\b",
            r"\bmulticultural\b",
            r"\bidentity\b",
            r"\bcollective\b",
            r"\bqueer",
            r"\bracial\b",
            r"\bsocial justice\b",
        ],
    },
    {
        "id": "communicative",
        "label": "Communicative / Semiotic",
        "description": "Verbal, linguistic, semiotic, and symbolic dimensions of intelligence in art learning.",
        "cues": ["language", "semiotics", "metaphor", "criticism"],
        "keywords": [
            r"\bverbal",
            r"\blanguage\b",
            r"\bsemiotic",
            r"\bmetaphor",
            r"\bcriticism\b",
            r"\bmeaning\b",
            r"\bresponding\b",
            r"\bconversation\b",
        ],
    },
    {
        "id": "digital",
        "label": "Digital / Computational",
        "description": "Computing, digital media, games, AI, and machine-augmented visual intelligence.",
        "cues": ["digital media", "computing", "AI", "games and film"],
        "keywords": [
            r"\bcomputer",
            r"\bcomputing\b",
            r"\bdigital\b",
            r"\bnetwork society\b",
            r"\bai\b",
            r"\bartificial intelligence\b",
            r"\bsynthography\b",
            r"\bgame\b",
            r"\bmedia\b",
            r"\bfilm\b",
        ],
    },
    {
        "id": "exceptionality",
        "label": "Gifted / Neurodiverse / Clinical",
        "description": "Giftedness, disability, autism, impairment, and clinical framings of ability.",
        "cues": ["giftedness", "disability", "autism", "inclusion"],
        "keywords": [
            r"\bgifted\b",
            r"\btalented\b",
            r"\bautistic\b",
            r"\bautism\b",
            r"\bdisabil",
            r"\bhearing impaired\b",
            r"\bmentally retarded\b",
            r"\binclusive\b",
            r"\bdisadvantaged\b",
        ],
    },
]


PERSPECTIVES = [
    {
        "id": "assessment",
        "label": "Assessment & Measurement",
        "description": "Testing, scoring, psychometrics, comparative evaluation, and quantified outcomes.",
        "cues": ["testing", "measurement", "criteria", "quantified outcomes"],
        "keywords": [
            r"\btest",
            r"\bmeasure",
            r"\bmeasurement\b",
            r"\bquantitative\b",
            r"\bempirical\b",
            r"\binstrument\b",
            r"\bcriteria\b",
            r"\bdegrees\b",
            r"\beffects of\b",
            r"\bassessment\b",
            r"\bjudging\b",
        ],
    },
    {
        "id": "developmental",
        "label": "Developmental Psychology",
        "description": "Developmental stages, child development, personality, age-based change, and growth.",
        "cues": ["child development", "age-based stages", "growth", "personality"],
        "keywords": [
            r"\bdevelopment",
            r"\bchildren\b",
            r"\bchild\b",
            r"\badolescent",
            r"\bpreschool",
            r"\bfifth-grade\b",
            r"\bninth-grade\b",
            r"\bpersonality\b",
            r"\blongitudinal\b",
            r"\bage\b",
        ],
    },
    {
        "id": "pedagogy",
        "label": "Curriculum & Pedagogy",
        "description": "Teaching models, curriculum design, classroom practice, and learning transfer.",
        "cues": ["curriculum", "teaching", "classroom practice", "transfer"],
        "keywords": [
            r"\bcurriculum\b",
            r"\bpedagog",
            r"\bteaching\b",
            r"\bteacher\b",
            r"\btransfer\b",
            r"\bclassroom\b",
            r"\binstruction\b",
            r"\bworkshop\b",
            r"\bpreservice\b",
            r"\bteaching model\b",
        ],
    },
    {
        "id": "critical",
        "label": "Critical / Social Justice",
        "description": "Power, emancipation, race, gender, decolonial, queer, and anti-oppressive perspectives.",
        "cues": ["power", "justice", "race and gender", "decolonial critique"],
        "keywords": [
            r"\bcritical\b",
            r"\bsocial justice\b",
            r"\bemancipation\b",
            r"\bfeminis",
            r"\bqueer",
            r"\bracial\b",
            r"\bbias",
            r"\bdecolon",
            r"\bpolitic",
            r"\bequality\b",
        ],
    },
    {
        "id": "disability",
        "label": "Disability & Neurodiversity",
        "description": "Disability studies, autism, inclusion, impairment, and differentiated ability.",
        "cues": ["disability studies", "autism", "inclusion", "neurodiversity"],
        "keywords": [
            r"\bdisabil",
            r"\bautis",
            r"\bhearing impaired\b",
            r"\bmentally retarded\b",
            r"\binclusive\b",
            r"\bneuro",
            r"\bdisadvantaged\b",
        ],
    },
    {
        "id": "technology",
        "label": "Technology & Media",
        "description": "Digital media, computing, AI, networked learning, film, and games.",
        "cues": ["digital media", "computing", "AI", "networked learning"],
        "keywords": [
            r"\bcomputer",
            r"\bcomputing\b",
            r"\bdigital\b",
            r"\bai\b",
            r"\bartificial intelligence\b",
            r"\bfilm\b",
            r"\bvideo\b",
            r"\bgame\b",
            r"\bnetwork\b",
            r"\bmedia\b",
        ],
    },
    {
        "id": "philosophy",
        "label": "Philosophy & Aesthetics",
        "description": "Aesthetic theory, criticism, philosophy of art education, and epistemology.",
        "cues": ["aesthetic theory", "philosophy", "epistemology", "criticism"],
        "keywords": [
            r"\baesthetic",
            r"\besthetic",
            r"\bphilosoph",
            r"\btheory\b",
            r"\bauthority\b",
            r"\bcriticism\b",
            r"\bsemiotic\b",
            r"\bmetaphor\b",
            r"\bliberal education\b",
        ],
    },
    {
        "id": "community",
        "label": "Community / Museum / Cultural Context",
        "description": "Museum learning, community settings, cultural comparison, place, and public education.",
        "cues": ["museum learning", "community settings", "place", "cross-cultural context"],
        "keywords": [
            r"\bmuseum\b",
            r"\bcommunity\b",
            r"\bpublic art\b",
            r"\bplace\b",
            r"\bcross-cultural\b",
            r"\baustralia\b",
            r"\bpakistan\b",
            r"\bthailand\b",
            r"\bnigeria\b",
            r"\bquebec\b",
            r"\bfrance\b",
        ],
    },
]


SIGNALS = [
    {
        "id": "identity",
        "label": "Identity and aspiration",
        "description": "Identity formation, self-positioning, aspiration, and subject formation around art learning.",
        "cues": ["identity", "aspiration", "subject formation", "self-positioning"],
        "keywords": [r"\bidentity\b", r"\baspirational\b", r"\bforeclosure\b"],
    },
    {
        "id": "equity",
        "label": "Equity and justice",
        "description": "Equality, justice, bias, emancipation, and anti-oppressive signals adjacent to intelligence.",
        "cues": ["equity", "justice", "bias", "emancipation"],
        "keywords": [r"\bequality\b", r"\bjustice\b", r"\bbias\b", r"\bemancipation\b"],
    },
    {
        "id": "place",
        "label": "Place and ecology",
        "description": "Place, ecology, environment, and relational world-making around intelligence discourse.",
        "cues": ["place", "ecology", "environment", "relational world"],
        "keywords": [r"\bplace\b", r"\becology\b", r"\brelational world\b"],
    },
    {
        "id": "materiality",
        "label": "Materiality",
        "description": "Material culture, new materialism, and the agency of materials in art learning.",
        "cues": ["material culture", "new materialism", "materiality", "materials"],
        "keywords": [r"\bmaterial culture\b", r"\bnew materialism\b", r"\bmateriality\b", r"\bmaterial\b"],
    },
    {
        "id": "transfer",
        "label": "Transfer",
        "description": "Transfer of learning across contexts, domains, or forms of art education.",
        "cues": ["transfer", "carryover", "cross-domain learning"],
        "keywords": [r"\btransfer\b"],
    },
    {
        "id": "teacherhood",
        "label": "Teachers and professional formation",
        "description": "Teachers, preservice formation, professional identity, and the conditions of teaching practice.",
        "cues": ["teacher", "preservice", "professional formation", "teacher stress"],
        "keywords": [r"\bteacher\b", r"\bpreservice\b", r"\bart teacher\b", r"\bteacher stress\b"],
    },
    {
        "id": "museum",
        "label": "Museum and public learning",
        "description": "Museums and public-facing art learning beyond the classroom.",
        "cues": ["museum", "gallery", "public learning"],
        "keywords": [r"\bmuseum\b"],
    },
    {
        "id": "language",
        "label": "Language and semiotics",
        "description": "Language, verbal response, semiotics, and metaphor as adjacent frames for intelligence.",
        "cues": ["language", "verbal response", "semiotics", "metaphor"],
        "keywords": [r"\blanguage\b", r"\bverbal", r"\bsemiotic\b", r"\bmetaphor\b"],
    },
    {
        "id": "technology",
        "label": "Technology and media",
        "description": "Technology, media, digital systems, film, games, and AI adjacent to intelligence.",
        "cues": ["digital", "computing", "AI", "film and games"],
        "keywords": [r"\bcomputer", r"\bdigital\b", r"\bai\b", r"\bgame\b", r"\bfilm\b"],
    },
    {
        "id": "care",
        "label": "Care and wellbeing",
        "description": "Care, mindfulness, wellbeing, resilience, and stress as adjacent signals.",
        "cues": ["care", "mindfulness", "wellbeing", "resilience"],
        "keywords": [r"\bcare\b", r"\bmindful", r"\bresilien", r"\bstress\b"],
    },
]


RAW_TYPE_OVERRIDES = {
    "A Nonverbal Ability Test": ["communicative", "cognitive", "assessment"],
    "A Typology of Creativity in the Visual Arts": ["creative", "cognitive", "philosophy"],
    "Creative Intelligence, Creative Practice: Lowenfeld Redux": ["creative", "cognitive", "pedagogy"],
    "Learning in and through the Arts: The Question of Transfer": ["cognitive", "creative", "pedagogy"],
    "The Meaning of Transfer in the Practices of Arts Education": ["cognitive", "social", "pedagogy"],
    "Visual Culture, Visual Brain, and “Art” Education": ["perceptual", "cognitive", "technology"],
    "Creative and Critical Entanglements With AI in Art Education": ["digital", "creative", "social", "technology"],
    "The Physics of Art Education: New Materialism, AI, and the Tacit Knowledge of Visual Culture": ["digital", "affective", "social", "technology"],
    "On “Nadia’s Drawings: Theorizing about an Autistic Child’s Phenomenal Ability”": ["exceptionality", "perceptual", "disability"],
    "Nadia’s Drawings: Theorizing about an Autistic Child’s Phenomenal Ability": ["exceptionality", "perceptual", "disability"],
    "Identification of the Gifted in Art": ["exceptionality", "creative", "assessment"],
    "An Historical Perspective on the Gifted and the Talented in Art": ["exceptionality", "creative", "developmental"],
    "The Effects of Perceptual Training upon the Two-Dimensional Drawings of Children": ["perceptual", "cognitive", "assessment"],
    "Judging Children’s Drawings as Measures of Art Abilities": ["perceptual", "creative", "assessment"],
}


def title_key(value: str) -> str:
    normalized = value.replace("“", '"').replace("”", '"').replace("’", "'")
    return re.sub(r"[^a-z0-9]+", " ", normalized.lower()).strip()


TYPE_OVERRIDES = {title_key(key): value for key, value in RAW_TYPE_OVERRIDES.items()}


COMMON_THREADS = [
    {
        "title": "Art intelligence is repeatedly treated as more than IQ",
        "body": "Across decades, the journal uses intelligence to name creative, perceptual, embodied, social, and technological capacities. Even the more psychometric studies rarely confine art learning to a single measurable faculty.",
    },
    {
        "title": "The corpus moves from testing abilities toward situating them",
        "body": "Earlier work leans heavily on measurement, developmental psychology, and perceptual training. Later work shifts toward social justice, community, ecology, disability, and relational accounts of knowing.",
    },
    {
        "title": "Visual thinking is central, but not isolated",
        "body": "Perception and visual-spatial reasoning are a constant thread, yet they are often tied to language, culture, identity, and classroom practice rather than treated as purely internal cognition.",
    },
    {
        "title": "Technology revives intelligence debates in new forms",
        "body": "Computing, digital culture, games, and AI re-open old questions about creativity, judgment, expertise, and tacit knowledge while also exposing who benefits and who gets excluded.",
    },
]


def ensure_data_dir() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def run_extractor() -> list[dict]:
    env = dict(**subprocess.os.environ)
    env["CLANG_MODULE_CACHE_PATH"] = "/tmp/swift-module-cache"
    env["SWIFT_MODULECACHE_PATH"] = "/tmp/swift-module-cache"
    subprocess.run(["mkdir", "-p", "/tmp/swift-module-cache"], check=True)
    result = subprocess.run(
        ["swift", str(EXTRACTOR), str(PDF_DIR)],
        check=True,
        capture_output=True,
        text=True,
        env=env,
    )
    return json.loads(result.stdout)


def clean_title(raw: str) -> str:
    title = Path(raw).stem
    title = re.sub(r"^\d{2}-", "", title)
    title = re.sub(r"([A-Za-z])_s\b", r"\1's", title)
    title = title.replace("_", " ")
    title = title.replace("“", '"').replace("”", '"')
    title = re.sub(r"\s+", " ", title).strip()
    title = re.sub(r"\s+([,.:;!?])", r"\1", title)
    return title


def normalize_text(text: str) -> str:
    text = text.replace("\u2019", "'").replace("\u2018", "'").replace("\u201c", '"').replace("\u201d", '"')
    text = text.replace("\u2014", " ").replace("\u2013", " ")
    text = text.replace("\x0c", "\n")
    return re.sub(r"\s+", " ", text).strip()


def parse_year(text: str) -> int | None:
    patterns = [
        r"To cite this article:.*?\((\d{4})\)",
        r"Copyright\s+(\d{4})",
        r"National Art Education Association.*?(\d{4}),",
        r"Studies in Art Education.*?(\d{4}),",
        r"Published online:\s+\d{1,2}\s+\w+\s+(\d{4})",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        if match:
            year = int(match.group(1))
            if 1900 <= year <= 2100:
                return year
    candidates = re.findall(r"\b(19\d{2}|20\d{2})\b", text[:2200])
    if candidates:
        years = [int(value) for value in candidates]
        return min(years)
    return None


def parse_title_from_citation(text: str) -> str | None:
    match = re.search(
        r"To cite this article:.*?\(\d{4}\)\s*(.*?)\s*,\s*Studies in Art Education",
        text,
        re.IGNORECASE | re.DOTALL,
    )
    if not match:
        return None
    title = match.group(1)
    title = title.replace("\n", " ").replace("\u00a0", " ")
    title = re.sub(r"\s+", " ", title).strip(" ,.;")
    return title or None


def parse_doi(text: str) -> str | None:
    match = re.search(r"(10\.\d{4,9}/[-._;()/:A-Z0-9]+)", text, re.IGNORECASE)
    if match:
        doi = match.group(1).rstrip(".,);")
        return doi.lower()
    return None


def parse_front_matter_numbers(text: str) -> dict[str, int | None]:
    views = None
    citing = None

    view_match = re.search(r"Article views:\s*([\d,]+)", text, re.IGNORECASE)
    if view_match:
        views = int(view_match.group(1).replace(",", ""))

    cite_match = re.search(r"Citing articles:\s*([\d,]+)", text, re.IGNORECASE)
    if cite_match:
        citing = int(cite_match.group(1).replace(",", ""))

    return {"articleViews": views, "citingArticlesPdf": citing}


def match_keywords(text: str, definitions: list[dict], threshold: int = 1) -> list[dict]:
    matches = []
    for definition in definitions:
        score = 0
        hits = []
        for pattern in definition["keywords"]:
            found = len(re.findall(pattern, text, re.IGNORECASE))
            if found:
                score += found
                hits.append(pattern)
        if score >= threshold:
            matches.append({"id": definition["id"], "score": score, "hits": hits})
    matches.sort(key=lambda item: (-item["score"], item["id"]))
    return matches


def top_ids(matches: list[dict], maximum: int = 3) -> list[str]:
    return [item["id"] for item in matches[:maximum]]


def article_excerpt(text: str) -> str:
    text = re.sub(r"Submit your article to this journal.*?journalCode=usae20", " ", text, flags=re.IGNORECASE)
    text = re.sub(r"Article views:\s*[\d,]+", " ", text, flags=re.IGNORECASE)
    text = re.sub(r"View related articles", " ", text, flags=re.IGNORECASE)
    text = re.sub(r"Full Terms .*?journalCode=usae20", " ", text, flags=re.IGNORECASE)
    text = re.sub(r"\s+", " ", text).strip()
    sentences = re.split(r"(?<=[.!?])\s+", text)
    picked = []
    for sentence in sentences:
        normalized = sentence.strip()
        if len(normalized) < 70:
            continue
        if "Studies in Art Education" in normalized:
            continue
        picked.append(normalized)
        if len(" ".join(picked)) > 260:
            break
    return " ".join(picked)[:320].strip()


def build_articles(raw_records: list[dict]) -> list[dict]:
    articles = []
    for record in raw_records:
        normalized = normalize_text(record["text"])
        first_page = normalize_text(record["firstPageText"])
        title = parse_title_from_citation(record["firstPageText"]) or clean_title(record["file"])
        metadata = parse_front_matter_numbers(first_page)

        intelligence_matches = match_keywords(f"{title} {first_page[:4000]} {normalized[:14000]}", INTELLIGENCE_TYPES)
        perspective_matches = match_keywords(f"{title} {first_page[:5000]} {normalized[:18000]}", PERSPECTIVES)

        type_ids = top_ids(intelligence_matches)
        perspective_ids = top_ids(perspective_matches)

        overrides = TYPE_OVERRIDES.get(title_key(title))
        if overrides:
            type_ids = [value for value in overrides if value in {item["id"] for item in INTELLIGENCE_TYPES}]
            perspective_ids = [value for value in overrides if value in {item["id"] for item in PERSPECTIVES}]

        if not type_ids:
            type_ids = ["cognitive"]
        if not perspective_ids:
            perspective_ids = ["pedagogy"]

        signals = []
        signal_text = f"{title} {normalized[:16000]}"
        for signal in SIGNALS:
            score = sum(len(re.findall(pattern, signal_text, re.IGNORECASE)) for pattern in signal["keywords"])
            if score:
                signals.append({"id": signal["id"], "score": score})
        signals.sort(key=lambda item: (-item["score"], item["id"]))

        article = {
            "file": record["file"],
            "title": title,
            "year": parse_year(first_page) or parse_year(normalized) or 0,
            "doi": parse_doi(first_page) or parse_doi(normalized[:5000]),
            "pageCount": record["pageCount"],
            "articleViews": metadata["articleViews"],
            "citingArticlesPdf": metadata["citingArticlesPdf"],
            "intelligenceTypes": type_ids,
            "perspectives": perspective_ids,
            "signals": [item["id"] for item in signals[:5]],
            "excerpt": article_excerpt(normalized),
        }
        articles.append(article)

    articles.sort(key=lambda item: (item["year"], item["title"]))
    return articles


def index_lookup(definitions: list[dict]) -> dict[str, dict]:
    return {item["id"]: item for item in definitions}


def decade_label(year: int) -> str:
    if not year:
        return "Unknown"
    decade = year - (year % 10)
    return f"{decade}s"


def build_matrix(articles: list[dict]) -> list[dict]:
    cells = []
    for intelligence in INTELLIGENCE_TYPES:
        for perspective in PERSPECTIVES:
            matching = [
                article["title"]
                for article in articles
                if intelligence["id"] in article["intelligenceTypes"] and perspective["id"] in article["perspectives"]
            ]
            if matching:
                cells.append(
                    {
                        "intelligenceId": intelligence["id"],
                        "perspectiveId": perspective["id"],
                        "count": len(matching),
                        "titles": matching[:12],
                    }
                )
    return cells


def build_counts(articles: list[dict], key: str) -> list[dict]:
    counter = Counter()
    for article in articles:
        counter.update(article[key])

    definitions = index_lookup(INTELLIGENCE_TYPES if key == "intelligenceTypes" else PERSPECTIVES)
    return [
        {
            "id": item_id,
            "label": definitions[item_id]["label"],
            "count": count,
            "description": definitions[item_id]["description"],
        }
        for item_id, count in counter.most_common()
    ]


def build_timeline(articles: list[dict]) -> list[dict]:
    by_decade = defaultdict(lambda: {"count": 0, "typeCounts": Counter(), "perspectiveCounts": Counter()})
    for article in articles:
        decade = decade_label(article["year"])
        by_decade[decade]["count"] += 1
        by_decade[decade]["typeCounts"].update(article["intelligenceTypes"])
        by_decade[decade]["perspectiveCounts"].update(article["perspectives"])

    rows = []
    for decade in sorted(by_decade):
        row = by_decade[decade]
        rows.append(
            {
                "decade": decade,
                "articleCount": row["count"],
                "topTypes": [{"id": item_id, "count": count} for item_id, count in row["typeCounts"].most_common(3)],
                "topPerspectives": [
                    {"id": item_id, "count": count} for item_id, count in row["perspectiveCounts"].most_common(3)
                ],
            }
        )
    return rows


def build_signals(articles: list[dict]) -> list[dict]:
    counter = Counter()
    for article in articles:
        counter.update(article["signals"])
    signal_lookup = {item["id"]: item for item in SIGNALS}
    output = []
    for signal_id, count in counter.most_common():
        definition = signal_lookup[signal_id]
        output.append(
            {
                "id": signal_id,
                "label": definition["label"],
                "description": definition["description"],
                "cues": definition["cues"],
                "count": count,
            }
        )
    return output


def build_windowed_counts(articles: list[dict]) -> tuple[list[str], dict]:
    by_decade = defaultdict(lambda: {"articles": 0, "types": Counter(), "perspectives": Counter(), "signals": Counter()})
    for article in articles:
        decade = decade_label(article["year"])
        by_decade[decade]["articles"] += 1
        by_decade[decade]["types"].update(article["intelligenceTypes"])
        by_decade[decade]["perspectives"].update(article["perspectives"])
        by_decade[decade]["signals"].update(article["signals"])
    decades = sorted(by_decade)
    return decades, by_decade


def article_decade(article: dict) -> str:
    return decade_label(article["year"])


def article_importance_key(article: dict) -> tuple:
    return (-(article.get("citingArticlesPdf") or 0), -(article.get("articleViews") or 0), article["year"], article["title"])


def sample_articles_for_bucket(
    articles: list[dict],
    list_key: str,
    bucket_id: str,
    decades: list[str],
    limit: int = 3,
) -> dict:
    early_window = set(decades[:3])
    late_window = set(decades[-3:])

    matches = [article for article in articles if bucket_id in article[list_key]]
    early_matches = [article for article in matches if article_decade(article) in early_window]
    late_matches = [article for article in matches if article_decade(article) in late_window]

    def compress(rows: list[dict]) -> list[dict]:
        trimmed = sorted(rows, key=article_importance_key)[:limit]
        return [{"title": row["title"], "year": row["year"], "doi": row.get("doi")} for row in trimmed]

    return {"early": compress(early_matches), "late": compress(late_matches)}


def classify_delta(delta: float) -> str:
    if delta >= 0.2:
        return "rising sharply"
    if delta >= 0.08:
        return "rising"
    if delta <= -0.2:
        return "declining sharply"
    if delta <= -0.08:
        return "declining"
    return "stable"


def build_trend_rows(
    definitions: list[dict],
    bucket_key: str,
    decades: list[str],
    by_decade: dict,
    articles: list[dict],
    window_size: int = 3,
) -> dict:
    early_window = decades[:window_size]
    late_window = decades[-window_size:]
    early_total = sum(by_decade[decade]["articles"] for decade in early_window) or 1
    late_total = sum(by_decade[decade]["articles"] for decade in late_window) or 1

    rows = []
    for definition in definitions:
        early_count = sum(by_decade[decade][bucket_key][definition["id"]] for decade in early_window)
        late_count = sum(by_decade[decade][bucket_key][definition["id"]] for decade in late_window)
        early_share = early_count / early_total
        late_share = late_count / late_total
        delta = late_share - early_share
        rows.append(
            {
                "id": definition["id"],
                "label": definition["label"],
                "description": definition["description"],
                "earlyCount": early_count,
                "lateCount": late_count,
                "earlyShare": round(early_share, 3),
                "lateShare": round(late_share, 3),
                "delta": round(delta, 3),
                "direction": classify_delta(delta),
                "examples": sample_articles_for_bucket(
                    articles,
                    "intelligenceTypes" if bucket_key == "types" else "perspectives",
                    definition["id"],
                    decades,
                ),
            }
        )

    rows.sort(key=lambda item: (abs(item["delta"]), item["lateShare"]), reverse=True)

    return {
        "earlyWindow": early_window,
        "lateWindow": late_window,
        "rows": rows,
    }


def build_trend_highlights(type_trends: dict, perspective_trends: dict) -> list[dict]:
    rising_type = max(type_trends["rows"], key=lambda item: item["delta"])
    declining_perspective = min(perspective_trends["rows"], key=lambda item: item["delta"])
    rising_perspective = max(perspective_trends["rows"], key=lambda item: item["delta"])
    stable_bridge = min(
        [row for row in perspective_trends["rows"] if row["lateShare"] >= 0.45],
        key=lambda item: abs(item["delta"]),
    )

    return [
        {
            "title": f"{rising_type['label']} is the strongest rising intelligence frame",
            "body": (
                f"Its share grows from {round(rising_type['earlyShare'] * 100)}% of articles in "
                f"{type_trends['earlyWindow'][0]}–{type_trends['earlyWindow'][-1]} to "
                f"{round(rising_type['lateShare'] * 100)}% in {type_trends['lateWindow'][0]}–{type_trends['lateWindow'][-1]}, "
                f"suggesting a major shift toward situated and relational accounts of intelligence."
            ),
            "examples": rising_type["examples"],
        },
        {
            "title": f"{rising_perspective['label']} expands most as a way of reading intelligence",
            "body": (
                f"It rises from {round(rising_perspective['earlyShare'] * 100)}% to "
                f"{round(rising_perspective['lateShare'] * 100)}% across the two windows, showing that newer work "
                f"reads intelligence through media systems, infrastructure, and machine culture much more often than earlier work did."
            ),
            "examples": rising_perspective["examples"],
        },
        {
            "title": f"{declining_perspective['label']} recedes as the default frame",
            "body": (
                f"It drops from {round(declining_perspective['earlyShare'] * 100)}% to "
                f"{round(declining_perspective['lateShare'] * 100)}%, which helps explain why the later corpus feels less stage-based "
                f"and less anchored to classic developmental explanation."
            ),
            "examples": declining_perspective["examples"],
        },
        {
            "title": f"{stable_bridge['label']} remains the connective tissue",
            "body": (
                f"Unlike more volatile lenses, it stays high in both windows "
                f"({round(stable_bridge['earlyShare'] * 100)}% to {round(stable_bridge['lateShare'] * 100)}%), "
                f"making pedagogy the recurring bridge between older and newer concepts of intelligence."
            ),
            "examples": stable_bridge["examples"],
        },
    ]


def build_signal_trends(decades: list[str], by_decade: dict) -> dict:
    early_window = decades[:3]
    late_window = decades[-3:]
    early_total = sum(by_decade[decade]["articles"] for decade in early_window) or 1
    late_total = sum(by_decade[decade]["articles"] for decade in late_window) or 1

    rows = []
    for signal in SIGNALS:
        early_count = sum(by_decade[decade]["signals"][signal["id"]] for decade in early_window)
        late_count = sum(by_decade[decade]["signals"][signal["id"]] for decade in late_window)
        early_share = early_count / early_total
        late_share = late_count / late_total
        delta = late_share - early_share
        rows.append(
            {
                "id": signal["id"],
                "label": signal["label"],
                "earlyCount": early_count,
                "lateCount": late_count,
                "earlyShare": round(early_share, 3),
                "lateShare": round(late_share, 3),
                "delta": round(delta, 3),
                "direction": classify_delta(delta),
            }
        )

    rows.sort(key=lambda item: (abs(item["delta"]), item["lateShare"]), reverse=True)
    return {"earlyWindow": early_window, "lateWindow": late_window, "rows": rows}


def build_trend_scorecards(type_trends: dict, perspective_trends: dict, signal_trends: dict) -> dict:
    pools = {
        "rising": sorted(
            [*type_trends["rows"], *perspective_trends["rows"], *signal_trends["rows"]],
            key=lambda item: item["delta"],
            reverse=True,
        ),
        "fading": sorted(
            [*type_trends["rows"], *perspective_trends["rows"], *signal_trends["rows"]],
            key=lambda item: item["delta"],
        ),
    }

    cards = {}
    for label, rows in pools.items():
        used = set()
        compact = []
        for row in rows:
            if row["id"] in used:
                continue
            used.add(row["id"])
            compact.append(
                {
                    "id": row["id"],
                    "label": row["label"],
                    "delta": row["delta"],
                    "direction": row["direction"],
                    "earlyShare": row["earlyShare"],
                    "lateShare": row["lateShare"],
                }
            )
            if len(compact) == 5:
                break
        cards[label] = compact
    return cards


def build_blind_spots(
    type_counts: list[dict],
    perspective_counts: list[dict],
    matrix: list[dict],
    signals: list[dict],
    summary: dict,
) -> list[dict]:
    max_type_count = max(item["count"] for item in type_counts)
    max_perspective_count = max(item["count"] for item in perspective_counts)
    signal_lookup = {item["id"]: item["count"] for item in signals}
    type_lookup = {item["id"]: item["count"] for item in type_counts}
    perspective_lookup = {item["id"]: item["count"] for item in perspective_counts}

    matrix_lookup = {(item["intelligenceId"], item["perspectiveId"]): item["count"] for item in matrix}
    zero_cells = []
    sparse_cells = []
    for intelligence in INTELLIGENCE_TYPES:
        for perspective in PERSPECTIVES:
            count = matrix_lookup.get((intelligence["id"], perspective["id"]), 0)
            if count == 0:
                zero_cells.append((intelligence, perspective))
            elif count <= 3:
                sparse_cells.append((count, intelligence, perspective))

    least_type = min(type_counts, key=lambda item: item["count"])
    least_perspective = min(perspective_counts, key=lambda item: item["count"])

    entries = []
    for intelligence, perspective in zero_cells:
        entries.append(
            {
                "kind": "empty intersection",
                "title": f"No articles join {intelligence['label']} with {perspective['label']}",
                "body": (
                    f"In this corpus, the intersection is empty. That does not prove the wider field ignores it, "
                    f"but it does mark a real blind spot within the selected Studies in Art Education set."
                ),
                "contrast": f"{intelligence['label']} appears in {type_lookup[intelligence['id']]} articles overall; {perspective['label']} appears in {perspective_lookup[perspective['id']]}.",
            }
        )

    if sparse_cells:
        sparse_cells.sort(key=lambda item: item[0])
        count, intelligence, perspective = sparse_cells[0]
        entries.append(
            {
                "kind": "thin zone",
                "title": f"{intelligence['label']} rarely appears through {perspective['label']}",
                "body": (
                    f"Only {count} articles sit in this cell, which suggests the corpus makes little room for this combination "
                    f"even when both categories appear elsewhere."
                ),
                "contrast": f"The type total is {type_lookup[intelligence['id']]} and the perspective total is {perspective_lookup[perspective['id']]}.",
            }
        )

    entries.extend(
        [
            {
                "kind": "underrepresented type",
                "title": f"{least_type['label']} remains peripheral",
                "body": (
                    f"It appears in only {least_type['count']} of {summary['articleCount']} articles, far below the leading "
                    f"type count of {max_type_count}. Intelligence differences tied to giftedness, neurodiversity, or clinical framing "
                    f"are present, but not structurally central."
                ),
                "contrast": f"That is {round((least_type['count'] / summary['articleCount']) * 100)}% of the corpus.",
            },
            {
                "kind": "underrepresented perspective",
                "title": f"{least_perspective['label']} is the least-used perspective",
                "body": (
                    f"Only {least_perspective['count']} articles use this lens, compared with {max_perspective_count} for the most common one. "
                    f"That makes disability a recurring but still thin interpretive strand."
                ),
                "contrast": f"That is {round((least_perspective['count'] / summary['articleCount']) * 100)}% of the corpus.",
            },
            {
                "kind": "weak social signal",
                "title": "Equity and care are secondary signals rather than structuring themes",
                "body": (
                    f"In this coding pass, equity appears in {signal_lookup.get('equity', 0)} articles and care in "
                    f"{signal_lookup.get('care', 0)}, well below language ({signal_lookup.get('language', 0)}) and place "
                    f"({signal_lookup.get('place', 0)}). The field touches these issues more often than it centers them."
                ),
                "contrast": "The signal layer shows justice-adjacent concerns are visible, but not yet dominant organizing devices.",
            },
        ]
    )

    return entries[:6]


def build_origins(articles: list[dict], type_counts: list[dict], perspective_counts: list[dict], signals: list[dict]) -> dict:
    type_lookup = {item["id"]: item for item in INTELLIGENCE_TYPES}
    perspective_lookup = {item["id"]: item for item in PERSPECTIVES}
    signal_lookup = {item["id"]: item for item in SIGNALS}
    signal_counts = {item["id"]: item["count"] for item in signals}
    count_lookup_types = {item["id"]: item["count"] for item in type_counts}
    count_lookup_perspectives = {item["id"]: item["count"] for item in perspective_counts}

    def earliest_for(bucket_ids: list[str], key: str) -> list[dict]:
        rows = []
        for bucket_id in bucket_ids:
            matching = [article for article in articles if bucket_id in article[key]]
            if not matching:
                continue
            first = sorted(matching, key=lambda article: (article["year"], article["title"]))[0]
            if key == "intelligenceTypes":
                label = type_lookup[bucket_id]["label"]
                total = count_lookup_types[bucket_id]
            elif key == "perspectives":
                label = perspective_lookup[bucket_id]["label"]
                total = count_lookup_perspectives[bucket_id]
            else:
                label = signal_lookup[bucket_id]["label"]
                total = signal_counts.get(bucket_id, 0)
            rows.append(
                {
                    "id": bucket_id,
                    "label": label,
                    "firstYear": first["year"],
                    "firstTitle": first["title"],
                    "doi": first.get("doi"),
                    "totalCount": total,
                }
            )
        rows.sort(key=lambda item: (item["firstYear"], item["label"]))
        return rows

    return {
        "types": earliest_for([item["id"] for item in INTELLIGENCE_TYPES], "intelligenceTypes"),
        "perspectives": earliest_for([item["id"] for item in PERSPECTIVES], "perspectives"),
        "signals": earliest_for([signal["id"] for signal in SIGNALS], "signals"),
    }


def build_rare_pairs(articles: list[dict], matrix: list[dict], type_counts: list[dict], perspective_counts: list[dict]) -> list[dict]:
    type_lookup = {item["id"]: item for item in INTELLIGENCE_TYPES}
    perspective_lookup = {item["id"]: item for item in PERSPECTIVES}
    type_totals = {item["id"]: item["count"] for item in type_counts}
    perspective_totals = {item["id"]: item["count"] for item in perspective_counts}

    rows = []
    for cell in sorted(matrix, key=lambda item: (item["count"], item["intelligenceId"], item["perspectiveId"])):
        if cell["count"] > 5:
            continue
        matches = [
            article
            for article in articles
            if cell["intelligenceId"] in article["intelligenceTypes"] and cell["perspectiveId"] in article["perspectives"]
        ]
        matches = sorted(matches, key=lambda article: (article["year"], article["title"]))[:3]
        rows.append(
            {
                "count": cell["count"],
                "intelligenceId": cell["intelligenceId"],
                "intelligenceLabel": type_lookup[cell["intelligenceId"]]["label"],
                "perspectiveId": cell["perspectiveId"],
                "perspectiveLabel": perspective_lookup[cell["perspectiveId"]]["label"],
                "typeTotal": type_totals[cell["intelligenceId"]],
                "perspectiveTotal": perspective_totals[cell["perspectiveId"]],
                "examples": [{"title": article["title"], "year": article["year"]} for article in matches],
            }
        )
    return rows[:8]


def build_frontier_articles(
    articles: list[dict],
    rare_pairs: list[dict],
    signal_trends: dict,
    type_trends: dict,
    perspective_trends: dict,
) -> list[dict]:
    signal_lookup = {item["id"]: item for item in SIGNALS}
    rising_types = {row["id"] for row in type_trends["rows"] if row["delta"] >= 0.08}
    rising_perspectives = {row["id"] for row in perspective_trends["rows"] if row["delta"] >= 0.08}
    rare_pair_keys = {(item["intelligenceId"], item["perspectiveId"]) for item in rare_pairs}
    rising_signals = {row["id"] for row in signal_trends["rows"] if row["delta"] >= 0.1}

    output = []
    for article in articles:
        if article["year"] < 2020:
            continue

        score = 0
        reasons = []

        rising_type_hits = [value for value in article["intelligenceTypes"] if value in rising_types]
        score += len(rising_type_hits) * 1.5
        reasons.extend(rising_type_hits[:2])

        rising_perspective_hits = [value for value in article["perspectives"] if value in rising_perspectives]
        score += len(rising_perspective_hits) * 1.5
        reasons.extend(f"{value} lens" for value in rising_perspective_hits[:2])

        rising_signal_hits = [signal for signal in article["signals"] if signal in rising_signals]
        score += len(rising_signal_hits)
        reasons.extend(signal_lookup[signal]["label"] for signal in rising_signal_hits[:3])

        for intelligence_id in article["intelligenceTypes"]:
            for perspective_id in article["perspectives"]:
                if (intelligence_id, perspective_id) in rare_pair_keys:
                    score += 2
                    reasons.append("rare pairing")
                    break
            else:
                continue
            break

        score += max(0, article["year"] - 2020) * 0.2

        if score >= 5:
            output.append(
                {
                    "title": article["title"],
                    "year": article["year"],
                    "doi": article.get("doi"),
                    "score": round(score, 1),
                    "excerpt": article["excerpt"],
                    "reasons": reasons[:4],
                    "intelligenceTypes": article["intelligenceTypes"],
                    "perspectives": article["perspectives"],
                }
            )

    output.sort(key=lambda item: (-item["score"], -item["year"], item["title"]))
    return output[:8]


def build_top_cited(articles: list[dict]) -> list[dict]:
    ranked = sorted(
        [article for article in articles if article["citingArticlesPdf"] is not None],
        key=lambda item: (-item["citingArticlesPdf"], -(item["articleViews"] or 0), item["title"]),
    )
    return ranked[:12]


def build_summary(articles: list[dict]) -> dict:
    years = [article["year"] for article in articles if article["year"]]
    pdf_cites = [article["citingArticlesPdf"] for article in articles if article["citingArticlesPdf"] is not None]
    return {
        "articleCount": len(articles),
        "yearRange": [min(years), max(years)] if years else [None, None],
        "withPdfCitationCounts": len(pdf_cites),
        "averagePdfCitationCount": round(mean(pdf_cites), 1) if pdf_cites else None,
        "medianPageCount": sorted(article["pageCount"] for article in articles)[len(articles) // 2],
    }


def build_methods() -> list[dict]:
    return [
        {
            "title": "Corpus first",
            "body": "Each article PDF was converted to text locally with PDFKit, then coded from article titles, first-page metadata, and body text.",
        },
        {
            "title": "Plural coding",
            "body": "Articles can belong to multiple intelligence types and multiple interpretive perspectives. That avoids forcing a single, reductive category onto complex scholarship.",
        },
        {
            "title": "Context over neutrality",
            "body": "The page foregrounds where intelligence is discussed from critical, disability, community, and pedagogical perspectives rather than pretending the corpus is only psychometric.",
        },
        {
            "title": "Labor visible",
            "body": "The coding model, sources, and caveats are shown on the page so the interpretive work remains inspectable instead of hidden.",
        },
        {
            "title": "Public evidence, no export",
            "body": "The public page exposes article-level evidence cards and the codebook, but not a downloadable dataset. Because the site runs client-side on GitHub Pages, any visible evidence remains inspectable in the browser.",
        },
    ]


def build_dataset() -> dict:
    raw_records = run_extractor()
    RAW_PATH.write_text(json.dumps(raw_records, ensure_ascii=False, indent=2), encoding="utf-8")

    articles = build_articles(raw_records)
    type_counts = build_counts(articles, "intelligenceTypes")
    perspective_counts = build_counts(articles, "perspectives")
    matrix = build_matrix(articles)
    signals = build_signals(articles)
    summary = build_summary(articles)
    decades, by_decade = build_windowed_counts(articles)
    type_trends = build_trend_rows(INTELLIGENCE_TYPES, "types", decades, by_decade, articles)
    perspective_trends = build_trend_rows(PERSPECTIVES, "perspectives", decades, by_decade, articles)
    signal_trends = build_signal_trends(decades, by_decade)
    rare_pairs = build_rare_pairs(articles, matrix, type_counts, perspective_counts)

    dataset = {
        "summary": summary,
        "intelligenceTypes": INTELLIGENCE_TYPES,
        "perspectives": PERSPECTIVES,
        "articles": articles,
        "typeCounts": type_counts,
        "perspectiveCounts": perspective_counts,
        "matrix": matrix,
        "timeline": build_timeline(articles),
        "signals": signals,
        "origins": build_origins(articles, type_counts, perspective_counts, signals),
        "trends": {
            "types": type_trends,
            "perspectives": perspective_trends,
            "signals": signal_trends,
            "highlights": build_trend_highlights(type_trends, perspective_trends),
            "scorecards": build_trend_scorecards(type_trends, perspective_trends, signal_trends),
        },
        "blindSpots": build_blind_spots(type_counts, perspective_counts, matrix, signals, summary),
        "rarePairs": rare_pairs,
        "frontierArticles": build_frontier_articles(articles, rare_pairs, signal_trends, type_trends, perspective_trends),
        "topCited": build_top_cited(articles),
        "commonThreads": COMMON_THREADS,
        "methods": build_methods(),
    }
    return dataset


def main() -> None:
    ensure_data_dir()
    dataset = build_dataset()
    json_text = json.dumps(dataset, ensure_ascii=False, indent=2)
    OUTPUT_PATH.write_text(json_text, encoding="utf-8")
    OUTPUT_JS_PATH.write_text(f"window.CORPUS_DATA = {json_text};\n", encoding="utf-8")
    print(f"Wrote {OUTPUT_PATH}")
    print(f"Articles: {dataset['summary']['articleCount']}")
    print(f"Years: {dataset['summary']['yearRange'][0]}-{dataset['summary']['yearRange'][1]}")
    print("Top types:")
    for item in dataset["typeCounts"][:6]:
        print(f"  - {item['label']}: {item['count']}")
    print("Top perspectives:")
    for item in dataset["perspectiveCounts"][:6]:
        print(f"  - {item['label']}: {item['count']}")
    print("Top cited from PDF front matter:")
    for article in dataset["topCited"][:10]:
        print(f"  - {article['citingArticlesPdf']:>3} | {article['year']} | {article['title']}")


if __name__ == "__main__":
    main()
