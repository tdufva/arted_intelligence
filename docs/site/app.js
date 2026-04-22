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

  const conceptCatalog = [
    ...corpus.intelligenceTypes.map((item) => ({ ...item, family: "types" })),
    ...corpus.perspectives.map((item) => ({ ...item, family: "perspectives" })),
    ...corpus.signals.map((item) => ({
      id: item.id,
      label: lookupSignalLabel(item.id),
      description: "Adjacent corpus signal.",
      family: "signals",
    })),
  ].map((item) => ({
    ...item,
    search: normalizeForSearch(`${item.label} ${item.description || ""} ${(customAliases[item.id] || []).join(" ")}`),
  }));

  function compareArticlesByImportance(a, b) {
    const aCitations = openAlexByDoi[a.doi]?.citedByCount || 0;
    const bCitations = openAlexByDoi[b.doi]?.citedByCount || 0;
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
        { articleCount: 0, articles: [], types: {}, perspectives: {}, signals: {} },
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

  function getComparisonFamilyConfig(family) {
    if (family === "perspectives") {
      return {
        bucketKey: "perspectives",
        articleKey: "perspectives",
        label: "perspectives",
        rows: corpus.perspectives.map((item) => ({
          id: item.id,
          label: item.label,
          description: item.description,
        })),
      };
    }

    if (family === "signals") {
      return {
        bucketKey: "signals",
        articleKey: "signals",
        label: "signals",
        rows: corpus.signals.map((item) => ({
          id: item.id,
          label: lookupSignalLabel(item.id),
          description: "Adjacent motif in the corpus.",
        })),
      };
    }

    return {
      bucketKey: "types",
      articleKey: "intelligenceTypes",
      label: "intelligence types",
      rows: corpus.intelligenceTypes.map((item) => ({
        id: item.id,
        label: item.label,
        description: item.description,
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
        },
        {
          title: `${leftDecade} leans harder into ${strongestLeft.label}`,
          body: `${strongestLeft.label} drops from ${formatPercent(strongestLeft.leftShare)} to ${formatPercent(strongestLeft.rightShare)}, making it more characteristic of the earlier decade.`,
        },
        {
          title: `${shared.label} stays central in both decades`,
          body: `Its minimum share across the two sides remains high, which makes it a bridge rather than a swing variable.`,
        },
      ];

      if (newOnRight) {
        cards.push({
          title: `${newOnRight.label} is newly visible on the right`,
          body: `It is absent in ${leftDecade} but present in ${formatPercent(newOnRight.rightShare)} of ${rightDecade} articles in this comparison.`,
        });
      }

      takeaways.innerHTML = "";
      cards.forEach((item) => {
        const card = document.createElement("article");
        card.className = "thread-card";
        card.innerHTML = `<h3>${item.title}</h3><p>${item.body}</p>`;
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

  function renderAskCorpus() {
    const input = document.getElementById("ask-input");
    const submit = document.getElementById("ask-submit");
    const suggestions = document.getElementById("ask-suggestions");
    const output = document.getElementById("ask-output");

    if (!input || !submit || !suggestions || !output) {
      return;
    }

    const prompts = [
      "How is disability discussed over time?",
      "Which articles connect AI and intelligence?",
      "What are the biggest blind spots in the corpus?",
      "How does the 1960s compare with the 2020s?",
      "Which themes are rising fastest?",
    ];

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

    function getMatchedArticles(query, concepts, decades) {
      const normalized = normalizeForSearch(query);
      const tokens = tokenize(query);
      return corpus.articles
        .map((article) => {
          let score = 0;
          const haystack = normalizeForSearch(
            `${article.title} ${article.excerpt} ${article.intelligenceTypes.join(" ")} ${article.perspectives.join(" ")} ${article.signals.join(" ")} ${article.year} ${currentDecade(article)}`,
          );
          tokens.forEach((token) => {
            if (haystack.includes(token)) score += 1;
            if (normalizeForSearch(article.title).includes(token)) score += 2;
          });
          concepts.forEach((concept) => {
            if (
              article.intelligenceTypes.includes(concept.id) ||
              article.perspectives.includes(concept.id) ||
              article.signals.includes(concept.id)
            ) {
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

    function buildTrendAnswer(concepts, decades) {
      if (!concepts.length) {
        return {
          title: "Strongest overall shifts",
          summary:
            "The broadest shift is from developmental and measurement-heavy framings toward more social, technological, and justice-oriented readings of intelligence.",
          bullets: corpus.trends.highlights.map((item) => item.title),
          evidence: openAlex.topCited.slice(0, 3),
        };
      }

      const bullets = concepts.slice(0, 3).map((concept) => {
        const source =
          corpus.trends.types.rows.find((row) => row.id === concept.id) ||
          corpus.trends.perspectives.rows.find((row) => row.id === concept.id) ||
          corpus.trends.signals.rows.find((row) => row.id === concept.id);
        if (!source) return `${concept.label} appears in the corpus, but the trend summary is weak.`;
        return `${concept.label}: ${formatPercent(source.earlyShare)} → ${formatPercent(source.lateShare)} (${source.direction}).`;
      });

      return {
        title: "Trend answer",
        summary:
          decades.length >= 2
            ? `The question points to change over time, so the answer draws on decade-level shifts and the selected decades ${decades.join(" and ")}.`
            : "The question points to change over time, so the answer draws on the corpus-wide trend windows.",
        bullets,
        evidence: concepts
          .flatMap((concept) => {
            const source =
              corpus.trends.types.rows.find((row) => row.id === concept.id) ||
              corpus.trends.perspectives.rows.find((row) => row.id === concept.id);
            return source?.examples?.late || [];
          })
          .slice(0, 4),
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
        evidence: [],
      };
    }

    function buildCitationAnswer(matchedArticles) {
      const rows = matchedArticles.length
        ? [...matchedArticles]
            .sort((a, b) => (openAlexByDoi[b.doi]?.citedByCount || 0) - (openAlexByDoi[a.doi]?.citedByCount || 0))
            .slice(0, 5)
        : openAlex.topCited.slice(0, 5);
      return {
        title: "Most cited relevant articles",
        summary: matchedArticles.length
          ? "These are the highest-cited matches for your question in the current OpenAlex snapshot."
          : "These are the most cited articles in the corpus-wide OpenAlex snapshot.",
        bullets: rows.map((article) => `${article.title} (${article.year}) · ${formatNumber(openAlexByDoi[article.doi]?.citedByCount || article.openAlexCitations || 0)} citations`),
        evidence: rows,
      };
    }

    function buildOriginAnswer(concepts) {
      const pools = [...corpus.origins.types, ...corpus.origins.perspectives, ...corpus.origins.signals];
      const rows = concepts.length
        ? pools.filter((row) => concepts.some((concept) => concept.id === row.id))
        : pools.slice(0, 6);
      return {
        title: "Origins in the corpus",
        summary: "This answer traces where a theme or lens first becomes visible in the corpus.",
        bullets: rows.slice(0, 6).map((row) => `${row.label}: ${row.firstYear}, ${row.firstTitle}`),
        evidence: rows.slice(0, 4),
      };
    }

    function buildGeneralAnswer(query, concepts, matchedArticles, decades) {
      const sample = matchedArticles.slice(0, 20);
      const typeCounts = {};
      const perspectiveCounts = {};
      const signalCounts = {};
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
      });
      const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
      const topPerspective = Object.entries(perspectiveCounts).sort((a, b) => b[1] - a[1])[0];
      const topSignal = Object.entries(signalCounts).sort((a, b) => b[1] - a[1])[0];
      return {
        title: "Best-matching answer",
        summary: matchedArticles.length
          ? `I found ${matchedArticles.length} matching articles${decades.length ? ` in or around ${decades.join(" and ")}` : ""}.`
          : `The question did not map strongly to one narrow slice, so this answer falls back to the strongest corpus-level patterns.`,
        bullets: [
          topType ? `Most common type in the match set: ${lookupAnyLabel(topType[0])} (${topType[1]} of the top matches).` : null,
          topPerspective ? `Most common perspective: ${lookupAnyLabel(topPerspective[0])} (${topPerspective[1]}).` : null,
          topSignal ? `Most recurrent adjacent signal: ${lookupAnyLabel(topSignal[0])} (${topSignal[1]}).` : null,
          concepts.length ? `Detected themes: ${concepts.map((concept) => concept.label).join(", ")}.` : null,
        ].filter(Boolean),
        evidence: matchedArticles.slice(0, 5),
      };
    }

    function renderAnswer(answer) {
      const evidenceHtml = answer.evidence?.length
        ? `
          <div class="evidence-block">
            <div class="evidence-grid">
              <div>
                <h4>Evidence</h4>
                <ul>${answer.evidence
                  .map((item) => `<li>${item.year}: ${item.title || item.firstTitle}</li>`)
                  .join("")}</ul>
              </div>
            </div>
          </div>
        `
        : "";

      output.innerHTML = `
        <article class="answer-card">
          <h3>${answer.title}</h3>
          <p>${answer.summary}</p>
          <ul class="answer-list">${answer.bullets.map((item) => `<li>${item}</li>`).join("")}</ul>
          ${evidenceHtml}
        </article>
      `;
    }

    function answer(query) {
      const normalized = normalizeForSearch(query);
      const concepts = detectConcepts(query);
      const decades = allDecades.filter((decade) => normalized.includes(decade.toLowerCase()));
      const matchedArticles = getMatchedArticles(query, concepts, decades);

      const wantsBlindSpots = /blind|gap|missing|absence|underrepresented/.test(normalized);
      const wantsCitations = /cited|influential|important|key research|most cited/.test(normalized);
      const wantsOrigins = /first|origin|start|appear|emerge/.test(normalized);
      const wantsTrend = /trend|rise|rising|declin|shift|change|over time|compare|difference|vs|versus/.test(normalized);

      if (wantsBlindSpots) {
        renderAnswer(buildBlindSpotAnswer(concepts));
        return;
      }
      if (wantsCitations) {
        renderAnswer(buildCitationAnswer(matchedArticles));
        return;
      }
      if (wantsOrigins) {
        renderAnswer(buildOriginAnswer(concepts));
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
      if (familySelect.value === "perspectives") {
        return corpus.perspectives.map((item) => ({ id: item.id, label: item.label }));
      }
      if (familySelect.value === "signals") {
        return corpus.signals.map((item) => ({ id: item.id, label: lookupSignalLabel(item.id) }));
      }
      return corpus.intelligenceTypes.map((item) => ({ id: item.id, label: item.label }));
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
            const value = profile[familySelect.value][item.id] || 0;
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

      takeaways.innerHTML = `
        <h3>Graph takeaways</h3>
        <p>${rows.length ? `${rows.length} themes are selected.` : "Choose one or more themes to graph them."}</p>
        ${
          rows.length
            ? `<ul class="answer-list">
                <li>Strongest rise: ${biggestRise.label} (${metricSelect.value === "share" ? formatPercent(biggestRise.delta) : Math.round(biggestRise.delta)} change from first to last decade).</li>
                <li>Highest peak: ${biggestPeak.label} reaches its maximum in ${
                  biggestPeak.points.slice().sort((a, b) => b.value - a.value)[0].decade
                }.</li>
                <li>Most stable: ${steadiest.label} changes least across the selected decades.</li>
              </ul>`
            : ""
        }
      `;
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
    renderComparisonStudio();
    renderMatrix();
    renderTimeline();
    renderBlindSpots();
    renderOrigins();
    renderRarePairs();
    renderFrontierArticles();
    renderTopCited();
    renderThreads();
    renderSignals();
    renderAskCorpus();
    renderGraphLab();
    renderExplorer();
    renderMethods();
    attachCoverageNote();
    revealOnScroll();
  }

  init();
})();
