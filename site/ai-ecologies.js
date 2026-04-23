(function () {
  const data = window.AI_ECOLOGIES_DATA;

  if (!data) {
    return;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function formatPercent(value) {
    return `${Math.round((value || 0) * 100)}%`;
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("en-US").format(value || 0);
  }

  function lookupLabel(family, id) {
    const row = data.comparison[family]?.rows?.find((item) => item.id === id);
    return row?.label || id.replaceAll("_", " ");
  }

  function sentenceForDelta(row, leftName = "art-education corpus", rightName = "AI sample") {
    if (row.delta > 0.18) {
      return `The ${rightName} emphasizes this much more strongly than the ${leftName}.`;
    }
    if (row.delta < -0.18) {
      return `The ${leftName} emphasizes this much more strongly than the ${rightName}.`;
    }
    return `Both corpora engage this strand, but they do so with different emphases.`;
  }

  function detailTags(family, ids) {
    return (ids || []).map((id) => `<span class="tag">${escapeHtml(lookupLabel(family, id))}</span>`).join("");
  }

  function renderHeroStats() {
    const target = document.getElementById("ai-hero-stats");
    if (!target) return;
    const stats = [
      {
        value: data.heroStats.arxivPaperCount,
        label: "curated arXiv papers",
      },
      {
        value: `${data.heroStats.arxivYearRange[0]}-${data.heroStats.arxivYearRange[1]}`,
        label: "arXiv year span",
      },
      {
        value: data.heroStats.artCorpusArticles,
        label: "art-education articles",
      },
      {
        value: data.heroStats.comparisonFamilies,
        label: "shared comparison families",
      },
    ];

    target.innerHTML = "";
    stats.forEach((item) => {
      const stat = document.createElement("div");
      stat.className = "stat";
      stat.innerHTML = `<span class="value">${escapeHtml(item.value)}</span><span class="label">${escapeHtml(item.label)}</span>`;
      target.append(stat);
    });
  }

  function renderTakeaways() {
    const target = document.getElementById("ai-takeaways");
    if (!target) return;
    target.innerHTML = "";
    data.takeaways.forEach((item) => {
      const card = document.createElement("article");
      card.className = "thread-card";
      card.innerHTML = `<h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.body)}</p>`;
      target.append(card);
    });
  }

  function renderAxes() {
    const target = document.getElementById("axis-list");
    const detail = document.getElementById("axis-detail");
    if (!target || !detail) return;

    const rows = [...data.axes];
    const maxValue = Math.max(...rows.flatMap((item) => [item.artScore, item.aiScore]), 0.01);
    const wrappers = [];

    function renderDetail(axis) {
      detail.innerHTML = `
        <h3>${escapeHtml(axis.label)}</h3>
        <p>${escapeHtml(axis.description)}</p>
        <p><strong>Art education:</strong> ${formatPercent(axis.artScore)}<br /><strong>AI sample:</strong> ${formatPercent(axis.aiScore)}</p>
        <p>${escapeHtml(
          axis.delta > 0
            ? "This composite tendency is stronger in the AI sample."
            : "This composite tendency is stronger in the art-education corpus.",
        )}</p>
      `;
    }

    target.innerHTML = "";
    rows.forEach((axis) => {
      const wrapper = document.createElement("div");
      wrapper.className = "comparison-row";
      const button = document.createElement("button");
      button.type = "button";
      button.innerHTML = `
        <div class="comparison-meta">
          <strong>${escapeHtml(axis.label)}</strong>
          <span class="comparison-values">${formatPercent(axis.artScore)} vs ${formatPercent(axis.aiScore)}</span>
        </div>
        <div class="comparison-bars">
          <div class="comparison-side left"><div class="comparison-fill left" style="width:${(axis.artScore / maxValue) * 100}%"></div></div>
          <div class="comparison-axis" aria-hidden="true"></div>
          <div class="comparison-side right"><div class="comparison-fill right" style="width:${(axis.aiScore / maxValue) * 100}%"></div></div>
        </div>
        <div class="comparison-delta">${axis.delta > 0 ? `AI +${Math.round(axis.delta * 100)} pts` : `Art +${Math.round(Math.abs(axis.delta) * 100)} pts`}</div>
      `;
      button.addEventListener("click", () => {
        wrappers.forEach((item) => item.classList.remove("is-active"));
        wrapper.classList.add("is-active");
        renderDetail(axis);
      });
      wrapper.append(button);
      target.append(wrapper);
      wrappers.push(wrapper);
    });

    if (wrappers[0]) {
      wrappers[0].classList.add("is-active");
      renderDetail(rows[0]);
    }
  }

  function renderAtlas() {
    const clusterTarget = document.getElementById("cluster-list");
    const paperTarget = document.getElementById("paper-list");
    const detail = document.getElementById("paper-detail");
    if (!clusterTarget || !paperTarget || !detail) return;

    let activeCluster = "All";
    let activePaper = data.arxivPapers[0];

    function matchingPapers() {
      return [...data.arxivPapers]
        .filter((paper) => activeCluster === "All" || paper.cluster === activeCluster)
        .sort((left, right) => left.year - right.year || left.title.localeCompare(right.title));
    }

    function renderDetail(paper) {
      detail.innerHTML = `
        <h3>${escapeHtml(paper.title)}</h3>
        <p class="meta-line">${escapeHtml(`${paper.year} · ${paper.arxivId} · ${paper.authors}`)}</p>
        <p>${escapeHtml(paper.focus)}</p>
        <p>${escapeHtml(paper.whyItMatters)}</p>
        <div class="detail-tags">
          <span class="tag">${escapeHtml(paper.cluster)}</span>
          ${detailTags("definitions", paper.codes.definitions)}
          ${detailTags("locations", paper.codes.locations)}
        </div>
        <div class="evidence-block">
          <div class="evidence-grid">
            <div>
              <h4>Types and perspectives</h4>
              <div class="detail-tags detail-tags-subtle">
                ${detailTags("types", paper.codes.types)}
                ${detailTags("perspectives", paper.codes.perspectives)}
              </div>
            </div>
            <div>
              <h4>Recognition and subjects</h4>
              <div class="detail-tags detail-tags-subtle">
                ${detailTags("recognition", paper.codes.recognition)}
                ${detailTags("subjects", paper.codes.subjects)}
              </div>
            </div>
          </div>
        </div>
        <div class="evidence-actions">
          <a class="ghost-button" href="${escapeHtml(paper.url)}" target="_blank" rel="noreferrer">Open on arXiv</a>
        </div>
      `;
    }

    function renderClusters() {
      clusterTarget.innerHTML = "";
      const allButton = document.createElement("button");
      allButton.type = "button";
      allButton.className = `toggle-button${activeCluster === "All" ? " is-active" : ""}`;
      allButton.textContent = `All strands (${data.arxivPapers.length})`;
      allButton.addEventListener("click", () => {
        activeCluster = "All";
        activePaper = matchingPapers()[0] || data.arxivPapers[0];
        renderClusters();
        renderPapers();
      });
      clusterTarget.append(allButton);

      data.clusters.forEach((cluster) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `toggle-button${activeCluster === cluster.label ? " is-active" : ""}`;
        button.textContent = `${cluster.label} (${cluster.count})`;
        button.addEventListener("click", () => {
          activeCluster = cluster.label;
          activePaper = matchingPapers()[0] || data.arxivPapers[0];
          renderClusters();
          renderPapers();
        });
        clusterTarget.append(button);
      });
    }

    function renderPapers() {
      const papers = matchingPapers();
      paperTarget.innerHTML = "";
      papers.forEach((paper) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `paper-button${paper.id === activePaper?.id ? " is-active" : ""}`;
        button.innerHTML = `
          <span class="paper-year">${escapeHtml(paper.year)}</span>
          <span class="paper-title">${escapeHtml(paper.title)}</span>
          <span class="paper-cluster">${escapeHtml(paper.cluster)}</span>
          <span class="paper-focus">${escapeHtml(paper.focus)}</span>
        `;
        button.addEventListener("click", () => {
          activePaper = paper;
          renderPapers();
          renderDetail(paper);
        });
        paperTarget.append(button);
      });
      renderDetail(activePaper || papers[0]);
    }

    renderClusters();
    renderPapers();
  }

  function renderComparison() {
    const familyTarget = document.getElementById("comparison-family");
    const noteTarget = document.getElementById("comparison-note");
    const rowsTarget = document.getElementById("comparison-rows");
    const detailTarget = document.getElementById("comparison-detail");
    if (!familyTarget || !noteTarget || !rowsTarget || !detailTarget) return;

    const familyConfig = {
      definitions: "Definition frames",
      recognition: "Recognition modes",
      locations: "Location frames",
      types: "Intelligence types",
      perspectives: "Perspectives",
      subjects: "Centered subjects",
    };

    let activeFamily = "definitions";

    function rowsForFamily() {
      return [...data.comparison[activeFamily].rows].sort(
        (left, right) => Math.max(right.artShare, right.aiShare) - Math.max(left.artShare, left.aiShare) || left.label.localeCompare(right.label),
      );
    }

    function renderFamilyButtons() {
      familyTarget.innerHTML = "";
      Object.entries(familyConfig).forEach(([family, label]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `toggle-button${family === activeFamily ? " is-active" : ""}`;
        button.textContent = label;
        button.addEventListener("click", () => {
          activeFamily = family;
          render();
        });
        familyTarget.append(button);
      });
    }

    function renderDetail(row) {
      const aiMatches = data.arxivPapers.filter((paper) => paper.codes[activeFamily].includes(row.id)).slice(0, 4);
      detailTarget.innerHTML = `
        <h3>${escapeHtml(row.label)}</h3>
        <p>${escapeHtml(sentenceForDelta(row))}</p>
        <p><strong>Art education:</strong> ${formatPercent(row.artShare)} (${formatNumber(row.artCount)} articles)</p>
        <p><strong>AI sample:</strong> ${formatPercent(row.aiShare)} (${formatNumber(row.aiCount)} of ${data.arxivPapers.length} papers)</p>
        ${
          aiMatches.length
            ? `<div class="codebook-block">
                <h4>Matched arXiv papers</h4>
                <ul class="codebook-list">
                  ${aiMatches.map((paper) => `<li><strong>${paper.year}</strong> ${escapeHtml(paper.title)}</li>`).join("")}
                </ul>
              </div>`
            : ""
        }
        <p class="chart-note">For article-level evidence on the art-education side, use the corpus atlas page.</p>
        <div class="evidence-actions">
          <a class="ghost-button" href="index.html#evidence-desk-section">Open corpus evidence desk</a>
        </div>
      `;
    }

    function render() {
      renderFamilyButtons();
      noteTarget.textContent = data.comparison[activeFamily].note;
      const rows = rowsForFamily();
      const maxValue = Math.max(...rows.flatMap((item) => [item.artShare, item.aiShare]), 0.01);
      const wrappers = [];
      rowsTarget.innerHTML = "";

      rows.forEach((row) => {
        const wrapper = document.createElement("div");
        wrapper.className = "comparison-row";
        const button = document.createElement("button");
        button.type = "button";
        button.innerHTML = `
          <div class="comparison-meta">
            <strong>${escapeHtml(row.label)}</strong>
            <span class="comparison-values">${formatPercent(row.artShare)} vs ${formatPercent(row.aiShare)}</span>
          </div>
          <div class="comparison-bars">
            <div class="comparison-side left"><div class="comparison-fill left" style="width:${(row.artShare / maxValue) * 100}%"></div></div>
            <div class="comparison-axis" aria-hidden="true"></div>
            <div class="comparison-side right"><div class="comparison-fill right" style="width:${(row.aiShare / maxValue) * 100}%"></div></div>
          </div>
          <div class="comparison-delta">${row.delta > 0 ? `AI +${Math.round(row.delta * 100)} pts` : row.delta < 0 ? `Art +${Math.round(Math.abs(row.delta) * 100)} pts` : "Aligned"}</div>
        `;
        button.addEventListener("click", () => {
          wrappers.forEach((item) => item.classList.remove("is-active"));
          wrapper.classList.add("is-active");
          renderDetail(row);
        });
        wrapper.append(button);
        rowsTarget.append(wrapper);
        wrappers.push(wrapper);
      });

      if (wrappers[0]) {
        wrappers[0].classList.add("is-active");
        renderDetail(rows[0]);
      }
    }

    render();
  }

  function renderUmwelt() {
    const note = document.getElementById("umwelt-note");
    const umweltTarget = document.getElementById("umwelt-sources");
    const bridleTarget = document.getElementById("bridle-sources");
    const movesTarget = document.getElementById("rethinking-moves");
    if (!note || !umweltTarget || !bridleTarget || !movesTarget) return;

    note.textContent = data.umwelt.note;

    umweltTarget.innerHTML = "";
    data.umwelt.sources.forEach((item) => {
      const capsule = document.createElement("article");
      capsule.className = "source-capsule";
      capsule.innerHTML = `
        <h4>${escapeHtml(item.title)}</h4>
        <p>${escapeHtml(item.summary)}</p>
        <a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">${escapeHtml(item.source)}</a>
      `;
      umweltTarget.append(capsule);
    });

    bridleTarget.innerHTML = "";
    data.umwelt.bridleSources.forEach((item) => {
      const card = document.createElement("article");
      card.className = "origin-card";
      card.innerHTML = `
        <h4>${escapeHtml(item.title)}</h4>
        <p class="meta-line">${escapeHtml(`${item.year} · ${item.source}`)}</p>
        <p>${escapeHtml(item.focus)}</p>
        <p>${escapeHtml(item.relevance)}</p>
        <div class="evidence-actions">
          <a class="ghost-button" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">Open source</a>
        </div>
      `;
      bridleTarget.append(card);
    });

    movesTarget.innerHTML = "";
    data.umwelt.moves.forEach((item) => {
      const card = document.createElement("article");
      card.className = "thread-card";
      card.innerHTML = `<h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.body)}</p>`;
      movesTarget.append(card);
    });
  }

  function renderImplications() {
    const target = document.getElementById("implication-list");
    if (!target) return;
    target.innerHTML = "";
    data.implications.forEach((item) => {
      const card = document.createElement("article");
      card.className = "thread-card";
      card.innerHTML = `<h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.body)}</p>`;
      target.append(card);
    });
  }

  function renderMethods() {
    const target = document.getElementById("external-methods");
    if (!target) return;
    const methods = [
      {
        title: "Separate outside-research page",
        body: data.sourceBoundary,
      },
      {
        title: "Curated arXiv sample",
        body: data.methodNote,
      },
      {
        title: "Comparable coding families",
        body: "The arXiv papers were manually coded into the same broad families used in the art-education atlas: definitions, recognition modes, locations, types, perspectives, and centered subjects.",
      },
      {
        title: "Local corpus as comparison baseline",
        body: "The art-education side is computed directly from the local PDF corpus dataset rather than from outside search.",
      },
      {
        title: "Interpretive bridge",
        body: "Umwelt and James Bridle are used here not as quantitative data sources, but as conceptual tools for re-reading both corpora as ecologies of cognition.",
      },
    ];

    target.innerHTML = "";
    methods.forEach((item) => {
      const node = document.createElement("div");
      node.className = "method-item";
      node.innerHTML = `<h4>${escapeHtml(item.title)}</h4><p>${escapeHtml(item.body)}</p>`;
      target.append(node);
    });
  }

  function renderReferences() {
    const target = document.getElementById("reference-list");
    if (!target) return;
    target.innerHTML = "";
    data.references.forEach((item) => {
      const li = document.createElement("li");
      li.innerHTML = `<a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">${escapeHtml(item.title)}</a> <span class="reference-kind">${escapeHtml(item.type)}</span>`;
      target.append(li);
    });
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

  renderHeroStats();
  renderTakeaways();
  renderAxes();
  renderAtlas();
  renderComparison();
  renderUmwelt();
  renderImplications();
  renderMethods();
  renderReferences();
  revealOnScroll();
})();
