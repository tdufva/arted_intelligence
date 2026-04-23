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


DEFINITION_FRAMES = [
    {
        "id": "measurable_faculty",
        "label": "As measurable faculty",
        "description": "Intelligence is defined as an ability that can be tested, scored, staged, or compared.",
        "cues": ["ability", "measurement", "score", "developmental stage"],
        "keywords": [
            r"\bability\b",
            r"\babilities\b",
            r"\bmeasure",
            r"\bmeasurement\b",
            r"\bscore\b",
            r"\bpsychometric\b",
            r"\bintelligence test\b",
            r"\biq\b",
            r"\bcriteria\b",
            r"\bdevelopmental stage\b",
        ],
    },
    {
        "id": "creative_capacity",
        "label": "As creative capacity",
        "description": "Intelligence is defined as imagination, originality, invention, or creative production.",
        "cues": ["creativity", "imagination", "divergence", "originality"],
        "keywords": [
            r"\bcreativ",
            r"\bimagin",
            r"\bdivergent\b",
            r"\boriginality\b",
            r"\binvention\b",
            r"\bartistic creativity\b",
        ],
    },
    {
        "id": "perceptual_sensitivity",
        "label": "As perceptual sensitivity",
        "description": "Intelligence is defined as heightened seeing, perception, differentiation, or visual sensitivity.",
        "cues": ["perception", "seeing", "differentiation", "visual sensitivity"],
        "keywords": [
            r"\bpercept",
            r"\bseeing\b",
            r"\bvisual[- ]spatial\b",
            r"\bdifferentiat",
            r"\bsensitivity\b",
            r"\baesthetic perception\b",
            r"\battention\b",
        ],
    },
    {
        "id": "interpretive_meaning",
        "label": "As symbolic / interpretive meaning-making",
        "description": "Intelligence is defined through language, interpretation, criticism, and symbolic meaning.",
        "cues": ["language", "meaning", "semiotics", "criticism"],
        "keywords": [
            r"\blanguage\b",
            r"\bmeaning\b",
            r"\bsemiotic\b",
            r"\bmetaphor\b",
            r"\bcriticism\b",
            r"\bresponding\b",
            r"\bconversation\b",
        ],
    },
    {
        "id": "situated_practice",
        "label": "As situated social / cultural practice",
        "description": "Intelligence is defined as relational, cultural, communal, or identity-based practice.",
        "cues": ["culture", "community", "identity", "relation"],
        "keywords": [
            r"\bsocial\b",
            r"\bcultural\b",
            r"\bcommunity\b",
            r"\bidentity\b",
            r"\brelational\b",
            r"\bcollective\b",
            r"\bsocial justice\b",
        ],
    },
    {
        "id": "embodied_attunement",
        "label": "As embodied / affective attunement",
        "description": "Intelligence is defined as affective, tacit, bodily, mindful, or emotionally attuned knowing.",
        "cues": ["embodiment", "affect", "tacit knowing", "emotion"],
        "keywords": [
            r"\bembod",
            r"\baffect",
            r"\btacit\b",
            r"\bemotion",
            r"\bmindful",
            r"\bself-efficacy\b",
            r"\bresilien",
        ],
    },
    {
        "id": "machinic_relation",
        "label": "As technological / machinic relation",
        "description": "Intelligence is defined through digital media, computation, AI, and human-machine relation.",
        "cues": ["digital media", "computation", "AI", "machine relation"],
        "keywords": [
            r"\bcomputer",
            r"\bcomputing\b",
            r"\bdigital\b",
            r"\bartificial intelligence\b",
            r"\bai\b",
            r"\bmachine\b",
            r"\bnetwork\b",
            r"\bgame\b",
            r"\bsynthography\b",
        ],
    },
]


RECOGNITION_MODES = [
    {
        "id": "testing_scoring",
        "label": "Through tests and scores",
        "description": "Intelligence becomes visible through instruments, scores, measurement, and assessment.",
        "cues": ["tests", "scores", "measurement", "instrument"],
        "keywords": [r"\btest", r"\bscore\b", r"\bmeasurement\b", r"\binstrument\b", r"\bassessment\b", r"\bcriteria\b"],
    },
    {
        "id": "developmental_observation",
        "label": "Through developmental observation",
        "description": "Intelligence is recognized through observation of stages, growth, personality, or developmental change.",
        "cues": ["development", "observation", "growth", "personality"],
        "keywords": [r"\bdevelopment", r"\bobserve", r"\bgrowth\b", r"\bpersonality\b", r"\blongitudinal\b", r"\bstage\b"],
    },
    {
        "id": "making_performance",
        "label": "Through artworks and making",
        "description": "Intelligence is recognized in drawing, studio work, artmaking, or produced artifacts.",
        "cues": ["drawing", "artmaking", "studio practice", "production"],
        "keywords": [
            r"\bdrawing",
            r"\bartwork",
            r"\bart making\b",
            r"\bartmaking\b",
            r"\bstudio\b",
            r"\bproduction\b",
            r"\bpractice\b",
            r"\bportfolio\b",
        ],
    },
    {
        "id": "judgment_critique",
        "label": "Through judgment and critique",
        "description": "Intelligence is recognized through evaluation, criticism, judgment, or critique.",
        "cues": ["judgment", "critique", "evaluation", "criticism"],
        "keywords": [r"\bjudg", r"\bcriticism\b", r"\bcritique\b", r"\bevaluat", r"\breview\b"],
    },
    {
        "id": "language_reflection",
        "label": "Through language and reflection",
        "description": "Intelligence is recognized through talk, writing, verbal explanation, interview, and reflection.",
        "cues": ["language", "verbal explanation", "interview", "reflection"],
        "keywords": [
            r"\blanguage\b",
            r"\bverbal",
            r"\binterview\b",
            r"\bconversation\b",
            r"\breflect",
            r"\bresponding\b",
            r"\bnarrative\b",
        ],
    },
    {
        "id": "participation_relation",
        "label": "Through participation and relation",
        "description": "Intelligence is recognized through participation, collaboration, community membership, or public engagement.",
        "cues": ["participation", "collaboration", "community", "engagement"],
        "keywords": [
            r"\bparticipat",
            r"\bcollabor",
            r"\bcommunity\b",
            r"\bengagement\b",
            r"\bpublic\b",
            r"\bdialog",
            r"\bcollective\b",
            r"\bmuseum\b",
        ],
    },
    {
        "id": "technical_fluency",
        "label": "Through media and technical fluency",
        "description": "Intelligence is recognized through digital, media, computational, or AI-enabled fluency.",
        "cues": ["digital", "media fluency", "computation", "AI"],
        "keywords": [r"\bcomputer", r"\bdigital\b", r"\bmedia\b", r"\bfilm\b", r"\bgame\b", r"\bai\b", r"\bartificial intelligence\b"],
    },
]


