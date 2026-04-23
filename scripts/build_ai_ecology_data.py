#!/usr/bin/env python3

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SITE_DATA = ROOT / "site" / "data"
CORPUS_JSON = SITE_DATA / "corpus.json"
OUTPUT_JSON = SITE_DATA / "ai_ecologies.json"
OUTPUT_JS = SITE_DATA / "ai-ecologies-data.js"


ARXIV_PAPERS = [
    {
        "id": "universal-intelligence",
        "title": "Universal Intelligence: A Definition of Machine Intelligence",
        "year": 2007,
        "arxivId": "0712.3329",
        "url": "https://arxiv.org/abs/0712.3329",
        "authors": "Shane Legg and Marcus Hutter",
        "cluster": "Formal definitions and benchmarks",
        "focus": "Defines machine intelligence as a general measure that can compare arbitrary machines.",
        "whyItMatters": "A foundational articulation of intelligence as formal, universal, and measurable.",
        "codes": {
            "types": ["cognitive", "digital"],
            "perspectives": ["assessment", "philosophy"],
            "definitions": ["measurable_faculty"],
            "recognition": ["testing_scoring"],
            "locations": ["mind_concepts", "media_machines"],
            "subjects": ["machines_nonhumans"],
        },
    },
    {
        "id": "measure-of-intelligence",
        "title": "On the Measure of Intelligence",
        "year": 2019,
        "arxivId": "1911.01547",
        "url": "https://arxiv.org/abs/1911.01547",
        "authors": "Francois Chollet",
        "cluster": "Formal definitions and benchmarks",
        "focus": "Argues that intelligence should be evaluated as skill-acquisition efficiency rather than raw task skill.",
        "whyItMatters": "Refines the benchmark tradition by centering generalization, priors, and data efficiency.",
        "codes": {
            "types": ["cognitive", "digital"],
            "perspectives": ["assessment", "philosophy"],
            "definitions": ["measurable_faculty"],
            "recognition": ["testing_scoring", "judgment_critique"],
            "locations": ["mind_concepts"],
            "subjects": ["machines_nonhumans"],
        },
    },
    {
        "id": "xai-survey",
        "title": "Explainable Artificial Intelligence Approaches: A Survey",
        "year": 2021,
        "arxivId": "2101.09429",
        "url": "https://arxiv.org/abs/2101.09429",
        "authors": "Sheikh Rabiul Islam, William Eberle, Sheikh Khaled Ghafoor, and Mohiuddin Ahmed",
        "cluster": "Human-centered governance",
        "focus": "Surveys explanation methods for opaque AI systems in high-stakes domains.",
        "whyItMatters": "Shows that, even in AI research, intelligence becomes socially legible only through explanation, trust, and accountability.",
        "codes": {
            "types": ["cognitive", "communicative", "digital"],
            "perspectives": ["technology", "critical"],
            "definitions": ["interpretive_meaning", "machinic_relation"],
            "recognition": ["judgment_critique", "language_reflection", "technical_fluency"],
            "locations": ["media_machines", "relations_culture"],
            "subjects": ["machines_nonhumans", "communities_publics"],
        },
    },
    {
        "id": "consciousness-general-intelligence",
        "title": "On the link between conscious function and general intelligence in humans and machines",
        "year": 2022,
        "arxivId": "2204.05133",
        "url": "https://arxiv.org/abs/2204.05133",
        "authors": "Arthur Juliani, Kai Arulkumaran, Shuntaro Sasai, and Ryota Kanai",
        "cluster": "Embodiment and cognition",
        "focus": "Links general intelligence to conscious function, attention, and adaptive learning in humans and machines.",
        "whyItMatters": "Pushes AI research beyond benchmark skill toward adaptive, embodied, and experiential cognition.",
        "codes": {
            "types": ["cognitive", "affective"],
            "perspectives": ["philosophy", "developmental", "technology"],
            "definitions": ["measurable_faculty", "embodied_attunement"],
            "recognition": ["developmental_observation", "language_reflection"],
            "locations": ["mind_concepts", "body_affect"],
            "subjects": ["machines_nonhumans"],
        },
    },
    {
        "id": "generalist-agent",
        "title": "A Generalist Agent",
        "year": 2022,
        "arxivId": "2205.06175",
        "url": "https://arxiv.org/abs/2205.06175",
        "authors": "Scott Reed and colleagues",
        "cluster": "Agents and general systems",
        "focus": "Presents a single multimodal system that can act across tasks, media, and embodiments.",
        "whyItMatters": "Turns intelligence into cross-domain action capacity rather than a single narrow skill.",
        "codes": {
            "types": ["cognitive", "perceptual", "digital"],
            "perspectives": ["technology", "assessment"],
            "definitions": ["measurable_faculty", "machinic_relation"],
            "recognition": ["testing_scoring", "technical_fluency"],
            "locations": ["media_machines"],
            "subjects": ["machines_nonhumans"],
        },
    },
    {
        "id": "sparks-of-agi",
        "title": "Sparks of Artificial General Intelligence: Early experiments with GPT-4",
        "year": 2023,
        "arxivId": "2303.12712",
        "url": "https://arxiv.org/abs/2303.12712",
        "authors": "Sebastien Bubeck and colleagues",
        "cluster": "Formal definitions and benchmarks",
        "focus": "Frames GPT-4 as exhibiting broad capabilities that resemble an early, incomplete AGI.",
        "whyItMatters": "Intelligence is treated as breadth and depth across many benchmark-like tasks, with human performance as the comparison point.",
        "codes": {
            "types": ["cognitive", "communicative", "digital"],
            "perspectives": ["technology", "assessment"],
            "definitions": ["measurable_faculty"],
            "recognition": ["testing_scoring", "language_reflection"],
            "locations": ["mind_concepts", "media_machines"],
            "subjects": ["machines_nonhumans"],
        },
    },
    {
        "id": "levels-of-agi",
        "title": "Levels of AGI for Operationalizing Progress on the Path to AGI",
        "year": 2023,
        "arxivId": "2311.02462",
        "url": "https://arxiv.org/abs/2311.02462",
        "authors": "Meredith Ringel Morris and colleagues",
        "cluster": "Formal definitions and benchmarks",
        "focus": "Builds an ontology for comparing AI systems by performance, generality, autonomy, and risk.",
        "whyItMatters": "Makes explicit how AI research organizes intelligence as a staged hierarchy of capability and deployment.",
        "codes": {
            "types": ["cognitive", "digital"],
            "perspectives": ["assessment", "philosophy"],
            "definitions": ["measurable_faculty"],
            "recognition": ["testing_scoring", "judgment_critique"],
            "locations": ["mind_concepts", "relations_culture"],
            "subjects": ["machines_nonhumans", "communities_publics"],
        },
    },
    {
        "id": "interactive-agent-foundation-model",
        "title": "An Interactive Agent Foundation Model",
        "year": 2024,
        "arxivId": "2402.05929",
        "url": "https://arxiv.org/abs/2402.05929",
        "authors": "Zane Durante and colleagues",
        "cluster": "Agents and general systems",
        "focus": "Unifies agent training across robotics, games, healthcare, and multimodal data.",
        "whyItMatters": "Recasts intelligence as action-taking generality across domains rather than isolated model performance.",
        "codes": {
            "types": ["cognitive", "perceptual", "digital"],
            "perspectives": ["technology"],
            "definitions": ["machinic_relation", "measurable_faculty"],
            "recognition": ["technical_fluency", "testing_scoring"],
            "locations": ["media_machines"],
            "subjects": ["machines_nonhumans"],
        },
    },
    {
        "id": "magentic-one",
        "title": "Magentic-One: A Generalist Multi-Agent System for Solving Complex Tasks",
        "year": 2024,
        "arxivId": "2411.04468",
        "url": "https://arxiv.org/abs/2411.04468",
        "authors": "Adam Fourney and colleagues",
        "cluster": "Agents and general systems",
        "focus": "Describes a modular multi-agent system that plans, delegates, and recovers from errors across benchmarks.",
        "whyItMatters": "Intelligence becomes orchestration: coordinating many specialized agents into a broader system.",
        "codes": {
            "types": ["cognitive", "communicative", "digital", "social"],
            "perspectives": ["technology", "assessment"],
            "definitions": ["machinic_relation", "situated_practice"],
            "recognition": ["technical_fluency", "testing_scoring", "participation_relation"],
            "locations": ["media_machines", "relations_culture"],
            "subjects": ["machines_nonhumans", "communities_publics"],
        },
    },
    {
        "id": "embodied-intelligence-survey",
        "title": "A Survey: Learning Embodied Intelligence from Physical Simulators and World Models",
        "year": 2025,
        "arxivId": "2507.00917",
        "url": "https://arxiv.org/abs/2507.00917",
        "authors": "Xiaoxiao Long and colleagues",
        "cluster": "Embodiment and cognition",
        "focus": "Surveys embodied intelligence through simulators, world models, planning, and real-world interaction.",
        "whyItMatters": "Provides the strongest arXiv bridge from abstract intelligence to environment-grounded perception and action.",
        "codes": {
            "types": ["perceptual", "affective", "digital"],
            "perspectives": ["technology", "developmental"],
            "definitions": ["embodied_attunement", "machinic_relation"],
            "recognition": ["technical_fluency", "participation_relation"],
            "locations": ["body_affect", "media_machines", "place_ecology"],
            "subjects": ["machines_nonhumans"],
        },
    },
    {
        "id": "ai4research",
        "title": "AI4Research: A Survey of Artificial Intelligence for Scientific Research",
        "year": 2025,
        "arxivId": "2507.01903",
        "url": "https://arxiv.org/abs/2507.01903",
        "authors": "Qiguang Chen and colleagues",
        "cluster": "Research automation",
        "focus": "Surveys systems that aim to automate parts of scientific research workflows across disciplines.",
        "whyItMatters": "Extends the ambition of intelligence from task solving to knowledge production itself.",
        "codes": {
            "types": ["cognitive", "communicative", "digital"],
            "perspectives": ["technology", "community"],
            "definitions": ["machinic_relation", "measurable_faculty"],
            "recognition": ["technical_fluency", "judgment_critique", "language_reflection"],
            "locations": ["media_machines", "relations_culture"],
            "subjects": ["machines_nonhumans", "communities_publics"],
        },
    },
]


