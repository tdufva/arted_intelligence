(function () {
  const corpus = window.CORPUS_DATA;
  const openAlex = window.OPENALEX_DATA;

  if (!corpus) {
    return;
  }

  const signalFallbackMeta = {
    language: {
      label: "Language and semiotics",
      description: "Language, verbal response, semiotics, and metaphor as adjacent frames for intelligence.",
      cues: ["language", "verbal response", "semiotics", "metaphor"],
    },
    teacherhood: {
      label: "Teachers and professional formation",
      description: "Teachers, preservice formation, and the conditions of teaching practice.",
      cues: ["teacher", "preservice", "professional formation", "teacher stress"],
    },
    place: {
      label: "Place and ecology",
      description: "Place, ecology, environment, and relational world-making around intelligence discourse.",
      cues: ["place", "ecology", "environment", "relational world"],
    },
    technology: {
      label: "Technology and media",
      description: "Technology, media, digital systems, film, games, and AI adjacent to intelligence.",
      cues: ["digital", "computing", "AI", "film and games"],
    },
    materiality: {
      label: "Materiality",
      description: "Material culture, new materialism, and the agency of materials in art learning.",
      cues: ["material culture", "new materialism", "materiality", "materials"],
    },
    identity: {
      label: "Identity and aspiration",
      description: "Identity formation, aspiration, and subject formation around art learning.",
      cues: ["identity", "aspiration", "subject formation", "self-positioning"],
    },
    equity: {
      label: "Equity and justice",
      description: "Equality, justice, bias, emancipation, and anti-oppressive signals adjacent to intelligence.",
      cues: ["equity", "justice", "bias", "emancipation"],
    },
    museum: {
      label: "Museum and public learning",
      description: "Museums and public-facing art learning beyond the classroom.",
      cues: ["museum", "gallery", "public learning"],
    },
    care: {
      label: "Care and wellbeing",
      description: "Care, mindfulness, wellbeing, resilience, and stress as adjacent signals.",
      cues: ["care", "mindfulness", "wellbeing", "resilience"],
    },
    transfer: {
      label: "Transfer",
      description: "Transfer of learning across contexts, domains, or forms of art education.",
      cues: ["transfer", "carryover", "cross-domain learning"],
    },
  };

  const typeLookup = Object.fromEntries(corpus.intelligenceTypes.map((item) => [item.id, item]));
  const perspectiveLookup = Object.fromEntries(corpus.perspectives.map((item) => [item.id, item]));
  const signalLookup = Object.fromEntries(corpus.signals.map((item) => [item.id, item]));
  const definitionLookup = Object.fromEntries(corpus.definitionFrames.map((item) => [item.id, item]));
  const recognitionLookup = Object.fromEntries(corpus.recognitionModes.map((item) => [item.id, item]));
  const locationLookup = Object.fromEntries(corpus.locationFrames.map((item) => [item.id, item]));
  const subjectLookup = Object.fromEntries(corpus.subjectFrames.map((item) => [item.id, item]));

  const familyConfigs = {
    types: {
      label: "Intelligence types",
      articleKey: "intelligenceTypes",
      bucketKey: "types",
      definitions: corpus.intelligenceTypes,
      counts: corpus.typeCounts,
      trends: corpus.trends.types,
      lookup: typeLookup,
    },
    perspectives: {
      label: "Perspectives",
      articleKey: "perspectives",
      bucketKey: "perspectives",
      definitions: corpus.perspectives,
      counts: corpus.perspectiveCounts,
      trends: corpus.trends.perspectives,
      lookup: perspectiveLookup,
    },
    signals: {
      label: "Signals",
      articleKey: "signals",
      bucketKey: "signals",
      definitions: corpus.signals.map((item) => ({
        ...item,
        label: item.label || signalFallbackMeta[item.id]?.label || item.id,
        description: item.description || signalFallbackMeta[item.id]?.description || "Adjacent corpus signal.",
        cues: item.cues || signalFallbackMeta[item.id]?.cues || [],
      })),
      counts: corpus.signals,
      trends: corpus.trends.signals,
      lookup: signalLookup,
    },
    definitions: {
      label: "Definition frames",
      articleKey: "definitionFrames",
      bucketKey: "definitions",
      definitions: corpus.definitionFrames,
      counts: corpus.conceptualQuestions.definitions.counts,
      trends: corpus.conceptualQuestions.definitions.trends,
      lookup: definitionLookup,
    },
    recognition: {
      label: "Recognition modes",
      articleKey: "recognitionModes",
      bucketKey: "recognition",
      definitions: corpus.recognitionModes,
      counts: corpus.conceptualQuestions.recognition.counts,
      trends: corpus.conceptualQuestions.recognition.trends,
      lookup: recognitionLookup,
    },
    locations: {
      label: "Location frames",
      articleKey: "locationFrames",
      bucketKey: "locations",
      definitions: corpus.locationFrames,
      counts: corpus.conceptualQuestions.locations.counts,
      trends: corpus.conceptualQuestions.locations.trends,
      lookup: locationLookup,
    },
    subjects: {
      label: "Subjects",
      articleKey: "subjectFrames",
      bucketKey: "subjects",
      definitions: corpus.subjectFrames,
      counts: corpus.conceptualQuestions.subjects.counts,
      trends: corpus.conceptualQuestions.subjects.trends,
      lookup: subjectLookup,
    },
  };

  const familyCountLookup = Object.fromEntries(
    Object.entries(familyConfigs).map(([key, config]) => [key, Object.fromEntries(config.counts.map((item) => [item.id, item]))]),
  );
  const originLookup = Object.fromEntries(
    Object.entries(corpus.origins).map(([key, rows]) => [key, Object.fromEntries(rows.map((item) => [item.id, item]))]),
  );
  const openAlexByDoi = Object.fromEntries(
    Object.entries(openAlex?.citationsByDoi || {}).map(([doi, value]) => [doi.toLowerCase(), value]),
  );
  let evidenceDeskController = null;

  function pdfCitationCount(article) {
    return article?.citingArticlesPdf || 0;
  }

  function externalCitationCount(article) {
    return openAlexByDoi[article?.doi]?.citedByCount || article?.openAlexCitations || 0;
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("en-US").format(value);
  }

  function formatPercent(value) {
    return `${Math.round(value * 100)}%`;
  }

  function lookupSignalLabel(id) {
    return signalLookup[id]?.label || signalFallbackMeta[id]?.label || id.replaceAll("_", " ");
  }

  function lookupAnyLabel(id) {
    return (
      typeLookup[id]?.label ||
      perspectiveLookup[id]?.label ||
      definitionLookup[id]?.label ||
      recognitionLookup[id]?.label ||
      locationLookup[id]?.label ||
      subjectLookup[id]?.label ||
      lookupSignalLabel(id)
    );
  }

  function currentDecade(article) {
    return `${article.year - (article.year % 10)}s`;
  }

  const allDecades = [...new Set(corpus.articles.map((article) => currentDecade(article)))].sort();

  const customAliases = {
    digital: ["ai", "artificial intelligence", "machine", "computational", "digital", "synthography"],
    disability: ["disability", "disabled", "autism", "autistic", "neurodiversity", "hearing impaired"],
    exceptionality: ["gifted", "talented", "neurodiverse", "clinical"],
    social: ["social", "cultural", "identity", "community", "justice", "equity"],
    critical: ["critical", "justice", "bias", "queer", "decolonial", "politics"],
    technology: ["technology", "media", "digital", "computer", "game", "film", "ai"],
    care: ["care", "wellbeing", "stress", "resilience", "mindfulness"],
    place: ["place", "ecology", "relational", "environment", "nonhuman"],
    measurable_faculty: ["measurement", "ability", "score", "test", "psychometric"],
    creative_capacity: ["creativity", "imagination", "originality", "invention"],
    perceptual_sensitivity: ["perception", "seeing", "visual", "sensitivity"],
    interpretive_meaning: ["interpretation", "symbolic", "language", "meaning", "critique"],
    situated_practice: ["social", "cultural", "community", "identity", "relation"],
    embodied_attunement: ["embodied", "affective", "emotion", "tacit", "mindful"],
    machinic_relation: ["digital", "machine", "ai", "computation", "network"],
    testing_scoring: ["tests", "scores", "measurement", "instrument"],
    developmental_observation: ["development", "observation", "growth", "stages"],
    making_performance: ["artwork", "drawing", "making", "studio"],
    judgment_critique: ["judgment", "critique", "evaluation", "criticism"],
    language_reflection: ["language", "reflection", "conversation", "interview"],
    participation_relation: ["participation", "collaboration", "engagement", "community"],
    technical_fluency: ["technical", "digital", "media", "ai"],
    mind_concepts: ["mind", "concept", "cognition", "understanding"],
    vision_perception: ["vision", "perception", "seeing", "visual"],
    body_affect: ["body", "affect", "emotion", "tacit"],
    artworks_materials: ["artwork", "drawing", "image", "material"],
    relations_culture: ["relations", "culture", "identity", "community"],
    pedagogical_institutions: ["classroom", "teaching", "curriculum", "school"],
    media_machines: ["media", "machine", "digital", "ai"],
    place_ecology: ["place", "ecology", "environment", "nonhuman"],
    children_students: ["children", "students", "learners", "adolescents"],
    teachers_educators: ["teachers", "educators", "preservice", "faculty"],
    artists_makers: ["artists", "makers", "designers", "practitioners"],
    communities_publics: ["communities", "publics", "museum", "families"],
    disabled_gifted_subjects: ["gifted", "disabled", "autistic", "neurodiverse"],
    identity_marked_subjects: ["race", "gender", "queer", "decolonial"],
    machines_nonhumans: ["machines", "ai", "nonhuman", "animals"],
  };

  function normalizeForSearch(value) {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokenize(value) {
    return normalizeForSearch(value)
      .split(" ")
      .filter((token) => token.length > 2);
  }

  const conceptCatalog = Object.entries(familyConfigs)
    .flatMap(([family, config]) =>
      config.definitions.map((item) => ({
        ...item,
        family,
        label: family === "signals" ? lookupSignalLabel(item.id) : item.label,
        description:
          item.description ||
          (family === "signals" ? signalFallbackMeta[item.id]?.description || "Adjacent corpus signal." : ""),
      })),
    )
    .map((item) => ({
      ...item,
      search: normalizeForSearch(`${item.label} ${item.description || ""} ${(customAliases[item.id] || []).join(" ")}`),
    }));

  const structuredFieldMap = {
    type: "types",
    types: "types",
    perspective: "perspectives",
    perspectives: "perspectives",
    signal: "signals",
    signals: "signals",
    definition: "definitions",
    definitions: "definitions",
    recognition: "recognition",
    recognitions: "recognition",
    location: "locations",
    locations: "locations",
    subject: "subjects",
    subjects: "subjects",
  };

  const fieldLabels = {
    title: "Title",
    quote: "Quote evidence",
    doi: "DOI",
    year: "Year",
    decade: "Decade",
    types: "Type",
    perspectives: "Perspective",
    signals: "Signal",
    definitions: "Definition frame",
    recognition: "Recognition mode",
    locations: "Location frame",
    subjects: "Subject frame",
  };

  const familySelectMap = {
    type: "types",
    perspective: "perspectives",
    signal: "signals",
    definition: "definitions",
    recognition: "recognition",
    location: "locations",
    subject: "subjects",
  };
  const familyStateFieldMap = {
    types: "type",
    perspectives: "perspective",
    signals: "signal",
    definitions: "definition",
    recognition: "recognition",
    locations: "location",
    subjects: "subject",
  };

  function queryTerms(value) {
    return normalizeForSearch(value)
      .split(" ")
      .filter((token) => token.length > 1);
  }

  function labelForFamilyItem(family, id) {
    if (family === "signals") return lookupSignalLabel(id);
    return familyConfigs[family]?.lookup[id]?.label || lookupAnyLabel(id);
  }

  function blankEvidenceState() {
    return {
      search: "",
      decade: "",
      type: "",
      perspective: "",
      signal: "",
      definition: "",
      recognition: "",
      location: "",
      subject: "",
      sort: "cited",
      titles: [],
      evidenceLabel: "",
    };
  }

  function titlesFromExamples(examples) {
    if (!examples) return [];
    const rows = Array.isArray(examples) ? examples : [...(examples.early || []), ...(examples.late || [])];
    return [...new Set(rows.map((item) => item.title || item.firstTitle).filter(Boolean))];
  }

  function evidenceStateForFamily(family, id, extra = {}) {
    const state = { ...blankEvidenceState(), ...extra };
    const field = familyStateFieldMap[family];
    if (field) {
      state[field] = id;
    }
    return state;
  }

  function showEvidenceDesk(nextState = {}) {
    if (!evidenceDeskController) return;
    evidenceDeskController.setFilters({ ...blankEvidenceState(), ...nextState });
    document.getElementById("evidence-desk-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function createActionButton(label, nextState, className = "ghost-button evidence-button") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.addEventListener("click", () => showEvidenceDesk(nextState));
    return button;
  }

  function appendActionButtons(container, actions = []) {
    const validActions = actions.filter((item) => item && item.state);
    if (!validActions.length) return;
    const wrap = document.createElement("div");
    wrap.className = "evidence-actions";
    validActions.forEach((item) => {
      wrap.append(createActionButton(item.label, item.state, item.className || "ghost-button evidence-button"));
    });
    container.append(wrap);
  }

  function resolveFamilyIds(family, value) {
    const config = familyConfigs[family];
    const normalizedValue = normalizeForSearch(value);
    if (!config || !normalizedValue) return [];

    const exact = [];
    const partial = [];

    config.definitions.forEach((item) => {
      const label = family === "signals" ? lookupSignalLabel(item.id) : item.label;
      const searchText = normalizeForSearch(
        `${item.id} ${label} ${item.description || ""} ${(customAliases[item.id] || []).join(" ")}`,
      );
      if (searchText === normalizedValue || normalizeForSearch(label) === normalizedValue || item.id === normalizedValue) {
        exact.push(item.id);
      } else if (searchText.includes(normalizedValue)) {
        partial.push(item.id);
      }
    });

    return [...new Set([...exact, ...partial])];
  }

  function parseStructuredSearch(rawValue) {
    const clauses = [];
    const pattern = /(^|\s)([a-zA-Z]+):(?:"([^"]+)"|([^\s]+))/g;
    const remainder = String(rawValue || "").replace(pattern, (match, lead, field, quoted, plain) => {
      clauses.push({
        field: String(field || "").toLowerCase(),
        value: String(quoted ?? plain ?? "").trim(),
      });
      return lead ? " " : "";
    });

    return {
      raw: rawValue,
      freeText: remainder.trim(),
      terms: queryTerms(remainder),
      clauses: clauses.map((clause) => {
        const family = structuredFieldMap[clause.field];
        if (family) {
          const resolvedIds = resolveFamilyIds(family, clause.value);
          return {
            ...clause,
            family,
            kind: "family",
            resolvedIds,
            valid: resolvedIds.length > 0,
            message: resolvedIds.length
              ? ""
              : `${fieldLabels[family] || familyConfigs[family]?.label || clause.field} could not resolve “${clause.value}”.`,
          };
        }

        if (["title", "quote", "doi", "year", "decade"].includes(clause.field)) {
          return {
            ...clause,
            kind: clause.field,
            normalizedValue: normalizeForSearch(clause.value),
            valid: Boolean(clause.value),
            message: Boolean(clause.value) ? "" : `${fieldLabels[clause.field]} needs a value.`,
          };
        }

        return {
          ...clause,
          kind: "unknown",
          valid: false,
          message: `Field “${clause.field}” is not supported.`,
        };
      }),
    };
  }

  function dedupeBy(items, keyFn) {
    const seen = new Set();
    const output = [];
    items.forEach((item) => {
      const key = keyFn(item);
      if (seen.has(key)) return;
      seen.add(key);
      output.push(item);
    });
    return output;
  }

  function articleSearchBundle(article) {
    return {
      title: normalizeForSearch(article.title),
      excerpt: normalizeForSearch(article.excerpt),
      doi: normalizeForSearch(article.doi || ""),
      codes: normalizeForSearch(
        [
          article.intelligenceTypes.map((id) => lookupAnyLabel(id)).join(" "),
          article.perspectives.map((id) => lookupAnyLabel(id)).join(" "),
          article.signals.map((id) => lookupAnyLabel(id)).join(" "),
          article.definitionFrames.map((id) => lookupAnyLabel(id)).join(" "),
          article.recognitionModes.map((id) => lookupAnyLabel(id)).join(" "),
          article.locationFrames.map((id) => lookupAnyLabel(id)).join(" "),
          article.subjectFrames.map((id) => lookupAnyLabel(id)).join(" "),
        ].join(" "),
      ),
      quotes: (article.quotes || []).map((quote) => ({
        ...quote,
        normalized: normalizeForSearch(quote.text),
      })),
    };
  }

  function relevantConfidenceEntries(article, families, matchedIdsByFamily = {}) {
    const selectedFamilies = families?.length ? families : ["types", "perspectives", "definitions"];
    const output = [];

    selectedFamilies.forEach((family) => {
      const config = familyConfigs[family];
      if (!config) return;
      const entries = article.codingConfidence?.[config.articleKey] || [];
      const filtered = matchedIdsByFamily[family]?.length
        ? entries.filter((entry) => matchedIdsByFamily[family].includes(entry.id))
        : entries.slice(0, 2);
      filtered.forEach((entry) => {
        output.push({
          family,
          ...entry,
        });
      });
    });

    return dedupeBy(output, (item) => `${item.family}:${item.id}`).slice(0, 6);
  }

  function selectRelevantQuotes(article, context = {}) {
    const quotes = (article.quotes || []).map((quote) => ({ ...quote }));
    if (!quotes.length) return [];

    const termList = context.terms || [];
    const quotePhrases = (context.clauses || [])
      .filter((clause) => clause.kind === "quote")
      .map((clause) => clause.normalizedValue)
      .filter(Boolean);
    const relevantTags = new Set(Object.values(context.matchedIdsByFamily || {}).flat());
    const focusFamilies = new Set(context.focusFamilies || []);

    const ranked = quotes
      .map((quote) => {
        const normalized = normalizeForSearch(quote.text);
        let score = /intelligen/i.test(quote.text) ? 1 : 0;
        if (quotePhrases.some((phrase) => normalized.includes(phrase))) score += 6;
        if (termList.length && termList.every((term) => normalized.includes(term))) score += 4;
        if (quote.tags?.some((tag) => relevantTags.has(tag))) score += 3;
        if (quote.families?.some((family) => focusFamilies.has(family))) score += 2;
        return { ...quote, score };
      })
      .filter((quote) => quote.score > 0)
      .sort((a, b) => b.score - a.score || a.text.length - b.text.length);

    if (!ranked.length) {
      return quotes.slice(0, 2);
    }

    return dedupeBy(ranked, (quote) => quote.text).slice(0, 2);
  }

  function compareArticlesByImportance(a, b) {
    const aCitations = pdfCitationCount(a);
    const bCitations = pdfCitationCount(b);
    return (
      bCitations - aCitations ||
      (b.articleViews || 0) - (a.articleViews || 0) ||
      b.year - a.year ||
      a.title.localeCompare(b.title)
    );
  }

  function buildDecadeProfiles() {
    const profiles = Object.fromEntries(
      allDecades.map((decade) => [
        decade,
        {
          articleCount: 0,
          articles: [],
          types: {},
          perspectives: {},
          signals: {},
          definitions: {},
          recognition: {},
          locations: {},
          subjects: {},
        },
      ]),
    );

    corpus.articles.forEach((article) => {
      const decade = currentDecade(article);
      const profile = profiles[decade];
      if (!profile) return;
      profile.articleCount += 1;
      profile.articles.push(article);
      article.intelligenceTypes.forEach((id) => {
        profile.types[id] = (profile.types[id] || 0) + 1;
      });
      article.perspectives.forEach((id) => {
        profile.perspectives[id] = (profile.perspectives[id] || 0) + 1;
      });
      article.signals.forEach((id) => {
        profile.signals[id] = (profile.signals[id] || 0) + 1;
      });
      article.definitionFrames.forEach((id) => {
        profile.definitions[id] = (profile.definitions[id] || 0) + 1;
      });
      article.recognitionModes.forEach((id) => {
        profile.recognition[id] = (profile.recognition[id] || 0) + 1;
      });
      article.locationFrames.forEach((id) => {
        profile.locations[id] = (profile.locations[id] || 0) + 1;
      });
      article.subjectFrames.forEach((id) => {
        profile.subjects[id] = (profile.subjects[id] || 0) + 1;
      });
    });

    return profiles;
  }

  const decadeProfiles = buildDecadeProfiles();

  function formatReason(reason) {
    if (reason.endsWith(" lens")) {
      const id = reason.replace(/ lens$/, "");
      return `${lookupAnyLabel(id)} lens`;
    }
    return lookupAnyLabel(reason);
  }

  function renderExampleList(examples) {
    if (!examples || (!examples.early?.length && !examples.late?.length)) {
      return "";
    }

    const buildItems = (rows) =>
      rows.map((row) => `<li>${row.year}: ${row.title}</li>`).join("");

    return `
      <div class="evidence-block">
        <div class="evidence-grid">
          <div>
            <h4>Earlier examples</h4>
            <ul>${buildItems(examples.early || [])}</ul>
          </div>
          <div>
            <h4>Later examples</h4>
            <ul>${buildItems(examples.late || [])}</ul>
          </div>
        </div>
      </div>
    `;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function articleMatchesFamily(article, family, id) {
    const config = familyConfigs[family];
    if (!config) return false;
    return article[config.articleKey].includes(id);
  }

  function articlesForFamily(family, id) {
    return corpus.articles.filter((article) => articleMatchesFamily(article, family, id));
  }

  function cuesForDefinition(definition) {
    if (definition?.cues?.length) return definition.cues;
    return [];
  }

  function countForFamily(family, id) {
    return familyCountLookup[family]?.[id]?.count || 0;
  }

  function detailTagMarkup(ids) {
    return (ids || []).map((id) => `<span class="tag">${escapeHtml(lookupAnyLabel(id))}</span>`).join("");
  }

  function articleCardMarkup(article, options = {}) {
    const cited = pdfCitationCount(article);
    const metaBits = [
      article.year ? `${article.year}` : null,
      article.pageCount ? `${article.pageCount} pages` : null,
      article.articleViews ? `${formatNumber(article.articleViews)} views` : null,
      cited ? `${formatNumber(cited)} citing articles in PDF metadata` : null,
    ].filter(Boolean);

    const matchReasons = options.matchReasons?.length
      ? `
        <div class="match-list">
          <h5>Match reasons</h5>
          <ul>${options.matchReasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}</ul>
        </div>
      `
      : "";
    const quotes = options.quotes?.length
      ? `
        <div class="quote-list">
          <h5>Quote-level evidence</h5>
          ${options.quotes
            .map(
              (quote) => `
                <figure class="quote-item">
                  <p>“${escapeHtml(quote.text)}”</p>
                </figure>
              `,
            )
            .join("")}
        </div>
      `
      : "";
    const confidenceStrip = options.confidence?.length
      ? `
        <div class="confidence-strip">
          ${options.confidence
            .map(
              (item) => `
                <span class="confidence-badge" data-kind="${escapeHtml(item.kind || "heuristic")}" title="${escapeHtml(item.note || "")}">
                  ${escapeHtml(labelForFamilyItem(item.family, item.id))} · ${escapeHtml(item.label)}
                </span>
              `,
            )
            .join("")}
        </div>
      `
      : "";
    const conceptualDetails = options.showConcepts !== false
      ? `
        <div class="detail-tags detail-tags-subtle">${detailTagMarkup(article.definitionFrames)}${detailTagMarkup(article.recognitionModes)}</div>
        <div class="detail-tags detail-tags-subtle">${detailTagMarkup(article.locationFrames)}${detailTagMarkup(article.subjectFrames)}</div>
      `
      : "";

    return `
      <article class="explorer-card">
        <div class="meta-line">${escapeHtml(metaBits.join(" · "))}</div>
        <h4>${escapeHtml(article.title)}</h4>
        <p>${escapeHtml(article.excerpt)}</p>
        ${matchReasons}
        ${quotes}
        ${confidenceStrip}
        <div class="detail-tags">${detailTagMarkup(article.intelligenceTypes)}</div>
        <div class="detail-tags detail-tags-subtle">${detailTagMarkup(article.perspectives)}${detailTagMarkup(article.signals)}</div>
        ${conceptualDetails}
        <p class="evidence-meta">${article.doi ? `DOI: ${escapeHtml(article.doi)}` : "DOI not available in extracted metadata."}</p>
      </article>
    `;
  }

  function inspectConceptInEvidenceDesk(family, id) {
    showEvidenceDesk(evidenceStateForFamily(family, id));
  }

  function topLabels(counter, limit) {
    return Object.entries(counter)
      .sort((a, b) => b[1] - a[1] || lookupAnyLabel(a[0]).localeCompare(lookupAnyLabel(b[0])))
      .slice(0, limit)
      .map(([id]) => lookupAnyLabel(id));
  }

  function codebookCompanions(family, articles) {
    const typeCounter = {};
    const perspectiveCounter = {};
    const signalCounter = {};

    articles.forEach((article) => {
      article.intelligenceTypes.forEach((id) => {
        typeCounter[id] = (typeCounter[id] || 0) + 1;
      });
      article.perspectives.forEach((id) => {
        perspectiveCounter[id] = (perspectiveCounter[id] || 0) + 1;
      });
      article.signals.forEach((id) => {
        signalCounter[id] = (signalCounter[id] || 0) + 1;
      });
    });

    if (family === "types") {
      return [
        { label: "Usually read through", values: topLabels(perspectiveCounter, 3) },
        { label: "Recurring adjacent signals", values: topLabels(signalCounter, 3) },
      ];
    }

    if (family === "perspectives") {
      return [
        { label: "Most often joined with", values: topLabels(typeCounter, 3) },
        { label: "Recurring adjacent signals", values: topLabels(signalCounter, 3) },
      ];
    }

    return [
      { label: "Most often joined with", values: topLabels(typeCounter, 3) },
      { label: "Often interpreted through", values: topLabels(perspectiveCounter, 3) },
    ];
  }

  function createBarRows(container, rows, tone, options = {}) {
    const max = Math.max(...rows.map((item) => item.count), 1);
    container.innerHTML = "";

    rows.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "bar-row";

      const meta = document.createElement("div");
      meta.className = "bar-meta";

      const title = document.createElement("strong");
      title.textContent = item.label;

      const count = document.createElement("span");
      count.className = "bar-count";
      count.textContent = formatNumber(item.count);

      meta.append(title, count);

      const track = document.createElement("div");
      track.className = "bar-track";
      const fill = document.createElement("div");
      fill.className = "bar-fill";
      fill.style.width = `${(item.count / max) * 100}%`;
      fill.style.background =
        tone === "warm"
          ? "linear-gradient(90deg, rgba(173,95,59,0.95), rgba(215,181,109,0.92))"
          : "linear-gradient(90deg, rgba(19,70,71,0.95), rgba(84,141,138,0.9))";
      track.append(fill);

      const description = document.createElement("p");
      description.className = "bar-desc";
      description.textContent = item.description || "";

      row.append(meta, track, description);
      if (options.family && item.id) {
        appendActionButtons(row, [
          {
            label: "See evidence",
            state: evidenceStateForFamily(options.family, item.id),
          },
        ]);
      }
      row.style.transitionDelay = `${index * 35}ms`;
      container.append(row);
    });
  }

  function heatColor(count, max) {
    const ratio = max === 0 ? 0 : count / max;
    const hue = 176;
    const saturation = 34 + ratio * 16;
    const lightness = 94 - ratio * 48;
    return `hsl(${hue} ${saturation}% ${lightness}%)`;
  }

  function textColor(count, max) {
    return count / max > 0.55 ? "#f8f5ee" : "#173433";
  }

  function renderHeroStats() {
    const wrapper = document.getElementById("hero-stats");
    const stats = [
      {
        value: corpus.summary.articleCount,
        label: "articles in the corpus",
      },
      {
        value: `${corpus.summary.yearRange[0]}-${corpus.summary.yearRange[1]}`,
        label: "publication span",
      },
      {
        value: `${corpus.summary.withPdfCitationCounts || 0}/${corpus.summary.articleCount}`,
        label: "with PDF citation metadata",
      },
      {
        value: `${corpus.intelligenceTypes.length} × ${corpus.perspectives.length}`,
        label: "types and perspectives",
      },
    ];

    wrapper.innerHTML = "";
    stats.forEach((item) => {
      const stat = document.createElement("div");
      stat.className = "stat";
      stat.innerHTML = `<span class="value">${item.value}</span><span class="label">${item.label}</span>`;
      wrapper.append(stat);
    });
  }

  function getComparisonFamilyConfig(family) {
    const config = familyConfigs[family] || familyConfigs.types;
    return {
      bucketKey: config.bucketKey,
      articleKey: config.articleKey,
      label: config.label.toLowerCase(),
      rows: config.definitions.map((item) => ({
        id: item.id,
        label: family === "signals" ? lookupSignalLabel(item.id) : item.label,
        description:
          item.description || (family === "signals" ? signalFallbackMeta[item.id]?.description || "Adjacent motif in the corpus." : ""),
      })),
    };
  }

  function renderComparisonStudio() {
    const familySelect = document.getElementById("compare-family");
    const leftSelect = document.getElementById("compare-left");
    const rightSelect = document.getElementById("compare-right");
    const sortSelect = document.getElementById("compare-sort");
    const note = document.getElementById("comparison-note");
    const chart = document.getElementById("comparison-chart");
    const detail = document.getElementById("comparison-detail");
    const takeaways = document.getElementById("comparison-takeaways");

    if (!familySelect || !leftSelect || !rightSelect) {
      return;
    }

    leftSelect.innerHTML = "";
    rightSelect.innerHTML = "";
    allDecades.forEach((decade) => {
      const leftOption = document.createElement("option");
      leftOption.value = decade;
      leftOption.textContent = decade;
      leftSelect.append(leftOption);

      const rightOption = document.createElement("option");
      rightOption.value = decade;
      rightOption.textContent = decade;
      rightSelect.append(rightOption);
    });
    leftSelect.value = allDecades[0];
    rightSelect.value = allDecades[allDecades.length - 1];

    function buildRows() {
      const family = getComparisonFamilyConfig(familySelect.value);
      const leftDecade = leftSelect.value;
      const rightDecade = rightSelect.value;
      const leftProfile = decadeProfiles[leftDecade];
      const rightProfile = decadeProfiles[rightDecade];

      return family.rows.map((item) => {
        const leftCount = leftProfile[family.bucketKey][item.id] || 0;
        const rightCount = rightProfile[family.bucketKey][item.id] || 0;
        const leftShare = leftCount / leftProfile.articleCount;
        const rightShare = rightCount / rightProfile.articleCount;
        const delta = rightShare - leftShare;
        return {
          ...item,
          leftCount,
          rightCount,
          leftShare,
          rightShare,
          delta,
          examples: {
            left: leftProfile.articles
              .filter((article) => article[family.articleKey].includes(item.id))
              .sort(compareArticlesByImportance)
              .slice(0, 3),
            right: rightProfile.articles
              .filter((article) => article[family.articleKey].includes(item.id))
              .sort(compareArticlesByImportance)
              .slice(0, 3),
          },
        };
      });
    }

    function sortRows(rows) {
      if (sortSelect.value === "left") {
        return [...rows].sort((a, b) => b.leftShare - a.leftShare || b.delta - a.delta);
      }
      if (sortSelect.value === "right") {
        return [...rows].sort((a, b) => b.rightShare - a.rightShare || b.delta - a.delta);
      }
      if (sortSelect.value === "stable") {
        return [...rows].sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta) || b.rightShare - a.rightShare);
      }
      return [...rows].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || b.rightShare - a.rightShare);
    }

    function renderDetail(row) {
      const leftDecade = leftSelect.value;
      const rightDecade = rightSelect.value;
      const direction =
        row.delta > 0.03
          ? `${rightDecade} leans more heavily toward this than ${leftDecade}.`
          : row.delta < -0.03
            ? `${leftDecade} leans more heavily toward this than ${rightDecade}.`
            : `This strand is comparatively stable across the two decades.`;

      const buildItems = (articles) =>
        articles.length
          ? articles.map((article) => `<li>${article.year}: ${article.title}</li>`).join("")
          : "<li>No matching articles in this decade.</li>";

      detail.innerHTML = `
        <h3>${row.label}</h3>
        <p>${row.description}</p>
        <p>${leftSelect.value}: ${formatPercent(row.leftShare)} (${row.leftCount} articles) · ${rightSelect.value}: ${formatPercent(row.rightShare)} (${row.rightCount} articles)</p>
        <p>${direction}</p>
        <div class="evidence-block">
          <div class="evidence-grid">
            <div>
              <h4>${leftDecade}</h4>
              <ul>${buildItems(row.examples.left)}</ul>
            </div>
            <div>
              <h4>${rightDecade}</h4>
              <ul>${buildItems(row.examples.right)}</ul>
            </div>
          </div>
        </div>
      `;
      appendActionButtons(detail, [
        {
          label: "Open these articles",
          state: {
            ...evidenceStateForFamily(familySelect.value, row.id),
            titles: titlesFromExamples({ early: row.examples.left, late: row.examples.right }),
            evidenceLabel: `${row.label} comparison evidence`,
          },
        },
      ]);
    }

    function renderTakeaways(rows) {
      const leftDecade = leftSelect.value;
      const rightDecade = rightSelect.value;
      const strongestRight = [...rows].sort((a, b) => b.delta - a.delta)[0];
      const strongestLeft = [...rows].sort((a, b) => a.delta - b.delta)[0];
      const shared = [...rows].sort((a, b) => Math.min(b.leftShare, b.rightShare) - Math.min(a.leftShare, a.rightShare))[0];
      const newOnRight = [...rows].find((row) => row.leftShare === 0 && row.rightShare >= 0.08);

      const cards = [
        {
          title: `${rightDecade} leans hardest into ${strongestRight.label}`,
          body: `${strongestRight.label} rises from ${formatPercent(strongestRight.leftShare)} to ${formatPercent(strongestRight.rightShare)} across the comparison.`,
          row: strongestRight,
        },
        {
          title: `${leftDecade} leans harder into ${strongestLeft.label}`,
          body: `${strongestLeft.label} drops from ${formatPercent(strongestLeft.leftShare)} to ${formatPercent(strongestLeft.rightShare)}, making it more characteristic of the earlier decade.`,
          row: strongestLeft,
        },
        {
          title: `${shared.label} stays central in both decades`,
          body: `Its minimum share across the two sides remains high, which makes it a bridge rather than a swing variable.`,
          row: shared,
        },
      ];

      if (newOnRight) {
        cards.push({
          title: `${newOnRight.label} is newly visible on the right`,
          body: `It is absent in ${leftDecade} but present in ${formatPercent(newOnRight.rightShare)} of ${rightDecade} articles in this comparison.`,
          row: newOnRight,
        });
      }

      takeaways.innerHTML = "";
      cards.forEach((item) => {
        const card = document.createElement("article");
        card.className = "thread-card";
        card.innerHTML = `<h3>${item.title}</h3><p>${item.body}</p>`;
        appendActionButtons(card, [
          {
            label: "See evidence",
            state: {
              ...evidenceStateForFamily(familySelect.value, item.row.id),
              titles: titlesFromExamples({ early: item.row.examples.left, late: item.row.examples.right }),
              evidenceLabel: item.title,
            },
          },
        ]);
        takeaways.append(card);
      });
    }

    function refresh() {
      const family = getComparisonFamilyConfig(familySelect.value);
      const leftDecade = leftSelect.value;
      const rightDecade = rightSelect.value;
      const leftProfile = decadeProfiles[leftDecade];
      const rightProfile = decadeProfiles[rightDecade];

      note.textContent = `${leftDecade} has ${leftProfile.articleCount} articles and ${rightDecade} has ${rightProfile.articleCount}. Bars show share of articles in each decade carrying a label, so multi-label categories can exceed 100% when summed.`;

      const rows = sortRows(buildRows());
      const maxShare = Math.max(...rows.map((row) => Math.max(row.leftShare, row.rightShare)), 0.01);
      const buttons = [];
      chart.innerHTML = "";

      rows.forEach((row) => {
        const wrapper = document.createElement("div");
        wrapper.className = "comparison-row";
        const button = document.createElement("button");
        button.type = "button";
        const deltaPoints = Math.round(Math.abs(row.delta) * 100);
        const deltaLabel =
          row.delta > 0.005
            ? `${rightDecade} +${deltaPoints} pts`
            : row.delta < -0.005
              ? `${leftDecade} +${deltaPoints} pts`
              : "near balance";

        button.innerHTML = `
          <div class="comparison-meta">
            <strong>${row.label}</strong>
            <span class="comparison-values">${formatPercent(row.leftShare)} vs ${formatPercent(row.rightShare)}</span>
          </div>
          <div class="comparison-bars">
            <div class="comparison-side left"><div class="comparison-fill left" style="width:${(row.leftShare / maxShare) * 100}%"></div></div>
            <div class="comparison-axis" aria-hidden="true"></div>
            <div class="comparison-side right"><div class="comparison-fill right" style="width:${(row.rightShare / maxShare) * 100}%"></div></div>
          </div>
          <div class="comparison-delta">${deltaLabel}</div>
        `;
        button.addEventListener("click", () => {
          buttons.forEach((item) => item.wrapper.classList.remove("is-active"));
          wrapper.classList.add("is-active");
          renderDetail(row);
        });

        wrapper.append(button);
        chart.append(wrapper);
        buttons.push({ wrapper, row });
      });

      renderTakeaways(rows);
      if (buttons[0]) {
        buttons[0].wrapper.classList.add("is-active");
        renderDetail(buttons[0].row);
      }
    }

    [familySelect, leftSelect, rightSelect, sortSelect].forEach((element) => {
      element.addEventListener("change", refresh);
      element.addEventListener("input", refresh);
    });

    refresh();
  }

  function renderMatrix() {
    const table = document.getElementById("matrix-table");
    const detail = document.getElementById("matrix-detail");
    const max = Math.max(...corpus.matrix.map((item) => item.count), 1);
    const matrixMap = new Map(
      corpus.matrix.map((item) => [`${item.intelligenceId}__${item.perspectiveId}`, item]),
    );

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    headRow.append(document.createElement("th"));

    corpus.perspectives.forEach((perspective) => {
      const th = document.createElement("th");
      th.textContent = perspective.label;
      headRow.append(th);
    });
    thead.append(headRow);

    const tbody = document.createElement("tbody");
    const buttons = [];

    function renderDetail(cell, intelligence, perspective) {
      const articles = corpus.articles.filter(
        (article) =>
          article.intelligenceTypes.includes(intelligence.id) &&
          article.perspectives.includes(perspective.id),
      );

      detail.innerHTML = "";

      const title = document.createElement("h3");
      title.textContent = `${intelligence.label} × ${perspective.label}`;

      const intro = document.createElement("p");
      intro.textContent = `${formatNumber(cell.count)} articles sit at this intersection.`;

      const description = document.createElement("p");
      description.textContent = `${intelligence.description} ${perspective.description}`;

      const tagWrap = document.createElement("div");
      tagWrap.className = "detail-tags";
      [intelligence.label, perspective.label].forEach((label) => {
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = label;
        tagWrap.append(tag);
      });

      const subtitle = document.createElement("h4");
      subtitle.textContent = "Example titles";

      const list = document.createElement("ol");
      list.className = "article-list";

      articles
        .sort((a, b) => a.year - b.year)
        .slice(0, 10)
        .forEach((article) => {
          const item = document.createElement("li");
          item.textContent = `${article.year}: ${article.title}`;
          list.append(item);
        });

      detail.append(title, intro, description, tagWrap, subtitle, list);
      appendActionButtons(detail, [
        {
          label: "Open exact articles",
          state: {
            ...evidenceStateForFamily("types", intelligence.id, { perspective: perspective.id }),
            titles: articles.map((article) => article.title),
            evidenceLabel: `${intelligence.label} × ${perspective.label}`,
          },
        },
      ]);
    }

    corpus.intelligenceTypes.forEach((intelligence) => {
      const tr = document.createElement("tr");
      const rowHeader = document.createElement("th");
      rowHeader.className = "row-label";
      rowHeader.scope = "row";
      rowHeader.textContent = intelligence.label;
      tr.append(rowHeader);

      corpus.perspectives.forEach((perspective) => {
        const td = document.createElement("td");
        const key = `${intelligence.id}__${perspective.id}`;
        const cell = matrixMap.get(key) || {
          intelligenceId: intelligence.id,
          perspectiveId: perspective.id,
          count: 0,
          titles: [],
        };

        const button = document.createElement("button");
        button.type = "button";
        button.className = "matrix-cell";
        button.style.background = heatColor(cell.count, max);
        button.style.color = textColor(cell.count, max);
        button.setAttribute("aria-label", `${intelligence.label} and ${perspective.label}: ${cell.count} articles`);
        button.innerHTML = `<span class="count">${cell.count}</span><span class="mini">articles</span>`;
        button.addEventListener("click", () => {
          buttons.forEach((candidate) => candidate.classList.remove("is-active"));
          button.classList.add("is-active");
          renderDetail(cell, intelligence, perspective);
        });

        buttons.push(button);
        td.append(button);
        tr.append(td);
      });

      tbody.append(tr);
    });

    table.innerHTML = "";
    table.append(thead, tbody);

    const defaultCell = [...buttons]
      .map((button, index) => ({ button, index, count: Number(button.querySelector(".count").textContent) }))
      .sort((a, b) => b.count - a.count)[0];

    if (defaultCell) {
      defaultCell.button.click();
    }
  }

  function renderTrendGroup(containerId, noteId, trendGroup, family) {
    const container = document.getElementById(containerId);
    const note = document.getElementById(noteId);

    if (note) {
      note.textContent = `${trendGroup.earlyWindow[0]}–${trendGroup.earlyWindow[trendGroup.earlyWindow.length - 1]} compared with ${trendGroup.lateWindow[0]}–${trendGroup.lateWindow[trendGroup.lateWindow.length - 1]}. Amber marks the early share; teal marks the later share.`;
    }

    container.innerHTML = "";

    trendGroup.rows.forEach((row) => {
      const item = document.createElement("div");
      item.className = "trend-row";

      const meta = document.createElement("div");
      meta.className = "trend-meta";
      meta.innerHTML = `
        <strong>${row.label}</strong>
        <span class="trend-values">${formatPercent(row.earlyShare)} → ${formatPercent(row.lateShare)}</span>
      `;

      const chart = document.createElement("div");
      chart.className = "trend-chart";

      const earlyDot = document.createElement("span");
      earlyDot.className = "trend-dot early";
      earlyDot.style.left = `${row.earlyShare * 100}%`;
      earlyDot.title = `${row.label} early window: ${formatPercent(row.earlyShare)}`;

      const lateDot = document.createElement("span");
      lateDot.className = "trend-dot late";
      lateDot.style.left = `${row.lateShare * 100}%`;
      lateDot.title = `${row.label} late window: ${formatPercent(row.lateShare)}`;

      chart.append(earlyDot, lateDot);

      const noteRow = document.createElement("div");
      noteRow.className = "trend-note";
      noteRow.innerHTML = `
        <span>${row.description}</span>
        <span class="trend-direction">${row.direction}</span>
      `;

      item.append(meta, chart, noteRow);
      if (family && row.id) {
        appendActionButtons(item, [
          {
            label: "Open supporting articles",
            state: {
              ...evidenceStateForFamily(family, row.id),
              titles: titlesFromExamples(row.examples),
              evidenceLabel: `${row.label} trend evidence`,
            },
          },
        ]);
      }
      container.append(item);
    });
  }

  function renderTrendHighlights() {
    const container = document.getElementById("trend-highlights");
    container.innerHTML = "";
    corpus.trends.highlights.forEach((thread) => {
      const card = document.createElement("article");
      card.className = "thread-card";
      card.innerHTML = `<h3>${thread.title}</h3><p>${thread.body}</p>${renderExampleList(thread.examples)}`;
      appendActionButtons(card, [
        {
          label: "See evidence",
          state: {
            ...blankEvidenceState(),
            titles: titlesFromExamples(thread.examples),
            evidenceLabel: thread.title,
          },
        },
      ]);
      container.append(card);
    });
  }

  function renderConceptualQuestions() {
    const targets = {
      definitions: {
        bars: document.getElementById("definition-bars"),
        note: document.getElementById("definition-note"),
        highlights: document.getElementById("definition-highlights"),
        tone: "warm",
        noteText:
          "These are heuristic frames for what intelligence is taken to mean. Articles can carry several at once, so the totals show recurrence rather than mutually exclusive types.",
      },
      recognition: {
        bars: document.getElementById("recognition-bars"),
        note: document.getElementById("recognition-note"),
        highlights: document.getElementById("recognition-highlights"),
        tone: "cool",
        noteText:
          "This lens tracks what counts as evidence of intelligence in the article: a score, an artwork, a reflection, a relation, or a technical practice.",
      },
      locations: {
        bars: document.getElementById("location-bars"),
        note: document.getElementById("location-note"),
        highlights: document.getElementById("location-highlights"),
        tone: "warm",
        noteText:
          "Location frames show where intelligence is imagined to reside. The same article can place it in more than one site at once.",
      },
      subjects: {
        bars: document.getElementById("subject-bars"),
        note: document.getElementById("subject-note"),
        highlights: document.getElementById("subject-highlights"),
        tone: "cool",
        noteText:
          "Subject positions show who is being centered as intelligent or intelligible. They indicate explicit attention, not the full set of people implied by every article.",
      },
    };

    Object.entries(targets).forEach(([family, target]) => {
      const question = corpus.conceptualQuestions[family];
      if (!question || !target.bars || !target.highlights || !target.note) {
        return;
      }

      createBarRows(target.bars, question.counts, target.tone, { family });
      target.note.textContent = target.noteText;
      target.highlights.innerHTML = "";
      const riserId = [...question.trends.rows].sort((a, b) => b.delta - a.delta)[0]?.id;
      const declinerId = [...question.trends.rows].sort((a, b) => a.delta - b.delta)[0]?.id;

      question.highlights.forEach((item, index) => {
        const card = document.createElement("article");
        card.className = "thread-card";
        const button = document.createElement("button");
        button.type = "button";
        button.className = "ghost-button question-button";
        const focusId = index === 0 ? question.counts[0]?.id : index === 1 ? riserId : declinerId;
        button.textContent = "Inspect evidence";
        if (focusId) {
          button.addEventListener("click", () =>
            showEvidenceDesk({
              ...evidenceStateForFamily(family, focusId),
              titles: titlesFromExamples(item.examples),
              evidenceLabel: item.title,
            }),
          );
        } else {
          button.disabled = true;
        }
        card.innerHTML = `<h3>${item.title}</h3><p>${item.body}</p>${renderExampleList(item.examples)}`;
        card.append(button);
        target.highlights.append(card);
      });
    });
  }

  function renderMeaningShifts() {
    const storyTarget = document.getElementById("meaning-shift-stories");
    const periodTarget = document.getElementById("meaning-periods");

    if (!storyTarget || !periodTarget) {
      return;
    }

    storyTarget.innerHTML = "";
    corpus.meaningShifts.stories.forEach((story) => {
      const card = document.createElement("article");
      card.className = "thread-card";
      card.innerHTML = `<h3>${story.title}</h3><p>${story.body}</p>${renderExampleList(story.examples)}`;
      appendActionButtons(card, [
        {
          label: "See evidence",
          state: {
            ...blankEvidenceState(),
            titles: titlesFromExamples(story.examples),
            evidenceLabel: story.title,
          },
        },
      ]);
      storyTarget.append(card);
    });

    periodTarget.innerHTML = "";
    corpus.meaningShifts.periods.forEach((period) => {
      const card = document.createElement("article");
      card.className = "period-card";
      card.innerHTML = `
        <h3>${period.label}</h3>
        <p>${formatNumber(period.articleCount)} articles</p>
        <div class="period-section">
          <h4>Defined as</h4>
          <p>${period.families.definitions.map((item) => `${item.label} (${formatPercent(item.share)})`).join(" · ") || "No strong dominant frame."}</p>
        </div>
        <div class="period-section">
          <h4>Recognized through</h4>
          <p>${period.families.recognition.map((item) => `${item.label} (${formatPercent(item.share)})`).join(" · ") || "No strong dominant mode."}</p>
        </div>
        <div class="period-section">
          <h4>Located in</h4>
          <p>${period.families.locations.map((item) => `${item.label} (${formatPercent(item.share)})`).join(" · ") || "No strong dominant site."}</p>
        </div>
        <div class="period-section">
          <h4>Centered on</h4>
          <p>${period.families.subjects.map((item) => `${item.label} (${formatPercent(item.share)})`).join(" · ") || "No strong dominant subject."}</p>
        </div>
      `;
      periodTarget.append(card);
    });
  }

  function renderScorecards() {
    const rising = document.getElementById("trend-risers");
    const fading = document.getElementById("trend-decliners");

    function paint(container, rows) {
      container.innerHTML = "";
      rows.forEach((row) => {
        const card = document.createElement("article");
        card.className = "scorecard";
        card.innerHTML = `
          <h4>${typeLookup[row.id]?.label || perspectiveLookup[row.id]?.label || lookupSignalLabel(row.id)}</h4>
          <p><span class="delta">${formatPercent(row.earlyShare)} → ${formatPercent(row.lateShare)}</span> · ${row.direction}</p>
        `;
        appendActionButtons(card, [
          {
            label: "See evidence",
            state: {
              ...evidenceStateForFamily(row.family, row.id),
              titles: titlesFromExamples(row.examples),
              evidenceLabel: row.label,
            },
          },
        ]);
        container.append(card);
      });
    }

    paint(rising, corpus.trends.scorecards.rising);
    paint(fading, corpus.trends.scorecards.fading);
  }

  function renderOrigins() {
    const container = document.getElementById("origins");
    const selected = [
      ...corpus.origins.types
        .filter((item) => ["social", "digital", "exceptionality"].includes(item.id))
        .map((item) => ({ ...item, kind: "type" })),
      ...corpus.origins.perspectives
        .filter((item) => ["critical", "technology", "community", "disability"].includes(item.id))
        .map((item) => ({ ...item, kind: "perspective" })),
      ...corpus.origins.signals
        .filter((item) => ["equity", "identity", "place"].includes(item.id))
        .map((item) => ({ ...item, kind: "signal" })),
    ].sort((a, b) => a.firstYear - b.firstYear || a.label.localeCompare(b.label));

    container.innerHTML = "";
    selected.forEach((item) => {
      const card = document.createElement("article");
      card.className = "origin-card";
      card.innerHTML = `
        <div class="meta-line">${item.firstYear} · first appearance</div>
        <h4>${item.label}</h4>
        <p>${item.firstTitle}</p>
        <div class="detail-tags">
          <span class="tag">${item.kind}</span>
          <span class="tag">${formatNumber(item.totalCount)} articles overall</span>
        </div>
      `;
      const family = item.kind === "type" ? "types" : item.kind === "perspective" ? "perspectives" : "signals";
      appendActionButtons(card, [
        {
          label: "Open first appearance",
          state: {
            ...evidenceStateForFamily(family, item.id),
            titles: [item.firstTitle],
            evidenceLabel: item.label,
          },
        },
      ]);
      container.append(card);
    });
  }

  function renderRarePairs() {
    const container = document.getElementById("rare-pairs");
    container.innerHTML = "";

    corpus.rarePairs.forEach((item) => {
      const card = document.createElement("article");
      card.className = "thread-card";
      card.innerHTML = `
        <span class="insight-kind">${item.count} articles</span>
        <h3>${item.intelligenceLabel} × ${item.perspectiveLabel}</h3>
        <p>The pair is rare despite ${item.typeTotal} articles in the type row and ${item.perspectiveTotal} in the perspective column.</p>
        <div class="evidence-block">
          <div class="evidence-grid">
            <div>
              <h4>Example titles</h4>
              <ul>${item.examples.map((row) => `<li>${row.year}: ${row.title}</li>`).join("")}</ul>
            </div>
          </div>
        </div>
      `;
      appendActionButtons(card, [
        {
          label: "Open exact pair",
          state: {
            ...evidenceStateForFamily("types", item.intelligenceId, { perspective: item.perspectiveId }),
            titles: item.examples.map((row) => row.title),
            evidenceLabel: `${item.intelligenceLabel} × ${item.perspectiveLabel}`,
          },
        },
      ]);
      container.append(card);
    });
  }

  function renderFrontierArticles() {
    const container = document.getElementById("frontier-articles");
    container.innerHTML = "";

    corpus.frontierArticles.forEach((article) => {
      const card = document.createElement("article");
      card.className = "frontier-card";
      const uniqueTags = Array.from(
        new Set([
          ...article.reasons.map((reason) => formatReason(reason)),
          ...article.intelligenceTypes.slice(0, 1).map((id) => lookupAnyLabel(id)),
          ...article.perspectives.slice(0, 1).map((id) => lookupAnyLabel(id)),
        ]),
      );
      const tags = uniqueTags.map((label) => `<span class="tag">${label}</span>`).join("");
      card.innerHTML = `
        <div class="meta-line">${article.year} · frontier score ${article.score}</div>
        <h4>${article.title}</h4>
        <p>${article.excerpt}</p>
        <div class="detail-tags">${tags}</div>
      `;
      appendActionButtons(card, [
        {
          label: "Open article",
          state: {
            ...blankEvidenceState(),
            titles: [article.title],
            evidenceLabel: article.title,
          },
        },
      ]);
      container.append(card);
    });
  }

  function renderTimeline() {
    const container = document.getElementById("timeline");
    const typeMax = Math.max(...corpus.timeline.flatMap((row) => row.topTypes.map((item) => item.count)), 1);
    const perspectiveMax = Math.max(
      ...corpus.timeline.flatMap((row) => row.topPerspectives.map((item) => item.count)),
      1,
    );

    container.innerHTML = "";

    corpus.timeline.forEach((row) => {
      const wrapper = document.createElement("article");
      wrapper.className = "timeline-row";

      const meta = document.createElement("div");
      meta.className = "timeline-meta";
      meta.innerHTML = `<h3>${row.decade}</h3><p>${formatNumber(row.articleCount)} corpus articles</p>`;

      const typeBlock = document.createElement("div");
      const typeHeading = document.createElement("h4");
      typeHeading.textContent = "Top intelligence types";
      const typeBars = document.createElement("div");
      typeBars.className = "mini-bars";

      row.topTypes.forEach((item) => {
        const entry = document.createElement("button");
        entry.className = "mini-bar";
        entry.type = "button";
        entry.innerHTML = `
          <span>${typeLookup[item.id].label}</span>
          <span class="track"><span class="fill" style="width:${(item.count / typeMax) * 100}%"></span></span>
          <span class="count">${item.count}</span>
        `;
        entry.addEventListener("click", () =>
          showEvidenceDesk({
            ...evidenceStateForFamily("types", item.id, { decade: row.decade }),
            evidenceLabel: `${row.decade} · ${typeLookup[item.id].label}`,
          }),
        );
        typeBars.append(entry);
      });
      typeBlock.append(typeHeading, typeBars);

      const perspectiveBlock = document.createElement("div");
      const perspectiveHeading = document.createElement("h4");
      perspectiveHeading.textContent = "Top perspectives";
      const perspectiveBars = document.createElement("div");
      perspectiveBars.className = "mini-bars";

      row.topPerspectives.forEach((item) => {
        const entry = document.createElement("button");
        entry.className = "mini-bar";
        entry.type = "button";
        entry.innerHTML = `
          <span>${perspectiveLookup[item.id].label}</span>
          <span class="track"><span class="fill" style="width:${(item.count / perspectiveMax) * 100}%"></span></span>
          <span class="count">${item.count}</span>
        `;
        entry.addEventListener("click", () =>
          showEvidenceDesk({
            ...evidenceStateForFamily("perspectives", item.id, { decade: row.decade }),
            evidenceLabel: `${row.decade} · ${perspectiveLookup[item.id].label}`,
          }),
        );
        perspectiveBars.append(entry);
      });
      perspectiveBlock.append(perspectiveHeading, perspectiveBars);

      wrapper.append(meta, typeBlock, perspectiveBlock);
      container.append(wrapper);
    });
  }

  function renderBlindSpots() {
    const container = document.getElementById("blind-spots");
    container.innerHTML = "";

    corpus.blindSpots.forEach((spot) => {
      const card = document.createElement("article");
      card.className = "thread-card";
      card.innerHTML = `
        <span class="insight-kind">${spot.kind}</span>
        <h3>${spot.title}</h3>
        <p>${spot.body}</p>
        ${spot.contrast ? `<p class="contrast-note">${spot.contrast}</p>` : ""}
      `;
      if (spot.evidenceQuery) {
        appendActionButtons(card, [
          {
            label: "Inspect evidence",
            state: { ...blankEvidenceState(), ...spot.evidenceQuery, evidenceLabel: spot.title },
          },
        ]);
      }
      container.append(card);
    });
  }

  function renderAskCorpus() {
    const input = document.getElementById("ask-input");
    const submit = document.getElementById("ask-submit");
    const suggestions = document.getElementById("ask-suggestions");
    const output = document.getElementById("ask-output");

    if (!input || !submit || !suggestions || !output) {
      return;
    }

    const prompts = [
      "How is intelligence defined over time?",
      "How is intelligence recognized in these articles?",
      "Where is intelligence located in the corpus?",
      "Whose intelligence counts here?",
      "When intelligence appears, is it closer to creativity or talent?",
      "Which articles connect AI and intelligence?",
      "What are the biggest blind spots in the corpus?",
    ];
    const articleByTitle = Object.fromEntries(corpus.articles.map((article) => [normalizeForSearch(article.title), article]));
    const neighborLookup = Object.fromEntries(corpus.conceptNeighbors.terms.map((item) => [item.id, item]));

    suggestions.innerHTML = "";
    prompts.forEach((prompt) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "suggestion-chip";
      button.textContent = prompt;
      button.addEventListener("click", () => {
        input.value = prompt;
        answer(prompt);
      });
      suggestions.append(button);
    });

    function detectConcepts(query) {
      const normalized = normalizeForSearch(query);
      return conceptCatalog.filter((item) => item.search.split(" ").some((token) => normalized.includes(token)));
    }

    function detectNeighborTerms(query) {
      const normalized = normalizeForSearch(query);
      return corpus.conceptNeighbors.terms.filter((item) => normalized.includes(normalizeForSearch(item.label)));
    }

    function resolveArticle(item) {
      if (!item) return null;
      const title = item.title || item.firstTitle;
      return title ? articleByTitle[normalizeForSearch(title)] || null : null;
    }

    function getMatchedArticles(query, concepts, decades) {
      const normalized = normalizeForSearch(query);
      const tokens = tokenize(query);
      return corpus.articles
        .map((article) => {
          let score = 0;
          const haystack = normalizeForSearch(
            `${article.title} ${article.excerpt} ${article.intelligenceTypes.join(" ")} ${article.perspectives.join(" ")} ${article.signals.join(" ")} ${article.definitionFrames.join(" ")} ${article.recognitionModes.join(" ")} ${article.locationFrames.join(" ")} ${article.subjectFrames.join(" ")} ${article.year} ${currentDecade(article)}`,
          );
          tokens.forEach((token) => {
            if (haystack.includes(token)) score += 1;
            if (normalizeForSearch(article.title).includes(token)) score += 2;
          });
          concepts.forEach((concept) => {
            if (articleMatchesFamily(article, concept.family, concept.id)) {
              score += 3;
            }
          });
          if (decades.length && decades.includes(currentDecade(article))) score += 2;
          return { article, score };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score || compareArticlesByImportance(a.article, b.article))
        .map((item) => item.article);
    }

    function buildEvidenceRowsFromArticles(articles, query, concepts, neighborTerms, limit = 4) {
      const uniqueArticles = dedupeBy(articles.filter(Boolean), (article) => article.title);
      const matchedIdsByFamily = {};
      concepts.forEach((concept) => {
        matchedIdsByFamily[concept.family] = [...new Set([...(matchedIdsByFamily[concept.family] || []), concept.id])];
      });
      const focusFamilies = Object.keys(matchedIdsByFamily);
      const terms = queryTerms(`${query} ${neighborTerms.map((item) => item.label).join(" ")}`);

      return uniqueArticles
        .slice(0, limit)
        .map((article) => {
          const quotes = selectRelevantQuotes(article, {
            terms,
            clauses: [],
            matchedIdsByFamily,
            focusFamilies,
          });
          const topQuote = quotes[0] || article.quotes?.[0] || null;
          const reasonParts = [];
          if (concepts.length) {
            reasonParts.push(concepts.slice(0, 2).map((concept) => concept.label).join(", "));
          }
          if (neighborTerms.length) {
            reasonParts.push(neighborTerms.map((item) => item.label).join(", "));
          }
          return {
            title: article.title,
            year: article.year,
            quote: topQuote?.text || "",
            article,
            reason: reasonParts.length ? `Matched through ${reasonParts.join(" and ")}.` : "Representative supporting article.",
          };
        });
    }

    function confidenceNote(matchCount, evidenceRows) {
      if (matchCount >= 10 && evidenceRows.length >= 3) {
        return {
          label: "High",
          note: "The answer draws on a broad matching set and multiple quoted articles.",
        };
      }
      if (matchCount >= 4 && evidenceRows.length >= 2) {
        return {
          label: "Moderate",
          note: "The answer is grounded in a smaller but still substantive matching set.",
        };
      }
      return {
        label: "Exploratory",
        note: "The answer is inferential and should be read as a lead for closer reading, not a settled claim.",
      };
    }

    function buildNeighborAnswer(neighborTerms) {
      const rows = neighborTerms.length ? neighborTerms : corpus.conceptNeighbors.terms.slice(0, 2);
      const evidenceArticles = rows.flatMap((item) => titlesFromExamples(item.examples).map((title) => resolveArticle({ title }))).filter(Boolean);
      return {
        title: "Concept neighbors of intelligence",
        summary:
          rows.length === 1
            ? `${rows[0].label} appears in ${formatPercent(rows[0].share)} of the corpus, with ${formatPercent(rows[0].coMentionShare)} of those articles co-mentioning it with intelligence in the same sentence.`
            : `${rows[0].label} and ${rows[1].label} let us compare what intelligence is being asked to resemble, rival, or borrow from.`,
        bullets: rows.map((row) => {
          const topDefinition = row.topDefinitions?.[0]?.label || "weakly coded";
          const topPerspective = row.topPerspectives?.[0]?.label || "weakly coded";
          return `${row.label}: ${formatPercent(row.earlyShare)} → ${formatPercent(row.lateShare)} over time, most often through ${topPerspective} and ${topDefinition}.`;
        }),
        evidenceRows: buildEvidenceRowsFromArticles(evidenceArticles, rows.map((item) => item.label).join(" "), [], rows),
        confidence: confidenceNote(evidenceArticles.length, buildEvidenceRowsFromArticles(evidenceArticles, rows.map((item) => item.label).join(" "), [], rows)),
        evidenceLabel: rows.map((item) => item.label).join(", "),
      };
    }

    function buildTrendAnswer(concepts, decades) {
      if (!concepts.length) {
        const evidenceArticles = corpus.trends.highlights
          .flatMap((item) => titlesFromExamples(item.examples).map((title) => resolveArticle({ title })))
          .filter(Boolean);
        const evidenceRows = buildEvidenceRowsFromArticles(evidenceArticles, "trend shifts over time", [], []);
        return {
          title: "Strongest overall shifts",
          summary:
            "The broadest shift is from developmental and measurement-heavy framings toward more social, technological, and justice-oriented readings of intelligence.",
          bullets: corpus.trends.highlights.map((item) => item.title),
          evidenceRows,
          confidence: confidenceNote(evidenceArticles.length, evidenceRows),
          evidenceLabel: "trend highlights",
        };
      }

      const bullets = concepts.slice(0, 3).map((concept) => {
        const source = familyConfigs[concept.family]?.trends?.rows.find((row) => row.id === concept.id);
        if (!source) return `${concept.label} appears in the corpus, but the trend summary is weak.`;
        return `${concept.label}: ${formatPercent(source.earlyShare)} → ${formatPercent(source.lateShare)} (${source.direction}).`;
      });
      const evidenceArticles = concepts
        .flatMap((concept) => {
          const source = familyConfigs[concept.family]?.trends?.rows.find((row) => row.id === concept.id);
          return titlesFromExamples(source?.examples).map((title) => resolveArticle({ title }));
        })
        .filter(Boolean);
      const evidenceRows = buildEvidenceRowsFromArticles(evidenceArticles, decades.join(" "), concepts, []);

      return {
        title: "Trend answer",
        summary:
          decades.length >= 2
            ? `The question points to change over time, so the answer draws on decade-level shifts and the selected decades ${decades.join(" and ")}.`
            : "The question points to change over time, so the answer draws on the corpus-wide trend windows.",
        bullets,
        evidenceRows,
        confidence: confidenceNote(evidenceArticles.length, evidenceRows),
        evidenceLabel: concepts.map((concept) => concept.label).join(", "),
      };
    }

    function buildBlindSpotAnswer(concepts) {
      const matches = corpus.blindSpots.filter((spot) =>
        concepts.length
          ? concepts.some((concept) => normalizeForSearch(`${spot.title} ${spot.body}`).includes(normalizeForSearch(concept.label)))
          : true,
      );
      const chosen = matches.length ? matches : corpus.blindSpots;
      return {
        title: "Blind spots in the corpus",
        summary:
          "The strongest blind spots are real absences or thin zones inside this selected corpus, especially where categories exist separately but do not meet each other.",
        bullets: chosen.slice(0, 4).map((item) => `${item.title}. ${item.contrast || item.body}`),
        evidenceRows: buildEvidenceRowsFromArticles(
          chosen
            .flatMap((item) => {
              if (item.evidenceQuery?.type && item.evidenceQuery?.perspective) {
                return corpus.articles.filter(
                  (article) => article.intelligenceTypes.includes(item.evidenceQuery.type) || article.perspectives.includes(item.evidenceQuery.perspective),
                );
              }
              if (item.evidenceQuery?.type) {
                return corpus.articles.filter((article) => article.intelligenceTypes.includes(item.evidenceQuery.type));
              }
              if (item.evidenceQuery?.perspective) {
                return corpus.articles.filter((article) => article.perspectives.includes(item.evidenceQuery.perspective));
              }
              if (item.evidenceQuery?.signal) {
                return corpus.articles.filter((article) => article.signals.includes(item.evidenceQuery.signal));
              }
              return [];
            })
            .sort(compareArticlesByImportance),
          concepts.map((item) => item.label).join(" "),
          concepts,
          [],
        ),
        confidence: { label: "Moderate", note: "Blind-spot answers are grounded in surrounding articles because absence claims do not have direct article quotes of their own." },
        evidenceLabel: "blind spots",
      };
    }

    function buildCitationAnswer(matchedArticles, concepts, query, mode = "pdf") {
      const useExternal = mode === "external" && openAlex;
      const rankedMatches = [...matchedArticles]
        .filter((article) => (useExternal ? externalCitationCount(article) > 0 : article.citingArticlesPdf != null))
        .sort((a, b) =>
          useExternal
            ? externalCitationCount(b) - externalCitationCount(a) || compareArticlesByImportance(a, b)
            : compareArticlesByImportance(a, b),
        );
      const rows = rankedMatches.length
        ? rankedMatches.slice(0, 5)
        : (useExternal ? openAlex.topCited : corpus.topCited).slice(0, 5);
      const evidenceRows = buildEvidenceRowsFromArticles(rows.map((article) => resolveArticle(article) || article), query, concepts, []);
      return {
        title: "Most cited relevant articles",
        summary: useExternal
          ? matchedArticles.length
            ? "These are the highest-cited matches for your question in the separate OpenAlex snapshot."
            : "These are the most cited articles in the separate OpenAlex snapshot."
          : matchedArticles.length
            ? "These are the highest-cited matches for your question using citation metadata from the provided PDFs."
            : "These are the most cited articles in the provided PDF dataset.",
        bullets: rows.map((article) =>
          useExternal
            ? `${article.title} (${article.year}) · ${formatNumber(externalCitationCount(article))} OpenAlex citations`
            : `${article.title} (${article.year}) · ${formatNumber(pdfCitationCount(article))} citing articles in PDF metadata`,
        ),
        evidenceRows,
        confidence: confidenceNote(rows.length, evidenceRows),
        evidenceLabel: useExternal ? "OpenAlex cited research" : "PDF cited research",
        sourceNote: useExternal
          ? "External citation context: this answer uses the separate OpenAlex snapshot rather than only the provided PDFs."
          : "Corpus-only answer: this citation ranking uses metadata found in the provided PDF files.",
      };
    }

    function buildOriginAnswer(concepts) {
      const pools = [
        ...corpus.origins.types,
        ...corpus.origins.perspectives,
        ...corpus.origins.signals,
        ...corpus.origins.definitions,
        ...corpus.origins.recognition,
        ...corpus.origins.locations,
        ...corpus.origins.subjects,
      ];
      const rows = concepts.length
        ? pools.filter((row) => concepts.some((concept) => concept.id === row.id))
        : pools.slice(0, 6);
      return {
        title: "Origins in the corpus",
        summary: "This answer traces where a theme or lens first becomes visible in the corpus.",
        bullets: rows.slice(0, 6).map((row) => `${row.label}: ${row.firstYear}, ${row.firstTitle}`),
        evidenceRows: buildEvidenceRowsFromArticles(
          rows
            .map((row) => resolveArticle(row))
            .filter(Boolean),
          "origins first appearance",
          concepts,
          [],
        ),
        confidence: confidenceNote(rows.length, buildEvidenceRowsFromArticles(rows.map((row) => resolveArticle(row)).filter(Boolean), "origins first appearance", concepts, [])),
        evidenceLabel: "origins",
      };
    }

    function buildGeneralAnswer(query, concepts, matchedArticles, decades) {
      const sample = matchedArticles.slice(0, 20);
      const typeCounts = {};
      const perspectiveCounts = {};
      const signalCounts = {};
      const definitionCounts = {};
      const recognitionCounts = {};
      const locationCounts = {};
      const subjectCounts = {};
      sample.forEach((article) => {
        article.intelligenceTypes.forEach((id) => {
          typeCounts[id] = (typeCounts[id] || 0) + 1;
        });
        article.perspectives.forEach((id) => {
          perspectiveCounts[id] = (perspectiveCounts[id] || 0) + 1;
        });
        article.signals.forEach((id) => {
          signalCounts[id] = (signalCounts[id] || 0) + 1;
        });
        article.definitionFrames.forEach((id) => {
          definitionCounts[id] = (definitionCounts[id] || 0) + 1;
        });
        article.recognitionModes.forEach((id) => {
          recognitionCounts[id] = (recognitionCounts[id] || 0) + 1;
        });
        article.locationFrames.forEach((id) => {
          locationCounts[id] = (locationCounts[id] || 0) + 1;
        });
        article.subjectFrames.forEach((id) => {
          subjectCounts[id] = (subjectCounts[id] || 0) + 1;
        });
      });
      const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
      const topPerspective = Object.entries(perspectiveCounts).sort((a, b) => b[1] - a[1])[0];
      const topSignal = Object.entries(signalCounts).sort((a, b) => b[1] - a[1])[0];
      const topDefinition = Object.entries(definitionCounts).sort((a, b) => b[1] - a[1])[0];
      const topRecognition = Object.entries(recognitionCounts).sort((a, b) => b[1] - a[1])[0];
      const topLocation = Object.entries(locationCounts).sort((a, b) => b[1] - a[1])[0];
      const topSubject = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1])[0];
      const evidenceRows = buildEvidenceRowsFromArticles(matchedArticles, query, concepts, []);
      return {
        title: "Best-matching answer",
        summary: matchedArticles.length
          ? `I found ${matchedArticles.length} matching articles${decades.length ? ` in or around ${decades.join(" and ")}` : ""}.`
          : `The question did not map strongly to one narrow slice, so this answer falls back to the strongest corpus-level patterns.`,
        bullets: [
          topType ? `Most common type in the match set: ${lookupAnyLabel(topType[0])} (${topType[1]} of the top matches).` : null,
          topPerspective ? `Most common perspective: ${lookupAnyLabel(topPerspective[0])} (${topPerspective[1]}).` : null,
          topSignal ? `Most recurrent adjacent signal: ${lookupAnyLabel(topSignal[0])} (${topSignal[1]}).` : null,
          topDefinition ? `Dominant definition frame: ${lookupAnyLabel(topDefinition[0])} (${topDefinition[1]}).` : null,
          topRecognition ? `Most common recognition mode: ${lookupAnyLabel(topRecognition[0])} (${topRecognition[1]}).` : null,
          topLocation ? `Most common location frame: ${lookupAnyLabel(topLocation[0])} (${topLocation[1]}).` : null,
          topSubject ? `Most visible subject position: ${lookupAnyLabel(topSubject[0])} (${topSubject[1]}).` : null,
          concepts.length ? `Detected themes: ${concepts.map((concept) => concept.label).join(", ")}.` : null,
        ].filter(Boolean),
        evidenceRows,
        confidence: confidenceNote(matchedArticles.length, evidenceRows),
        evidenceLabel: query,
      };
    }

    function renderAnswer(answer) {
      const sourceHtml = answer.sourceNote
        ? `<p class="answer-confidence"><strong>Source scope:</strong> ${escapeHtml(answer.sourceNote)}</p>`
        : "";
      const confidenceHtml = answer.confidence
        ? `<p class="answer-confidence"><strong>Confidence:</strong> ${escapeHtml(answer.confidence.label)}. ${escapeHtml(answer.confidence.note)}</p>`
        : "";
      const evidenceHtml = answer.evidenceRows?.length
        ? `
          <div class="evidence-block">
            <div class="quote-list">
              <h5>Quoted sources used</h5>
              ${answer.evidenceRows
                .map(
                  (item) => `
                    <figure class="quote-item">
                      <p><strong>${escapeHtml(`${item.year} · ${item.title}`)}</strong></p>
                      ${item.quote ? `<p>“${escapeHtml(item.quote)}”</p>` : ""}
                      <p class="evidence-meta">${escapeHtml(item.reason)}</p>
                    </figure>
                  `,
                )
                .join("")}
            </div>
          </div>
        `
        : "";

      output.innerHTML = `
        <article class="answer-card">
          <h3>${answer.title}</h3>
          <p>${answer.summary}</p>
          ${sourceHtml}
          ${confidenceHtml}
          <ul class="answer-list">${answer.bullets.map((item) => `<li>${item}</li>`).join("")}</ul>
          ${evidenceHtml}
        </article>
      `;
      if (answer.evidenceRows?.length) {
        appendActionButtons(output.firstElementChild, [
          {
            label: "Open these sources",
            state: {
              ...blankEvidenceState(),
              titles: answer.evidenceRows.map((item) => item.title),
              evidenceLabel: answer.evidenceLabel || answer.title,
            },
          },
        ]);
      }
    }

    function answer(query) {
      const normalized = normalizeForSearch(query);
      const concepts = detectConcepts(query);
      const neighborTerms = detectNeighborTerms(query);
      const decades = allDecades.filter((decade) => normalized.includes(decade.toLowerCase()));
      const matchedArticles = getMatchedArticles(query, concepts, decades);

      const wantsBlindSpots = /blind|gap|missing|absence|underrepresented/.test(normalized);
      const wantsCitations = /cited|influential|important|key research|most cited/.test(normalized);
      const wantsExternalCitations = /openalex|external citation|external citations|citation database/.test(normalized);
      const wantsOrigins = /first|origin|start|appear|emerge/.test(normalized);
      const wantsTrend = /trend|rise|rising|declin|shift|change|over time|compare|difference|vs|versus/.test(normalized);
      const wantsNeighbors = /creativity|talent|skill|judgment|imagination/.test(normalized);

      if (wantsBlindSpots) {
        renderAnswer(buildBlindSpotAnswer(concepts));
        return;
      }
      if (wantsCitations) {
        renderAnswer(buildCitationAnswer(matchedArticles, concepts, query, wantsExternalCitations ? "external" : "pdf"));
        return;
      }
      if (wantsOrigins) {
        renderAnswer(buildOriginAnswer(concepts));
        return;
      }
      if (wantsNeighbors) {
        renderAnswer(buildNeighborAnswer(neighborTerms));
        return;
      }
      if (wantsTrend) {
        renderAnswer(buildTrendAnswer(concepts, decades));
        return;
      }
      renderAnswer(buildGeneralAnswer(query, concepts, matchedArticles, decades));
    }

    submit.addEventListener("click", () => answer(input.value));
    input.addEventListener("keydown", (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        answer(input.value);
      }
    });

    answer("What are the biggest shifts in the corpus over time?");
  }

  function renderGraphLab() {
    const familySelect = document.getElementById("graph-family");
    const metricSelect = document.getElementById("graph-metric");
    const chipPicker = document.getElementById("graph-chip-picker");
    const note = document.getElementById("graph-note");
    const visual = document.getElementById("graph-visual");
    const takeaways = document.getElementById("graph-takeaways");

    if (!familySelect || !metricSelect || !chipPicker || !visual || !takeaways) {
      return;
    }

    const palette = ["#134647", "#ad5f3b", "#4a7f7d", "#d7b56d", "#7b4b94", "#c05e7b"];
    const selected = new Set();

    function familyOptions() {
      const config = familyConfigs[familySelect.value] || familyConfigs.types;
      return config.definitions.map((item) => ({
        id: item.id,
        label: familySelect.value === "signals" ? lookupSignalLabel(item.id) : item.label,
      }));
    }

    function fillPicker(reset = false) {
      const options = familyOptions();
      if (reset || !selected.size) {
        selected.clear();
        options.slice(0, 3).forEach((item) => selected.add(item.id));
      }

      chipPicker.innerHTML = "";
      options.forEach((item) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = `chip-button${selected.has(item.id) ? " is-active" : ""}`;
        chip.textContent = item.label;
        chip.addEventListener("click", () => {
          if (selected.has(item.id)) {
            selected.delete(item.id);
          } else if (selected.size < 5) {
            selected.add(item.id);
          }
          fillPicker(false);
          render();
        });
        chipPicker.append(chip);
      });
    }

    function seriesRows() {
      return familyOptions()
        .filter((item) => selected.has(item.id))
        .map((item) => ({
          ...item,
          points: allDecades.map((decade) => {
            const profile = decadeProfiles[decade];
            const bucketKey = familyConfigs[familySelect.value]?.bucketKey || "types";
            const value = profile[bucketKey][item.id] || 0;
            return {
              decade,
              count: value,
              value: metricSelect.value === "share" ? value / profile.articleCount : value,
            };
          }),
        }));
    }

    function render() {
      const rows = seriesRows();
      const maxValue = Math.max(...rows.flatMap((row) => row.points.map((point) => point.value)), 0.01);
      note.textContent =
        metricSelect.value === "share"
          ? "Each line shows the share of articles in each decade carrying the selected theme."
          : "Each line shows the raw number of articles in each decade carrying the selected theme.";

      const width = 760;
      const height = 360;
      const margin = { top: 30, right: 24, bottom: 34, left: 48 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;
      const xStep = innerWidth / Math.max(allDecades.length - 1, 1);
      const yFor = (value) => margin.top + innerHeight - (value / maxValue) * innerHeight;

      const gridLines = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const y = margin.top + innerHeight - ratio * innerHeight;
        const labelValue = metricSelect.value === "share" ? formatPercent(ratio * maxValue) : Math.round(ratio * maxValue);
        return `
          <line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" stroke="rgba(19,70,71,0.12)" />
          <text x="${margin.left - 10}" y="${y + 4}" text-anchor="end" font-size="11" fill="#596765">${labelValue}</text>
        `;
      });

      const lines = rows
        .map((row, index) => {
          const color = palette[index % palette.length];
          const path = row.points
            .map((point, pointIndex) => {
              const x = margin.left + pointIndex * xStep;
              const y = yFor(point.value);
              return `${pointIndex === 0 ? "M" : "L"} ${x} ${y}`;
            })
            .join(" ");
          const dots = row.points
            .map((point, pointIndex) => {
              const x = margin.left + pointIndex * xStep;
              const y = yFor(point.value);
              const label = metricSelect.value === "share" ? formatPercent(point.value) : point.count;
              return `<circle cx="${x}" cy="${y}" r="4" fill="${color}"><title>${row.label}, ${point.decade}: ${label}</title></circle>`;
            })
            .join("");
          return `<path d="${path}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />${dots}`;
        })
        .join("");

      const xLabels = allDecades
        .map((decade, index) => {
          const x = margin.left + index * xStep;
          return `<text x="${x}" y="${height - 8}" text-anchor="middle" font-size="11" fill="#596765">${decade}</text>`;
        })
        .join("");

      visual.innerHTML = `
        <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Theme graph over decades">
          ${gridLines.join("")}
          ${xLabels}
          ${lines}
        </svg>
        <div class="graph-legend">
          ${rows
            .map(
              (row, index) => `
                <span class="legend-item">
                  <span class="legend-swatch" style="background:${palette[index % palette.length]}"></span>
                  ${row.label}
                </span>`,
            )
            .join("")}
        </div>
      `;

      const biggestRise = [...rows]
        .map((row) => ({ ...row, delta: row.points[row.points.length - 1].value - row.points[0].value }))
        .sort((a, b) => b.delta - a.delta)[0];
      const biggestPeak = [...rows].sort(
        (a, b) => Math.max(...b.points.map((point) => point.value)) - Math.max(...a.points.map((point) => point.value)),
      )[0];
      const steadiest = [...rows]
        .map((row) => ({
          ...row,
          spread: Math.max(...row.points.map((point) => point.value)) - Math.min(...row.points.map((point) => point.value)),
        }))
        .sort((a, b) => a.spread - b.spread)[0];

      takeaways.innerHTML = "";
      const heading = document.createElement("h3");
      heading.textContent = "Graph takeaways";
      const intro = document.createElement("p");
      intro.textContent = rows.length ? `${rows.length} themes are selected.` : "Choose one or more themes to graph them.";
      takeaways.append(heading, intro);

      if (!rows.length) {
        return;
      }

      const peakPoint = biggestPeak.points.slice().sort((a, b) => b.value - a.value)[0];
      const cards = [
        {
          title: "Strongest rise",
          body: `${biggestRise.label} shows the largest first-to-last change.`,
          state: evidenceStateForFamily(familySelect.value, biggestRise.id),
        },
        {
          title: "Highest peak",
          body: `${biggestPeak.label} reaches its maximum in ${peakPoint.decade}.`,
          state: evidenceStateForFamily(familySelect.value, biggestPeak.id, { decade: peakPoint.decade }),
        },
        {
          title: "Most stable",
          body: `${steadiest.label} changes least across the selected decades.`,
          state: evidenceStateForFamily(familySelect.value, steadiest.id),
        },
      ];

      cards.forEach((item) => {
        const card = document.createElement("article");
        card.className = "thread-card";
        card.innerHTML = `<h3>${item.title}</h3><p>${item.body}</p>`;
        appendActionButtons(card, [
          {
            label: "See evidence",
            state: item.state,
          },
        ]);
        takeaways.append(card);
      });
    }

    familySelect.addEventListener("change", () => {
      fillPicker(true);
      render();
    });
    metricSelect.addEventListener("change", render);

    fillPicker(true);
    render();
  }

  function renderTopCited() {
    const container = document.getElementById("top-cited");
    const tabs = document.getElementById("citation-tabs");
    const note = document.getElementById("citation-source-note");

    if (!container || !tabs || !note) {
      return;
    }

    const modes = [
      {
        id: "pdf",
        label: "PDF dataset only",
        note: `Corpus-only tab: these ranks come from citation counts printed in the provided PDFs. PDF citation metadata appears on ${corpus.summary.withPdfCitationCounts || 0} of ${corpus.summary.articleCount} articles.`,
        rows: corpus.topCited.slice(0, 10),
      },
    ];

    if (openAlex) {
      modes.push({
        id: "external",
        label: "External: OpenAlex snapshot",
        note: `External tab: these ranks come from an OpenAlex snapshot taken on ${openAlex.snapshotDate}. This view is kept separate from the PDF-only analysis, and OpenAlex matched ${openAlex.matchedArticles} of ${corpus.summary.articleCount} corpus articles.`,
        rows: openAlex.topCited.slice(0, 10),
      });
    }

    let activeMode = modes[0]?.id || "pdf";

    function renderList(mode) {
      const config = modes.find((item) => item.id === mode) || modes[0];
      activeMode = config.id;
      note.textContent = config.note;
      container.innerHTML = "";

      config.rows.forEach((article, index) => {
        const item = document.createElement("li");
        item.className = "citation-item";

        const rank = document.createElement("div");
        rank.className = "citation-rank";
        rank.textContent = String(index + 1).padStart(2, "0");

        const content = document.createElement("div");
        const title = document.createElement("h3");
        if (article.doi) {
          const link = document.createElement("a");
          link.href = `https://doi.org/${article.doi}`;
          link.target = "_blank";
          link.rel = "noreferrer";
          link.textContent = article.title;
          title.append(link);
        } else {
          title.textContent = article.title;
        }

        const meta = document.createElement("p");
        meta.className = "citation-meta";
        meta.textContent = `${article.year} • ${article.excerpt}`;

        const tags = document.createElement("div");
        tags.className = "citation-tags";
        [...(article.intelligenceTypes || []).slice(0, 2), ...(article.perspectives || []).slice(0, 1)].forEach((id) => {
          const definition = typeLookup[id] || perspectiveLookup[id];
          if (!definition) return;
          const tag = document.createElement("span");
          tag.className = "tag";
          tag.textContent = definition.label;
          tags.append(tag);
        });

        content.append(title, meta, tags);

        const badge = document.createElement("div");
        badge.className = "citation-badge";
        badge.textContent =
          config.id === "external"
            ? `${formatNumber(externalCitationCount(article))} OpenAlex citations`
            : `${formatNumber(pdfCitationCount(article))} PDF citing articles`;

        item.append(rank, content, badge);
        container.append(item);
      });

      [...tabs.querySelectorAll(".toggle-button")].forEach((button) => {
        button.classList.toggle("is-active", button.dataset.citationSource === activeMode);
        button.setAttribute("aria-selected", button.dataset.citationSource === activeMode ? "true" : "false");
      });
    }

    tabs.innerHTML = "";
    modes.forEach((mode) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `toggle-button${mode.id === activeMode ? " is-active" : ""}`;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", mode.id === activeMode ? "true" : "false");
      button.dataset.citationSource = mode.id;
      button.textContent = mode.label;
      button.addEventListener("click", () => renderList(mode.id));
      tabs.append(button);
    });

    renderList(activeMode);
  }

  function renderThreads() {
    const container = document.getElementById("threads");
    container.innerHTML = "";
    corpus.commonThreads.forEach((thread) => {
      const card = document.createElement("article");
      card.className = "thread-card";
      card.innerHTML = `<h3>${thread.title}</h3><p>${thread.body}</p>${renderExampleList(thread.examples)}`;
      appendActionButtons(card, [
        {
          label: "See evidence",
          state: {
            ...blankEvidenceState(),
            titles: titlesFromExamples(thread.examples),
            evidenceLabel: thread.title,
          },
        },
      ]);
      container.append(card);
    });
  }

  function renderMethods() {
    const container = document.getElementById("methods");
    container.innerHTML = "";
    corpus.methods.forEach((method) => {
      const item = document.createElement("div");
      item.className = "method-item";
      item.innerHTML = `<h4>${method.title}</h4><p>${method.body}</p>`;
      container.append(item);
    });
  }

  function renderConceptNeighbors() {
    const note = document.getElementById("neighbor-note");
    const chart = document.getElementById("neighbor-chart");
    const detail = document.getElementById("neighbor-detail");
    const takeaways = document.getElementById("neighbor-takeaways");

    if (!note || !chart || !detail || !takeaways || !corpus.conceptNeighbors) {
      return;
    }

    note.textContent = corpus.conceptNeighbors.note;
    const rows = [...corpus.conceptNeighbors.terms].sort((a, b) => b.share - a.share || b.delta - a.delta);
    const maxShare = Math.max(...rows.map((row) => row.share), 0.01);
    const buttons = [];

    function renderDetail(row) {
      detail.innerHTML = `
        <h3>${row.label}</h3>
        <p>${row.description}</p>
        <p>${formatPercent(row.share)} of the corpus mentions ${row.label.toLowerCase()}, and ${formatPercent(row.coMentionShare)} of those articles co-mention it with intelligence in the same sentence.</p>
        <p>Early window: ${formatPercent(row.earlyShare)} · late window: ${formatPercent(row.lateShare)}.</p>
        <div class="detail-tags">
          ${row.topDefinitions.map((item) => `<span class="tag">${item.label}</span>`).join("")}
          ${row.topPerspectives.map((item) => `<span class="tag">${item.label}</span>`).join("")}
        </div>
        ${
          row.quotes?.length
            ? `<div class="quote-list">
                <h5>Quote-level evidence</h5>
                ${row.quotes.map((item) => `<figure class="quote-item"><p><strong>${item.year} · ${escapeHtml(item.title)}</strong></p><p>“${escapeHtml(item.quote)}”</p></figure>`).join("")}
              </div>`
            : ""
        }
        ${renderExampleList(row.examples)}
      `;
      appendActionButtons(detail, [
        {
          label: "Open exact articles",
          state: {
            ...blankEvidenceState(),
            titles: titlesFromExamples(row.examples),
            evidenceLabel: row.label,
          },
        },
      ]);
    }

    chart.innerHTML = "";
    rows.forEach((row) => {
      const wrapper = document.createElement("div");
      wrapper.className = "comparison-row";
      const button = document.createElement("button");
      button.type = "button";
      button.innerHTML = `
        <div class="comparison-meta">
          <strong>${row.label}</strong>
          <span class="comparison-values">${formatPercent(row.share)} of corpus</span>
        </div>
        <div class="comparison-bars">
          <div class="comparison-side left"><div class="comparison-fill left" style="width:${(row.earlyShare / maxShare) * 100}%"></div></div>
          <div class="comparison-axis" aria-hidden="true"></div>
          <div class="comparison-side right"><div class="comparison-fill right" style="width:${(row.lateShare / maxShare) * 100}%"></div></div>
        </div>
        <div class="comparison-delta">${row.delta >= 0 ? `late +${Math.round(row.delta * 100)} pts` : `early +${Math.round(Math.abs(row.delta) * 100)} pts`}</div>
      `;
      button.addEventListener("click", () => {
        buttons.forEach((item) => item.wrapper.classList.remove("is-active"));
        wrapper.classList.add("is-active");
        renderDetail(row);
      });
      wrapper.append(button);
      chart.append(wrapper);
      buttons.push({ wrapper, row });
    });

    takeaways.innerHTML = "";
    corpus.conceptNeighbors.takeaways.forEach((item) => {
      const card = document.createElement("article");
      card.className = "thread-card";
      card.innerHTML = `<h3>${item.title}</h3><p>${item.body}</p>${renderExampleList(item.examples)}`;
      appendActionButtons(card, [
        {
          label: "See evidence",
          state: {
            ...blankEvidenceState(),
            titles: titlesFromExamples(item.examples),
            evidenceLabel: item.title,
          },
        },
      ]);
      takeaways.append(card);
    });

    if (buttons[0]) {
      buttons[0].wrapper.classList.add("is-active");
      renderDetail(buttons[0].row);
    }
  }

  function renderValidation() {
    const summary = document.getElementById("validation-summary");
    const familyGrid = document.getElementById("validation-family-grid");
    const auditList = document.getElementById("audit-notes");
    const validation = corpus.validation;

    if (!summary || !familyGrid || !auditList || !validation) {
      return;
    }

    summary.textContent = `The manual gold sample checks ${validation.sampleSize} of ${validation.expectedSize} planned articles across six coding families. Quote-level evidence appears on ${formatPercent(
      validation.quoteCoverage || 0,
    )} of the corpus, and lower-overlap families are shown as provisional rather than hidden.`;

    familyGrid.innerHTML = "";
    (validation.familyStats || []).forEach((row) => {
      const mismatch = row.mismatchExamples?.[0];
      const card = document.createElement("article");
      card.className = "validation-card";
      card.innerHTML = `
        <h4>${escapeHtml(row.label)}</h4>
        <p>Exact-match rate ${Math.round((row.exactRate || 0) * 100)}% · average overlap ${Math.round(
          (row.averageJaccard || 0) * 100,
        )}% across ${formatNumber(row.sampleSize || 0)} audited articles.</p>
        <div class="validation-metadata">
          <span class="tag">${formatNumber(row.overrideCount || 0)} manual overrides visible</span>
          <span class="tag">${formatNumber(row.inferredCount || 0)} inferred labels in corpus</span>
        </div>
        ${
          row.falseNegativePatterns?.length
            ? `<p class="validation-note"><strong>False negatives:</strong> ${escapeHtml(
                row.falseNegativePatterns.map((item) => `${item.label} (${item.count})`).join(" · "),
              )}</p>`
            : ""
        }
        ${
          row.falsePositivePatterns?.length
            ? `<p class="validation-note"><strong>False positives:</strong> ${escapeHtml(
                row.falsePositivePatterns.map((item) => `${item.label} (${item.count})`).join(" · "),
              )}</p>`
            : ""
        }
        ${
          mismatch
            ? `<p class="validation-note">Example audit tension: <strong>${escapeHtml(mismatch.title)}</strong>${
                mismatch.missing?.length ? ` missed ${escapeHtml(mismatch.missing.map((id) => lookupAnyLabel(id)).join(", "))}` : ""
              }${
                mismatch.extra?.length ? `${mismatch.missing?.length ? ";" : ""} added ${escapeHtml(mismatch.extra.map((id) => lookupAnyLabel(id)).join(", "))}` : ""
              }.</p>`
            : `<p class="validation-note">No disagreement surfaced in the current gold sample for this family.</p>`
        }
      `;
      familyGrid.append(card);
    });

    auditList.innerHTML = "";
    (validation.auditNotes || []).forEach((note) => {
      const card = document.createElement("article");
      card.className = "audit-card";
      card.innerHTML = `<h4>${escapeHtml(note.title)}</h4><p>${escapeHtml(note.body)}</p>`;
      auditList.append(card);
    });
  }

  function renderSignals() {
    const container = document.getElementById("signal-bars");
    const rows = corpus.signals.map((item) => ({
      id: item.id,
      label: lookupSignalLabel(item.id),
      count: item.count,
      description: "",
    }));
    createBarRows(container, rows, "warm", { family: "signals" });
  }

  function renderSignalTrends() {
    const rows = corpus.trends.signals.rows.map((row) => ({
      ...row,
      label: lookupSignalLabel(row.id),
      description: "Adjacency signal across the corpus.",
    }));

    renderTrendGroup(
      "signal-trends",
      "signal-trend-note",
      {
        ...corpus.trends.signals,
        rows,
      },
      "signals",
    );
  }

  function attachCoverageNote() {
    const target = document.getElementById("coverage-note");
    if (!target) {
      return;
    }
    const parts = [
      `PDF metadata note: ${corpus.summary.withPdfCitationCounts || 0} of ${corpus.summary.articleCount} articles include citation counts in the provided files.`,
    ];
    if (openAlex) {
      parts.push(`External note: OpenAlex matched ${openAlex.matchedArticles} of ${corpus.summary.articleCount} articles on ${openAlex.snapshotDate}.`);
    }
    target.textContent = parts.join(" ");
  }

  function populateSelect(select, options, labelFn) {
    select.innerHTML = `<option value="">All</option>`;
    options.forEach((option) => {
      const element = document.createElement("option");
      element.value = option;
      element.textContent = labelFn(option);
      select.append(element);
    });
  }

  function renderExplorer() {
    const search = document.getElementById("explorer-search");
    const decade = document.getElementById("explorer-decade");
    const type = document.getElementById("explorer-type");
    const perspective = document.getElementById("explorer-perspective");
    const signal = document.getElementById("explorer-signal");
    const definition = document.getElementById("explorer-definition");
    const recognition = document.getElementById("explorer-recognition");
    const location = document.getElementById("explorer-location");
    const subject = document.getElementById("explorer-subject");
    const sort = document.getElementById("explorer-sort");
    const summary = document.getElementById("explorer-summary");
    const results = document.getElementById("explorer-results");
    let pinnedTitles = [];
    let pinnedLabel = "";

    const decades = [...new Set(corpus.articles.map((article) => `${article.year - (article.year % 10)}s`))].sort();
    populateSelect(decade, decades, (value) => value);
    populateSelect(type, corpus.intelligenceTypes.map((item) => item.id), lookupAnyLabel);
    populateSelect(perspective, corpus.perspectives.map((item) => item.id), lookupAnyLabel);
    populateSelect(signal, corpus.signals.map((item) => item.id), lookupAnyLabel);
    populateSelect(definition, corpus.definitionFrames.map((item) => item.id), lookupAnyLabel);
    populateSelect(recognition, corpus.recognitionModes.map((item) => item.id), lookupAnyLabel);
    populateSelect(location, corpus.locationFrames.map((item) => item.id), lookupAnyLabel);
    populateSelect(subject, corpus.subjectFrames.map((item) => item.id), lookupAnyLabel);

    function selectedDropdownFilters() {
      return [
        { family: familySelectMap.type, id: type.value, source: "filter" },
        { family: familySelectMap.perspective, id: perspective.value, source: "filter" },
        { family: familySelectMap.signal, id: signal.value, source: "filter" },
        { family: familySelectMap.definition, id: definition.value, source: "filter" },
        { family: familySelectMap.recognition, id: recognition.value, source: "filter" },
        { family: familySelectMap.location, id: location.value, source: "filter" },
        { family: familySelectMap.subject, id: subject.value, source: "filter" },
      ].filter((item) => item.id);
    }

    function invalidSearchMarkup(clauses) {
      return `
        <article class="explorer-card">
          <h4>Structured search needs a small correction</h4>
          <p>${escapeHtml(clauses[0]?.message || "One or more search clauses could not be resolved.")}</p>
          <div class="match-list">
            <h5>What to adjust</h5>
            <ul>${clauses.map((clause) => `<li>${escapeHtml(clause.message)}</li>`).join("")}</ul>
          </div>
        </article>
      `;
    }

    function evaluateArticle(article, parsed, dropdownFilters) {
      const bundle = articleSearchBundle(article);
      const reasons = [];
      const matchedIdsByFamily = {};
      const focusFamilies = new Set();
      const quoteMatches = [];

      if (parsed.terms.length) {
        const aggregate = [bundle.title, bundle.excerpt, bundle.doi, bundle.codes, ...bundle.quotes.map((quote) => quote.normalized)].join(
          " ",
        );
        if (parsed.terms.some((term) => !aggregate.includes(term))) {
          return null;
        }

        const sources = [];
        if (parsed.terms.every((term) => bundle.title.includes(term))) sources.push("title");
        if (parsed.terms.every((term) => bundle.excerpt.includes(term))) sources.push("excerpt");
        if (parsed.terms.every((term) => bundle.codes.includes(term))) sources.push("coded labels");
        const freeTextQuoteHits = bundle.quotes.filter((quote) => parsed.terms.every((term) => quote.normalized.includes(term)));
        if (freeTextQuoteHits.length) {
          sources.push("quote evidence");
          quoteMatches.push(...freeTextQuoteHits);
        }

        reasons.push(`Free text matched ${sources.length ? sources.join(", ") : "article evidence"}.`);
      }

      for (const clause of parsed.clauses) {
        if (clause.kind === "family") {
          const matchedIds = clause.resolvedIds.filter((id) => articleMatchesFamily(article, clause.family, id));
          if (!matchedIds.length) return null;
          matchedIdsByFamily[clause.family] = [...new Set([...(matchedIdsByFamily[clause.family] || []), ...matchedIds])];
          focusFamilies.add(clause.family);
          reasons.push(
            `${fieldLabels[clause.family] || familyConfigs[clause.family]?.label || clause.family} matched ${matchedIds
              .map((id) => labelForFamilyItem(clause.family, id))
              .join(", ")}.`,
          );
          continue;
        }

        if (clause.kind === "title") {
          if (!bundle.title.includes(clause.normalizedValue)) return null;
          reasons.push(`Title matched “${clause.value}”.`);
          continue;
        }

        if (clause.kind === "quote") {
          const hits = bundle.quotes.filter((quote) => quote.normalized.includes(clause.normalizedValue));
          if (!hits.length) return null;
          quoteMatches.push(...hits);
          reasons.push(`Quote evidence matched “${clause.value}”.`);
          continue;
        }

        if (clause.kind === "doi") {
          if (!bundle.doi.includes(clause.normalizedValue)) return null;
          reasons.push(`DOI matched “${clause.value}”.`);
          continue;
        }

        if (clause.kind === "year") {
          if (String(article.year) !== String(clause.value).trim()) return null;
          reasons.push(`Year matched ${article.year}.`);
          continue;
        }

        if (clause.kind === "decade") {
          if (normalizeForSearch(currentDecade(article)) !== clause.normalizedValue) return null;
          reasons.push(`Decade matched ${currentDecade(article)}.`);
        }
      }

      dropdownFilters.forEach((filter) => {
        if (!articleMatchesFamily(article, filter.family, filter.id)) return;
        matchedIdsByFamily[filter.family] = [...new Set([...(matchedIdsByFamily[filter.family] || []), filter.id])];
        focusFamilies.add(filter.family);
        reasons.push(`Filter matched ${labelForFamilyItem(filter.family, filter.id)}.`);
      });

      for (const filter of dropdownFilters) {
        if (!articleMatchesFamily(article, filter.family, filter.id)) {
          return null;
        }
      }

      const focusFamilyList = [...focusFamilies];
      const selectedQuotes = dedupeBy(
        [
          ...quoteMatches,
          ...selectRelevantQuotes(article, {
            terms: parsed.terms,
            clauses: parsed.clauses,
            matchedIdsByFamily,
            focusFamilies: focusFamilyList,
          }),
        ],
        (quote) => quote.text,
      ).slice(0, 2);

      return {
        article,
        matchReasons: dedupeBy(reasons, (reason) => reason).slice(0, 5),
        quotes: selectedQuotes,
        confidence: relevantConfidenceEntries(article, focusFamilyList, matchedIdsByFamily),
      };
    }

    function refresh() {
      const parsed = parseStructuredSearch(search.value.trim());
      const invalidClauses = parsed.clauses.filter((clause) => !clause.valid);
      const dropdownFilters = selectedDropdownFilters();

      if (invalidClauses.length) {
        summary.textContent = `${invalidClauses.length} structured ${invalidClauses.length === 1 ? "clause needs" : "clauses need"} revision before results can be shown.`;
        results.innerHTML = invalidSearchMarkup(invalidClauses);
        return;
      }

      const pinnedTitleKeys = new Set(pinnedTitles.map((title) => normalizeForSearch(title)));
      let rows = corpus.articles
        .filter((article) => !pinnedTitles.length || pinnedTitleKeys.has(normalizeForSearch(article.title)))
        .filter((article) => !decade.value || currentDecade(article) === decade.value)
        .map((article) => evaluateArticle(article, parsed, dropdownFilters))
        .filter(Boolean);

      rows.sort((a, b) => {
        const left = a.article;
        const right = b.article;
        if (sort.value === "oldest") return left.year - right.year || left.title.localeCompare(right.title);
        if (sort.value === "cited") {
          const aC = pdfCitationCount(left);
          const bC = pdfCitationCount(right);
          return bC - aC || right.year - left.year;
        }
        if (sort.value === "views") {
          return (right.articleViews || 0) - (left.articleViews || 0) || right.year - left.year;
        }
        return right.year - left.year || left.title.localeCompare(right.title);
      });

      const activeSearchPieces = [
        parsed.terms.length ? "free text" : null,
        ...parsed.clauses.map((clause) => `${fieldLabels[clause.family || clause.field] || clause.field}`),
        ...dropdownFilters.map((filter) => `${fieldLabels[filter.family] || filter.family}`),
        decade.value ? "Decade filter" : null,
      ].filter(Boolean);
      summary.textContent =
        rows.length > 24
          ? `${formatNumber(rows.length)} articles match the current search. Showing the first 24 evidence cards.${activeSearchPieces.length ? ` Active layers: ${activeSearchPieces.join(", ")}.` : ""}${pinnedLabel ? ` Evidence set: ${pinnedLabel}.` : ""}`
          : `${formatNumber(rows.length)} articles match the current search.${activeSearchPieces.length ? ` Active layers: ${activeSearchPieces.join(", ")}.` : ""}${pinnedLabel ? ` Evidence set: ${pinnedLabel}.` : ""}`;
      results.innerHTML = "";
      if (!rows.length) {
        results.innerHTML = `<article class="explorer-card"><h4>No articles match these filters</h4><p>Try clearing one filter or searching with a broader term such as a decade, type, or perspective label.</p></article>`;
        return;
      }

      rows.slice(0, 24).forEach((row) => {
        const card = document.createElement("div");
        card.innerHTML = articleCardMarkup(row.article, {
          matchReasons: row.matchReasons,
          quotes: row.quotes,
          confidence: row.confidence,
        });
        results.append(card.firstElementChild);
      });
    }

    evidenceDeskController = {
      setFilters(nextState = {}) {
        search.value = nextState.search ?? "";
        decade.value = nextState.decade ?? "";
        type.value = nextState.type ?? "";
        perspective.value = nextState.perspective ?? "";
        signal.value = nextState.signal ?? "";
        definition.value = nextState.definition ?? "";
        recognition.value = nextState.recognition ?? "";
        location.value = nextState.location ?? "";
        subject.value = nextState.subject ?? "";
        sort.value = nextState.sort ?? "cited";
        pinnedTitles = nextState.titles ?? [];
        pinnedLabel = nextState.evidenceLabel ?? "";
        refresh();
      },
    };

    [search, decade, type, perspective, signal, definition, recognition, location, subject, sort].forEach((element) => {
      const handle = () => {
        if (pinnedTitles.length) {
          pinnedTitles = [];
          pinnedLabel = "";
        }
        refresh();
      };
      element.addEventListener("input", handle);
      element.addEventListener("change", handle);
    });

    refresh();
  }

  function renderCodebook() {
    const familyTarget = document.getElementById("codebook-family");
    const summaryTarget = document.getElementById("codebook-summary");
    const grid = document.getElementById("codebook-grid");

    if (!familyTarget || !summaryTarget || !grid) {
      return;
    }

    const familyConfig = {
      types: {
        label: "Intelligence types",
        description:
          "These categories describe what kind of intelligence is being foregrounded in the article, not a single fixed essence of the work.",
        items: familyConfigs.types.definitions,
      },
      perspectives: {
        label: "Perspectives",
        description:
          "These categories describe the interpretive lens through which intelligence is discussed, from pedagogy to disability studies and philosophy.",
        items: familyConfigs.perspectives.definitions,
      },
      signals: {
        label: "Signals",
        description:
          "Signals are adjacent motifs that cluster around intelligence discourse without functioning as the main type or perspective labels.",
        items: familyConfigs.signals.definitions,
      },
      definitions: {
        label: "Definition frames",
        description:
          "These categories describe what intelligence is taken to be: a measurable faculty, a creative capacity, a social relation, or another conceptual frame.",
        items: familyConfigs.definitions.definitions,
      },
      recognition: {
        label: "Recognition modes",
        description:
          "These categories describe how intelligence becomes recognizable in the article: by tests, making, critique, language, participation, or media fluency.",
        items: familyConfigs.recognition.definitions,
      },
      locations: {
        label: "Location frames",
        description:
          "These categories describe where intelligence is placed: in minds, bodies, artworks, relations, pedagogy, machines, or ecology.",
        items: familyConfigs.locations.definitions,
      },
      subjects: {
        label: "Subjects",
        description:
          "These categories describe who is centered as intelligent or intelligible in the article.",
        items: familyConfigs.subjects.definitions,
      },
    };

    let activeFamily = "definitions";

    function renderFamilyButtons() {
      familyTarget.innerHTML = "";
      Object.entries(familyConfig).forEach(([family, config]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `toggle-button${family === activeFamily ? " is-active" : ""}`;
        button.textContent = config.label;
        button.addEventListener("click", () => {
          activeFamily = family;
          render();
        });
        familyTarget.append(button);
      });
    }

    function render() {
      renderFamilyButtons();
      const config = familyConfig[activeFamily];
      summaryTarget.textContent = config.description;
      grid.innerHTML = "";

      const items = [...config.items].sort((a, b) => {
        const aCount = countForFamily(activeFamily, a.id);
        const bCount = countForFamily(activeFamily, b.id);
        return bCount - aCount || a.label.localeCompare(b.label);
      });

      items.forEach((definition) => {
        const matchingArticles = articlesForFamily(activeFamily, definition.id).sort(compareArticlesByImportance);
        const count = countForFamily(activeFamily, definition.id);
        const share = count / corpus.summary.articleCount;
        const origin = originLookup[activeFamily]?.[definition.id];
        const companions = codebookCompanions(activeFamily, matchingArticles);
        const examples = matchingArticles.slice(0, 3);
        const card = document.createElement("article");
        card.className = "codebook-card";
        card.innerHTML = `
          <div class="codebook-head">
            <div>
              <div class="insight-kind">${escapeHtml(config.label)}</div>
              <h3>${escapeHtml(definition.label)}</h3>
            </div>
            <button type="button" class="ghost-button">Inspect evidence</button>
          </div>
          <p>${escapeHtml(definition.description || "")}</p>
          <div class="detail-tags">
            <span class="tag">${formatNumber(count)} articles</span>
            <span class="tag">${formatPercent(share)} of corpus</span>
            ${
              origin
                ? `<span class="tag">First visible: ${escapeHtml(`${origin.firstYear}`)}</span>`
                : ""
            }
          </div>
          <div class="codebook-block">
            <h4>Coding cues</h4>
            <p>${escapeHtml(cuesForDefinition(definition).join(", ") || "Description-led heuristic coding.")}</p>
          </div>
          ${companions
            .map(
              (item) => `
                <div class="codebook-block">
                  <h4>${escapeHtml(item.label)}</h4>
                  <p>${escapeHtml(item.values.length ? item.values.join(", ") : "No strong companion pattern.")}</p>
                </div>
              `,
            )
            .join("")}
          <div class="codebook-block">
            <h4>Representative articles</h4>
            <ul class="codebook-list">
              ${examples
                .map((article) => `<li><strong>${article.year}</strong> ${escapeHtml(article.title)}</li>`)
                .join("")}
            </ul>
          </div>
        `;
        card.querySelector(".ghost-button")?.addEventListener("click", () => inspectConceptInEvidenceDesk(activeFamily, definition.id));
        grid.append(card);
      });
    }

    render();
  }

  function revealOnScroll() {
    document.body.classList.add("is-animated");
    const nodes = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );

    nodes.forEach((node) => observer.observe(node));
  }

  function init() {
    renderHeroStats();
    renderConceptualQuestions();
    renderMeaningShifts();
    createBarRows(document.getElementById("type-bars"), corpus.typeCounts, "cool", { family: "types" });
    createBarRows(document.getElementById("perspective-bars"), corpus.perspectiveCounts, "warm", { family: "perspectives" });
    renderTrendGroup("type-trends", "type-trend-note", corpus.trends.types, "types");
    renderTrendGroup("perspective-trends", "perspective-trend-note", corpus.trends.perspectives, "perspectives");
    renderSignalTrends();
    renderTrendHighlights();
    renderScorecards();
    renderComparisonStudio();
    renderMatrix();
    renderTimeline();
    renderBlindSpots();
    renderOrigins();
    renderRarePairs();
    renderFrontierArticles();
    renderTopCited();
    renderThreads();
    renderConceptNeighbors();
    renderSignals();
    renderAskCorpus();
    renderGraphLab();
    renderExplorer();
    renderCodebook();
    renderMethods();
    renderValidation();
    attachCoverageNote();
    revealOnScroll();
  }

  init();
})();