LOCATION_FRAMES = [
    {
        "id": "mind_concepts",
        "label": "In the mind and concepts",
        "description": "Intelligence is located in cognition, concepts, intellect, and mental processing.",
        "cues": ["cognition", "concepts", "intellect", "understanding"],
        "keywords": [r"\bcognit", r"\bconcept", r"\bintellect", r"\bmental\b", r"\bthinking\b", r"\bunderstanding\b"],
    },
    {
        "id": "vision_perception",
        "label": "In vision and perception",
        "description": "Intelligence is located in seeing, visual-spatial reasoning, attention, and perceptual sensitivity.",
        "cues": ["seeing", "vision", "attention", "perception"],
        "keywords": [r"\bpercept", r"\bseeing\b", r"\bvisual\b", r"\battention\b", r"\baesthetic perception\b"],
    },
    {
        "id": "body_affect",
        "label": "In the body and affect",
        "description": "Intelligence is located in emotion, embodiment, tacit knowing, and affective attunement.",
        "cues": ["body", "emotion", "affect", "tacit knowing"],
        "keywords": [r"\bembod", r"\bemotion", r"\baffect", r"\btacit\b", r"\bmindful", r"\bstress\b"],
    },
    {
        "id": "artworks_materials",
        "label": "In artworks and materials",
        "description": "Intelligence is located in images, drawings, artifacts, materials, and studio practice.",
        "cues": ["artworks", "drawings", "materials", "studio practice"],
        "keywords": [
            r"\bdrawing",
            r"\bartwork",
            r"\bimage\b",
            r"\bmaterial",
            r"\bstudio\b",
            r"\bobject\b",
            r"\bpractice\b",
        ],
    },
    {
        "id": "relations_culture",
        "label": "In relations and culture",
        "description": "Intelligence is located in social relations, cultural life, identity, and community.",
        "cues": ["relations", "culture", "identity", "community"],
        "keywords": [r"\bsocial\b", r"\bcultural\b", r"\bcommunity\b", r"\bidentity\b", r"\brelational\b", r"\bcollective\b"],
    },
    {
        "id": "pedagogical_institutions",
        "label": "In classrooms and pedagogical systems",
        "description": "Intelligence is located in teaching, curriculum, classrooms, and educational institutions.",
        "cues": ["classroom", "curriculum", "teaching", "school"],
        "keywords": [r"\bcurriculum\b", r"\bclassroom\b", r"\bteaching\b", r"\bteacher\b", r"\bschool\b", r"\binstruction\b"],
    },
    {
        "id": "media_machines",
        "label": "In media and machines",
        "description": "Intelligence is located in digital systems, media infrastructures, computation, and AI.",
        "cues": ["digital systems", "media", "computation", "AI"],
        "keywords": [r"\bcomputer", r"\bdigital\b", r"\bmedia\b", r"\bai\b", r"\bartificial intelligence\b", r"\bnetwork\b"],
    },
    {
        "id": "place_ecology",
        "label": "In place and ecology",
        "description": "Intelligence is located in place, ecology, environment, and nonhuman relation.",
        "cues": ["place", "ecology", "environment", "nonhuman"],
        "keywords": [r"\bplace\b", r"\becology\b", r"\benvironment", r"\bnonhuman\b", r"\banimal", r"\brelational world\b"],
    },
]


SUBJECT_FRAMES = [
    {
        "id": "children_students",
        "label": "Children and students",
        "description": "Intelligence is most explicitly attached to children, students, adolescents, and learners.",
        "cues": ["children", "students", "adolescents", "learners"],
        "keywords": [r"\bchildren\b", r"\bchild\b", r"\bstudent", r"\blearner", r"\badolescent", r"\bpreschool"],
    },
    {
        "id": "teachers_educators",
        "label": "Teachers and educators",
        "description": "Intelligence is centered in teachers, preservice educators, and professional pedagogical formation.",
        "cues": ["teachers", "preservice", "educators", "professional formation"],
        "keywords": [r"\bteacher", r"\bpreservice\b", r"\beducator", r"\bfaculty\b"],
    },
    {
        "id": "artists_makers",
        "label": "Artists and makers",
        "description": "Intelligence is centered in artists, designers, practitioners, or makers.",
        "cues": ["artists", "designers", "practitioners", "makers"],
        "keywords": [r"\bartist", r"\bdesigner", r"\bpractitioner", r"\bmaker", r"\bmakers\b"],
    },
    {
        "id": "communities_publics",
        "label": "Communities and publics",
        "description": "Intelligence is centered in communities, museum publics, families, and lifelong learners beyond the classroom.",
        "cues": ["communities", "publics", "museum visitors", "older adults"],
        "keywords": [r"\bcommunity\b", r"\bpublic\b", r"\bmuseum\b", r"\bfamil", r"\bolder adults\b", r"\blifelong\b"],
    },
    {
        "id": "disabled_gifted_subjects",
        "label": "Gifted, disabled, and neurodiverse subjects",
        "description": "Intelligence is centered in gifted, disabled, autistic, or otherwise neurodiverse subjects.",
        "cues": ["giftedness", "disability", "autism", "neurodiversity"],
        "keywords": [
            r"\bgifted\b",
            r"\btalented\b",
            r"\bdisabil",
            r"\bautis",
            r"\bhearing impaired\b",
            r"\bneuro",
        ],
    },
    {
        "id": "identity_marked_subjects",
        "label": "Identity-marked and marginalized subjects",
        "description": "Intelligence is centered in subjects marked by race, gender, sexuality, decoloniality, or other identity positions.",
        "cues": ["race", "gender", "queer", "decoloniality"],
        "keywords": [r"\bracial\b", r"\bqueer", r"\bgender\b", r"\bfeminis", r"\bdecolon", r"\bmulticultural\b", r"\bindigenous\b"],
    },
    {
        "id": "machines_nonhumans",
        "label": "Machines and nonhumans",
        "description": "Intelligence is centered in AI, machines, nonhuman animals, or more-than-human agencies.",
        "cues": ["AI", "machines", "nonhuman", "animals"],
        "keywords": [r"\bai\b", r"\bartificial intelligence\b", r"\bmachine\b", r"\bnonhuman\b", r"\banimal", r"\balgorithm\b"],
    },
]


CONCEPTUAL_FAMILIES = [
    {
        "id": "definitions",
        "articleKey": "definitionFrames",
        "bucketKey": "definitions",
        "title": "How intelligence is defined",
        "noun": "definition frame",
        "definitions": DEFINITION_FRAMES,
    },
    {
        "id": "recognition",
        "articleKey": "recognitionModes",
        "bucketKey": "recognition",
        "title": "How intelligence is recognized",
        "noun": "recognition mode",
        "definitions": RECOGNITION_MODES,
    },
    {
        "id": "locations",
        "articleKey": "locationFrames",
        "bucketKey": "locations",
        "title": "Where intelligence is located",
        "noun": "location frame",
        "definitions": LOCATION_FRAMES,
    },
    {
        "id": "subjects",
        "articleKey": "subjectFrames",
        "bucketKey": "subjects",
        "title": "Whose intelligence counts",
        "noun": "subject position",
        "definitions": SUBJECT_FRAMES,
    },
]