BRIDLE_SOURCES = [
    {
        "id": "umwelt-extract",
        "title": "Ways of Being (published extract)",
        "year": 2022,
        "source": "Published extract PDF",
        "url": "https://volumesofvalue.com/wp-content/uploads/2023/03/ways-of-being-extract.pdf",
        "focus": "Uses the self-driving car to explain Umwelt as a situated perceptual world that humans can partly share with machines.",
        "relevance": "This is the clearest bridge between AI perception and a more-than-human account of intelligence as entangled world-making.",
    },
    {
        "id": "ways-of-being-book",
        "title": "Ways of Being",
        "year": 2022,
        "source": "James Bridle",
        "url": "https://jamesbridle.com/books/ways-of-being",
        "focus": "Frames AI, animals, plants, and natural systems as plural intelligences demanding a wider ecology of relation.",
        "relevance": "Provides the page's key turn away from singular intelligence toward solidarity, cognitive diversity, and more-than-human coexistence.",
    },
    {
        "id": "through-other-eyes",
        "title": "Through Other Eyes",
        "year": 2019,
        "source": "James Bridle",
        "url": "https://www.jamesbridle.com/works/through-other-eyes",
        "focus": "Explores machine intelligence and non-human vision together, asking how perception changes when vision exceeds the human sensorium.",
        "relevance": "Helps connect machine perception to artistic and ecological shifts in what counts as seeing and thinking.",
    },
    {
        "id": "se-ti-sabir",
        "title": "Se ti sabir",
        "year": 2019,
        "source": "James Bridle",
        "url": "https://jamesbridle.com/works/se-ti-sabir",
        "focus": "Reflects on language, intelligence, new technologies, and non-human species as problems of mutual understanding.",
        "relevance": "Recasts intelligence as translation, encounter, and negotiated coexistence rather than mastery.",
    },
]


