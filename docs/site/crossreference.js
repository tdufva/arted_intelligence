(function () {
  const corpus = window.CORPUS_DATA;

  if (!corpus) {
    return;
  }

  const signalFallbackMeta = {
    language: { label: "Language and semiotics" },
    teacherhood: { label: "Teachers and professional formation" },
    place: { label: "Place and ecology" },
    technology: { label: "Technology and media" },
    materiality: { label: "Materiality" },
    identity: { label: "Identity and aspiration" },
    equity: { label: "Equity and justice" },
    museum: { label: "Museum and public learning" },
    care: { label: "Care and wellbeing" },
    transfer: { label: "Transfer" },
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
      definitions: corpus.intelligenceTypes,
      counts: corpus.typeCounts,
      lookup: typeLookup,
    },
    perspectives: {
      label: "Perspectives",
      articleKey: "perspectives",
      definitions: corpus.perspectives,
      counts: corpus.perspectiveCounts,
      lookup: perspectiveLookup,
    },
    signals: {
      label: "Signals",
      articleKey: "signals",
      definitions: corpus.signals.map((item) => ({
        ...item,
        label: item.label || signalFallbackMeta[item.id]?.label || item.id.replaceAll("_", " "),
      })),
      counts: corpus.signals,
      lookup: signalLookup,
    },
    definitions: {
      label: "Definition frames",
      articleKey: "definitionFrames",
      definitions: corpus.definitionFrames,
      counts: corpus.conceptualQuestions.definitions.counts,
      lookup: definitionLookup,
    },
    recognition: {
      label: "Recognition modes",
      articleKey: "recognitionModes",
      definitions: corpus.recognitionModes,
      counts: corpus.conceptualQuestions.recognition.counts,
      lookup: recognitionLookup,
    },
    locations: {
      label: "Location frames",
      articleKey: "locationFrames",
      definitions: corpus.locationFrames,
      counts: corpus.conceptualQuestions.locations.counts,
      lookup: locationLookup,
    },
    subjects: {
      label: "Centered subjects",
      articleKey: "subjectFrames",
      definitions: corpus.subjectFrames,
      counts: corpus.conceptualQuestions.subjects.counts,
      lookup: subjectLookup,
    },
  };

  const familyList = [
    "types",
    "perspectives",
    "signals",
    "definitions",
    "recognition",
    "locations",
    "subjects",
  ];

  const countLookups = Object.fromEntries(
    Object.entries(familyConfigs).map(([family, config]) => [family, Object.fromEntries(config.counts.map((item) => [item.id, item.count]))]),
  );

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
  const earlyWindow = corpus.trends.types.earlyWindow || allDecades.slice(0, 3);
  const lateWindow = corpus.trends.types.lateWindow || allDecades.slice(-3);

  const scopeOptions = [
    { id: "all", label: "All decades" },
    { id: "early-window", label: `${earlyWindow[0]}–${earlyWindow[earlyWindow.length - 1]}` },
    { id: "late-window", label: `${lateWindow[0]}–${lateWindow[lateWindow.length - 1]}` },
    ...allDecades.map((decade) => ({ id: decade, label: decade })),
  ];

  const state = {
    primaryFamily: "types",
    primaryId: "",
    secondaryFamily: "perspectives",
    secondaryId: "",
    lensFamily: "",
    lensId: "",
    scope: "all",
    sort: "association",
    researchNoteMode: "pair",
    pair: {
      a: {
        familyOne: "types",
        idOne: "digital",
        familyTwo: "perspectives",
        idTwo: "technology",
      },
      b: {
        familyOne: "types",
        idOne: "social",
        familyTwo: "perspectives",
        idTwo: "community",
      },
    },
  };

  function formatNumber(value) {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value || 0);
  }

  function formatPercent(value) {
    return `${Math.round((value || 0) * 100)}%`;
  }

  function pdfCitationCount(article) {
    return article?.citingArticlesPdf || 0;
  }

  function compareArticlesByImportance(left, right) {
    return (
      pdfCitationCount(right) - pdfCitationCount(left) ||
      (right.articleViews || 0) - (left.articleViews || 0) ||
      right.year - left.year ||
      left.title.localeCompare(right.title)
    );
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
    if (!family || !id) return true;
    const config = familyConfigs[family];
    return config ? article[config.articleKey].includes(id) : false;
  }

  function articleInScope(article, scope) {
    const decade = currentDecade(article);
    if (scope === "all") return true;
    if (scope === "early-window") return earlyWindow.includes(decade);
    if (scope === "late-window") return lateWindow.includes(decade);
    return decade === scope;
  }

  function labelForFamily(family) {
    return familyConfigs[family]?.label || family;
  }

  function definitionRowsForFamily(family) {
    const config = familyConfigs[family];
    if (!config) return [];
    return [...config.definitions]
      .map((item) => ({
        ...item,
        label: family === "signals" ? lookupSignalLabel(item.id) : item.label,
        corpusCount: countLookups[family]?.[item.id] || 0,
      }))
      .sort((left, right) => right.corpusCount - left.corpusCount || left.label.localeCompare(right.label));
  }

  function preferredDefinitionId(family, preferredIds = []) {
    const rows = definitionRowsForFamily(family);
    const hit = preferredIds.find((candidate) => rows.some((row) => row.id === candidate));
    return hit || rows[0]?.id || "";
  }

  function pairLabel(pair) {
    if (!pair) return "";
    return `${lookupAnyLabel(pair.idOne)} × ${lookupAnyLabel(pair.idTwo)}`;
  }

  function pairMatches(article, pair) {
    return articleMatchesFamily(article, pair.familyOne, pair.idOne) && articleMatchesFamily(article, pair.familyTwo, pair.idTwo);
  }

  function pairConcepts(pair) {
    const items = [
      { family: pair.familyOne, id: pair.idOne },
      { family: pair.familyTwo, id: pair.idTwo },
    ];
    if (state.lensFamily && state.lensId) {
      items.push({ family: state.lensFamily, id: state.lensId });
    }
    return items;
  }

  function ensureStateValidity() {
    if (!familyConfigs[state.primaryFamily]) state.primaryFamily = "types";
    const primaryRows = definitionRowsForFamily(state.primaryFamily);
    if (!primaryRows.some((item) => item.id === state.primaryId)) {
      state.primaryId = primaryRows[0]?.id || "";
    }

    if (!familyConfigs[state.secondaryFamily]) state.secondaryFamily = "perspectives";
    const secondaryRows = definitionRowsForFamily(state.secondaryFamily).filter(
      (item) => !(state.secondaryFamily === state.primaryFamily && item.id === state.primaryId),
    );
    if (state.secondaryId && !secondaryRows.some((item) => item.id === state.secondaryId)) {
      state.secondaryId = "";
    }

    if (state.lensFamily && !familyConfigs[state.lensFamily]) {
      state.lensFamily = "";
      state.lensId = "";
    }
    const lensRows = state.lensFamily ? definitionRowsForFamily(state.lensFamily) : [];
    if (state.lensId && !lensRows.some((item) => item.id === state.lensId)) {
      state.lensId = "";
    }
    if (!scopeOptions.some((item) => item.id === state.scope)) state.scope = "all";

    ["a", "b"].forEach((slot, index) => {
      const pair = state.pair[slot];
      if (!familyConfigs[pair.familyOne]) pair.familyOne = "types";
      if (!familyConfigs[pair.familyTwo]) pair.familyTwo = "perspectives";

      const familyOneRows = definitionRowsForFamily(pair.familyOne);
      if (!familyOneRows.some((item) => item.id === pair.idOne)) {
        pair.idOne = preferredDefinitionId(
          pair.familyOne,
          index === 0 ? ["digital", "cognitive"] : ["social", "creative", "cognitive"],
        );
      }

      const familyTwoRows = definitionRowsForFamily(pair.familyTwo).filter(
        (item) => !(pair.familyOne === pair.familyTwo && item.id === pair.idOne),
      );
      if (!familyTwoRows.some((item) => item.id === pair.idTwo)) {
        pair.idTwo = preferredDefinitionId(
          pair.familyTwo,
          index === 0 ? ["technology", "assessment", "pedagogy"] : ["community", "critical", "pedagogy"],
        );
        if (pair.familyOne === pair.familyTwo && pair.idTwo === pair.idOne) {
          pair.idTwo = familyTwoRows[0]?.id || "";
        }
      }
    });

    if (!["lead", "pair"].includes(state.researchNoteMode)) {
      state.researchNoteMode = "pair";
    }
  }

  function populateSelect(select, rows, selectedId, placeholder) {
    if (!select) return;
    select.innerHTML = "";
    if (placeholder) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = placeholder;
      select.append(option);
    }
    rows.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.id;
      option.textContent = item.label;
      select.append(option);
    });
    select.value = selectedId || "";
  }

  function renderControls() {
    const primaryFamily = document.getElementById("crossref-primary-family");
    const primaryId = document.getElementById("crossref-primary-id");
    const secondaryFamily = document.getElementById("crossref-secondary-family");
    const secondaryId = document.getElementById("crossref-secondary-id");
    const lensFamily = document.getElementById("crossref-lens-family");
    const lensId = document.getElementById("crossref-lens-id");
    const scope = document.getElementById("crossref-scope");
    const sort = document.getElementById("crossref-sort");
    const noteMode = document.getElementById("research-note-mode");
    const pairAFamilyOne = document.getElementById("pair-a-family-one");
    const pairAIdOne = document.getElementById("pair-a-id-one");
    const pairAFamilyTwo = document.getElementById("pair-a-family-two");
    const pairAIdTwo = document.getElementById("pair-a-id-two");
    const pairBFamilyOne = document.getElementById("pair-b-family-one");
    const pairBIdOne = document.getElementById("pair-b-id-one");
    const pairBFamilyTwo = document.getElementById("pair-b-family-two");
    const pairBIdTwo = document.getElementById("pair-b-id-two");
    const pairLoadActive = document.getElementById("pair-load-active");
    const pairSwap = document.getElementById("pair-swap");

    if (!primaryFamily || !primaryId || !secondaryFamily || !secondaryId || !lensFamily || !lensId || !scope || !sort) {
      return;
    }

    ensureStateValidity();

    const familyOptions = familyList.map((family) => ({ id: family, label: labelForFamily(family) }));
    populateSelect(primaryFamily, familyOptions, state.primaryFamily);
    populateSelect(secondaryFamily, familyOptions, state.secondaryFamily);
    populateSelect(lensFamily, familyOptions, state.lensFamily, "No additional lens");
    populateSelect(primaryId, definitionRowsForFamily(state.primaryFamily), state.primaryId);
    populateSelect(
      secondaryId,
      definitionRowsForFamily(state.secondaryFamily).filter(
        (item) => !(state.secondaryFamily === state.primaryFamily && item.id === state.primaryId),
      ),
      state.secondaryId,
      `Rank all ${labelForFamily(state.secondaryFamily).toLowerCase()}`,
    );
    populateSelect(
      lensId,
      state.lensFamily ? definitionRowsForFamily(state.lensFamily) : [],
      state.lensId,
      state.lensFamily ? `No ${labelForFamily(state.lensFamily).toLowerCase()} filter` : "Choose a lens family first",
    );
    lensId.disabled = !state.lensFamily;
    populateSelect(scope, scopeOptions, state.scope);
    sort.value = state.sort;
    if (noteMode) noteMode.value = state.researchNoteMode;

    const renderPairSlot = (slotPrefix, pair) => {
      const familyOne = document.getElementById(`${slotPrefix}-family-one`);
      const idOne = document.getElementById(`${slotPrefix}-id-one`);
      const familyTwo = document.getElementById(`${slotPrefix}-family-two`);
      const idTwo = document.getElementById(`${slotPrefix}-id-two`);
      if (!familyOne || !idOne || !familyTwo || !idTwo) return;

      populateSelect(familyOne, familyOptions, pair.familyOne);
      populateSelect(familyTwo, familyOptions, pair.familyTwo);
      populateSelect(idOne, definitionRowsForFamily(pair.familyOne), pair.idOne);
      populateSelect(
        idTwo,
        definitionRowsForFamily(pair.familyTwo).filter(
          (item) => !(pair.familyOne === pair.familyTwo && item.id === pair.idOne),
        ),
        pair.idTwo,
      );
    };

    renderPairSlot("pair-a", state.pair.a);
    renderPairSlot("pair-b", state.pair.b);

    if (!primaryFamily.dataset.bound) {
      primaryFamily.addEventListener("change", () => {
        state.primaryFamily = primaryFamily.value;
        state.primaryId = "";
        if (state.secondaryFamily === state.primaryFamily && state.secondaryId === state.primaryId) {
          state.secondaryId = "";
        }
        renderAll();
      });
      primaryFamily.dataset.bound = "true";
    }

    if (!primaryId.dataset.bound) {
      primaryId.addEventListener("change", () => {
        state.primaryId = primaryId.value;
        if (state.secondaryFamily === state.primaryFamily && state.secondaryId === state.primaryId) {
          state.secondaryId = "";
        }
        renderAll();
      });
      primaryId.dataset.bound = "true";
    }

    if (!secondaryFamily.dataset.bound) {
      secondaryFamily.addEventListener("change", () => {
        state.secondaryFamily = secondaryFamily.value;
        state.secondaryId = "";
        renderAll();
      });
      secondaryFamily.dataset.bound = "true";
    }

    if (!secondaryId.dataset.bound) {
      secondaryId.addEventListener("change", () => {
        state.secondaryId = secondaryId.value;
        renderAll();
      });
      secondaryId.dataset.bound = "true";
    }

    if (!lensFamily.dataset.bound) {
      lensFamily.addEventListener("change", () => {
        state.lensFamily = lensFamily.value;
        state.lensId = "";
        renderAll();
      });
      lensFamily.dataset.bound = "true";
    }

    if (!lensId.dataset.bound) {
      lensId.addEventListener("change", () => {
        state.lensId = lensId.value;
        renderAll();
      });
      lensId.dataset.bound = "true";
    }

    if (!scope.dataset.bound) {
      scope.addEventListener("change", () => {
        state.scope = scope.value;
        renderAll();
      });
      scope.dataset.bound = "true";
    }

    if (!sort.dataset.bound) {
      sort.addEventListener("change", () => {
        state.sort = sort.value;
        renderAll();
      });
      sort.dataset.bound = "true";
    }

    const bindPairSelect = (element, updater) => {
      if (!element || element.dataset.bound) return;
      element.addEventListener("change", () => {
        updater(element.value);
        renderAll();
      });
      element.dataset.bound = "true";
    };

    bindPairSelect(pairAFamilyOne, (value) => {
      state.pair.a.familyOne = value;
      state.pair.a.idOne = "";
    });
    bindPairSelect(pairAIdOne, (value) => {
      state.pair.a.idOne = value;
    });
    bindPairSelect(pairAFamilyTwo, (value) => {
      state.pair.a.familyTwo = value;
      state.pair.a.idTwo = "";
    });
    bindPairSelect(pairAIdTwo, (value) => {
      state.pair.a.idTwo = value;
    });
    bindPairSelect(pairBFamilyOne, (value) => {
      state.pair.b.familyOne = value;
      state.pair.b.idOne = "";
    });
    bindPairSelect(pairBIdOne, (value) => {
      state.pair.b.idOne = value;
    });
    bindPairSelect(pairBFamilyTwo, (value) => {
      state.pair.b.familyTwo = value;
      state.pair.b.idTwo = "";
    });
    bindPairSelect(pairBIdTwo, (value) => {
      state.pair.b.idTwo = value;
    });

    if (noteMode && !noteMode.dataset.bound) {
      noteMode.addEventListener("change", () => {
        state.researchNoteMode = noteMode.value;
        renderAll();
      });
      noteMode.dataset.bound = "true";
    }

    if (pairLoadActive && !pairLoadActive.dataset.bound) {
      pairLoadActive.addEventListener("click", () => {
        const activeRow = computeRows().active;
        state.pair.a.familyOne = state.primaryFamily;
        state.pair.a.idOne = state.primaryId;
        state.pair.a.familyTwo = state.secondaryFamily;
        state.pair.a.idTwo = activeRow?.id || state.secondaryId || state.pair.a.idTwo;
        renderAll();
      });
      pairLoadActive.dataset.bound = "true";
    }

    if (pairSwap && !pairSwap.dataset.bound) {
      pairSwap.addEventListener("click", () => {
        const nextA = { ...state.pair.b };
        const nextB = { ...state.pair.a };
        state.pair.a = nextA;
        state.pair.b = nextB;
        renderAll();
      });
      pairSwap.dataset.bound = "true";
    }
  }

  function selectedConcepts(activeRow) {
    const items = [];
    if (state.primaryId) items.push({ family: state.primaryFamily, id: state.primaryId });
    if (activeRow?.id) items.push({ family: state.secondaryFamily, id: activeRow.id });
    if (state.lensFamily && state.lensId) items.push({ family: state.lensFamily, id: state.lensId });
    return items;
  }

  function selectRelevantQuotes(article, concepts) {
    const ids = new Set(concepts.map((item) => item.id));
    const families = new Set(concepts.map((item) => item.family));
    const quotes = article.quotes || [];
    return [...quotes]
      .map((quote) => {
        let score = /intelligen/i.test(quote.text) ? 1 : 0;
        if (quote.tags?.some((tag) => ids.has(tag))) score += 4;
        if (quote.families?.some((family) => families.has(family))) score += 2;
        return { ...quote, score };
      })
      .filter((quote) => quote.score > 0)
      .sort((left, right) => right.score - left.score || left.text.length - right.text.length)
      .slice(0, 2);
  }

  function relevantConfidenceEntries(article, concepts) {
    return concepts
      .map((item) => {
        const key = familyConfigs[item.family]?.articleKey;
        const entry = (article.codingConfidence?.[key] || []).find((candidate) => candidate.id === item.id);
        return entry ? { family: item.family, ...entry } : null;
      })
      .filter(Boolean)
      .slice(0, 4);
  }

  function detailTagMarkup(ids) {
    return (ids || []).map((id) => `<span class="tag">${escapeHtml(lookupAnyLabel(id))}</span>`).join("");
  }

  function articleCardMarkup(article, concepts, reasons) {
    const metaBits = [
      article.year,
      article.pageCount ? `${article.pageCount} pages` : null,
      article.articleViews ? `${formatNumber(article.articleViews)} views` : null,
      pdfCitationCount(article) ? `${formatNumber(pdfCitationCount(article))} citing articles in PDF metadata` : null,
    ].filter(Boolean);

    const quotes = selectRelevantQuotes(article, concepts);
    const confidence = relevantConfidenceEntries(article, concepts);

    return `
      <article class="explorer-card">
        <div class="meta-line">${escapeHtml(metaBits.join(" · "))}</div>
        <h4>${escapeHtml(article.title)}</h4>
        <p>${escapeHtml(article.excerpt)}</p>
        <div class="match-list">
          <h5>Match reasons</h5>
          <ul>${reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}</ul>
        </div>
        ${
          quotes.length
            ? `<div class="quote-list">
                <h5>Quote-level evidence</h5>
                ${quotes.map((quote) => `<figure class="quote-item"><p>“${escapeHtml(quote.text)}”</p></figure>`).join("")}
              </div>`
            : ""
        }
        ${
          confidence.length
            ? `<div class="confidence-strip">
                ${confidence
                  .map(
                    (item) => `<span class="confidence-badge" data-kind="${escapeHtml(item.kind || "heuristic")}" title="${escapeHtml(item.note || "")}">
                      ${escapeHtml(lookupAnyLabel(item.id))} · ${escapeHtml(item.label)}
                    </span>`,
                  )
                  .join("")}
              </div>`
            : ""
        }
        <div class="detail-tags">${detailTagMarkup(article.intelligenceTypes)}</div>
        <div class="detail-tags detail-tags-subtle">${detailTagMarkup(article.perspectives)}${detailTagMarkup(article.signals)}</div>
        <div class="detail-tags detail-tags-subtle">${detailTagMarkup(article.definitionFrames)}${detailTagMarkup(article.locationFrames)}</div>
        <p class="evidence-meta">${article.doi ? `DOI: ${escapeHtml(article.doi)}` : "DOI not available in extracted metadata."}</p>
      </article>
    `;
  }

  function heroStats() {
    const target = document.getElementById("crossref-hero-stats");
    if (!target) return;
    const stats = [
      { value: corpus.summary.articleCount, label: "articles in scope" },
      { value: `${familyList.length} coded families`, label: "crossreference dimensions" },
      { value: allDecades.length, label: "decades available" },
      { value: corpus.validation.sampleSize, label: "validated gold-sample articles" },
    ];
    target.innerHTML = "";
    stats.forEach((item) => {
      const stat = document.createElement("div");
      stat.className = "stat";
      stat.innerHTML = `<span class="value">${escapeHtml(item.value)}</span><span class="label">${escapeHtml(item.label)}</span>`;
      target.append(stat);
    });
  }

  function filteredBaseArticles() {
    return corpus.articles.filter((article) => {
      if (!articleInScope(article, state.scope)) return false;
      if (state.lensFamily && state.lensId && !articleMatchesFamily(article, state.lensFamily, state.lensId)) return false;
      return true;
    });
  }

  function scoreForRow(row, mode) {
    if (!row) return -Infinity;
    if (mode === "strength") return row.observed + row.primaryShare + row.avgCitation * 0.05;
    if (mode === "frontier") return Math.max(row.frontierDelta, 0) * 6 + row.recentShare * 1.5 + row.observed * 0.08;
    if (mode === "cited") return row.avgCitation * 3 + row.totalCitation * 0.05 + row.observed * 0.1;
    if (mode === "hidden") {
      const rarity = row.observed > 0 && row.observed <= 4 ? 1.3 : Math.max(0, 5 - row.observed) * 0.05;
      return rarity + Math.min(row.lift, 3) * 0.8 + row.recentShare * 0.8 + row.avgCitation * 0.08;
    }
    return row.lift * Math.log2(row.observed + 1);
  }

  function computeRows() {
    const baseArticles = filteredBaseArticles();
    const primaryArticles = baseArticles.filter((article) => articleMatchesFamily(article, state.primaryFamily, state.primaryId));
    const primaryEarly = primaryArticles.filter((article) => earlyWindow.includes(currentDecade(article))).length;
    const primaryLate = primaryArticles.filter((article) => lateWindow.includes(currentDecade(article))).length;
    const candidates = definitionRowsForFamily(state.secondaryFamily).filter(
      (item) => !(state.secondaryFamily === state.primaryFamily && item.id === state.primaryId),
    );

    const allRows = candidates.map((item) => {
      const crossArticles = baseArticles.filter((article) => articleMatchesFamily(article, state.secondaryFamily, item.id));
      const matchedArticles = primaryArticles.filter((article) => articleMatchesFamily(article, state.secondaryFamily, item.id));
      const observed = matchedArticles.length;
      const crossCount = crossArticles.length;
      const expected = baseArticles.length ? (primaryArticles.length * crossCount) / baseArticles.length : 0;
      const lift = expected > 0 ? observed / expected : 0;
      const totalCitation = matchedArticles.reduce((sum, article) => sum + pdfCitationCount(article), 0);
      const avgCitation = observed ? totalCitation / observed : 0;
      const totalViews = matchedArticles.reduce((sum, article) => sum + (article.articleViews || 0), 0);
      const avgViews = observed ? totalViews / observed : 0;
      const quoteCoverage = observed ? matchedArticles.filter((article) => (article.quotes || []).length > 0).length / observed : 0;
      const earlyObserved = matchedArticles.filter((article) => earlyWindow.includes(currentDecade(article))).length;
      const lateObserved = matchedArticles.filter((article) => lateWindow.includes(currentDecade(article))).length;
      const earlyShare = primaryEarly ? earlyObserved / primaryEarly : 0;
      const lateShare = primaryLate ? lateObserved / primaryLate : 0;
      const frontierDelta = lateShare - earlyShare;
      const recentShare = observed ? lateObserved / observed : 0;
      const decadeCounts = allDecades.map((decade) => {
        const count = matchedArticles.filter((article) => currentDecade(article) === decade).length;
        const primaryCount = primaryArticles.filter((article) => currentDecade(article) === decade).length;
        return {
          decade,
          count,
          shareWithinPrimary: primaryCount ? count / primaryCount : 0,
        };
      });

      return {
        id: item.id,
        label: item.label,
        description: item.description || "",
        observed,
        crossCount,
        primaryCount: primaryArticles.length,
        baseCount: baseArticles.length,
        expected,
        lift,
        primaryShare: primaryArticles.length ? observed / primaryArticles.length : 0,
        corpusShare: baseArticles.length ? observed / baseArticles.length : 0,
        totalCitation,
        avgCitation,
        avgViews,
        quoteCoverage,
        frontierDelta,
        earlyShare,
        lateShare,
        recentShare,
        decadeCounts,
        articles: [...matchedArticles].sort(compareArticlesByImportance),
      };
    });

    const rows = allRows.filter((row) => row.observed > 0).sort((left, right) => {
      const scoreDiff = scoreForRow(right, state.sort) - scoreForRow(left, state.sort);
      return scoreDiff || right.observed - left.observed || right.lift - left.lift || left.label.localeCompare(right.label);
    });

    const active =
      (state.secondaryId && allRows.find((row) => row.id === state.secondaryId)) ||
      rows[0] ||
      allRows[0] ||
      null;

    return {
      baseArticles,
      primaryArticles,
      rows,
      allRows,
      active,
    };
  }

  function computePairMetrics(pair, baseArticles) {
    const firstArticles = baseArticles.filter((article) => articleMatchesFamily(article, pair.familyOne, pair.idOne));
    const secondArticles = baseArticles.filter((article) => articleMatchesFamily(article, pair.familyTwo, pair.idTwo));
    const matchedArticles = baseArticles.filter((article) => pairMatches(article, pair));
    const observed = matchedArticles.length;
    const expected = baseArticles.length ? (firstArticles.length * secondArticles.length) / baseArticles.length : 0;
    const totalCitation = matchedArticles.reduce((sum, article) => sum + pdfCitationCount(article), 0);
    const avgCitation = observed ? totalCitation / observed : 0;
    const totalViews = matchedArticles.reduce((sum, article) => sum + (article.articleViews || 0), 0);
    const avgViews = observed ? totalViews / observed : 0;
    const earlyScopeCount = baseArticles.filter((article) => earlyWindow.includes(currentDecade(article))).length;
    const lateScopeCount = baseArticles.filter((article) => lateWindow.includes(currentDecade(article))).length;
    const earlyCount = matchedArticles.filter((article) => earlyWindow.includes(currentDecade(article))).length;
    const lateCount = matchedArticles.filter((article) => lateWindow.includes(currentDecade(article))).length;
    const earlyScopeShare = earlyScopeCount ? earlyCount / earlyScopeCount : 0;
    const lateScopeShare = lateScopeCount ? lateCount / lateScopeCount : 0;
    const decadeCounts = allDecades.map((decade) => {
      const scopeCount = baseArticles.filter((article) => currentDecade(article) === decade).length;
      const count = matchedArticles.filter((article) => currentDecade(article) === decade).length;
      return {
        decade,
        count,
        shareWithinScope: scopeCount ? count / scopeCount : 0,
      };
    });

    return {
      ...pair,
      label: pairLabel(pair),
      observed,
      expected,
      lift: expected > 0 ? observed / expected : 0,
      firstCount: firstArticles.length,
      secondCount: secondArticles.length,
      scopeShare: baseArticles.length ? observed / baseArticles.length : 0,
      firstShare: firstArticles.length ? observed / firstArticles.length : 0,
      secondShare: secondArticles.length ? observed / secondArticles.length : 0,
      totalCitation,
      avgCitation,
      avgViews,
      earlyScopeShare,
      lateScopeShare,
      frontierDelta: lateScopeShare - earlyScopeShare,
      recentShare: observed ? lateCount / observed : 0,
      decadeCounts,
      articles: [...matchedArticles].sort(compareArticlesByImportance),
    };
  }

  function computePairContext(context) {
    return {
      baseArticles: context.baseArticles,
      a: computePairMetrics(state.pair.a, context.baseArticles),
      b: computePairMetrics(state.pair.b, context.baseArticles),
    };
  }

  function pairWinnerKey(left, right, key, higherWins = true) {
    if (Math.abs((left[key] || 0) - (right[key] || 0)) < 0.0001) return "tie";
    if (higherWins) return left[key] > right[key] ? "a" : "b";
    return left[key] < right[key] ? "a" : "b";
  }

  function pairWinnerLabel(pairContext, key, formatter) {
    const winner = pairWinnerKey(pairContext.a, pairContext.b, key, true);
    if (winner === "tie") return "Near tie";
    const pair = pairContext[winner];
    return `${winner === "a" ? "Pair A" : "Pair B"} · ${formatter(pair[key])}`;
  }

  function pairDifferenceNarrative(pairContext) {
    const bigger = pairWinnerKey(pairContext.a, pairContext.b, "observed", true);
    const tighter = pairWinnerKey(pairContext.a, pairContext.b, "lift", true);
    const newer = pairWinnerKey(pairContext.a, pairContext.b, "frontierDelta", true);
    const cited = pairWinnerKey(pairContext.a, pairContext.b, "avgCitation", true);
    const lines = [];

    if (bigger !== "tie") {
      lines.push(`${bigger === "a" ? "Pair A" : "Pair B"} is the larger overlap in the current scope.`);
    } else {
      lines.push("Both pairs have a similar overlap size in the current scope.");
    }

    if (tighter !== "tie") {
      lines.push(`${tighter === "a" ? "Pair A" : "Pair B"} is the tighter coupling once frequency is normalized through lift.`);
    }

    if (newer !== "tie") {
      lines.push(
        (pairContext[newer].frontierDelta > 0.02 ? `${newer === "a" ? "Pair A" : "Pair B"} has the stronger later-corpus signal.` : "Neither pair shows a strong late-window advantage."),
      );
    }

    if (cited !== "tie") {
      lines.push(`${cited === "a" ? "Pair A" : "Pair B"} is more citation-dense in the available PDF metadata.`);
    }

    return lines.join(" ");
  }

  function formatReference(article) {
    const doiText = article.doi ? `DOI: https://doi.org/${article.doi}` : "DOI not available in extracted metadata.";
    return `- ${article.title} (${article.year}). ${doiText}`;
  }

  function collectQuoteEvidence(articles, concepts, limit = 4) {
    const output = [];
    articles.forEach((article) => {
      if (output.length >= limit) return;
      const quotes = selectRelevantQuotes(article, concepts);
      if (!quotes.length) return;
      output.push({
        title: article.title,
        year: article.year,
        text: quotes[0].text,
      });
    });
    return output.slice(0, limit);
  }

  function slugify(value) {
    return String(value || "research-note")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
  }

  function buildLeadNote(context) {
    const row = context.active;
    if (!row) {
      return {
        text: "No active ranked lead is available for note generation.",
        citations: "",
        filename: "crossreference-note.md",
      };
    }

    const primaryLabel = lookupAnyLabel(state.primaryId);
    const title = `${primaryLabel} × ${row.label}`;
    const concepts = selectedConcepts(row);
    const topArticles = row.articles.slice(0, 8);
    const quotes = collectQuoteEvidence(topArticles, concepts, 4);
    const lensText = state.lensFamily && state.lensId ? `${lookupAnyLabel(state.lensId)} (${labelForFamily(state.lensFamily)})` : "None";
    const citations = topArticles.map(formatReference).join("\n");

    return {
      filename: `${slugify(title)}-note.md`,
      citations,
      text: [
        `# Research note: ${title}`,
        ``,
        `## Corpus scope`,
        `- Source: Studies in Art Education PDF corpus only`,
        `- Window: ${state.scope === "all" ? "All decades" : state.scope}`,
        `- Additional lens: ${lensText}`,
        `- Primary slice size: ${formatNumber(context.primaryArticles.length)} articles`,
        ``,
        `## Working lead`,
        `- Matched articles: ${formatNumber(row.observed)}`,
        `- Share of primary slice: ${formatPercent(row.primaryShare)}`,
        `- Observed / expected: ${row.lift.toFixed(2)}x`,
        `- Average PDF citation count: ${formatNumber(row.avgCitation)}`,
        `- Early-to-late shift: ${formatPercent(row.earlyShare)} -> ${formatPercent(row.lateShare)}`,
        ``,
        `## Interpretive note`,
        rowNarrative(row),
        ``,
        `## Supporting articles`,
        citations || "- No articles available in the current slice.",
        ``,
        `## Quote evidence`,
        ...(quotes.length
          ? quotes.map((item) => `- ${item.year}, ${item.title}: "${item.text}"`)
          : ["- No quote-level evidence available in the current slice."]),
        ``,
        `## Method and cautions`,
        `- Multi-label corpus: intersections show co-presence rather than exclusive classification.`,
        `- PDF citation metadata is partial in this dataset.`,
        `- This note is a research lead, not a finished claim; the supporting articles should be read closely before interpretation is finalized.`,
      ].join("\n"),
    };
  }

  function buildPairNote(pairContext) {
    const pairA = pairContext.a;
    const pairB = pairContext.b;
    const citationsA = pairA.articles.slice(0, 6).map(formatReference);
    const citationsB = pairB.articles.slice(0, 6).map(formatReference);
    const quotesA = collectQuoteEvidence(pairA.articles.slice(0, 6), pairConcepts(pairA), 3);
    const quotesB = collectQuoteEvidence(pairB.articles.slice(0, 6), pairConcepts(pairB), 3);
    const lensText = state.lensFamily && state.lensId ? `${lookupAnyLabel(state.lensId)} (${labelForFamily(state.lensFamily)})` : "None";

    return {
      filename: `${slugify(`${pairA.label}-vs-${pairB.label}`)}.md`,
      citations: [`## Pair A`, ...citationsA, ``, `## Pair B`, ...citationsB].join("\n"),
      text: [
        `# Pair comparison note: ${pairA.label} vs ${pairB.label}`,
        ``,
        `## Corpus scope`,
        `- Source: Studies in Art Education PDF corpus only`,
        `- Window: ${state.scope === "all" ? "All decades" : state.scope}`,
        `- Additional lens: ${lensText}`,
        `- Articles in scope: ${formatNumber(pairContext.baseArticles.length)}`,
        ``,
        `## Pair A`,
        `- Pair: ${pairA.label}`,
        `- Matched articles: ${formatNumber(pairA.observed)}`,
        `- Share of scope: ${formatPercent(pairA.scopeShare)}`,
        `- Lift: ${pairA.lift.toFixed(2)}x`,
        `- Average PDF citation count: ${formatNumber(pairA.avgCitation)}`,
        `- Early-to-late scope shift: ${formatPercent(pairA.earlyScopeShare)} -> ${formatPercent(pairA.lateScopeShare)}`,
        ``,
        `## Pair B`,
        `- Pair: ${pairB.label}`,
        `- Matched articles: ${formatNumber(pairB.observed)}`,
        `- Share of scope: ${formatPercent(pairB.scopeShare)}`,
        `- Lift: ${pairB.lift.toFixed(2)}x`,
        `- Average PDF citation count: ${formatNumber(pairB.avgCitation)}`,
        `- Early-to-late scope shift: ${formatPercent(pairB.earlyScopeShare)} -> ${formatPercent(pairB.lateScopeShare)}`,
        ``,
        `## Comparative takeaways`,
        `- ${pairDifferenceNarrative(pairContext)}`,
        ``,
        `## Supporting articles for Pair A`,
        ...(citationsA.length ? citationsA : ["- No articles available for Pair A in the current scope."]),
        ``,
        `## Supporting articles for Pair B`,
        ...(citationsB.length ? citationsB : ["- No articles available for Pair B in the current scope."]),
        ``,
        `## Quote evidence for Pair A`,
        ...(quotesA.length ? quotesA.map((item) => `- ${item.year}, ${item.title}: "${item.text}"`) : ["- No quote-level evidence available."]),
        ``,
        `## Quote evidence for Pair B`,
        ...(quotesB.length ? quotesB.map((item) => `- ${item.year}, ${item.title}: "${item.text}"`) : ["- No quote-level evidence available."]),
        ``,
        `## Method and cautions`,
        `- Pair comparison uses the same scope and lens for both pairs.`,
        `- Lift is used to distinguish unusually tight pairings from merely common ones.`,
        `- Citation density uses the PDF-derived metadata available in this corpus and is not a complete citation index.`,
      ].join("\n"),
    };
  }

  async function copyTextToClipboard(text) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (error) {
      // Fall through to the textarea fallback.
    }

    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "true");
      textarea.style.position = "absolute";
      textarea.style.left = "-9999px";
      document.body.append(textarea);
      textarea.select();
      const success = document.execCommand("copy");
      textarea.remove();
      return success;
    } catch (error) {
      return false;
    }
  }

  function downloadTextFile(text, filename) {
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(href);
  }

  function metricCards(context) {
    const target = document.getElementById("crossref-stats");
    const note = document.getElementById("crossref-note");
    if (!target || !note) return;

    const primaryLabel = lookupAnyLabel(state.primaryId);
    const familyLabel = labelForFamily(state.secondaryFamily).toLowerCase();
    const lensText =
      state.lensFamily && state.lensId ? `, filtered by ${lookupAnyLabel(state.lensId)} (${labelForFamily(state.lensFamily).toLowerCase()})` : "";

    note.textContent = `${formatNumber(context.baseArticles.length)} articles are in the current scope. ${formatNumber(context.primaryArticles.length)} carry ${primaryLabel}. The ranking compares that slice against ${familyLabel}${lensText}.`;

    const active = context.active;
    const cards = [
      {
        label: "Articles in scope",
        value: formatNumber(context.baseArticles.length),
        note: state.scope === "all" ? "All available decades" : `Window: ${state.scope}`,
      },
      {
        label: "Primary slice",
        value: formatNumber(context.primaryArticles.length),
        note: active ? `${formatPercent(active.primaryShare)} carry the active lead` : "Choose a lead",
      },
      {
        label: "Nonzero leads",
        value: formatNumber(context.rows.length),
        note: `Across ${labelForFamily(state.secondaryFamily).toLowerCase()}`,
      },
      {
        label: "Active lift",
        value: active ? `${active.lift.toFixed(2)}×` : "0×",
        note: active ? `Observed ${formatNumber(active.observed)} vs expected ${formatNumber(active.expected)}` : "No active lead yet",
      },
    ];

    target.innerHTML = "";
    cards.forEach((item) => {
      const card = document.createElement("article");
      card.className = "crossref-stat";
      card.innerHTML = `<span class="value">${escapeHtml(item.value)}</span><strong>${escapeHtml(item.label)}</strong><p>${escapeHtml(item.note)}</p>`;
      target.append(card);
    });
  }

  function deltaLabel(row) {
    if (row.frontierDelta > 0.08) return `late +${Math.round(row.frontierDelta * 100)} pts`;
    if (row.frontierDelta < -0.08) return `early +${Math.round(Math.abs(row.frontierDelta) * 100)} pts`;
    return "stable over windows";
  }

  function renderList(context) {
    const target = document.getElementById("crossref-list");
    if (!target) return;

    target.innerHTML = "";

    if (!context.primaryArticles.length) {
      target.innerHTML = `<article class="explorer-card"><h4>No primary articles in this slice</h4><p>Try widening the corpus window or changing the lens so the primary concept has material to crossreference against.</p></article>`;
      return;
    }

    if (!context.rows.length) {
      target.innerHTML = `<article class="explorer-card"><h4>No nonzero overlaps</h4><p>The current workspace produces no matching crossreferences. That may itself be a blind spot worth noting, but try broadening the scope to confirm it.</p></article>`;
      return;
    }

    const maxObserved = Math.max(...context.rows.map((row) => row.observed), 1);
    context.rows.forEach((row) => {
      const wrapper = document.createElement("div");
      wrapper.className = `crossref-row${context.active?.id === row.id ? " is-active" : ""}`;
      const button = document.createElement("button");
      button.type = "button";
      button.innerHTML = `
        <div class="crossref-row__meta">
          <strong>${escapeHtml(row.label)}</strong>
          <span>${formatNumber(row.observed)} articles</span>
        </div>
        <div class="crossref-row__bar">
          <div class="crossref-row__fill" style="width:${(row.observed / maxObserved) * 100}%"></div>
        </div>
        <div class="crossref-row__stats">
          <span>${formatPercent(row.primaryShare)} of primary</span>
          <span>lift ${row.lift.toFixed(2)}×</span>
          <span>${deltaLabel(row)}</span>
        </div>
      `;
      button.addEventListener("click", () => {
        state.secondaryId = row.id;
        renderAll();
      });
      wrapper.append(button);
      target.append(wrapper);
    });
  }

  function rowNarrative(row) {
    if (!row || row.observed === 0) {
      return "There are no articles carrying both concepts in the current slice. That absence can still matter, but it needs contextual reading rather than numeric overinterpretation.";
    }
    const liftLine =
      row.lift >= 1.35
        ? `The pairing is tighter than independence would predict.`
        : row.lift <= 0.85
          ? `The pairing is looser than the separate frequencies would suggest.`
          : `The pairing is present at roughly the level its separate frequencies would predict.`;
    const timeLine =
      row.frontierDelta > 0.08
        ? `It becomes more strongly linked in the later corpus window.`
        : row.frontierDelta < -0.08
          ? `It is more characteristic of the earlier corpus window.`
          : `Its linkage stays comparatively stable across the early and late windows.`;
    return `${liftLine} ${timeLine}`;
  }

  function renderDetail(context) {
    const target = document.getElementById("crossref-detail");
    if (!target) return;
    const row = context.active;
    const primaryLabel = lookupAnyLabel(state.primaryId);
    const lensLabel = state.lensFamily && state.lensId ? lookupAnyLabel(state.lensId) : "";

    if (!row) {
      target.innerHTML = `<h3>No active lead</h3><p>Choose a crossreference row to inspect it in detail.</p>`;
      return;
    }

    const topArticles = row.articles.slice(0, 5);

    target.innerHTML = `
      <h3>${escapeHtml(primaryLabel)} × ${escapeHtml(row.label)}</h3>
      <p>${escapeHtml(rowNarrative(row))}</p>
      <div class="crossref-detail-grid">
        <div class="crossref-metric"><span class="value">${formatNumber(row.observed)}</span><strong>Matched articles</strong></div>
        <div class="crossref-metric"><span class="value">${formatPercent(row.primaryShare)}</span><strong>Share of primary slice</strong></div>
        <div class="crossref-metric"><span class="value">${row.lift.toFixed(2)}×</span><strong>Observed / expected</strong></div>
        <div class="crossref-metric"><span class="value">${formatNumber(row.avgCitation)}</span><strong>Average PDF citations</strong></div>
      </div>
      <div class="detail-tags">
        <span class="tag">${escapeHtml(primaryLabel)}</span>
        <span class="tag">${escapeHtml(row.label)}</span>
        ${lensLabel ? `<span class="tag">${escapeHtml(lensLabel)}</span>` : ""}
      </div>
      <div class="codebook-block">
        <h4>Representative articles</h4>
        <ul class="codebook-list">
          ${
            topArticles.length
              ? topArticles.map((article) => `<li><strong>${article.year}</strong> ${escapeHtml(article.title)}</li>`).join("")
              : "<li>No articles in this slice.</li>"
          }
        </ul>
      </div>
    `;

    const actions = document.createElement("div");
    actions.className = "evidence-actions";

    if (state.secondaryId) {
      const reset = document.createElement("button");
      reset.type = "button";
      reset.className = "ghost-button";
      reset.textContent = "Return to ranked mode";
      reset.addEventListener("click", () => {
        state.secondaryId = "";
        renderAll();
      });
      actions.append(reset);
    }

    target.append(actions);
  }

  function renderPairComparison(pairContext) {
    const note = document.getElementById("pair-note");
    const stats = document.getElementById("pair-stats");
    const chart = document.getElementById("pair-decade-chart");
    const detail = document.getElementById("pair-detail");
    if (!note || !stats || !chart || !detail) return;

    const lensText =
      state.lensFamily && state.lensId ? ` and lens-filtered by ${lookupAnyLabel(state.lensId)}` : "";
    note.textContent = `${formatNumber(pairContext.baseArticles.length)} articles are in scope for both pairs. Pair A and Pair B are evaluated under the same corpus window${lensText}.`;

    const cards = [
      {
        title: "Larger overlap",
        value: pairWinnerLabel(pairContext, "observed", (value) => `${formatNumber(value)} articles`),
        note: `A ${formatNumber(pairContext.a.observed)} · B ${formatNumber(pairContext.b.observed)}`,
      },
      {
        title: "Tighter coupling",
        value: pairWinnerLabel(pairContext, "lift", (value) => `${value.toFixed(2)}x`),
        note: `A ${pairContext.a.lift.toFixed(2)}x · B ${pairContext.b.lift.toFixed(2)}x`,
      },
      {
        title: "Stronger later signal",
        value: pairWinnerLabel(pairContext, "frontierDelta", (value) => `${Math.round(value * 100)} pts`),
        note: `A ${Math.round(pairContext.a.frontierDelta * 100)} pts · B ${Math.round(pairContext.b.frontierDelta * 100)} pts`,
      },
      {
        title: "Higher citation density",
        value: pairWinnerLabel(pairContext, "avgCitation", (value) => `${formatNumber(value)}`),
        note: `A ${formatNumber(pairContext.a.avgCitation)} · B ${formatNumber(pairContext.b.avgCitation)}`,
      },
    ];

    stats.innerHTML = "";
    cards.forEach((item) => {
      const card = document.createElement("article");
      card.className = "crossref-stat";
      card.innerHTML = `<span class="value">${escapeHtml(item.value)}</span><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.note)}</p>`;
      stats.append(card);
    });

    const maxShare = Math.max(
      ...pairContext.a.decadeCounts.map((item) => item.shareWithinScope),
      ...pairContext.b.decadeCounts.map((item) => item.shareWithinScope),
      0.01,
    );
    chart.innerHTML = "";
    allDecades.forEach((decade) => {
      const aRow = pairContext.a.decadeCounts.find((item) => item.decade === decade) || { count: 0, shareWithinScope: 0 };
      const bRow = pairContext.b.decadeCounts.find((item) => item.decade === decade) || { count: 0, shareWithinScope: 0 };
      const node = document.createElement("div");
      node.className = "pair-decade-row";
      node.innerHTML = `
        <div class="pair-decade-meta">
          <strong>${escapeHtml(decade)}</strong>
          <span>A ${formatPercent(aRow.shareWithinScope)} · B ${formatPercent(bRow.shareWithinScope)}</span>
        </div>
        <div class="pair-decade-bars">
          <div class="pair-decade-lane"><span class="pair-decade-fill pair-a" style="width:${(aRow.shareWithinScope / maxShare) * 100}%"></span></div>
          <div class="pair-decade-lane"><span class="pair-decade-fill pair-b" style="width:${(bRow.shareWithinScope / maxShare) * 100}%"></span></div>
        </div>
      `;
      chart.append(node);
    });

    const topA = pairContext.a.articles.slice(0, 4);
    const topB = pairContext.b.articles.slice(0, 4);
    detail.innerHTML = `
      <h3>${escapeHtml(pairContext.a.label)} vs ${escapeHtml(pairContext.b.label)}</h3>
      <p>${escapeHtml(pairDifferenceNarrative(pairContext))}</p>
      <div class="pair-legend">
        <span class="pair-chip pair-chip-a">Pair A</span>
        <span>${escapeHtml(pairContext.a.label)}</span>
        <span class="pair-chip pair-chip-b">Pair B</span>
        <span>${escapeHtml(pairContext.b.label)}</span>
      </div>
      <div class="codebook-block">
        <h4>Representative articles for Pair A</h4>
        <ul class="codebook-list">
          ${topA.length ? topA.map((article) => `<li><strong>${article.year}</strong> ${escapeHtml(article.title)}</li>`).join("") : "<li>No articles in scope.</li>"}
        </ul>
      </div>
      <div class="codebook-block">
        <h4>Representative articles for Pair B</h4>
        <ul class="codebook-list">
          ${topB.length ? topB.map((article) => `<li><strong>${article.year}</strong> ${escapeHtml(article.title)}</li>`).join("") : "<li>No articles in scope.</li>"}
        </ul>
      </div>
    `;
  }

  function renderResearchNote(context, pairContext) {
    const mode = document.getElementById("research-note-mode");
    const status = document.getElementById("research-note-status");
    const output = document.getElementById("research-note-output");
    const copyButton = document.getElementById("research-note-copy");
    const downloadButton = document.getElementById("research-note-download");
    const copyCitationsButton = document.getElementById("research-note-copy-citations");
    if (!mode || !status || !output || !copyButton || !downloadButton || !copyCitationsButton) return;

    const noteData = state.researchNoteMode === "pair" ? buildPairNote(pairContext) : buildLeadNote(context);
    mode.value = state.researchNoteMode;
    output.textContent = noteData.text;
    status.textContent =
      state.researchNoteMode === "pair"
        ? "The note is built from the current pair comparison and keeps the same scope, lens, and metric frame."
        : "The note is built from the active ranked lead and includes the supporting articles and quotes now in view.";

    copyButton.onclick = async () => {
      const success = await copyTextToClipboard(noteData.text);
      status.textContent = success ? "Research note copied to the clipboard." : "Clipboard copy failed in this browser; use the note preview to copy manually.";
    };

    downloadButton.onclick = () => {
      downloadTextFile(noteData.text, noteData.filename);
      status.textContent = `Downloaded ${noteData.filename}.`;
    };

    copyCitationsButton.onclick = async () => {
      const success = await copyTextToClipboard(noteData.citations || "");
      status.textContent = success ? "Citation list copied to the clipboard." : "Clipboard copy failed for the citation list.";
    };
  }

  function pickLead(rows, mode, used = new Set()) {
    return [...rows]
      .sort((left, right) => scoreForRow(right, mode) - scoreForRow(left, mode) || right.observed - left.observed)
      .find((row) => !used.has(row.id));
  }

  function leadCardBody(row, kind) {
    if (!row) return "";
    if (kind === "strength") {
      return `${row.label} is the largest overlap in the current workspace with ${formatNumber(row.observed)} articles, or ${formatPercent(row.primaryShare)} of the primary slice.`;
    }
    if (kind === "association") {
      return `${row.label} appears ${row.lift.toFixed(2)}× more often than independence would predict in this slice, which makes it the tightest coupling here.`;
    }
    if (kind === "frontier") {
      return `${row.label} shifts from ${formatPercent(row.earlyShare)} to ${formatPercent(row.lateShare)} between the early and late windows within the primary slice.`;
    }
    if (kind === "cited") {
      return `${row.label} is the most citation-dense lead here, averaging ${formatNumber(row.avgCitation)} PDF-derived citing articles across ${formatNumber(row.observed)} matches.`;
    }
    return `${row.label} is not a mass pattern, but it stays worth attention because it combines only ${formatNumber(row.observed)} articles with lift ${row.lift.toFixed(2)}× and ${formatPercent(row.recentShare)} of its evidence in the later corpus.`;
  }

  function renderLeadCards(context) {
    const target = document.getElementById("crossref-leads");
    if (!target) return;
    target.innerHTML = "";

    if (!context.rows.length) {
      target.innerHTML = `<article class="thread-card"><h3>No leads available</h3><p>Change the current workspace to give the lab enough material to rank promising crossreferences.</p></article>`;
      return;
    }

    const used = new Set();
    const leads = [
      { kind: "strength", title: "Largest overlap in this workspace" },
      { kind: "association", title: "Tightest coupling" },
      { kind: "frontier", title: "Later-emerging lead" },
      { kind: "cited", title: "Citation-dense lead" },
      { kind: "hidden", title: "Rare but meaningful edge case" },
    ]
      .map((item) => {
        const row = pickLead(context.rows, item.kind, used);
        if (row) used.add(row.id);
        return row ? { ...item, row } : null;
      })
      .filter(Boolean);

    leads.forEach((item) => {
      const card = document.createElement("article");
      card.className = "thread-card";
      card.innerHTML = `<h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(leadCardBody(item.row, item.kind))}</p>`;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ghost-button question-button";
      button.textContent = "Activate this lead";
      button.addEventListener("click", () => {
        state.secondaryId = item.row.id;
        renderAll();
      });
      card.append(button);
      target.append(card);
    });
  }

  function renderDecadeChart(context) {
    const note = document.getElementById("crossref-decade-note");
    const target = document.getElementById("crossref-decade-chart");
    if (!target || !note) return;

    const row = context.active;
    if (!row) {
      note.textContent = "Choose a lead to see how it distributes across decades.";
      target.innerHTML = "";
      return;
    }

    note.textContent = "Each row shows how many articles in that decade carry both concepts, alongside the share of the primary slice in that decade.";
    target.innerHTML = "";
    const maxCount = Math.max(...row.decadeCounts.map((item) => item.count), 1);

    row.decadeCounts.forEach((item) => {
      const node = document.createElement("div");
      node.className = "crossref-decade-row";
      node.innerHTML = `
        <div class="crossref-decade-meta">
          <strong>${escapeHtml(item.decade)}</strong>
          <span>${formatNumber(item.count)} articles · ${formatPercent(item.shareWithinPrimary)}</span>
        </div>
        <div class="crossref-decade-track">
          <div class="crossref-decade-fill" style="width:${(item.count / maxCount) * 100}%"></div>
        </div>
      `;
      target.append(node);
    });
  }

  function renderRationale(context) {
    const target = document.getElementById("crossref-rationale");
    if (!target) return;
    const row = context.active;
    target.innerHTML = "";

    if (!row) {
      return;
    }

    const cards = [
      {
        title: "Coupling strength",
        body: row.lift >= 1.35
          ? `This pairing is stronger than the separate frequencies would imply, which makes it a good candidate for close reading.`
          : `This is a real overlap, but it behaves more like a broad field tendency than a tightly coupled niche.`,
      },
      {
        title: "Temporal signal",
        body:
          row.frontierDelta > 0.08
            ? `The linkage strengthens in the later corpus, so it may signal a newer conceptual turn rather than a long-standing constant.`
            : row.frontierDelta < -0.08
              ? `The linkage is stronger in the earlier corpus, so it may point to a discourse that has receded or been rearticulated.`
              : `The linkage remains relatively stable across the early and late windows, which makes it a good structural rather than merely recent finding.`,
      },
      {
        title: "What to verify next",
        body: row.observed <= 3
          ? `Because the evidence set is small, the next step is to read every matched article and test whether the shared code really names the same idea each time.`
          : `The next step is to compare the highest-cited and most recent matched articles to see whether the pairing keeps the same meaning over time.`,
      },
    ];

    cards.forEach((item) => {
      const card = document.createElement("article");
      card.className = "thread-card";
      card.innerHTML = `<h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.body)}</p>`;
      target.append(card);
    });
  }

  function renderEvidence(context) {
    const target = document.getElementById("crossref-results");
    if (!target) return;
    const row = context.active;
    target.innerHTML = "";

    if (!row) {
      return;
    }

    if (!row.articles.length) {
      target.innerHTML = `<article class="explorer-card"><h4>No articles in the current slice</h4><p>There are no articles carrying both the primary concept and the active crossreference inside the current scope.</p></article>`;
      return;
    }

    const concepts = selectedConcepts(row);
    const reasons = [lookupAnyLabel(state.primaryId), row.label, state.lensId ? lookupAnyLabel(state.lensId) : null].filter(Boolean);

    row.articles.slice(0, 12).forEach((article) => {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = articleCardMarkup(article, concepts, reasons);
      target.append(wrapper.firstElementChild);
    });
  }

  function renderAll() {
    renderControls();
    const context = computeRows();
    const pairContext = computePairContext(context);
    metricCards(context);
    renderList(context);
    renderDetail(context);
    renderPairComparison(pairContext);
    renderResearchNote(context, pairContext);
    renderLeadCards(context);
    renderDecadeChart(context);
    renderRationale(context);
    renderEvidence(context);
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
      { threshold: 0.14 },
    );
    nodes.forEach((node) => observer.observe(node));
  }

  heroStats();
  renderAll();
  revealOnScroll();
})();