ALL_FAMILY_SPECS = [
    {
        "id": "types",
        "articleKey": "intelligenceTypes",
        "bucketKey": "types",
        "definitions": INTELLIGENCE_TYPES,
        "label": "Types",
    },
    {
        "id": "perspectives",
        "articleKey": "perspectives",
        "bucketKey": "perspectives",
        "definitions": PERSPECTIVES,
        "label": "Perspectives",
    },
    {
        "id": "signals",
        "articleKey": "signals",
        "bucketKey": "signals",
        "definitions": SIGNALS,
        "label": "Signals",
    },
    *CONCEPTUAL_FAMILIES,
]


VALIDATION_FAMILY_SPECS = [spec for spec in ALL_FAMILY_SPECS if spec["id"] != "signals"]


GOLD_SAMPLE = {
    "A Nonverbal Ability Test": {
        "intelligenceTypes": ["communicative", "cognitive"],
        "perspectives": ["assessment"],
        "definitionFrames": ["measurable_faculty"],
        "recognitionModes": ["testing_scoring"],
        "locationFrames": ["mind_concepts"],
        "subjectFrames": ["children_students"],
    },
    "A Typology of Creativity in the Visual Arts": {
        "intelligenceTypes": ["creative", "cognitive"],
        "perspectives": ["philosophy"],
        "definitionFrames": ["creative_capacity"],
        "recognitionModes": ["judgment_critique"],
        "locationFrames": ["mind_concepts", "artworks_materials"],
        "subjectFrames": ["artists_makers"],
    },
    "Learning in and through the Arts: The Question of Transfer": {
        "intelligenceTypes": ["cognitive", "creative"],
        "perspectives": ["pedagogy"],
        "definitionFrames": ["measurable_faculty", "creative_capacity"],
        "recognitionModes": ["language_reflection", "making_performance"],
        "locationFrames": ["pedagogical_institutions", "mind_concepts"],
        "subjectFrames": ["children_students", "teachers_educators"],
    },
    "The Meaning of Transfer in the Practices of Arts Education": {
        "intelligenceTypes": ["cognitive", "social"],
        "perspectives": ["pedagogy"],
        "definitionFrames": ["interpretive_meaning", "situated_practice"],
        "recognitionModes": ["language_reflection", "participation_relation"],
        "locationFrames": ["pedagogical_institutions", "relations_culture"],
        "subjectFrames": ["teachers_educators"],
    },
    "Visual Culture, Visual Brain, and (Art) Education": {
        "intelligenceTypes": ["perceptual", "cognitive", "digital"],
        "perspectives": ["technology", "philosophy"],
        "definitionFrames": ["perceptual_sensitivity", "machinic_relation"],
        "recognitionModes": ["technical_fluency", "language_reflection"],
        "locationFrames": ["vision_perception", "media_machines"],
        "subjectFrames": ["teachers_educators"],
    },
    "Creative and Critical Entanglements With AI in Art Education": {
        "intelligenceTypes": ["digital", "creative", "social"],
        "perspectives": ["technology", "critical"],
        "definitionFrames": ["machinic_relation", "situated_practice"],
        "recognitionModes": ["technical_fluency", "participation_relation"],
        "locationFrames": ["media_machines", "relations_culture"],
        "subjectFrames": ["machines_nonhumans", "teachers_educators"],
    },
    "The Physics of Art Education: New Materialism, AI, and the Tacit Knowledge of Visual Culture": {
        "intelligenceTypes": ["digital", "affective", "social"],
        "perspectives": ["technology", "philosophy"],
        "definitionFrames": ["machinic_relation", "embodied_attunement"],
        "recognitionModes": ["technical_fluency", "making_performance"],
        "locationFrames": ["media_machines", "place_ecology", "body_affect"],
        "subjectFrames": ["machines_nonhumans", "artists_makers"],
    },
    "Identification of the Gifted in Art": {
        "intelligenceTypes": ["exceptionality", "creative"],
        "perspectives": ["assessment"],
        "definitionFrames": ["measurable_faculty", "creative_capacity"],
        "recognitionModes": ["testing_scoring", "judgment_critique"],
        "locationFrames": ["mind_concepts"],
        "subjectFrames": ["disabled_gifted_subjects", "children_students"],
    },
    "An Historical Perspective on the Gifted and the Talented in Art": {
        "intelligenceTypes": ["exceptionality", "creative"],
        "perspectives": ["developmental"],
        "definitionFrames": ["measurable_faculty", "creative_capacity"],
        "recognitionModes": ["developmental_observation"],
        "locationFrames": ["mind_concepts"],
        "subjectFrames": ["disabled_gifted_subjects", "children_students"],
    },
    "Judging Children's Drawings as Measures of Art Abilities": {
        "intelligenceTypes": ["perceptual", "creative"],
        "perspectives": ["assessment"],
        "definitionFrames": ["measurable_faculty", "perceptual_sensitivity"],
        "recognitionModes": ["testing_scoring", "judgment_critique", "making_performance"],
        "locationFrames": ["artworks_materials", "vision_perception"],
        "subjectFrames": ["children_students"],
    },
    "Disability Studies and Art Education": {
        "intelligenceTypes": ["exceptionality", "social"],
        "perspectives": ["disability", "critical"],
        "definitionFrames": ["situated_practice", "embodied_attunement"],
        "recognitionModes": ["participation_relation", "language_reflection"],
        "locationFrames": ["relations_culture", "body_affect"],
        "subjectFrames": ["disabled_gifted_subjects", "identity_marked_subjects"],
    },
    "Art, Ecology and Art Education: Locating Art Education in a Critical Place-based Pedagogy": {
        "intelligenceTypes": ["social", "cognitive"],
        "perspectives": ["community", "critical", "pedagogy"],
        "definitionFrames": ["situated_practice"],
        "recognitionModes": ["participation_relation", "making_performance"],
        "locationFrames": ["place_ecology", "relations_culture", "pedagogical_institutions"],
        "subjectFrames": ["communities_publics", "children_students"],
    },
    "Midjourney Killed the Photoshop Star: Assembling the Emerging Field of Synthography": {
        "intelligenceTypes": ["digital", "social"],
        "perspectives": ["technology"],
        "definitionFrames": ["machinic_relation"],
        "recognitionModes": ["technical_fluency", "making_performance"],
        "locationFrames": ["media_machines", "artworks_materials"],
        "subjectFrames": ["machines_nonhumans", "artists_makers", "teachers_educators"],
    },
    "Art Education Beyond Anthropocentricism The Question of Nonhuman Animals in Contemporary Art": {
        "intelligenceTypes": ["social", "cognitive"],
        "perspectives": ["critical", "philosophy"],
        "definitionFrames": ["situated_practice"],
        "recognitionModes": ["language_reflection", "judgment_critique"],
        "locationFrames": ["place_ecology", "relations_culture"],
        "subjectFrames": ["machines_nonhumans", "artists_makers"],
    },
    "Beyond Traditional Art Education: Transformative Lifelong Learning in Community-Based Settings with Older Adults": {
        "intelligenceTypes": ["social", "cognitive"],
        "perspectives": ["community", "pedagogy"],
        "definitionFrames": ["situated_practice"],
        "recognitionModes": ["participation_relation", "developmental_observation"],
        "locationFrames": ["relations_culture", "pedagogical_institutions"],
        "subjectFrames": ["communities_publics"],
    },
    "Nadia's Drawings: Theorizing about an Autistic Child's Phenomenal Ability": {
        "intelligenceTypes": ["exceptionality", "perceptual"],
        "perspectives": ["disability"],
        "definitionFrames": ["perceptual_sensitivity", "measurable_faculty"],
        "recognitionModes": ["making_performance", "developmental_observation"],
        "locationFrames": ["vision_perception", "artworks_materials"],
        "subjectFrames": ["disabled_gifted_subjects", "children_students"],
    },
}


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