UMWELT_SOURCES = [
    {
        "id": "britannica-umwelt",
        "title": "Umwelt",
        "source": "Encyclopaedia Britannica",
        "url": "https://www.britannica.com/topic/Umwelt",
        "summary": "Defines Umwelt as an organism's unique sensory world, making intelligence inseparable from species-specific perception.",
    },
    {
        "id": "bridle-umwelt",
        "title": "Bridle's machine Umwelt",
        "source": "Ways of Being extract",
        "url": "https://volumesofvalue.com/wp-content/uploads/2023/03/ways-of-being-extract.pdf",
        "summary": "Bridle extends Umwelt to machine perception: a self-driving car builds a partial world through the road features it can sense and act upon.",
    },
]


IMPLICATIONS = [
    {
        "title": "Teach intelligence as situated perception, not just performance",
        "body": "If every intelligence operates through an Umwelt, then art education can treat perception as partial, embodied, and world-making rather than neutral observation.",
    },
    {
        "title": "Use studio practice to render machine perception visible and contestable",
        "body": "Bridle's autonomous-car experiments suggest that art can make machine worlds legible, strange, and open to intervention instead of leaving them opaque.",
    },
    {
        "title": "Shift assessment from ranking minds to tracing relations",
        "body": "The AI literature often validates intelligence through benchmarks, while the art-education corpus offers making, critique, and participation as alternative evidentiary forms.",
    },
    {
        "title": "Expand art education toward multispecies and more-than-human cognition",
        "body": "An ecological understanding of intelligence invites curricula that include plants, animals, materials, climates, and infrastructures as thinking partners and not just backdrops.",
    },
    {
        "title": "Treat AI literacy as ecological literacy",
        "body": "Students need to understand not only model outputs but the sensory limits, training worlds, infrastructures, and power relations that shape what AI can perceive and decide.",
    },
]


