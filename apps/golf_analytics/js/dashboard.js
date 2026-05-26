/**
 * Golf Analytics — interactive dashboard (D3 + vanilla JS).
 * Data: data/processed/nine_hole_rounds.csv (9-hole segments from GolfPad).
 * Assumes each row is a complete front or back nine; 18-hole view merges pairs by round_key.
 */
(function () {
  const CSV_URL = "data/processed/nine_hole_rounds.csv";
  const HOLES_CSV_URL = "data/processed/hole_scores.csv";
  const HANDICAP_CSV_URL = "data/processed/rounds_for_handicap.csv";
  const CHART_W = 900;

  const COLORS = {
    text: "#202623",
    muted: "#5c6b63",
    border: "#ddd8ce",
    slate: "#4a6a82",
    green: "#3d6b5a",
    rose: "#9a5c52",
    line: "#3d6b5a",
    lineMuted: "#8a9e94",
    roll5: "#4a6a82",
    roll10: "#8a8478",
    dot: "#6b7f75",
    dotHover: "#3d6b5a",
    dotSelected: "#4a6a82",
    subtleHighlight: "rgba(154, 92, 82, 0.08)",
  };

  /** Kellogg Championship front 2026-05-24 — subtle tooltip/table note only. */
  const KELLOGG_NOTABLE = {
    dateKey: "2026-05-24",
    course: "Howard D. Kellogg Golf Course - Championship Course",
    side: "front",
    score: 51,
  };

  const state = {
    allRows: [],
    holeRows: [],
    handicapRows: [],
    controls: {
      xMode: "equal",
      metric: "score",
      rolling: "off",
      holeFormat: "nine",
      courseFilter: "all",
    },
    tableShowAll: false,
    selectedKey: null,
  };

  function shortCourse(name) {
    if (name.includes("Kellogg") && name.includes("Championship")) return "Kellogg Championship";
    if (name.includes("Kellogg") && name.includes("Executive")) return "Kellogg Executive";
    if (name.startsWith("Madison")) return "Madison";
    if (name.startsWith("Newman")) return "Newman";
    if (name.startsWith("Quail")) return "Quail Meadows";
    if (name.includes("Orange Beach")) return "Orange Beach";
    if (name.includes("Isle Dauphine")) return "Isle Dauphine";
    return name.length > 28 ? name.slice(0, 26) + "…" : name;
  }

  function courseBucket(course) {
    const s = shortCourse(course);
    if (s === "Newman") return "newman";
    if (s === "Kellogg Championship") return "kellogg";
    if (s === "Madison") return "madison";
    if (s === "Quail Meadows") return "quail";
    return "other";
  }

  function rowKey(d) {
    return `${d.dateKey}|${d.course}|${d.side}|${d.score}`;
  }

  function segmentKey(d) {
    return `${d.round_key}|${d.side}`;
  }

  const HEATMAP_LABEL_FONT = 8;
  const HEATMAP_CELL_FONT = 8;
  const HEATMAP_FOREST = "#1a3d32";

  /** Double-bogey emphasis scale (strokes vs par, one hole). */
  function vsParColor(v) {
    if (v == null || !Number.isFinite(v)) return "transparent";
    if (v <= -1) return "#1a3d32";
    if (v === 0) return "#3d6b5a";
    if (v === 1) return "#7a9f8e";
    if (v === 2) return "#ffffff";
    if (v === 3) return "#f0d6d2";
    if (v === 4) return "#9a5c52";
    return "#6f3d34";
  }

  function vsParEmphasisStroke(v) {
    if (v === 2 || v === 3) return COLORS.border;
    return "none";
  }

  function vsParTextColor(v) {
    if (v === 2) return HEATMAP_FOREST;
    if (v === 3) return COLORS.text;
    if (v != null && v >= 4) return "#fff";
    return "#f7f5f0";
  }

  /** Compact labels for heatmap y-axis only. */
  function shortCourseHeatmap(name) {
    if (name.includes("Kellogg") && name.includes("Championship")) return "Kellog";
    if (name.includes("Kellogg") && name.includes("Executive")) return "Kellog Exec";
    if (name.startsWith("Madison")) return "Madison";
    if (name.startsWith("Newman")) return "Newman";
    if (name.startsWith("Quail")) return "Quail";
    if (name.includes("Orange Beach")) return "Orange Bch";
    if (name.includes("Isle Dauphine")) return "Isle D";
    return shortCourse(name);
  }

  function shortSideLabel(side) {
    if (side === "front") return "F";
    if (side === "back") return "B";
    if (side === "18") return "18";
    return side || "";
  }

  function heatmapRowLabel(seg) {
    return `${seg.dateKey} · ${shortCourseHeatmap(seg.course)} · ${shortSideLabel(seg.side)}`;
  }

  /** Match handicap penalties to this nine or merged 18, not every row on date+course. */
  function penaltiesForSegment(seg) {
    const candidates = state.handicapRows.filter(
      (r) => r.dateKey === seg.dateKey && r.course === seg.course
    );
    if (!candidates.length) return 0;
    if (seg.side === "18") {
      const r18 = candidates.find((r) => r.completed_holes === 18);
      return r18 ? r18.penalties : 0;
    }
    const r9 = candidates.find(
      (r) => r.completed_holes === 9 && r.gross_score === seg.score
    );
    return r9 ? r9.penalties : 0;
  }

  function filteredPenaltyRounds() {
    const f = state.controls.courseFilter;
    return state.handicapRows.filter((r) => {
      if (r.completed_holes < 9 || !Number.isFinite(r.gross_score)) return false;
      if (f === "all") return true;
      return courseBucket(r.course) === f;
    });
  }

  function isKelloggNotable(d) {
    return (
      d.dateKey === KELLOGG_NOTABLE.dateKey &&
      d.course === KELLOGG_NOTABLE.course &&
      d.side === KELLOGG_NOTABLE.side &&
      d.score === KELLOGG_NOTABLE.score
    );
  }

  function compareRounds(a, b) {
    if (a.score !== b.score) return a.score - b.score;
    return a.score_vs_par - b.score_vs_par;
  }

  function metricValue(d) {
    return state.controls.metric === "score_vs_par" ? d.score_vs_par : d.score;
  }

  /** Merge front+back when both exist for same round_key (completed 18). */
  function buildEighteenHoleRows(rows) {
    const byKey = d3.group(rows, (d) => d.round_key);
    const out = [];
    byKey.forEach((segs) => {
      const front = segs.find((s) => s.side === "front");
      const back = segs.find((s) => s.side === "back");
      if (!front || !back) return;
      // Only merge when export recorded a full 18-hole round (both nines present).
      if (front.completed_holes_in_round !== 18) return;
      out.push({
        dateKey: front.dateKey,
        date: front.date,
        course: front.course,
        side: "18",
        tee: front.tee,
        score: front.score + back.score,
        par: front.par + back.par,
        score_vs_par: front.score_vs_par + back.score_vs_par,
        completed_holes_in_round: 18,
        round_key: front.round_key,
        format: "18",
      });
    });
    return out.sort((a, b) => a.date - b.date || compareRounds(a, b));
  }

  function baseRows() {
    return state.controls.holeFormat === "eighteen"
      ? buildEighteenHoleRows(state.allRows)
      : state.allRows;
  }

  function applyCourseFilter(rows) {
    const f = state.controls.courseFilter;
    if (f === "all") return rows;
    return rows.filter((d) => courseBucket(d.course) === f);
  }

  function filteredRows() {
    return applyCourseFilter(baseRows());
  }

  function chronological(rows) {
    return [...rows].sort((a, b) => a.date - b.date || compareRounds(a, b));
  }

  function rollingAverage(values, window) {
    return values.map((_, i) => {
      const start = Math.max(0, i - window + 1);
      const slice = values.slice(start, i + 1);
      return d3.mean(slice);
    });
  }

  function attachRollups(rows) {
    const sorted = chronological(rows);
    const metrics = sorted.map(metricValue);
    sorted.forEach((d, i) => {
      d._idx = i;
      d._metric = metrics[i];
    });
    if (state.controls.rolling === "5") {
      const r5 = rollingAverage(metrics, 5);
      sorted.forEach((d, i) => {
        d._roll5 = r5[i];
      });
    }
    if (state.controls.rolling === "10") {
      const r10 = rollingAverage(metrics, 10);
      sorted.forEach((d, i) => {
        d._roll10 = r10[i];
      });
    }
    return sorted;
  }

  function bestScoreKeys(rows) {
    if (!rows.length) return new Set();
    const min = d3.min(rows, (d) => d.score);
    return new Set(
      rows.filter((d) => d.score === min).map(rowKey)
    );
  }

  function axisStyles(sel) {
    sel.selectAll("text").attr("fill", COLORS.muted);
    sel.selectAll("line, path").attr("stroke", COLORS.border);
  }

  function clearChart(sel) {
    sel.selectAll("svg").remove();
    sel.selectAll(".chart-empty").remove();
  }

  function showTip(el, html, event) {
    const wrap = el.closest(".chart-wrap");
    if (!wrap) return;
    const tip = wrap.querySelector(".chart-tooltip");
    if (!tip) return;
    tip.classList.add("visible");
    tip.innerHTML = html;
    const rect = wrap.getBoundingClientRect();
    tip.style.left = `${event.clientX - rect.left + 12}px`;
    tip.style.top = `${event.clientY - rect.top - 8}px`;
  }

  function hideTip(el) {
    const wrap = el.closest(".chart-wrap");
    const tip = wrap?.querySelector(".chart-tooltip");
    tip?.classList.remove("visible");
  }

  function tooltipHtml(d, extras) {
    const vs = d.score_vs_par > 0 ? `+${d.score_vs_par}` : d.score_vs_par;
    const note = isKelloggNotable(d)
      ? "<br><span class='tip-note'>Kellogg Championship · front nine · 51 (2026-05-24)</span>"
      : "";
    const best = extras?.personalBest ? "<br><em>Personal best (lowest score)</em>" : "";
    return `<strong>${d.dateKey}</strong><br>${shortCourse(d.course)} · ${d.side || "—"}<br>Score ${d.score} · par ${d.par} · ${vs} vs par${note}${best}`;
  }

  function courseTooltipHtml(d) {
    const vs = d.score_vs_par > 0 ? `+${d.score_vs_par}` : d.score_vs_par;
    const extra =
      state.controls.metric === "score_vs_par"
        ? `<br><span class="tip-note">${vs} vs par · ${shortCourse(d.course)}</span>`
        : `<br><span class="tip-note">${shortCourse(d.course)} · ${d.side || "—"}</span>`;
    return `<strong>${d.dateKey}</strong><br>Score <strong>${d.score}</strong>${extra}`;
  }

  function handicapSummaryIndex() {
    const eligible = state.handicapRows.filter(
      (r) =>
        r.completed_holes === 18 &&
        Number.isFinite(r.score_differential) &&
        (r.differential_type === "whs_18" || r.differential_type === "estimate_over_par")
    );
    const whsOnly = eligible.filter((r) => r.differential_type === "whs_18");
    const calc = computeHandicapIndex(eligible);
    const calcWhs = whsOnly.length >= 3 ? computeHandicapIndex(whsOnly) : null;
    if (calcWhs) return { value: calcWhs.index, detail: "WHS · rating + slope" };
    if (calc) return { value: calc.index, detail: "Estimate · unrated 18s" };
    return { value: "—", detail: "Need 3+ eligible 18-hole rounds" };
  }

  function renderSummary() {
    const all = [...state.allRows].sort(compareRounds);
    const best = all[0];
    const eighteen = state.handicapRows
      .filter((r) => r.completed_holes === 18 && Number.isFinite(r.gross_score))
      .sort((a, b) => a.gross_score - b.gross_score);
    const best18 = eighteen[0];
    const hcp = handicapSummaryIndex();

    const el = document.getElementById("summary-cards");
    el.innerHTML = `
      <article class="summary-card">
        <h3>Best overall 9-hole</h3>
        <p class="summary-value">${best.score}</p>
        <p class="summary-detail">${best.dateKey} · ${shortCourse(best.course)} · ${best.side}</p>
      </article>
      <article class="summary-card">
        <h3>Best overall 18</h3>
        <p class="summary-value">${best18 ? best18.gross_score : "—"}</p>
        <p class="summary-detail">${best18 ? `${best18.dateKey} · ${shortCourse(best18.course)}` : "No 18-hole rounds"}</p>
      </article>
      <article class="summary-card">
        <h3>Handicap</h3>
        <p class="summary-value">${hcp.value}</p>
        <p class="summary-detail">${hcp.detail}</p>
      </article>
      <article class="summary-card">
        <h3>Rounds analyzed</h3>
        <p class="summary-value">${filteredRows().length}</p>
        <p class="summary-detail">${state.allRows.length} nine-hole segments · filter applied</p>
      </article>
    `;
  }

  function applyCourseDotStyle(selection, d) {
    const selected = rowKey(d) === state.selectedKey;
    selection
      .attr("r", selected ? 6 : 4)
      .attr("fill", selected ? COLORS.green : COLORS.dot)
      .attr("fill-opacity", selected ? 1 : 0.5)
      .attr("stroke", selected ? COLORS.slate : "#fff")
      .attr("stroke-width", selected ? 2 : 1);
  }

  function renderTimeline() {
    const container = d3.select("#chart-timeline");
    clearChart(container);
    const rows = attachRollups(filteredRows());
    if (!rows.length) {
      container.append("p").attr("class", "chart-empty").text("No rounds for current filters.");
      return;
    }

    const height = 320;
    const margin = { top: 18, right: 24, bottom: 40, left: 48 };
    const innerW = CHART_W - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;
    const metric = state.controls.metric;
    const vals = rows.map((d) => d._metric);
    const yPad = metric === "score" ? 4 : 2;

    const svg = container
      .append("svg")
      .attr("viewBox", `0 0 ${CHART_W} ${height}`);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x =
      state.controls.xMode === "date"
        ? d3.scaleTime().domain(d3.extent(rows, (d) => d.date)).range([0, innerW])
        : d3
            .scaleLinear()
            .domain([0, Math.max(0, rows.length - 1)])
            .range([0, innerW]);

    const xPos = (d) =>
      state.controls.xMode === "date" ? x(d.date) : x(d._idx);

    const y = d3
      .scaleLinear()
      .domain([d3.min(vals) - yPad, d3.max(vals) + yPad])
      .range([innerH, 0]);

    const line = d3
      .line()
      .x(xPos)
      .y((d) => y(d._metric));

    g.append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(
        state.controls.xMode === "date"
          ? d3.axisBottom(x).ticks(7).tickFormat(d3.timeFormat("%b %Y")).tickSizeOuter(0)
          : d3.axisBottom(x).ticks(Math.min(8, rows.length)).tickFormat((i) => {
              const r = rows[Math.round(i)];
              return r ? d3.timeFormat("%m/%d")(r.date) : "";
            }).tickSizeOuter(0)
      )
      .call(axisStyles);

    g.append("g")
      .call(d3.axisLeft(y).ticks(6).tickSizeOuter(0))
      .call(axisStyles);

    g.append("path")
      .datum(rows)
      .attr("fill", "none")
      .attr("stroke", COLORS.line)
      .attr("stroke-width", 1.75)
      .attr("opacity", 0.85)
      .attr("d", line);

    const drawRoll = (key, color, dash) => {
      if (rows[0][key] == null) return;
      g.append("path")
        .datum(rows)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 1.25)
        .attr("stroke-dasharray", dash || null)
        .attr("opacity", 0.7)
        .attr(
          "d",
          d3
            .line()
            .defined((d) => d[key] != null)
            .x(xPos)
            .y((d) => y(d[key]))
        );
    };
    drawRoll("_roll5", COLORS.roll5, "4,3");
    drawRoll("_roll10", COLORS.roll10, "2,2");

    const personalBest = bestScoreKeys(rows);

    const dots = g
      .selectAll("circle")
      .data(rows)
      .join("circle")
      .attr("cx", xPos)
      .attr("cy", (d) => y(d._metric))
      .attr("r", (d) => (rowKey(d) === state.selectedKey ? 5 : 3))
      .attr("fill", (d) =>
        rowKey(d) === state.selectedKey ? COLORS.dotSelected : COLORS.dot
      )
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .attr("opacity", 0.9)
      .style("cursor", "pointer")
      .on("mouseenter", function (event, d) {
        d3.select(this).attr("r", 5).attr("fill", COLORS.dotHover);
        showTip(
          this,
          tooltipHtml(d, { personalBest: personalBest.has(rowKey(d)) }),
          event
        );
      })
      .on("mousemove", function (event, d) {
        showTip(
          this,
          tooltipHtml(d, { personalBest: personalBest.has(rowKey(d)) }),
          event
        );
      })
      .on("mouseleave", function (event, d) {
        const sel = rowKey(d) === state.selectedKey;
        d3.select(this)
          .attr("r", sel ? 5 : 3)
          .attr("fill", sel ? COLORS.dotSelected : COLORS.dot);
        hideTip(this);
      })
      .on("click", (_, d) => {
        const k = rowKey(d);
        state.selectedKey = state.selectedKey === k ? null : k;
        renderTimeline();
        renderHeatmap();
      });

    const yLabel =
      metric === "score" ? "Gross score (9-hole)" : "Score vs par (9-hole)";
    svg
      .append("text")
      .attr("x", margin.left)
      .attr("y", 14)
      .attr("fill", COLORS.muted)
      .attr("font-size", 11)
      .text(yLabel);
  }

  function renderCourseDistribution() {
    const container = d3.select("#chart-courses");
    clearChart(container);
    const rows = filteredRows();
    if (!rows.length) {
      container.append("p").attr("class", "chart-empty").text("No rounds for current filters.");
      return;
    }

    const metric = state.controls.metric;
    const courses = d3
      .groups(rows, (d) => shortCourse(d.course))
      .map(([name, vals]) => ({
        name,
        vals,
        median: d3.median(vals, (d) => (metric === "score" ? d.score : d.score_vs_par)),
      }))
      .sort((a, b) => d3.ascending(a.median, b.median));

    const height = Math.max(240, courses.length * 40 + 56);
    const margin = { top: 16, right: 16, bottom: 36, left: 152 };
    const innerW = CHART_W - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const svg = container.append("svg").attr("viewBox", `0 0 ${CHART_W} ${height}`);
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const y = d3
      .scaleBand()
      .domain(courses.map((c) => c.name))
      .range([0, innerH])
      .padding(0.3);

    const allVals = rows.map((d) => (metric === "score" ? d.score : d.score_vs_par));
    const x = d3
      .scaleLinear()
      .domain([d3.min(allVals) - (metric === "score" ? 3 : 2), d3.max(allVals) + (metric === "score" ? 3 : 2)])
      .range([0, innerW])
      .nice();

    g.append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(x).ticks(8).tickSizeOuter(0))
      .call(axisStyles);

    g.append("g")
      .call(d3.axisLeft(y).tickSizeOuter(0))
      .call((sel) => sel.selectAll("text").attr("fill", COLORS.text).attr("font-size", 11))
      .call((sel) => sel.selectAll("line, path").attr("stroke", COLORS.border));

    const jitter = d3.scalePoint().domain(d3.range(12)).range([-11, 11]);
    const points = [];
    courses.forEach((c) => {
      c.vals.forEach((d, i) => {
        points.push({
          ...d,
          courseName: c.name,
          jitter: jitter(i % 12),
          val: metric === "score" ? d.score : d.score_vs_par,
        });
      });
    });

    const dots = g
      .selectAll("circle")
      .data(points)
      .join("circle")
      .attr("cx", (d) => x(d.val) + d.jitter)
      .attr("cy", (d) => y(d.courseName) + y.bandwidth() / 2)
      .style("cursor", "pointer");

    dots.each(function (d) {
      applyCourseDotStyle(d3.select(this), d);
    });

    dots
      .on("mouseenter", function (event, d) {
        d3.select(this)
          .attr("r", 6)
          .attr("fill", COLORS.green)
          .attr("fill-opacity", 1)
          .attr("stroke", COLORS.slate)
          .attr("stroke-width", 2);
        showTip(this, courseTooltipHtml(d), event);
      })
      .on("mousemove", function (event, d) {
        showTip(this, courseTooltipHtml(d), event);
      })
      .on("mouseleave", function (event, d) {
        applyCourseDotStyle(d3.select(this), d);
        hideTip(this);
      })
      .on("click", (_, d) => {
        const k = rowKey(d);
        state.selectedKey = state.selectedKey === k ? null : k;
        renderCourseDistribution();
        renderTimeline();
        renderHeatmap();
      });

    svg
      .append("text")
      .attr("x", margin.left)
      .attr("y", height - 6)
      .attr("fill", COLORS.muted)
      .attr("font-size", 11)
      .text(metric === "score" ? "Gross score" : "Score vs par");
  }

  function renderTable() {
    const wrap = document.getElementById("table-rounds");
    const sorted = [...filteredRows()].sort(compareRounds);
    const display = state.tableShowAll ? sorted : sorted.slice(0, 10);

    wrap.innerHTML = "";
    const toolbar = document.createElement("div");
    toolbar.className = "table-toolbar";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-text";
    btn.textContent = state.tableShowAll
      ? "Show top 10 only"
      : `Show all rounds (${sorted.length})`;
    btn.addEventListener("click", () => {
      state.tableShowAll = !state.tableShowAll;
      renderTable();
    });
    toolbar.appendChild(btn);
    wrap.appendChild(toolbar);

    const table = d3.select(wrap).append("table").attr("class", "rank-table");
    const thead = table.append("thead").append("tr");
    ["Rank", "Date", "Course", "Side", "Score", "Par", "vs par"].forEach((h) =>
      thead.append("th").text(h)
    );
    const tbody = table.append("tbody");
    const tr = tbody
      .selectAll("tr")
      .data(display)
      .join("tr")
      .attr("class", (d) => (isKelloggNotable(d) ? "row-notable" : null));

    tr.append("td").attr("class", "col-rank").text((_, i) => i + 1);
    tr.append("td").text((d) => d.dateKey);
    tr.append("td").text((d) => shortCourse(d.course));
    tr.append("td").text((d) => d.side || "—");
    tr.append("td").attr("class", "col-score").text((d) => d.score);
    tr.append("td").text((d) => d.par);
    tr.append("td").text((d) =>
      d.score_vs_par > 0 ? `+${d.score_vs_par}` : d.score_vs_par
    );
  }

  function holeNumbersForSegment(seg) {
    if (state.controls.holeFormat === "eighteen") return d3.range(1, 19);
    return seg.side === "back" ? d3.range(10, 19) : d3.range(1, 10);
  }

  function renderHeatmap() {
    const container = d3.select("#chart-heatmap");
    clearChart(container);
    const legendEl = document.getElementById("heatmap-legend");
    if (legendEl) legendEl.innerHTML = "";

    if (!state.holeRows.length) {
      container
        .append("p")
        .attr("class", "chart-empty")
        .text(
          "No hole-level data. Run scripts/build_nine_hole_rounds.py to generate data/processed/hole_scores.csv."
        );
      return;
    }

    const segments = chronological(filteredRows());
    if (!segments.length) {
      container.append("p").attr("class", "chart-empty").text("No rounds for current filters.");
      return;
    }

    function holesForSegment(seg, nums) {
      const numSet = new Set(nums);
      return state.holeRows.filter(
        (h) => h.round_key === seg.round_key && numSet.has(h.hole_number)
      );
    }

    const expectedCount = (nums) => nums.length;

    const matrix = segments
      .map((seg) => {
        const nums = holeNumbersForSegment(seg);
        const cells = holesForSegment(seg, nums);
        const byHole = new Map(cells.map((c) => [c.hole_number, c]));
        const values = nums.map((hn) => byHole.get(hn) || null);
        const pen = penaltiesForSegment(seg);
        return {
          seg,
          rowId: segmentKey(seg),
          penalties: pen,
          label: heatmapRowLabel(seg),
          nums,
          values,
        };
      })
      .filter((row) => {
        const filled = row.values.filter(Boolean).length;
        return filled >= expectedCount(row.nums);
      });

    if (!matrix.length) {
      container.append("p").attr("class", "chart-empty").text("No complete rounds for current filters.");
      return;
    }

    const hasFront = matrix.some((r) => r.seg.side === "front");
    const hasBack = matrix.some((r) => r.seg.side === "back");
    // Front nines use holes 1–9, back nines use 10–18 — shared x by hole number breaks back rows.
    const useSlotIndex = hasFront && hasBack;
    const slotCount = matrix[0].nums.length;
    const cell = 16;
    const margin = { top: 8, right: 8, bottom: useSlotIndex ? 40 : 28, left: 152 };
    const innerW = slotCount * cell;
    const innerH = matrix.length * cell;
    const width = margin.left + innerW + margin.right;
    const height = margin.top + innerH + margin.bottom + 8;

    const svg = container
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMinYMin meet");
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const xDomain = useSlotIndex
      ? d3.range(slotCount).map(String)
      : matrix[0].nums.map(String);
    const x = d3.scaleBand().domain(xDomain).range([0, innerW]).padding(0.06);
    const xPos = (i, hn) => (useSlotIndex ? x(String(i)) : x(String(hn)));

    const y = d3
      .scaleBand()
      .domain(matrix.map((m) => m.rowId))
      .range([0, innerH])
      .padding(0.06);
    const yPos = (row) => y(row.rowId);

    const xAxis = g
      .append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(
        d3
          .axisBottom(x)
          .tickFormat((d) => {
            if (useSlotIndex) return String(+d + 1);
            return d;
          })
          .tickSizeOuter(0)
      );
    xAxis
      .selectAll("text")
      .attr("fill", COLORS.muted)
      .attr("font-size", HEATMAP_LABEL_FONT);
    xAxis.selectAll("line, path").attr("stroke", COLORS.border);

    if (useSlotIndex) {
      svg
        .append("text")
        .attr("x", margin.left)
        .attr("y", height - 4)
        .attr("fill", COLORS.muted)
        .attr("font-size", HEATMAP_LABEL_FONT)
        .text("Columns 1–9 · front = holes 1–9, back = holes 10–18");
    }

    g.append("g")
      .call(
        d3
          .axisLeft(y)
          .tickFormat((id) => matrix.find((m) => m.rowId === id)?.label || id)
          .tickSizeOuter(0)
      )
      .call((sel) =>
        sel
          .selectAll("text")
          .attr("fill", COLORS.text)
          .attr("font-size", HEATMAP_LABEL_FONT)
      )
      .call((sel) => sel.selectAll("line, path").attr("stroke", COLORS.border));

    const rowGroups = g.selectAll("g.hm-row").data(matrix).join("g").attr("class", "hm-row");

    rowGroups.each(function (row) {
      const rg = d3.select(this);
      const isNotable = isKelloggNotable(row.seg);
      const isSel = rowKey(row.seg) === state.selectedKey;

      row.nums.forEach((hn, i) => {
        const cellData = row.values[i];
        if (!cellData) return;
        const vs = cellData.score_vs_par;
        const bw = x.bandwidth();

        rg.append("rect")
          .attr("x", xPos(i, hn))
          .attr("y", yPos(row))
          .attr("width", bw)
          .attr("height", y.bandwidth())
          .attr("fill", vsParColor(vs))
          .attr("stroke", vsParEmphasisStroke(vs))
          .attr("stroke-width", vs === 2 || vs === 3 ? 1 : 0)
          .attr("rx", 2)
          .style("cursor", "pointer")
          .on("mouseenter", function (event) {
            const penNote =
              row.penalties > 0
                ? `<br>${row.penalties} pen. (round)`
                : "";
            showTip(
              this,
              `<strong>Hole ${hn}</strong> · ${row.label}<br>${cellData.strokes} strokes (${vs > 0 ? "+" : ""}${vs} vs par)${penNote}`,
              event
            );
          })
          .on("mousemove", function (event) {
            const penNote =
              row.penalties > 0
                ? `<br>${row.penalties} pen. (round)`
                : "";
            showTip(
              this,
              `<strong>Hole ${hn}</strong> · ${row.label}<br>${cellData.strokes} strokes (${vs > 0 ? "+" : ""}${vs} vs par)${penNote}`,
              event
            );
          })
          .on("mouseleave", function () {
            hideTip(this);
          });
      });

      if (isNotable || isSel) {
        rg.insert("rect", ":first-child")
          .attr("x", -4)
          .attr("y", yPos(row))
          .attr("width", innerW + 4)
          .attr("height", y.bandwidth())
          .attr("fill", "none")
          .attr("stroke", isSel ? COLORS.dotSelected : COLORS.muted)
          .attr("stroke-width", isSel ? 1.5 : 1)
          .attr("stroke-dasharray", isNotable && !isSel ? "3,2" : null)
          .attr("opacity", 0.85);
      }
    });

    if (legendEl) {
      const items = [
        ["≤−1", "#1a3d32", ""],
        ["0", "#3d6b5a", ""],
        ["+1", "#7a9f8e", ""],
        ["+2", "#ffffff", "border:1px solid #ddd8ce"],
        ["+3", "#f0d6d2", ""],
        ["+4", "#9a5c52", ""],
        ["+5+", "#6f3d34", ""],
      ];
      legendEl.innerHTML =
        "<span class='legend-title'>Score vs par</span>" +
        items
          .map(
            ([lab, col, extra]) =>
              `<span class="legend-swatch"><i style="background:${col};${extra}"></i>${lab}</span>`
          )
          .join("") +
        "<span class='legend-note'>Incomplete nines hidden · hover for penalties (Penalties view)</span>";
    }
  }

  /**
   * USGA WHS (20 scores): average of lowest N Score Differentials (+ adjustment when N < 20).
   * Not "best 5" — at 20 scores it is best 8. See USGA Rule 5.2.
   */
  function whsLowestRule(scoreCount) {
    const n = Math.min(20, scoreCount);
    if (n < 3) return null;
    let use = 8;
    let adj = 0;
    if (n <= 5) use = 1;
    else if (n <= 6) use = 2;
    else if (n <= 8) use = 2;
    else if (n <= 11) use = 3;
    else if (n <= 14) use = 4;
    else if (n <= 16) use = 5;
    else if (n <= 18) use = 6;
    else if (n === 19) use = 7;
    if (n === 3) adj = -2.0;
    else if (n === 4) adj = -1.0;
    else if (n === 6) adj = -1.0;
    return { use, adj, pool: n };
  }

  function computeHandicapIndex(eligible) {
    const recent = [...eligible]
      .sort((a, b) => b.date - a.date)
      .slice(0, 20);
    const rule = whsLowestRule(recent.length);
    if (!rule) return null;

    const sorted = [...recent].sort(
      (a, b) => a.score_differential - b.score_differential
    );
    const used = sorted.slice(0, rule.use);
    const avg =
      used.reduce((s, r) => s + r.score_differential, 0) / used.length + rule.adj;
    const index = Math.round(avg * 10) / 10;

    return { index, rule, recent, used };
  }

  function renderHandicap() {
    const root = document.getElementById("handicap-panel");
    if (!root) return;

    const eligible = state.handicapRows.filter(
      (r) =>
        r.completed_holes === 18 &&
        Number.isFinite(r.score_differential) &&
        (r.differential_type === "whs_18" || r.differential_type === "estimate_over_par")
    );
    const whsOnly = eligible.filter((r) => r.differential_type === "whs_18");
    const nineCount = state.handicapRows.filter((r) => r.differential_type === "nine_hole").length;
    const calc = computeHandicapIndex(eligible);
    const calcWhs = whsOnly.length >= 3 ? computeHandicapIndex(whsOnly) : null;

    const indexDisplay = calcWhs
      ? { value: calcWhs.index, label: "WHS differential (rating + slope)" }
      : calc
        ? { value: calc.index, label: "Estimate (gross over par when unrated)" }
        : { value: "—", label: "Need 3+ eligible 18-hole scores" };

    root.innerHTML = `
      <div class="handicap-grid">
        <article class="handicap-card handicap-card-primary">
          <h3>Handicap index (estimate)</h3>
          <p class="handicap-value">${indexDisplay.value}</p>
          <p class="handicap-detail">${indexDisplay.label}</p>
        </article>
        <article class="handicap-card">
          <h3>WHS rule</h3>
          <p class="handicap-detail">Average of the <strong>lowest ${calc ? calc.rule.use : "—"}</strong> Score Differentials from your last <strong>${calc ? calc.rule.pool : 0}</strong> eligible 18-hole rounds (max 20). At 20 scores: <strong>best 8</strong>, not best 5.</p>
        </article>
        <article class="handicap-card">
          <h3>Eligible rounds</h3>
          <p class="handicap-value">${eligible.length}</p>
          <p class="handicap-detail">${whsOnly.length} with course rating + slope · ${nineCount} nine-hole (not in index yet)</p>
        </article>
      </div>
      <p class="handicap-formula">Score Differential (18-hole) = (113 ÷ Slope) × (Gross − Course Rating). PCC and 9-hole expected-score rules not applied yet.</p>
      <div class="future-boxes">
        <div class="future-box"><strong>Slope &amp; rating</strong><span>Per-tee values from GolfPad — used when present in export</span></div>
      </div>
      <div class="chart-wrap" id="chart-handicap"></div>
      <div id="handicap-used-table"></div>
    `;

    if (!calc) return;

    renderHandicapChart(calc);
    renderHandicapUsedTable(calc);
  }

  function renderHandicapUsedTable(calc) {
    const wrap = document.getElementById("handicap-used-table");
    if (!wrap) return;
    const roundId = (r) => `${r.dateKey}|${r.course}|${r.gross_score}`;
    const usedKeys = new Set(calc.used.map(roundId));
    const rows = calc.recent.map((r) => ({
      ...r,
      inIndex: usedKeys.has(roundId(r)),
    }));

    const table = d3.select(wrap).append("table").attr("class", "rank-table handicap-table");
    table.append("thead").append("tr").selectAll("th").data(
      ["", "Date", "Course", "Gross", "Diff", "Type"]
    ).join("th").text((d) => d);
    const tr = table.append("tbody").selectAll("tr").data(rows).join("tr")
      .attr("class", (d) => (d.inIndex ? "row-used" : null));
    tr.append("td").text((d) => (d.inIndex ? "✓" : ""));
    tr.append("td").text((d) => d.dateKey);
    tr.append("td").text((d) => shortCourse(d.course));
    tr.append("td").text((d) => d.gross_score);
    tr.append("td").text((d) => d.score_differential.toFixed(1));
    tr.append("td").text((d) =>
      d.differential_type === "whs_18" ? "WHS" : "Est."
    );
  }

  function renderHandicapChart(calc) {
    const container = d3.select("#chart-handicap");
    clearChart(container);
    const roundId = (r) => `${r.dateKey}|${r.course}|${r.gross_score}`;
    const usedKeys = new Set(calc.used.map(roundId));

    const data = [...calc.recent].sort((a, b) => a.date - b.date);
    const height = 200;
    const margin = { top: 12, right: 12, bottom: 36, left: 36 };
    const innerW = CHART_W - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const svg = container.append("svg").attr("viewBox", `0 0 ${CHART_W} ${height}`);
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.dateKey))
      .range([0, innerW])
      .padding(0.2);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.score_differential) + 2])
      .range([innerH, 0]);

    g.append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(x).tickSizeOuter(0))
      .call((sel) =>
        sel.selectAll("text").attr("fill", COLORS.muted).attr("font-size", 9)
          .attr("transform", "rotate(-35)").attr("text-anchor", "end").attr("dx", "-0.2em")
      )
      .call((sel) => sel.selectAll("line, path").attr("stroke", COLORS.border));

    g.append("g")
      .call(d3.axisLeft(y).ticks(5).tickSizeOuter(0))
      .call(axisStyles);

    g.selectAll("rect.hc-bar")
      .data(data)
      .join("rect")
      .attr("class", "hc-bar")
      .attr("x", (d) => x(d.dateKey))
      .attr("y", (d) => y(d.score_differential))
      .attr("width", x.bandwidth())
      .attr("height", (d) => innerH - y(d.score_differential))
      .attr("fill", (d) =>
        usedKeys.has(roundId(d)) ? COLORS.green : COLORS.lineMuted
      )
      .attr("opacity", (d) =>
        usedKeys.has(roundId(d)) ? 0.85 : 0.45
      )
      .attr("rx", 2)
      .append("title")
      .text(
        (d) =>
          `${d.dateKey} · ${shortCourse(d.course)}\nDiff ${d.score_differential}`
      );

    svg
      .append("text")
      .attr("x", margin.left)
      .attr("y", 10)
      .attr("fill", COLORS.muted)
      .attr("font-size", 10)
      .text("Score differential — darker bars used in index");
  }

  function renderPenalties() {
    const root = document.getElementById("penalties-panel");
    if (!root) return;

    const rows = filteredPenaltyRounds();
    const withPen = rows.filter((r) => r.penalties > 0);
    const totalPen = d3.sum(rows, (r) => r.penalties);

    root.innerHTML = `
      <div class="handicap-grid penalties-summary">
        <article class="handicap-card">
          <h3>Rounds tracked</h3>
          <p class="handicap-value">${rows.length}</p>
          <p class="handicap-detail">From GolfPad rounds export · respects course filter</p>
        </article>
        <article class="handicap-card">
          <h3>With penalties</h3>
          <p class="handicap-value">${withPen.length}</p>
          <p class="handicap-detail">${rows.length ? Math.round((100 * withPen.length) / rows.length) : 0}% of rounds</p>
        </article>
        <article class="handicap-card">
          <h3>Total penalty strokes</h3>
          <p class="handicap-value">${totalPen}</p>
          <p class="handicap-detail">Sum across filtered rounds</p>
        </article>
      </div>
      <p class="handicap-formula">Per-hole penalty breakdown not in export — penalty totals appear in heatmap tooltips when a round matches.</p>
      <div class="chart-wrap" id="chart-penalties">
        <div class="chart-tooltip"></div>
      </div>
    `;

    const container = d3.select("#chart-penalties");
    if (!rows.length) {
      container.append("p").attr("class", "chart-empty").text("No rounds for current filters.");
      return;
    }

    const height = 280;
    const margin = { top: 14, right: 16, bottom: 40, left: 44 };
    const innerW = CHART_W - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const svg = container.append("svg").attr("viewBox", `0 0 ${CHART_W} ${height}`);
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleLinear()
      .domain([-0.5, d3.max(rows, (d) => d.penalties) + 1])
      .range([0, innerW])
      .nice();

    const y = d3
      .scaleLinear()
      .domain([
        d3.min(rows, (d) => d.gross_score) - 4,
        d3.max(rows, (d) => d.gross_score) + 4,
      ])
      .range([innerH, 0])
      .nice();

    const jitter = d3.scalePoint().domain(d3.range(8)).range([-6, 6]);

    g.append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat(d3.format("d")).tickSizeOuter(0))
      .call(axisStyles);

    g.append("g")
      .call(d3.axisLeft(y).ticks(6).tickSizeOuter(0))
      .call(axisStyles);

    const points = rows.map((d, i) => ({
      ...d,
      jx: jitter(i % 8),
    }));

    const dots = g
      .selectAll("circle")
      .data(points)
      .join("circle")
      .attr("cx", (d) => x(d.penalties) + d.jx)
      .attr("cy", (d) => y(d.gross_score))
      .style("cursor", "pointer");

    dots.each(function (d) {
      const sel = rowKeyFromHandicap(d) === state.selectedKey;
      d3.select(this)
        .attr("r", sel ? 6 : d.penalties > 0 ? 5 : 4)
        .attr("fill", d.penalties > 0 ? COLORS.rose : COLORS.dot)
        .attr("fill-opacity", sel || d.penalties > 0 ? 0.85 : 0.45)
        .attr("stroke", sel ? COLORS.slate : "#fff")
        .attr("stroke-width", sel ? 2 : 1);
    });

    dots
      .on("mouseenter", function (event, d) {
        d3.select(this)
          .attr("r", 6)
          .attr("fill", d.penalties > 0 ? COLORS.rose : COLORS.green)
          .attr("fill-opacity", 1)
          .attr("stroke", COLORS.slate)
          .attr("stroke-width", 2);
        const vs =
          d.gross_over_par != null
            ? d.gross_over_par > 0
              ? `+${d.gross_over_par}`
              : d.gross_over_par
            : "—";
        showTip(
          this,
          `<strong>${d.dateKey}</strong><br>${shortCourse(d.course)}<br>Score <strong>${d.gross_score}</strong> (${vs} vs par)<br>Penalties <strong>${d.penalties}</strong>`,
          event
        );
      })
      .on("mousemove", function (event, d) {
        const vs =
          d.gross_over_par != null
            ? d.gross_over_par > 0
              ? `+${d.gross_over_par}`
              : d.gross_over_par
            : "—";
        showTip(
          this,
          `<strong>${d.dateKey}</strong><br>${shortCourse(d.course)}<br>Score <strong>${d.gross_score}</strong> (${vs} vs par)<br>Penalties <strong>${d.penalties}</strong>`,
          event
        );
      })
      .on("mouseleave", function (event, d) {
        const sel = rowKeyFromHandicap(d) === state.selectedKey;
        d3.select(this)
          .attr("r", sel ? 6 : d.penalties > 0 ? 5 : 4)
          .attr("fill", d.penalties > 0 ? COLORS.rose : COLORS.dot)
          .attr("fill-opacity", sel || d.penalties > 0 ? 0.85 : 0.45)
          .attr("stroke", sel ? COLORS.slate : "#fff")
          .attr("stroke-width", sel ? 2 : 1);
        hideTip(this);
      })
      .on("click", (_, d) => {
        const k = rowKeyFromHandicap(d);
        state.selectedKey = state.selectedKey === k ? null : k;
        renderPenalties();
        renderCourseDistribution();
        renderTimeline();
        renderHeatmap();
      });

    svg
      .append("text")
      .attr("x", margin.left + innerW / 2)
      .attr("y", height - 8)
      .attr("text-anchor", "middle")
      .attr("fill", COLORS.muted)
      .attr("font-size", 10)
      .text("Penalty strokes (round total)");

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(margin.top + innerH / 2))
      .attr("y", 12)
      .attr("text-anchor", "middle")
      .attr("fill", COLORS.muted)
      .attr("font-size", 10)
      .text("Gross score");
  }

  function rowKeyFromHandicap(r) {
    return `${r.dateKey}|${r.course}|${r.gross_score}`;
  }

  function renderAll() {
    renderSummary();
    renderTimeline();
    renderCourseDistribution();
    renderTable();
    renderHeatmap();
    renderHandicap();
    renderPenalties();
  }

  function bindControls() {
    const panel = document.getElementById("controls-panel");
    panel.querySelectorAll("[data-control]").forEach((input) => {
      input.addEventListener("change", () => {
        const key = input.name;
        state.controls[key] = input.value;
        renderAll();
      });
    });
  }

  function showError(msg) {
    const el = document.getElementById("dashboard-error");
    if (el) {
      el.hidden = false;
      el.textContent = msg;
    }
  }

  function parseNineRows(raw) {
    return raw
      .map((d) => ({
        dateKey: d.date,
        date: d3.timeParse("%Y-%m-%d")(d.date),
        course: d.course,
        side: d.side || "",
        tee: d.tee || "",
        score: +d.score,
        par: +d.par,
        score_vs_par: +d.score_vs_par,
        completed_holes_in_round: +d.completed_holes_in_round,
        round_key: d.round_key,
        format: "nine",
      }))
      .filter((d) => d.date && Number.isFinite(d.score));
  }

  function parseHoleRows(raw) {
    return raw
      .map((d) => ({
        dateKey: d.date,
        course: d.course,
        round_key: d.round_key,
        side: d.side || "",
        hole_number: +d.hole_number,
        strokes: +d.strokes,
        par: +d.par,
        score_vs_par: +d.score_vs_par,
      }))
      .filter((d) => d.round_key && Number.isFinite(d.hole_number));
  }

  function parseHandicapRows(raw) {
    return raw
      .map((d) => ({
        dateKey: d.date,
        date: d3.timeParse("%Y-%m-%d")(d.date),
        course: d.course,
        tee: d.tee || "",
        completed_holes: +d.completed_holes,
        gross_score: +d.gross_score,
        gross_over_par:
          d.gross_over_par === "" ? null : +d.gross_over_par,
        rating: d.rating === "" ? null : +d.rating,
        slope: d.slope === "" ? null : +d.slope,
        penalties: +d.penalties || 0,
        score_differential:
          d.score_differential === "" ? NaN : +d.score_differential,
        differential_type: d.differential_type,
      }))
      .filter((d) => d.date);
  }

  Promise.all([
    d3.csv(CSV_URL),
    d3.csv(HOLES_CSV_URL).catch(() => []),
    d3.csv(HANDICAP_CSV_URL).catch(() => []),
  ])
    .then(([nineRaw, holeRaw, handicapRaw]) => {
      state.allRows = parseNineRows(nineRaw);
      state.holeRows = parseHoleRows(holeRaw);
      state.handicapRows = parseHandicapRows(handicapRaw);

      if (!state.allRows.length) {
        showError("No rows loaded from nine_hole_rounds.csv.");
        return;
      }

      bindControls();
      renderAll();
    })
    .catch((err) => {
      showError(
        `Could not load ${CSV_URL}. Serve over HTTP from repo root (python3 -m http.server 8080). ${err}`
      );
    });
})();