RAW_CONCEPT_OVERRIDES = {
    "A Nonverbal Ability Test": {
        "definitionFrames": ["measurable_faculty"],
        "recognitionModes": ["testing_scoring"],
        "locationFrames": ["mind_concepts"],
        "subjectFrames": ["children_students"],
    },
    "Creative and Critical Entanglements With AI in Art Education": {
        "definitionFrames": ["machinic_relation", "situated_practice"],
        "recognitionModes": ["technical_fluency", "participation_relation"],
        "locationFrames": ["media_machines", "relations_culture"],
        "subjectFrames": ["machines_nonhumans", "identity_marked_subjects"],
    },
    "The Physics of Art Education: New Materialism, AI, and the Tacit Knowledge of Visual Culture": {
        "definitionFrames": ["machinic_relation", "embodied_attunement"],
        "recognitionModes": ["technical_fluency", "making_performance"],
        "locationFrames": ["media_machines", "place_ecology", "body_affect"],
        "subjectFrames": ["machines_nonhumans"],
    },
    "On “Nadia’s Drawings: Theorizing about an Autistic Child’s Phenomenal Ability”": {
        "definitionFrames": ["perceptual_sensitivity", "measurable_faculty"],
        "recognitionModes": ["making_performance", "developmental_observation"],
        "locationFrames": ["artworks_materials", "vision_perception"],
        "subjectFrames": ["disabled_gifted_subjects", "children_students"],
    },
    "Nadia’s Drawings: Theorizing about an Autistic Child’s Phenomenal Ability": {
        "definitionFrames": ["perceptual_sensitivity", "measurable_faculty"],
        "recognitionModes": ["making_performance", "developmental_observation"],
        "locationFrames": ["artworks_materials", "vision_perception"],
        "subjectFrames": ["disabled_gifted_subjects", "children_students"],
    },
    "Identification of the Gifted in Art": {
        "definitionFrames": ["measurable_faculty", "creative_capacity"],
        "recognitionModes": ["testing_scoring", "judgment_critique"],
        "locationFrames": ["mind_concepts"],
        "subjectFrames": ["disabled_gifted_subjects", "children_students"],
    },
    "An Historical Perspective on the Gifted and the Talented in Art": {
        "definitionFrames": ["measurable_faculty", "creative_capacity"],
        "recognitionModes": ["developmental_observation"],
        "locationFrames": ["mind_concepts"],
        "subjectFrames": ["disabled_gifted_subjects", "children_students"],
    },
}


def title_key(value: str) -> str:
    normalized = value.replace("“", '"').replace("”", '"').replace("’", "'")
    return re.sub(r"[^a-z0-9]+", " ", normalized.lower()).strip()


TYPE_OVERRIDES = {title_key(key): value for key, value in RAW_TYPE_OVERRIDES.items()}
CONCEPT_OVERRIDES = {title_key(key): value for key, value in RAW_CONCEPT_OVERRIDES.items()}


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


def unique_ids(values: list[str], maximum: int = 3) -> list[str]:
    output: list[str] = []
    for value in values:
        if value and value not in output:
            output.append(value)
        if len(output) == maximum:
            break
    return output


def fallback_definition_frames(type_ids: list[str], perspective_ids: list[str]) -> list[str]:
    guesses = []
    if "cognitive" in type_ids or "assessment" in perspective_ids or "developmental" in perspective_ids:
        guesses.append("measurable_faculty")
    if "creative" in type_ids:
        guesses.append("creative_capacity")
    if "perceptual" in type_ids:
        guesses.append("perceptual_sensitivity")
    if "communicative" in type_ids or "philosophy" in perspective_ids:
        guesses.append("interpretive_meaning")
    if "social" in type_ids or any(value in perspective_ids for value in ["critical", "community"]):
        guesses.append("situated_practice")
    if "affective" in type_ids:
        guesses.append("embodied_attunement")
    if "digital" in type_ids or "technology" in perspective_ids:
        guesses.append("machinic_relation")
    return unique_ids(guesses)


def fallback_recognition_modes(type_ids: list[str], perspective_ids: list[str], signal_ids: list[str]) -> list[str]:
    guesses = []
    if "assessment" in perspective_ids:
        guesses.append("testing_scoring")
    if "developmental" in perspective_ids:
        guesses.append("developmental_observation")
    if any(value in type_ids for value in ["creative", "perceptual"]) or "materiality" in signal_ids:
        guesses.append("making_performance")
    if "philosophy" in perspective_ids:
        guesses.append("judgment_critique")
    if "communicative" in type_ids or "language" in signal_ids:
        guesses.append("language_reflection")
    if any(value in perspective_ids for value in ["community", "critical"]) or "museum" in signal_ids:
        guesses.append("participation_relation")
    if "digital" in type_ids or "technology" in perspective_ids:
        guesses.append("technical_fluency")
    if "pedagogy" in perspective_ids and not guesses:
        guesses.append("making_performance")
    return unique_ids(guesses)


def fallback_location_frames(type_ids: list[str], perspective_ids: list[str], signal_ids: list[str]) -> list[str]:
    guesses = []
    if "cognitive" in type_ids:
        guesses.append("mind_concepts")
    if "perceptual" in type_ids:
        guesses.append("vision_perception")
    if "affective" in type_ids:
        guesses.append("body_affect")
    if "creative" in type_ids or "materiality" in signal_ids:
        guesses.append("artworks_materials")
    if "social" in type_ids or any(value in perspective_ids for value in ["critical", "community"]):
        guesses.append("relations_culture")
    if any(value in perspective_ids for value in ["pedagogy", "developmental"]):
        guesses.append("pedagogical_institutions")
    if "digital" in type_ids or "technology" in perspective_ids or "technology" in signal_ids:
        guesses.append("media_machines")
    if "place" in signal_ids:
        guesses.append("place_ecology")
    return unique_ids(guesses)