AXES = [
    {
        "id": "benchmark",
        "label": "Benchmark and measurability",
        "components": [("definitions", "measurable_faculty"), ("recognition", "testing_scoring"), ("perspectives", "assessment")],
        "description": "How strongly intelligence is framed as something that can be ranked, scored, or operationalized through general measures.",
    },
    {
        "id": "relation",
        "label": "Relation and situated practice",
        "components": [
            ("definitions", "situated_practice"),
            ("recognition", "participation_relation"),
            ("locations", "relations_culture"),
            ("perspectives", "community"),
        ],
        "description": "How strongly intelligence is framed as emerging in participation, relation, and sociocultural practice.",
    },
    {
        "id": "making",
        "label": "Making, interpretation, and critique",
        "components": [
            ("definitions", "creative_capacity"),
            ("definitions", "interpretive_meaning"),
            ("recognition", "making_performance"),
            ("recognition", "judgment_critique"),
            ("types", "creative"),
            ("types", "communicative"),
        ],
        "description": "How strongly intelligence is understood through creation, interpretation, symbolic work, and critical response.",
    },
    {
        "id": "machinic",
        "label": "Machinic and agentic intelligence",
        "components": [
            ("definitions", "machinic_relation"),
            ("locations", "media_machines"),
            ("types", "digital"),
            ("perspectives", "technology"),
            ("subjects", "machines_nonhumans"),
        ],
        "description": "How strongly intelligence is centered in computational systems, agents, infrastructures, and machine perception.",
    },
    {
        "id": "ecology",
        "label": "Embodiment, place, and ecological entanglement",
        "components": [
            ("definitions", "embodied_attunement"),
            ("locations", "body_affect"),
            ("locations", "place_ecology"),
            ("types", "affective"),
            ("perspectives", "community"),
        ],
        "description": "How strongly intelligence is grounded in bodies, environments, and more-than-human entanglement.",
    },
]


