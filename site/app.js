(function () {
  const corpus = window.CORPUS_DATA;
  const openAlex = window.OPENALEX_DATA;

  if (!corpus) {
    return;
  }

  const typeLookup = Object.fromEntries(corpus.intelligenceTypes.map((item) => [item.id, item]));
  const perspectiveLookup = Object.fromEntries(corpus.perspectives.map((item) => [item.id, item]));
  const openAlexByDoi = Object.fromEntries(
    Object.entries(openAlex?.citationsByDoi || {}).map(([doi, value]) => [doi.toLowerCase(), value]),
  );

  const signalLabels = {
    language: "Language and semiotics",
    teacherhood: "Teachers and professional formation",
    place: "Place and ecology",
    technology: "Technology and media",
    materiality: "Materiality",
    identity: "Identity and aspiration",
    equity: "Equity and justice",
    museum: "Museum and public learning",
    care: "Care and wellbeing",
    transfer: "Transfer",
  };

  function formatNumber(value) {
    return new Intl.NumberFormat("en-US").format(value);
  }

  function formatPercent(value) {
    return `${Math.round(value * 100)}%`;
  }

  function lookupSignalLabel(id) {
    return signalLabels[id] || id.replaceAll("_", " ");
  }

  function lookupAnyLabel(id) {
    return typeLookup[id]?.label || perspectiveLookup[id]?.label || lookupSignalLabel(id);
  }

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

  function createBarRows(container, rows, tone) {
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
        value: `${openAlex ? openAlex.matchedArticles : 0}/${corpus.summary.articleCount}`,
        label: "matched by OpenAlex",
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

  function renderTrendGroup(containerId, noteId, trendGroup) {
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
      container.append(card);
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
        const entry = document.createElement("div");
        entry.className = "mini-bar";
        entry.innerHTML = `
          <span>${typeLookup[item.id].label}</span>
          <span class="track"><span class="fill" style="width:${(item.count / typeMax) * 100}%"></span></span>
          <span class="count">${item.count}</span>
        `;
        typeBars.append(entry);
      });
      typeBlock.append(typeHeading, typeBars);

      const perspectiveBlock = document.createElement("div");
      const perspectiveHeading = document.createElement("h4");
      perspectiveHeading.textContent = "Top perspectives";
      const perspectiveBars = document.createElement("div");
      perspectiveBars.className = "mini-bars";

      row.topPerspectives.forEach((item) => {
        const entry = document.createElement("div");
        entry.className = "mini-bar";
        entry.innerHTML = `
          <span>${perspectiveLookup[item.id].label}</span>
          <span class="track"><span class="fill" style="width:${(item.count / perspectiveMax) * 100}%"></span></span>
          <span class="count">${item.count}</span>
        `;
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
      container.append(card);
    });
  }

  function renderTopCited() {
    const container = document.getElementById("top-cited");
    if (!openAlex) {
      return;
    }

    container.innerHTML = "";

    openAlex.topCited.slice(0, 10).forEach((article, index) => {
      const item = document.createElement("li");
      item.className = "citation-item";

      const rank = document.createElement("div");
      rank.className = "citation-rank";
      rank.textContent = String(index + 1).padStart(2, "0");

      const content = document.createElement("div");
      const title = document.createElement("h3");
      const link = document.createElement("a");
      link.href = `https://doi.org/${article.doi}`;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = article.title;
      title.append(link);

      const meta = document.createElement("p");
      meta.className = "citation-meta";
      meta.textContent = `${article.year} • ${article.excerpt}`;

      const tags = document.createElement("div");
      tags.className = "citation-tags";
      [...article.intelligenceTypes.slice(0, 2), ...article.perspectives.slice(0, 1)].forEach((id) => {
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
      badge.textContent = `${formatNumber(article.openAlexCitations)} citations`;

      item.append(rank, content, badge);
      container.append(item);
    });
  }

  function renderThreads() {
    const container = document.getElementById("threads");
    container.innerHTML = "";
    corpus.commonThreads.forEach((thread) => {
      const card = document.createElement("article");
      card.className = "thread-card";
      card.innerHTML = `<h3>${thread.title}</h3><p>${thread.body}</p>`;
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

  function renderSignals() {
    const container = document.getElementById("signal-bars");
    const rows = corpus.signals.map((item) => ({
      id: item.id,
      label: lookupSignalLabel(item.id),
      count: item.count,
      description: "",
    }));
    createBarRows(container, rows, "warm");
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
    );
  }

  function attachCoverageNote() {
    const target = document.getElementById("coverage-note");
    if (!target || !openAlex) {
      return;
    }
    target.textContent = `Coverage note: OpenAlex returned citation counts for ${openAlex.matchedArticles} of ${corpus.summary.articleCount} articles in the corpus on ${openAlex.snapshotDate}.`;
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
    const sort = document.getElementById("explorer-sort");
    const summary = document.getElementById("explorer-summary");
    const results = document.getElementById("explorer-results");

    const decades = [...new Set(corpus.articles.map((article) => `${article.year - (article.year % 10)}s`))].sort();
    populateSelect(decade, decades, (value) => value);
    populateSelect(type, corpus.intelligenceTypes.map((item) => item.id), lookupAnyLabel);
    populateSelect(perspective, corpus.perspectives.map((item) => item.id), lookupAnyLabel);
    populateSelect(signal, corpus.signals.map((item) => item.id), lookupAnyLabel);

    function currentDecade(article) {
      return `${article.year - (article.year % 10)}s`;
    }

    function refresh() {
      const query = search.value.trim().toLowerCase();
      let rows = corpus.articles.filter((article) => {
        if (query && !article.title.toLowerCase().includes(query)) return false;
        if (decade.value && currentDecade(article) !== decade.value) return false;
        if (type.value && !article.intelligenceTypes.includes(type.value)) return false;
        if (perspective.value && !article.perspectives.includes(perspective.value)) return false;
        if (signal.value && !article.signals.includes(signal.value)) return false;
        return true;
      });

      rows.sort((a, b) => {
        if (sort.value === "oldest") return a.year - b.year || a.title.localeCompare(b.title);
        if (sort.value === "cited") {
          const aC = openAlexByDoi[a.doi]?.citedByCount || 0;
          const bC = openAlexByDoi[b.doi]?.citedByCount || 0;
          return bC - aC || b.year - a.year;
        }
        if (sort.value === "views") {
          return (b.articleViews || 0) - (a.articleViews || 0) || b.year - a.year;
        }
        return b.year - a.year || a.title.localeCompare(b.title);
      });

      summary.textContent =
        rows.length > 24
          ? `${formatNumber(rows.length)} articles match the current filters. Showing the first 24.`
          : `${formatNumber(rows.length)} articles match the current filters.`;
      results.innerHTML = "";
      rows.slice(0, 24).forEach((article) => {
        const cited = openAlexByDoi[article.doi]?.citedByCount;
        const card = document.createElement("article");
        card.className = "explorer-card";
        card.innerHTML = `
          <div class="meta-line">${article.year}${cited ? ` · ${formatNumber(cited)} citations` : ""}</div>
          <h4>${article.title}</h4>
          <p>${article.excerpt}</p>
          <div class="detail-tags">
            ${article.intelligenceTypes.slice(0, 2).map((id) => `<span class="tag">${lookupAnyLabel(id)}</span>`).join("")}
            ${article.perspectives.slice(0, 2).map((id) => `<span class="tag">${lookupAnyLabel(id)}</span>`).join("")}
          </div>
        `;
        results.append(card);
      });
    }

    [search, decade, type, perspective, signal, sort].forEach((element) => {
      element.addEventListener("input", refresh);
      element.addEventListener("change", refresh);
    });

    refresh();
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
    createBarRows(document.getElementById("type-bars"), corpus.typeCounts, "cool");
    createBarRows(document.getElementById("perspective-bars"), corpus.perspectiveCounts, "warm");
    renderTrendGroup("type-trends", "type-trend-note", corpus.trends.types);
    renderTrendGroup("perspective-trends", "perspective-trend-note", corpus.trends.perspectives);
    renderSignalTrends();
    renderTrendHighlights();
    renderScorecards();
    renderMatrix();
    renderTimeline();
    renderBlindSpots();
    renderOrigins();
    renderRarePairs();
    renderFrontierArticles();
    renderTopCited();
    renderThreads();
    renderSignals();
    renderExplorer();
    renderMethods();
    attachCoverageNote();
    revealOnScroll();
  }

  init();
})();