def fallback_subject_frames(type_ids: list[str], perspective_ids: list[str], signal_ids: list[str]) -> list[str]:
    guesses = []
    if any(value in perspective_ids for value in ["developmental", "pedagogy"]):
        guesses.append("children_students")
    if "teacherhood" in signal_ids:
        guesses.append("teachers_educators")
    if "creative" in type_ids or "philosophy" in perspective_ids:
        guesses.append("artists_makers")
    if any(value in perspective_ids for value in ["community"]) or "museum" in signal_ids:
        guesses.append("communities_publics")
    if "exceptionality" in type_ids or "disability" in perspective_ids:
        guesses.append("disabled_gifted_subjects")
    if any(value in perspective_ids for value in ["critical"]) or any(value in signal_ids for value in ["identity", "equity"]):
        guesses.append("identity_marked_subjects")
    if "digital" in type_ids or "technology" in perspective_ids:
        guesses.append("machines_nonhumans")
    return unique_ids(guesses)


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


def article_quote_candidates(text: str) -> list[str]:
    cleaned = re.sub(r"Submit your article to this journal.*?journalCode=usae20", " ", text, flags=re.IGNORECASE)
    cleaned = re.sub(r"Article views:\s*[\d,]+", " ", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"View related articles", " ", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"Full Terms .*?journalCode=usae20", " ", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    sentences = re.split(r"(?<=[.!?])\s+", cleaned)
    output = []
    seen = set()
    for sentence in sentences:
        normalized = sentence.strip().strip('"')
        normalized = re.sub(r"\s+", " ", normalized)
        if len(normalized) < 70 or len(normalized) > 320:
            continue
        if "Studies in Art Education" in normalized:
            continue
        key = normalized.lower()
        if key in seen:
            continue
        seen.add(key)
        output.append(normalized)
        if len(output) >= 60:
            break
    return output


def confidence_label(score: int) -> str:
    if score >= 8:
        return "strong signal"
    if score >= 4:
        return "mixed signal"
    return "light signal"


def confidence_entries(
    selected_ids: list[str],
    matches: list[dict],
    manual_ids: list[str] | None = None,
    fallback_ids: list[str] | None = None,
) -> list[dict]:
    match_lookup = {item["id"]: item for item in matches}
    manual = set(manual_ids or [])
    fallback = set(fallback_ids or [])
    entries = []
    for item_id in selected_ids:
        match = match_lookup.get(item_id)
        if item_id in manual:
            entries.append(
                {
                    "id": item_id,
                    "label": "manual review",
                    "kind": "manual",
                    "score": match["score"] if match else 0,
                    "note": "Manually overridden or explicitly reviewed.",
                }
            )
        elif match:
            entries.append(
                {
                    "id": item_id,
                    "label": confidence_label(match["score"]),
                    "kind": "heuristic",
                    "score": match["score"],
                    "note": f"{match['score']} keyword hits in title, front matter, or body text.",
                }
            )
        elif item_id in fallback:
            entries.append(
                {
                    "id": item_id,
                    "label": "inferred",
                    "kind": "inferred",
                    "score": 0,
                    "note": "Derived from related codes when direct textual signal was weak.",
                }
            )
    return entries


def select_quote_evidence(
    text: str,
    selected_ids_by_family: dict[str, list[str]],
    family_specs: list[dict],
    limit: int = 4,
) -> list[dict]:
    candidates = article_quote_candidates(text)
    if not candidates:
        return []

    ranked = []
    seen = set()
    for sentence in candidates:
        tags = []
        family_hits = []
        score = 2 if re.search(r"\bintelligen", sentence, re.IGNORECASE) else 0
        for family in family_specs:
            selected_ids = set(selected_ids_by_family.get(family["articleKey"], []))
            if not selected_ids:
                continue
            matches = match_keywords(sentence, family["definitions"])
            hit_ids = [item["id"] for item in matches if item["id"] in selected_ids]
            if hit_ids:
                tags.extend(hit_ids[:3])
                family_hits.append(family["id"])
                score += sum(item["score"] for item in matches if item["id"] in selected_ids)
        if score <= 0:
            continue
        key = sentence.lower()
        if key in seen:
            continue
        seen.add(key)
        ranked.append(
            {
                "text": sentence.strip(),
                "tags": unique_ids(tags, maximum=6),
                "families": unique_ids(family_hits, maximum=6),
                "score": score,
            }
        )

    ranked.sort(key=lambda item: (-item["score"], len(item["text"])))
    return [{"text": item["text"], "tags": item["tags"], "families": item["families"]} for item in ranked[:limit]]


def build_articles(raw_records: list[dict]) -> list[dict]:
    articles = []
    for record in raw_records:
        normalized = normalize_text(record["text"])
        first_page = normalize_text(record["firstPageText"])
        title = parse_title_from_citation(record["firstPageText"]) or clean_title(record["file"])
        metadata = parse_front_matter_numbers(first_page)
        title_id = title_key(title)

        intelligence_matches = match_keywords(f"{title} {first_page[:4000]} {normalized[:14000]}", INTELLIGENCE_TYPES)
        perspective_matches = match_keywords(f"{title} {first_page[:5000]} {normalized[:18000]}", PERSPECTIVES)

        type_ids = top_ids(intelligence_matches)
        perspective_ids = top_ids(perspective_matches)
        manual_type_ids = []
        manual_perspective_ids = []

        overrides = TYPE_OVERRIDES.get(title_id)
        if overrides:
            manual_type_ids = [value for value in overrides if value in {item["id"] for item in INTELLIGENCE_TYPES}]
            manual_perspective_ids = [value for value in overrides if value in {item["id"] for item in PERSPECTIVES}]
            type_ids = manual_type_ids or type_ids
            perspective_ids = manual_perspective_ids or perspective_ids

        fallback_type_ids = []
        fallback_perspective_ids = []
        if not type_ids:
            type_ids = ["cognitive"]
            fallback_type_ids = ["cognitive"]
        if not perspective_ids:
            perspective_ids = ["pedagogy"]
            fallback_perspective_ids = ["pedagogy"]

        signals = []
        signal_text = f"{title} {normalized[:16000]}"
        for signal in SIGNALS:
            score = sum(len(re.findall(pattern, signal_text, re.IGNORECASE)) for pattern in signal["keywords"])
            if score:
                signals.append({"id": signal["id"], "score": score})
        signals.sort(key=lambda item: (-item["score"], item["id"]))
        signal_ids = [item["id"] for item in signals[:5]]

        concept_text = f"{title} {first_page[:7000]} {normalized[:22000]}"
        definition_matches = match_keywords(concept_text, DEFINITION_FRAMES)
        recognition_matches = match_keywords(concept_text, RECOGNITION_MODES)
        location_matches = match_keywords(concept_text, LOCATION_FRAMES)
        subject_matches = match_keywords(concept_text, SUBJECT_FRAMES)
        definition_ids = top_ids(definition_matches, maximum=3)
        recognition_ids = top_ids(recognition_matches, maximum=3)
        location_ids = top_ids(location_matches, maximum=3)
        subject_ids = top_ids(subject_matches, maximum=3)

        fallback_definition_ids = []
        fallback_recognition_ids = []
        fallback_location_ids = []
        fallback_subject_ids = []
        if not definition_ids:
            definition_ids = fallback_definition_frames(type_ids, perspective_ids)
            fallback_definition_ids = definition_ids[:]
        if not recognition_ids:
            recognition_ids = fallback_recognition_modes(type_ids, perspective_ids, signal_ids)
            fallback_recognition_ids = recognition_ids[:]
        if not location_ids:
            location_ids = fallback_location_frames(type_ids, perspective_ids, signal_ids)
            fallback_location_ids = location_ids[:]
        if not subject_ids:
            subject_ids = fallback_subject_frames(type_ids, perspective_ids, signal_ids)
            fallback_subject_ids = subject_ids[:]

        concept_overrides = CONCEPT_OVERRIDES.get(title_id, {})
        manual_definition_ids = []
        manual_recognition_ids = []
        manual_location_ids = []
        manual_subject_ids = []
        if concept_overrides:
            manual_definition_ids = concept_overrides.get("definitionFrames", [])
            manual_recognition_ids = concept_overrides.get("recognitionModes", [])
            manual_location_ids = concept_overrides.get("locationFrames", [])
            manual_subject_ids = concept_overrides.get("subjectFrames", [])
            definition_ids = manual_definition_ids or definition_ids
            recognition_ids = manual_recognition_ids or recognition_ids
            location_ids = manual_location_ids or location_ids
            subject_ids = manual_subject_ids or subject_ids

        selected_ids_by_family = {
            "intelligenceTypes": type_ids,
            "perspectives": perspective_ids,
            "signals": signal_ids,
            "definitionFrames": definition_ids,
            "recognitionModes": recognition_ids,
            "locationFrames": location_ids,
            "subjectFrames": subject_ids,
        }
        coding_confidence = {
            "intelligenceTypes": confidence_entries(
                type_ids,
                intelligence_matches,
                manual_ids=manual_type_ids,
                fallback_ids=fallback_type_ids,
            ),
            "perspectives": confidence_entries(
                perspective_ids,
                perspective_matches,
                manual_ids=manual_perspective_ids,
                fallback_ids=fallback_perspective_ids,
            ),
            "signals": confidence_entries(
                signal_ids,
                signals,
            ),
            "definitionFrames": confidence_entries(
                definition_ids,
                definition_matches,
                manual_ids=manual_definition_ids,
                fallback_ids=fallback_definition_ids,
            ),
            "recognitionModes": confidence_entries(
                recognition_ids,
                recognition_matches,
                manual_ids=manual_recognition_ids,
                fallback_ids=fallback_recognition_ids,
            ),
            "locationFrames": confidence_entries(
                location_ids,
                location_matches,
                manual_ids=manual_location_ids,
                fallback_ids=fallback_location_ids,
            ),
            "subjectFrames": confidence_entries(
                subject_ids,
                subject_matches,
                manual_ids=manual_subject_ids,
                fallback_ids=fallback_subject_ids,
            ),
        }
        confidence_summary = {
            key: entries[0]["label"] if entries else "not coded"
            for key, entries in coding_confidence.items()
        }
        quote_evidence = select_quote_evidence(normalized, selected_ids_by_family, ALL_FAMILY_SPECS)

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
            "signals": signal_ids,
            "definitionFrames": definition_ids,
            "recognitionModes": recognition_ids,
            "locationFrames": location_ids,
            "subjectFrames": subject_ids,
            "excerpt": article_excerpt(normalized),
            "quotes": quote_evidence,
            "codingConfidence": coding_confidence,
            "confidenceSummary": confidence_summary,
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
    return build_family_counts(articles, "signals", SIGNALS)


def build_family_counts(articles: list[dict], key: str, definitions: list[dict]) -> list[dict]:
    counter = Counter()
    for article in articles:
        counter.update(article[key])

    lookup = index_lookup(definitions)
    return [
        {
            "id": item_id,
            "label": lookup[item_id]["label"],
            "count": count,
            "description": lookup[item_id]["description"],
            "cues": lookup[item_id].get("cues", []),
        }
        for item_id, count in counter.most_common()
    ]


def build_windowed_counts(articles: list[dict]) -> tuple[list[str], dict]:
    def empty_bucket() -> dict:
        base = {"articles": 0, "types": Counter(), "perspectives": Counter(), "signals": Counter()}
        for family in CONCEPTUAL_FAMILIES:
            base[family["bucketKey"]] = Counter()
        return base

    by_decade = defaultdict(empty_bucket)
    for article in articles:
        decade = decade_label(article["year"])
        by_decade[decade]["articles"] += 1
        by_decade[decade]["types"].update(article["intelligenceTypes"])
        by_decade[decade]["perspectives"].update(article["perspectives"])
        by_decade[decade]["signals"].update(article["signals"])
        for family in CONCEPTUAL_FAMILIES:
            by_decade[decade][family["bucketKey"]].update(article[family["articleKey"]])
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
    article_key: str,
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
                    article_key,
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


def build_question_highlights(question: dict, counts: list[dict], trends: dict, summary: dict) -> list[dict]:
    if not counts:
        return []

    dominant = counts[0]
    trend_lookup = {row["id"]: row for row in trends["rows"]}
    dominant_row = trend_lookup[dominant["id"]]
    riser = max(trends["rows"], key=lambda item: item["delta"])
    decliner = min(trends["rows"], key=lambda item: item["delta"])

    output = [
        {
            "title": f"{dominant['label']} is the dominant {question['noun']}",
            "body": (
                f"It appears in {dominant['count']} of {summary['articleCount']} articles "
                f"({round((dominant['count'] / summary['articleCount']) * 100)}%), making it the strongest answer "
                f"to the question {question['title'].lower()} across the corpus."
            ),
            "examples": dominant_row["examples"],
        },
        {
            "title": f"{riser['label']} rises most over time",
            "body": (
                f"It grows from {round(riser['earlyShare'] * 100)}% of articles in "
                f"{trends['earlyWindow'][0]}–{trends['earlyWindow'][-1]} to {round(riser['lateShare'] * 100)}% in "
                f"{trends['lateWindow'][0]}–{trends['lateWindow'][-1]}."
            ),
            "examples": riser["examples"],
        },
    ]

    if abs(decliner["delta"]) < 0.05:
        output.append(
            {
                "title": f"{decliner['label']} stays comparatively steady",
                "body": (
                    f"Its share shifts only slightly across the early and late windows "
                    f"({round(decliner['earlyShare'] * 100)}% to {round(decliner['lateShare'] * 100)}%), "
                    f"which makes it a persistent rather than volatile way of framing intelligence."
                ),
                "examples": decliner["examples"],
            }
        )
    else:
        output.append(
            {
                "title": f"{decliner['label']} recedes most",
                "body": (
                    f"It falls from {round(decliner['earlyShare'] * 100)}% in "
                    f"{trends['earlyWindow'][0]}–{trends['earlyWindow'][-1]} to {round(decliner['lateShare'] * 100)}% "
                    f"in {trends['lateWindow'][0]}–{trends['lateWindow'][-1]}."
                ),
                "examples": decliner["examples"],
            }
        )

    return output


def build_period_windows(decades: list[str], groups: int = 3) -> list[list[str]]:
    if len(decades) <= groups:
        return [[decade] for decade in decades]

    base = len(decades) // groups
    remainder = len(decades) % groups
    windows = []
    cursor = 0
    for index in range(groups):
        size = base + (1 if index < remainder else 0)
        windows.append(decades[cursor : cursor + size])
        cursor += size
    return [window for window in windows if window]


def top_rows_for_window(definitions: list[dict], bucket_key: str, decades: list[str], by_decade: dict, limit: int = 2) -> list[dict]:
    total = sum(by_decade[decade]["articles"] for decade in decades) or 1
    rows = []
    for definition in definitions:
        count = sum(by_decade[decade][bucket_key][definition["id"]] for decade in decades)
        if not count:
            continue
        rows.append(
            {
                "id": definition["id"],
                "label": definition["label"],
                "count": count,
                "share": round(count / total, 3),
            }
        )
    rows.sort(key=lambda item: (-item["share"], -item["count"], item["label"]))
    return rows[:limit]


def build_meaning_shifts(questions: dict, decades: list[str], by_decade: dict) -> dict:
    windows = build_period_windows(decades, groups=3)
    periods = []
    for window in windows:
        article_total = sum(by_decade[decade]["articles"] for decade in window)
        period = {
            "label": f"{window[0]}–{window[-1]}" if len(window) > 1 else window[0],
            "articleCount": article_total,
            "families": {},
        }
        for family in CONCEPTUAL_FAMILIES:
            period["families"][family["id"]] = top_rows_for_window(
                family["definitions"],
                family["bucketKey"],
                window,
                by_decade,
            )
        periods.append(period)

    stories = []
    for family in CONCEPTUAL_FAMILIES:
        question = questions[family["id"]]
        riser = max(question["trends"]["rows"], key=lambda item: item["delta"])
        decliner = min(question["trends"]["rows"], key=lambda item: item["delta"])
        stories.append(
            {
                "title": family["title"],
                "body": (
                    f"The strongest rise is {riser['label']} "
                    f"({round(riser['earlyShare'] * 100)}% → {round(riser['lateShare'] * 100)}%), while the strongest "
                    f"{'decline' if decliner['delta'] <= -0.05 else 'countercurrent'} is {decliner['label']} "
                    f"({round(decliner['earlyShare'] * 100)}% → {round(decliner['lateShare'] * 100)}%)."
                ),
                "examples": riser["examples"],
            }
        )

    return {"periods": periods, "stories": stories}


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


def build_origins(
    articles: list[dict],
    type_counts: list[dict],
    perspective_counts: list[dict],
    signals: list[dict],
    question_counts: dict[str, list[dict]],
) -> dict:
    type_lookup = {item["id"]: item for item in INTELLIGENCE_TYPES}
    perspective_lookup = {item["id"]: item for item in PERSPECTIVES}
    signal_lookup = {item["id"]: item for item in SIGNALS}
    signal_counts = {item["id"]: item["count"] for item in signals}
    count_lookup_types = {item["id"]: item["count"] for item in type_counts}
    count_lookup_perspectives = {item["id"]: item["count"] for item in perspective_counts}
    question_count_lookup = {
        family["id"]: {item["id"]: item["count"] for item in question_counts[family["id"]]} for family in CONCEPTUAL_FAMILIES
    }

    def earliest_for(bucket_ids: list[str], key: str, family_id: str | None = None) -> list[dict]:
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
                if family_id == "signals":
                    label = signal_lookup[bucket_id]["label"]
                    total = signal_counts.get(bucket_id, 0)
                else:
                    family_def = next(item for item in CONCEPTUAL_FAMILIES if item["id"] == family_id)
                    definition_lookup = {item["id"]: item for item in family_def["definitions"]}
                    label = definition_lookup[bucket_id]["label"]
                    total = question_count_lookup[family_id].get(bucket_id, 0)
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
        "types": earliest_for([item["id"] for item in INTELLIGENCE_TYPES], "intelligenceTypes", "types"),
        "perspectives": earliest_for([item["id"] for item in PERSPECTIVES], "perspectives", "perspectives"),
        "signals": earliest_for([signal["id"] for signal in SIGNALS], "signals", "signals"),
        "definitions": earliest_for([item["id"] for item in DEFINITION_FRAMES], "definitionFrames", "definitions"),
        "recognition": earliest_for([item["id"] for item in RECOGNITION_MODES], "recognitionModes", "recognition"),
        "locations": earliest_for([item["id"] for item in LOCATION_FRAMES], "locationFrames", "locations"),
        "subjects": earliest_for([item["id"] for item in SUBJECT_FRAMES], "subjectFrames", "subjects"),
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
            "body": "Articles can belong to multiple intelligence types, interpretive perspectives, definition frames, recognition modes, locations, and subject positions. That avoids forcing a single, reductive category onto complex scholarship.",
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
        {
            "title": "Quote-grounded evidence",
            "body": "Each article card now includes short quote snippets drawn from the article text and tagged to the coded categories so the user can inspect claims against textual evidence.",
        },
        {
            "title": "Visible validation",
            "body": "A small manually reviewed gold sample checks how closely the heuristic coding aligns with article-level expectations. The resulting audit notes are shown on the page.",
        },
    ]