SECTION_NOTES = {
    "definitions": "The clearest definitional split is between intelligence as measurable general capability in the AI sample and intelligence as situated, creative, and interpretive practice in the art-education corpus.",
    "recognition": "AI papers mostly validate intelligence through benchmarks, agentic task success, and technical fluency. Art education more often recognizes intelligence through development, making, critique, and participation.",
    "locations": "AI research locates intelligence largely in models, representations, and machine environments. The art-education corpus distributes it across relations, classrooms, materials, bodies, and ecologies.",
    "types": "Both corpora retain a cognitive strand, but the art-education corpus broadens intelligence into social, communicative, perceptual, and affective modes far more often than the AI sample does.",
    "perspectives": "AI papers are dominated by technology and assessment. The art-education corpus remains pedagogical, developmental, philosophical, and, at its edges, critical and community-based.",
    "subjects": "The AI sample centers machines and agents, with publics appearing mainly as evaluators, users, or beneficiaries. The art-education corpus centers children, teachers, makers, and communities, while more-than-human subjects remain emergent rather than dominant.",
}


def load_corpus() -> dict:
    return json.loads(CORPUS_JSON.read_text(encoding="utf-8"))


def family_lookup(corpus: dict) -> dict:
    return {
        "definitions": {item["id"]: item["label"] for item in corpus["definitionFrames"]},
        "recognition": {item["id"]: item["label"] for item in corpus["recognitionModes"]},
        "locations": {item["id"]: item["label"] for item in corpus["locationFrames"]},
        "types": {item["id"]: item["label"] for item in corpus["intelligenceTypes"]},
        "perspectives": {item["id"]: item["label"] for item in corpus["perspectives"]},
        "subjects": {item["id"]: item["label"] for item in corpus["subjectFrames"]},
    }


def art_rows_for_family(corpus: dict, family: str) -> list[dict]:
    if family == "definitions":
        rows = corpus["conceptualQuestions"]["definitions"]["counts"]
    elif family == "recognition":
        rows = corpus["conceptualQuestions"]["recognition"]["counts"]
    elif family == "locations":
        rows = corpus["conceptualQuestions"]["locations"]["counts"]
    elif family == "subjects":
        rows = corpus["conceptualQuestions"]["subjects"]["counts"]
    elif family == "types":
        rows = corpus["typeCounts"]
    elif family == "perspectives":
        rows = corpus["perspectiveCounts"]
    else:
        raise ValueError(f"Unknown family {family}")

    total = corpus["summary"]["articleCount"]
    return [{"id": row["id"], "count": row["count"], "share": round(row["count"] / total, 4)} for row in rows]


def ai_rows_for_family(family: str) -> list[dict]:
    counts: dict[str, int] = {}
    total = len(ARXIV_PAPERS)
    key = family
    for paper in ARXIV_PAPERS:
        for value in paper["codes"][key]:
            counts[value] = counts.get(value, 0) + 1
    return [{"id": row_id, "count": count, "share": round(count / total, 4)} for row_id, count in sorted(counts.items())]


