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
    metricCards(context);
    renderList(context);
    renderDetail(context);
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
