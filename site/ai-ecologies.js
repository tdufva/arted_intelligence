(function () {
  const data = window.AI_ECOLOGIES_DATA;
  const corpus = window.CORPUS_DATA;

  if (!data) {
    return;
  }

  const familyArticleKeys = {
    definitions: "definitionFrames",
    recognition: "recognitionModes",
    locations: "locationFrames",
    types: "intelligenceTypes",
    perspectives: "perspectives",
    subjects: "subjectFrames",
  };

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

  function pdfCitationCount(article) {
    return article?.citingArticlesPdf || 0;
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

  function compareArticlesByImportance(left, right) {
    return (
      pdfCitationCount(right) - pdfCitationCount(left) ||
      (right.articleViews || 0) - (left.articleViews || 0) ||
      right.year - left.year ||
      left.title.localeCompare(right.title)
    );
  }

  function corpusArticlesFor(family, id, limit = 3) {
    if (!corpus) return [];
    const key = familyArticleKeys[family];
    if (!key) return [];
    return [...corpus.articles]
      .filter((article) => article[key]?.includes(id))
      .sort(compareArticlesByImportance)
      .slice(0, limit);
  }

  function aiPapersFor(family, id, limit = 3) {
    return [...data.arxivPapers]
      .filter((paper) => paper.codes[family]?.includes(id))
      .sort((left, right) => left.year - right.year || left.title.localeCompare(right.title))
      .slice(0, limit);
  }

  function articleReferenceMarkup(article) {
    const label = `${article.title} (${article.year})`;
    return article.doi
      ? `<a href="https://doi.org/${escapeHtml(article.doi)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`
      : escapeHtml(label);
  }

  function paperReferenceMarkup(paper) {
    return `<a href="${escapeHtml(paper.url)}" target="_blank" rel="noreferrer">${escapeHtml(`${paper.title} (${paper.year})`)}</a>`;
  }

  function referenceListMarkup(items, kind, heading) {
    if (!items?.length) {
      return `<div class="codebook-block"><h4>${escapeHtml(heading)}</h4><p class="chart-note">No references available in the current slice.</p></div>`;
    }
    const markup =
      kind === "paper"
        ? items.map((item) => `<li class="scholar-reference">${paperReferenceMarkup(item)}</li>`).join("")
        : items.map((item) => `<li class="scholar-reference">${articleReferenceMarkup(item)}</li>`).join("");
    return `
      <div class="codebook-block">
        <h4>${escapeHtml(heading)}</h4>
        <ul class="scholar-citation-list">${markup}</ul>
      </div>
    `;
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

  function renderSourceMap() {
    const target = document.getElementById("ai-source-map");
    if (!target) return;
    const cards = [
      {
        title: "Curated arXiv sample",
        meta: `${data.heroStats.arxivPaperCount} papers · ${data.heroStats.arxivYearRange[0]}–${data.heroStats.arxivYearRange[1]}`,
        body: "The outside research layer is a curated arXiv sample on intelligence in AI research, selected to cover definition, benchmarking, explanation, collectives, embodiment, social AI, and research automation.",
      },
      {
        title: "Local art-education corpus",
        meta: `${data.heroStats.artCorpusArticles} PDF articles`,
        body: "The comparison baseline is the local Studies in Art Education intelligence corpus already used on the main atlas page, rather than material fetched from outside search.",
      },
      {
        title: "Umwelt and Bridle sources",
        meta: `${data.umwelt.sources.length + data.umwelt.bridleSources.length} conceptual texts`,
        body: "Umwelt references and James Bridle texts are used as an interpretive bridge for re-reading both corpora as ecologies of intelligence rather than as a third quantitative dataset.",
      },
      {
        title: "Reference trail",
        meta: `${data.references.length} linked references`,
        body: "Every outside source used on this page is listed in the references section below, while representative corpus articles are cited directly inside the comparison abstracts.",
      },
    ];

    target.innerHTML = "";
    cards.forEach((item) => {
      const card = document.createElement("article");
      card.className = "source-card";
      card.innerHTML = `<h3>${escapeHtml(item.title)}</h3><p class="meta-line">${escapeHtml(item.meta)}</p><p>${escapeHtml(item.body)}</p>`;
      target.append(card);
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

  function renderAbstracts() {
    const target = document.getElementById("ai-abstracts");
    if (!target) return;

    const definitionPoint = data.pressurePoints.find((item) => item.family === "definitions");
    const perspectivePoint = data.pressurePoints.find((item) => item.family === "perspectives");
    const bridgePoint = [...data.pressurePoints].sort(
      (left, right) => right.sharedGround.sharedShare - left.sharedGround.sharedShare,
    )[0];

    const cards = [
      definitionPoint
        ? {
            title: "Definitional split",
            body: `The strongest definitional contrast remains between ${definitionPoint.aiDominant.label.toLowerCase()} in the AI sample and ${definitionPoint.artDominant.label.toLowerCase()} in the art-education corpus. This suggests that AI research still leans toward intelligence as a machinic relation, whereas the journal more often situates intelligence in creative, social, and interpretive educational practice.`,
            aiRefs: aiPapersFor("definitions", definitionPoint.aiDominant.id, 2),
            artRefs: corpusArticlesFor("definitions", definitionPoint.artDominant.id, 2),
          }
        : null,
      perspectivePoint
        ? {
            title: "Institutional contrast",
            body: `${perspectivePoint.aiDominant.label} dominates the AI sample, while ${perspectivePoint.artDominant.label} remains structurally central in the art-education corpus. In practice this means that intelligence in AI is often framed through technical systems and evaluation cultures, whereas in Studies in Art Education it is still most often worked through teaching, curriculum, and pedagogical formation.`,
            aiRefs: aiPapersFor("perspectives", perspectivePoint.aiDominant.id, 2),
            artRefs: corpusArticlesFor("perspectives", perspectivePoint.artDominant.id, 2),
          }
        : null,
      bridgePoint
        ? {
            title: "Shared bridge",
            body: `${bridgePoint.sharedGround.label} is one of the strongest overlaps across the two corpora. That shared ground matters because it shows the comparison is not a simple opposition between technical AI and humanistic art education; both fields still meet around recurring questions of ${bridgePoint.sharedGround.label.toLowerCase()}, even if they mobilize them differently.`,
            aiRefs: aiPapersFor(bridgePoint.family, bridgePoint.sharedGround.id, 2),
            artRefs: corpusArticlesFor(bridgePoint.family, bridgePoint.sharedGround.id, 2),
          }
        : null,
    ].filter(Boolean);

    target.innerHTML = "";
    cards.forEach((item) => {
      const card = document.createElement("article");
      card.className = "thread-card";
      card.innerHTML = `
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.body)}</p>
        ${referenceListMarkup(item.aiRefs, "paper", "Outside research references")}
        ${referenceListMarkup(item.artRefs, "article", "Art-education references")}
      `;
      target.append(card);
    });
  }

  function renderCautions() {
    const target = document.getElementById("sample-cautions");
    if (!target) return;
    const labels = ["Scope", "Platform bias", "Comparison rule"];
    target.innerHTML = "";
    data.sampleCautions.forEach((item, index) => {
      const card = document.createElement("article");
      card.className = "caution-card";
      card.innerHTML = `
        <span class="insight-kind">${escapeHtml(labels[index] || `Caution ${index + 1}`)}</span>
        <p>${escapeHtml(item)}</p>
      `;
      target.append(card);
    });
  }

  function renderClusterSummary() {
    const target = document.getElementById("cluster-summary");
    if (!target) return;
    const rows = [...data.clusters];
    const total = data.arxivPapers.length || 1;
    const maxValue = Math.max(...rows.map((item) => item.count), 1);
    target.innerHTML = "";

    rows.forEach((cluster) => {
      const share = cluster.count / total;
      const row = document.createElement("article");
      row.className = "cluster-row";
      row.innerHTML = `
        <div class="cluster-row__meta">
          <strong>${escapeHtml(cluster.label)}</strong>
          <span>${formatNumber(cluster.count)} papers · ${formatPercent(share)}</span>
        </div>
        <div class="cluster-row__bar">
          <div class="cluster-row__fill" style="width:${(cluster.count / maxValue) * 100}%"></div>
        </div>
      `;
      target.append(row);
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
      const aiMatches = aiPapersFor(activeFamily, row.id, 4);
      const artMatches = corpusArticlesFor(activeFamily, row.id, 4);
      const abstract = row.delta > 0.18
        ? `${row.label} is distinctly more characteristic of the AI sample than of the art-education corpus, which suggests that this frame operates as part of AI research's own conceptual center rather than as a marginal supplement.`
        : row.delta < -0.18
          ? `${row.label} is distinctly more characteristic of the art-education corpus than of the AI sample, which suggests that this frame remains more integral to how intelligence is discussed in educational and artistic contexts than in the selected AI research sample.`
          : `${row.label} remains legible in both corpora, but the representative sources below show that the two fields mobilize the frame for different argumentative purposes.`;
      detailTarget.innerHTML = `
        <h3>${escapeHtml(row.label)}</h3>
        <p>${escapeHtml(sentenceForDelta(row))}</p>
        <p><strong>Art education:</strong> ${formatPercent(row.artShare)} (${formatNumber(row.artCount)} articles)</p>
        <p><strong>AI sample:</strong> ${formatPercent(row.aiShare)} (${formatNumber(row.aiCount)} of ${data.arxivPapers.length} papers)</p>
        <div class="codebook-block">
          <h4>Short academic comparison</h4>
          <p>${escapeHtml(abstract)}</p>
        </div>
        ${
          aiMatches.length
            ? `<div class="codebook-block">
                <h4>Outside research references</h4>
                <ul class="scholar-citation-list">
                  ${aiMatches.map((paper) => `<li class="scholar-reference">${paperReferenceMarkup(paper)}</li>`).join("")}
                </ul>
              </div>`
            : ""
        }
        ${referenceListMarkup(artMatches, "article", "Art-education references")}
        <p class="chart-note">For article-level evidence on the art-education side, use the corpus atlas page.</p>
        <div class="evidence-actions">
          <a class="ghost-button" href="index.html#evidence-desk-section">Open corpus evidence desk</a>
        </div>
      `;
    }

    function render() {
      renderFamilyButtons();
      noteTarget.innerHTML = `${escapeHtml(data.comparison[activeFamily].note)} <strong>Bars show within-corpus shares, not raw counts.</strong>`;
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

  function renderPressurePoints() {
    const pressureTarget = document.getElementById("pressure-points");
    const sharedTarget = document.getElementById("shared-ground");
    if (!pressureTarget || !sharedTarget) return;

    pressureTarget.innerHTML = "";
    data.pressurePoints.forEach((item) => {
      const card = document.createElement("article");
      card.className = "pressure-card";
      card.innerHTML = `
        <h4>${escapeHtml(item.familyLabel)}</h4>
        <div class="pressure-split">
          <div class="pressure-block pressure-block-ai">
            <span class="insight-kind">AI-heavy</span>
            <strong>${escapeHtml(item.aiDominant.label)}</strong>
            <p>Art ${formatPercent(item.aiDominant.artShare)} · AI ${formatPercent(item.aiDominant.aiShare)}</p>
          </div>
          <div class="pressure-block pressure-block-art">
            <span class="insight-kind">Art-heavy</span>
            <strong>${escapeHtml(item.artDominant.label)}</strong>
            <p>Art ${formatPercent(item.artDominant.artShare)} · AI ${formatPercent(item.artDominant.aiShare)}</p>
          </div>
        </div>
      `;
      pressureTarget.append(card);
    });

    const bridges = [...data.pressurePoints].sort(
      (left, right) => right.sharedGround.sharedShare - left.sharedGround.sharedShare,
    );
    sharedTarget.innerHTML = "";
    bridges.forEach((item) => {
      const card = document.createElement("article");
      card.className = "bridge-card";
      card.innerHTML = `
        <h4>${escapeHtml(item.familyLabel)}</h4>
        <strong>${escapeHtml(item.sharedGround.label)}</strong>
        <p>Art ${formatPercent(item.sharedGround.artShare)} · AI ${formatPercent(item.sharedGround.aiShare)}</p>
      `;
      sharedTarget.append(card);
    });
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
      {
        title: "Visible cautions",
        list: data.sampleCautions,
      },
    ];

    target.innerHTML = "";
    methods.forEach((item) => {
      const node = document.createElement("div");
      node.className = "method-item";
      node.innerHTML = item.list
        ? `<h4>${escapeHtml(item.title)}</h4><ul class="method-listing">${item.list.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}</ul>`
        : `<h4>${escapeHtml(item.title)}</h4><p>${escapeHtml(item.body)}</p>`;
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
  renderSourceMap();
  renderTakeaways();
  renderAbstracts();
  renderCautions();
  renderClusterSummary();
  renderAxes();
  renderAtlas();
  renderComparison();
  renderPressurePoints();
  renderUmwelt();
  renderImplications();
  renderMethods();
  renderReferences();
  revealOnScroll();
})();