def merge_family_rows(corpus: dict, family: str) -> dict:
    labels = family_lookup(corpus)[family]
    art_lookup = {row["id"]: row for row in art_rows_for_family(corpus, family)}
    ai_lookup = {row["id"]: row for row in ai_rows_for_family(family)}
    ids = sorted(set(art_lookup) | set(ai_lookup), key=lambda item: labels.get(item, item))
    rows = []
    for item_id in ids:
        art = art_lookup.get(item_id, {"count": 0, "share": 0})
        ai = ai_lookup.get(item_id, {"count": 0, "share": 0})
        rows.append(
            {
                "id": item_id,
                "label": labels.get(item_id, item_id.replace("_", " ")),
                "artCount": art["count"],
                "artShare": art["share"],
                "aiCount": ai["count"],
                "aiShare": ai["share"],
                "delta": round(ai["share"] - art["share"], 4),
            }
        )

    rows.sort(key=lambda item: max(item["artShare"], item["aiShare"]), reverse=True)
    gaps = sorted(rows, key=lambda item: abs(item["delta"]), reverse=True)[:6]
    overlap = sorted(rows, key=lambda item: min(item["artShare"], item["aiShare"]), reverse=True)[:5]
    return {"rows": rows, "gaps": gaps, "overlap": overlap, "note": SECTION_NOTES[family]}


def axis_score(components: list[tuple[str, str]], comparison: dict) -> tuple[float, float]:
    art_values = []
    ai_values = []
    for family, item_id in components:
        row = next((row for row in comparison[family]["rows"] if row["id"] == item_id), None)
        art_values.append(row["artShare"] if row else 0)
        ai_values.append(row["aiShare"] if row else 0)
    art_score = round(sum(art_values) / len(art_values), 4)
    ai_score = round(sum(ai_values) / len(ai_values), 4)
    return art_score, ai_score


def build_axes(comparison: dict) -> list[dict]:
    axes = []
    for axis in AXES:
        art_score, ai_score = axis_score(axis["components"], comparison)
        axes.append(
            {
                "id": axis["id"],
                "label": axis["label"],
                "description": axis["description"],
                "artScore": art_score,
                "aiScore": ai_score,
                "delta": round(ai_score - art_score, 4),
            }
        )
    axes.sort(key=lambda item: abs(item["delta"]), reverse=True)
    return axes


def build_cluster_summary() -> list[dict]:
    counts: dict[str, int] = {}
    papers_by_cluster: dict[str, list[dict]] = {}
    for paper in ARXIV_PAPERS:
        cluster = paper["cluster"]
        counts[cluster] = counts.get(cluster, 0) + 1
        papers_by_cluster.setdefault(cluster, []).append({"title": paper["title"], "year": paper["year"]})
    return [
        {"label": label, "count": counts[label], "papers": sorted(papers_by_cluster[label], key=lambda item: (item["year"], item["title"]))}
        for label in sorted(counts, key=lambda item: (-counts[item], item))
    ]


def build_rethinking_moves() -> list[dict]:
    return [
        {
            "title": "From universal measure to situated world",
            "body": "The benchmark tradition asks how broadly and efficiently a system solves tasks. Umwelt asks what world becomes available to that system in the first place.",
        },
        {
            "title": "From autonomous agent to shared environment",
            "body": "Agent papers emphasize planning, delegation, and task completion. Bridle's machine Umwelt turns the question toward partial overlap: where do human and machine worlds meet, and where do they fail to meet?",
        },
        {
            "title": "From singular intelligence to plural intelligences",
            "body": "The arXiv sample repeatedly pursues general intelligence, while Bridle and the art-education corpus both open toward multiple intelligences distributed across bodies, materials, ecologies, and publics.",
        },
        {
            "title": "From domination to cohabitation",
            "body": "Once intelligence is understood ecologically, the goal is not merely to optimize or outcompete, but to learn how different beings sense, act, and live together without reducing everything to one standard.",
        },
    ]


def top_row(rows: list[dict], key: str) -> dict:
    return max(rows, key=lambda item: item[key])