def jaccard_similarity(left: set[str], right: set[str]) -> float:
    if not left and not right:
        return 1.0
    union = left | right
    if not union:
        return 1.0
    return len(left & right) / len(union)


def build_validation(articles: list[dict]) -> dict:
    by_title = {article["title"]: article for article in articles}
    sample_rows = []
    missing_titles = []
    family_name = lambda family: family.get("label") or family.get("title") or family["id"]

    family_rollups = {
        family["id"]: {
            "family": family["id"],
            "label": family_name(family),
            "exact": 0,
            "items": 0,
            "jaccardTotal": 0.0,
            "mismatches": [],
        }
        for family in VALIDATION_FAMILY_SPECS
    }

    for title, expected in GOLD_SAMPLE.items():
        article = by_title.get(title)
        if not article:
            missing_titles.append(title)
            continue

        row = {"title": title, "year": article["year"], "families": {}}
        for family in VALIDATION_FAMILY_SPECS:
            article_key = family["articleKey"]
            expected_set = set(expected.get(article_key, []))
            predicted_set = set(article[article_key])
            overlap = jaccard_similarity(expected_set, predicted_set)
            exact = expected_set == predicted_set
            missing = sorted(expected_set - predicted_set)
            extra = sorted(predicted_set - expected_set)
            row["families"][family["id"]] = {
                "expected": sorted(expected_set),
                "predicted": sorted(predicted_set),
                "exact": exact,
                "jaccard": round(overlap, 3),
                "missing": missing,
                "extra": extra,
            }

            family_rollups[family["id"]]["items"] += 1
            family_rollups[family["id"]]["jaccardTotal"] += overlap
            if exact:
                family_rollups[family["id"]]["exact"] += 1
            else:
                family_rollups[family["id"]]["mismatches"].append(
                    {
                        "title": title,
                        "missing": missing,
                        "extra": extra,
                        "jaccard": round(overlap, 3),
                    }
                )
        sample_rows.append(row)

    override_counts = {}
    inferred_counts = {}
    for family in ALL_FAMILY_SPECS:
        article_key = family["articleKey"]
        override_counts[family["id"]] = sum(
            1 for article in articles if any(item["kind"] == "manual" for item in article["codingConfidence"][article_key])
        )
        inferred_counts[family["id"]] = sum(
            1 for article in articles if any(item["kind"] == "inferred" for item in article["codingConfidence"][article_key])
        )

    family_stats = []
    for family in VALIDATION_FAMILY_SPECS:
        rollup = family_rollups[family["id"]]
        items = max(rollup["items"], 1)
        family_stats.append(
            {
                "family": family["id"],
                "label": family_name(family),
                "sampleSize": rollup["items"],
                "exactRate": round(rollup["exact"] / items, 3),
                "averageJaccard": round(rollup["jaccardTotal"] / items, 3),
                "overrideCount": override_counts[family["id"]],
                "inferredCount": inferred_counts[family["id"]],
                "mismatchExamples": sorted(rollup["mismatches"], key=lambda item: item["jaccard"])[:3],
            }
        )

    family_stats.sort(key=lambda item: item["averageJaccard"])
    weakest = family_stats[:2]
    strongest = sorted(family_stats, key=lambda item: item["averageJaccard"], reverse=True)[:2]

    audit_notes = [
        {
            "title": "Gold sample is partial by design",
            "body": (
                f"The manual audit checks {len(sample_rows)} articles across six coding families. "
                "It is meant to expose where the heuristic model is trustworthy and where it still needs closer reading."
            ),
        },
        {
            "title": f"Weakest agreement: {weakest[0]['label']}",
            "body": (
                f"This family has average overlap {round(weakest[0]['averageJaccard'] * 100)}% and exact match rate "
                f"{round(weakest[0]['exactRate'] * 100)}% in the gold sample. It should be read as provisional."
            ),
        },
        {
            "title": f"Strongest agreement: {strongest[0]['label']}",
            "body": (
                f"This family has average overlap {round(strongest[0]['averageJaccard'] * 100)}% and exact match rate "
                f"{round(strongest[0]['exactRate'] * 100)}% in the gold sample."
            ),
        },
        {
            "title": "Manual overrides remain visible",
            "body": (
                f"Manual review currently affects {override_counts['types']} articles for type coding and "
                f"{override_counts['definitions']} for definition frames. These interventions are part of the method, not hidden cleanup."
            ),
        },
        {
            "title": "Inference is most common where textual cues are indirect",
            "body": (
                f"Inferred subject coding appears in {inferred_counts['subjects']} articles and inferred location coding in "
                f"{inferred_counts['locations']}. Those are the families where direct lexical evidence is weakest."
            ),
        },
    ]

    return {
        "sampleSize": len(sample_rows),
        "expectedSize": len(GOLD_SAMPLE),
        "missingTitles": missing_titles,
        "familyStats": family_stats,
        "auditNotes": audit_notes,
        "sampleRows": sample_rows,
        "quoteCoverage": sum(1 for article in articles if article["quotes"]) / max(len(articles), 1),
    }


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
    type_trends = build_trend_rows(INTELLIGENCE_TYPES, "types", "intelligenceTypes", decades, by_decade, articles)
    perspective_trends = build_trend_rows(PERSPECTIVES, "perspectives", "perspectives", decades, by_decade, articles)
    signal_trends = build_signal_trends(decades, by_decade)
    rare_pairs = build_rare_pairs(articles, matrix, type_counts, perspective_counts)
    validation = build_validation(articles)
    conceptual_questions = {}
    conceptual_counts = {}
    for family in CONCEPTUAL_FAMILIES:
        counts = build_family_counts(articles, family["articleKey"], family["definitions"])
        trends = build_trend_rows(
            family["definitions"],
            family["bucketKey"],
            family["articleKey"],
            decades,
            by_decade,
            articles,
        )
        conceptual_counts[family["id"]] = counts
        conceptual_questions[family["id"]] = {
            "title": family["title"],
            "articleKey": family["articleKey"],
            "bucketKey": family["bucketKey"],
            "noun": family["noun"],
            "definitions": family["definitions"],
            "counts": counts,
            "trends": trends,
            "highlights": build_question_highlights(family, counts, trends, summary),
        }

    dataset = {
        "summary": summary,
        "intelligenceTypes": INTELLIGENCE_TYPES,
        "perspectives": PERSPECTIVES,
        "definitionFrames": DEFINITION_FRAMES,
        "recognitionModes": RECOGNITION_MODES,
        "locationFrames": LOCATION_FRAMES,
        "subjectFrames": SUBJECT_FRAMES,
        "articles": articles,
        "typeCounts": type_counts,
        "perspectiveCounts": perspective_counts,
        "matrix": matrix,
        "timeline": build_timeline(articles),
        "signals": signals,
        "conceptualQuestions": conceptual_questions,
        "meaningShifts": build_meaning_shifts(conceptual_questions, decades, by_decade),
        "origins": build_origins(articles, type_counts, perspective_counts, signals, conceptual_counts),
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
        "validation": validation,
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
    print("Top definition frames:")
    for item in dataset["conceptualQuestions"]["definitions"]["counts"][:5]:
        print(f"  - {item['label']}: {item['count']}")
    print("Top subjects:")
    for item in dataset["conceptualQuestions"]["subjects"]["counts"][:5]:
        print(f"  - {item['label']}: {item['count']}")
    print(
        f"Gold-sample validation: {dataset['validation']['sampleSize']}/{dataset['validation']['expectedSize']} "
        f"articles reviewed manually"
    )
    print("Top cited from PDF front matter:")
    for article in dataset["topCited"][:10]:
        print(f"  - {article['citingArticlesPdf']:>3} | {article['year']} | {article['title']}")


if __name__ == "__main__":
    main()