def build_takeaways(comparison: dict) -> list[dict]:
    definitions = comparison["definitions"]["rows"]
    recognition = comparison["recognition"]["rows"]
    locations = comparison["locations"]["rows"]
    subjects = comparison["subjects"]["rows"]

    ai_def = top_row(definitions, "aiShare")
    art_def = top_row(definitions, "artShare")
    ai_rec = top_row(recognition, "aiShare")
    art_rec = top_row(recognition, "artShare")
    ai_loc = top_row(locations, "aiShare")
    art_loc = top_row(locations, "artShare")
    ai_subj = top_row(subjects, "aiShare")
    art_subj = top_row(subjects, "artShare")

    return [
        {
            "title": "AI research still leans toward general measure",
            "body": f"In the curated arXiv sample, the strongest definition frame is {ai_def['label']}, while the art-education corpus is led by {art_def['label']}.",
        },
        {
            "title": "Validation methods diverge sharply",
            "body": f"The AI sample most often recognizes intelligence {ai_rec['label'].lower()}, while the art-education corpus most often recognizes it {art_rec['label'].lower()}.",
        },
        {
            "title": "Location matters",
            "body": f"AI research most often locates intelligence {ai_loc['label'].lower()}, whereas the art-education corpus most strongly locates it {art_loc['label'].lower()}.",
        },
        {
            "title": "The centered subject changes the whole picture",
            "body": f"The AI sample overwhelmingly centers {ai_subj['label'].lower()}, while the art-education corpus centers {art_subj['label'].lower()}.",
        },
    ]


def build_dataset() -> dict:
    corpus = load_corpus()
    comparison = {family: merge_family_rows(corpus, family) for family in ["definitions", "recognition", "locations", "types", "perspectives", "subjects"]}
    axes = build_axes(comparison)
    takeaways = build_takeaways(comparison)

    return {
        "updated": "2026-04-23",
        "sourceBoundary": "External comparative research page. It combines a curated arXiv sample on intelligence in AI research with James Bridle and Umwelt sources, then compares those materials against the local Studies in Art Education corpus.",
        "methodNote": "This is a curated comparative review, not an exhaustive scrape of all arXiv papers mentioning intelligence. The arXiv sample was selected to cover major strands in contemporary AI discourse: formal definition, benchmarking, generalist agents, explainability, embodiment, and research automation.",
        "heroStats": {
            "arxivPaperCount": len(ARXIV_PAPERS),
            "arxivYearRange": [min(item["year"] for item in ARXIV_PAPERS), max(item["year"] for item in ARXIV_PAPERS)],
            "artCorpusArticles": corpus["summary"]["articleCount"],
            "comparisonFamilies": 6,
        },
        "arxivPapers": ARXIV_PAPERS,
        "clusters": build_cluster_summary(),
        "comparison": comparison,
        "axes": axes,
        "takeaways": takeaways,
        "umwelt": {
            "sources": UMWELT_SOURCES,
            "bridleSources": BRIDLE_SOURCES,
            "moves": build_rethinking_moves(),
            "note": "Umwelt shifts intelligence from a universal ladder to a situated perceptual world. Bridle uses that shift to think machine perception alongside animal, plant, and ecological intelligence rather than above or outside them.",
        },
        "implications": IMPLICATIONS,
        "references": [
            {"title": item["title"], "type": "arXiv", "url": item["url"]} for item in ARXIV_PAPERS
        ]
        + [{"title": item["title"], "type": item["source"], "url": item["url"]} for item in BRIDLE_SOURCES]
        + [{"title": item["title"], "type": item["source"], "url": item["url"]} for item in UMWELT_SOURCES],
    }


def main() -> None:
    dataset = build_dataset()
    OUTPUT_JSON.write_text(json.dumps(dataset, indent=2), encoding="utf-8")
    OUTPUT_JS.write_text(f"window.AI_ECOLOGIES_DATA = {json.dumps(dataset, indent=2)};\n", encoding="utf-8")
    print(f"Wrote {OUTPUT_JSON}")
    print(f"Wrote {OUTPUT_JS}")
    print(f"Curated arXiv papers: {len(dataset['arxivPapers'])}")
    print(f"Art corpus articles compared: {dataset['heroStats']['artCorpusArticles']}")


if __name__ == "__main__":
    main()
