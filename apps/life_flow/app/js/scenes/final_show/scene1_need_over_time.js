import { organColors, storyColors } from "../../constants/colors.js";
import { typography } from "../../constants/typography.js";
import {
  beginChartScene,
  HEADER_GRID,
  drawSource,
  applyType,
  renderPlaceholder,
  STAGE
} from "./show_helpers.js";

// ---------------------------------------------------------------------------
// Scene 1 — Need over time.
//
// Re-wires the Assignment 1 ("temporal") line-chart sequence into the final
// show. Assignment 1 was a multi-state, arrow-key driven "zoom" through volume
// tiers: All Organs -> large-volume organs -> mid -> low -> rare (VCA micro),
// with the y-axis RESCALING at each step to reveal organs that were invisible
// at the larger scale. We preserve that arc as a self-contained MINI-SEQUENCE:
// a local `step` variable drives the states, advanced with an in-scene
// "Next within Scene" button (and Back) or the arrow keys.
//
// The transitions are the point of this scene: when we zoom into a smaller
// tier the y-axis animates down, the new tier fades in, and the previous
// (now off-the-chart) tier flies up past the top edge and fades out.
//
// Assignment 1 source files reused (tiers + animation technique):
//   - js/scenes/assignment1/main_assignment_01.js   (sequence/loadScene pattern)
//   - js/scenes/assignment1/a_total.js              (total line over time)
//   - js/scenes/assignment1/a_to_b1_transition.js   (overlay + y rescale joins)
//   - js/scenes/assignment1/b1_to_b2_transition.js  (major -> minor tier)
//   - js/scenes/assignment1/b2_to_b3_transition.js  (minor -> rare/VCA tier)
//   - js/scenes/assignment1/b2_minor_organs.js      (label repel for dense tiers)
//   - js/scenes/assignment1/b3_micro_organs.js      (VCA micro view + leaders)
// ---------------------------------------------------------------------------

const DATA_PATH = "data/optn_transplants_clean.csv"; // relative -> GitHub Pages-safe
const TRANSITION_MS = 1000;

// Volume tiers, ordered as the "zoom in" sequence. `organs: null` is the total
// (All Organs) line. Edit these lists to rebalance which organ sits in a tier.
const TIERS = [
  {
    key: "all",
    organs: null,
    title: "The organ transplant system has supported more transplants in recent years.",
    subtitle: "2021 had a noticeable decrease, while accelerating rapidly after."
  },
  {
    key: "large",
    organs: ["Kidney", "Liver", "Heart", "Lung"],
    title: "Kidney, Liver, Heart, and Lung drive most volume",
    subtitle:
      "Kidney is both the most prevalent and leveled off in 2025, while liver\u00a0transplants\u00a0accelerated."
  },
  {
    key: "medium",
    organs: ["Kidney / Pancreas", "Pancreas"],
    title: "Kidney/Pancreas is the largest multi-organ combination",
    subtitle: "Pancreas alone has had a decades-long decline."
  },
  {
    key: "small",
    organs: ["Intestine", "Heart / Lung"],
    title: "Both Intestines and Heart/Lung transplants number\u00a0in\u00a0hundreds.",
    subtitle: "Heart/Lung has grown in the last decade, while intestine have leveled off."
  },
  {
    key: "micro",
    organs: [
      "VCA - uterus",
      "VCA - upper limb",
      "VCA - abdominal wall",
      "VCA - head and neck",
      "VCA - other genitourinary organ",
      "VCA - external male genitalia"
    ],
    title: "VCA (vascularized composite allograft) transplants\u00a0are\u00a0rare",
    subtitle: "Uterus is the most prevalent of the very rare VCA procedures"
  }
];

const ASSIGNMENT1_SOURCES = [
  "js/scenes/assignment1/main_assignment_01.js",
  "js/scenes/assignment1/a_total.js",
  "js/scenes/assignment1/a_to_b1_transition.js",
  "js/scenes/assignment1/b1_to_b2_transition.js",
  "js/scenes/assignment1/b2_to_b3_transition.js",
  "js/scenes/assignment1/b2_minor_organs.js",
  "js/scenes/assignment1/b3_micro_organs.js"
];

// Final-show router entry point. Signature preserved: called with no args by
// js/main.js, clears #viz itself, and never touches global scene navigation.
/** @param {{ sceneLabel?: string, sourceNote?: string }} [options] */
export function runScene1(options = {}) {
  const container = d3.select("#viz");
  container.selectAll("*").remove();

  // Capture the navigation token so a late CSV callback can detect that the
  // user already navigated away and bail (avoids painting over a newer scene
  // and wrongly registering this detail stack). See js/main.js.
  const enteredToken = window.__navToken;
  const isStale = () =>
    typeof enteredToken !== "undefined" && window.__navToken !== enteredToken;

  console.log("[Scene 1] Assignment 1 source files found/reused:", ASSIGNMENT1_SOURCES);

  d3.csv(DATA_PATH)
    .then(rows => {
      if (isStale()) return;
      rows.forEach(d => {
        d.year = +d.year;
        d.transplants = +d.transplants;
        d.to_date = +d.to_date;
        d.donor_type = d.donor_type ? d.donor_type.trim() : "";
        d.organ = d.organ ? d.organ.trim() : "";
      });

      console.log("[Scene 1] data file loaded:", DATA_PATH);
      console.log("[Scene 1] row count:", rows.length);

      buildSequence(container, rows, options);
    })
    .catch(err => {
      if (isStale()) return;
      console.error("[Scene 1] CSV load error:", err);
      renderPlaceholder(container, {
        sceneLabel: "Scene 1",
        title: "Need Over Time",
        subtitle: "Transplants over time, 1988\u20132025.",
        note: "Scene 1 will incorporate the Assignment 1 temporal transition sequence."
      });
    });
}

// Keep header copy clear of the fixed breadcrumb + compass chrome (top-right).
const HEADER_TEXT_MAX_WIDTH = 620;
const TITLE_LINE_HEIGHT = 28;
const SUBTITLE_LINE_HEIGHT = 20;

function setWrappedHeaderText(textSel, value, maxWidth, lineHeight, measureSel) {
  const x = +textSel.attr("x");
  const y = +textSel.attr("y");
  textSel.selectAll("tspan").remove();
  textSel.text(null);
  if (!value) {
    return 0;
  }

  // Regular spaces only — \u00a0 (nbsp) keeps phrases like "in hundreds" on one line.
  const words = value.split(/ +/);
  const lines = [];
  let line = "";
  measureSel.text(null);

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    measureSel.text(next);
    if (measureSel.node().getComputedTextLength() > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);

  lines.forEach((entry, index) => {
    textSel
      .append("tspan")
      .attr("x", x)
      .attr("y", y)
      .attr("dy", index === 0 ? 0 : lineHeight)
      .text(entry);
  });

  return lines.length;
}

function buildSequence(container, rows, options = {}) {
  const sceneLabel = options.sceneLabel ?? "Scene 1";
  const sourceNote =
    options.sourceNote ??
    "Source: OPTN national data, 1988\u20132025. Adapted from Assignment 01 (temporal).";
  const commaFmt = d3.format(",");

  const seriesForOrgan = organ => ({
    id: organ,
    label: organ.replace("VCA - ", ""),
    color: organColors[organ] || "#888",
    points: rows
      .filter(d => d.donor_type === "All Donor Types" && d.organ === organ && d.year <= 2025)
      .sort((a, b) => a.year - b.year)
      .map(d => ({ year: d.year, value: d.transplants }))
  });

  const totalSeries = {
    id: "All Organs",
    label: "All organs",
    color: storyColors.charcoalForest,
    points: rows
      .filter(d => d.donor_type === "All Donor Types" && d.organ === "All Organs" && d.year <= 2025)
      .sort((a, b) => a.year - b.year)
      .map(d => ({ year: d.year, value: d.transplants }))
  };

  const steps = TIERS.map(tier => {
    const series = tier.organs
      ? tier.organs
          .map(seriesForOrgan)
          .filter(s => s.points.some(p => p.value > 0))
      : [totalSeries];
    const yMax = d3.max(series, s => d3.max(s.points, p => p.value)) || 1;
    return { ...tier, series, yMax };
  });

  // ---- Stage + persistent chart scaffold (Scene 4 header band template) -------
  const { headerSvg, chartSvg: svg } = beginChartScene(container, { sceneLabel });
  drawSource(svg, sourceNote);

  const titleText = applyType(
    headerSvg.append("text")
      .attr("x", STAGE.marginX)
      .attr("y", HEADER_GRID.titleY)
      .attr("fill", storyColors.textPrimary),
    typography.mainTitle
  );
  const subtitleText = applyType(
    headerSvg.append("text")
      .attr("x", STAGE.marginX)
      .attr("y", HEADER_GRID.subtitleY)
      .attr("fill", storyColors.textSecondary),
    typography.sceneTitle
  );
  const titleMeasure = applyType(
    headerSvg.append("text").attr("visibility", "hidden").attr("x", 0).attr("y", 0),
    typography.mainTitle
  );
  const subtitleMeasure = applyType(
    headerSvg.append("text").attr("visibility", "hidden").attr("x", 0).attr("y", 0),
    typography.sceneTitle
  );

  const plot = {
    left: STAGE.contentLeft + 70,
    right: STAGE.contentRight - 150,
    top: STAGE.contentTop + 24,
    bottom: STAGE.contentBottom - 26
  };

  const x = d3.scaleLinear().domain([1988, 2025]).range([plot.left, plot.right]);
  const yScale = d3.scaleLinear().domain([0, steps[0].yMax]).nice().range([plot.bottom, plot.top]);

  // Clip the plot so tiers that fly off the top during a zoom never paint over
  // the header/axes.
  const clipId = "scene1-plot-clip";
  svg.append("defs").append("clipPath").attr("id", clipId)
    .append("rect")
    .attr("x", plot.left)
    .attr("y", STAGE.contentTop - 6)
    .attr("width", plot.right - plot.left + 150)
    .attr("height", plot.bottom - (STAGE.contentTop - 6) + 4);

  svg.append("g")
    .attr("transform", `translate(0,${plot.bottom})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")).ticks(8));

  const yAxisG = svg.append("g").attr("transform", `translate(${plot.left},0)`);

  applyType(
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(plot.top + plot.bottom) / 2)
      .attr("y", STAGE.contentLeft - 4)
      .attr("text-anchor", "middle")
      .attr("fill", storyColors.textSecondary)
      .text("Transplants per year"),
    typography.label
  );

  applyType(
    svg.append("text")
      .attr("x", (plot.left + plot.right) / 2)
      .attr("y", STAGE.contentBottom + 6)
      .attr("text-anchor", "middle")
      .attr("fill", storyColors.textSecondary)
      .text("Year"),
    typography.label
  );

  const clipped = svg.append("g").attr("clip-path", `url(#${clipId})`);
  const leaderLayer = clipped.append("g");
  const lineLayer = clipped.append("g");
  const labelLayer = clipped.append("g");
  const calloutLayer = svg.append("g").attr("class", "callout-layer");

  const makeLine = () => d3.line()
    .defined(d => Number.isFinite(d.value) && Number.isFinite(d.year) && d.value > 0)
    .x(d => x(d.year))
    .y(d => yScale(d.value));

  // Spread end-of-line labels vertically so dense tiers stay readable.
  function repelLabels(series) {
    const items = series.map(s => {
      const lp = lastDefined(s.points);
      return {
        id: s.id,
        label: s.label,
        color: s.color,
        ex: x(lp.year),
        ey: yScale(lp.value),
        ly: yScale(lp.value)
      };
    }).sort((a, b) => a.ly - b.ly);

    const minGap = 15;
    const top = plot.top + 4;
    const bottom = plot.bottom - 4;

    for (let i = 0; i < items.length; i++) {
      items[i].ly = i === 0
        ? Math.max(items[i].ly, top)
        : Math.max(items[i].ly, items[i - 1].ly + minGap);
    }
    for (let i = items.length - 1; i >= 0; i--) {
      const cap = bottom - (items.length - 1 - i) * minGap;
      items[i].ly = Math.min(items[i].ly, cap);
    }
    return items;
  }

  function renderCallouts(callouts, cfg) {
    const lookup = id => cfg.series.find(s => s.id === id);
    const boxes = (callouts || [])
      .map(c => {
        const series = lookup(c.seriesId);
        if (!series) return null;
        const pt = series.points.find(p => p.year === c.year);
        if (!pt || !Number.isFinite(pt.value)) return null;
        const anchorX = x(pt.year);
        const anchorY = yScale(pt.value);
        const boxX = anchorX + (c.offset?.x ?? 12);
        const boxY = anchorY + (c.offset?.y ?? -24);
        const textW = Math.max(72, c.text.length * 6.2);
        return { ...c, anchorX, anchorY, boxX, boxY, textW, boxH: 22 };
      })
      .filter(Boolean);

    const groups = calloutLayer.selectAll("g.chart-callout")
      .data(boxes, d => d.id)
      .join(
        enter => {
          const g = enter.append("g").attr("class", "chart-callout").attr("opacity", 0);
          g.append("line")
            .attr("class", "callout-leader")
            .attr("stroke", storyColors.weatheredBrass)
            .attr("stroke-width", 1);
          g.append("rect")
            .attr("class", "callout-box")
            .attr("rx", 3)
            .attr("fill", storyColors.museumWhite)
            .attr("stroke", storyColors.weatheredBrass)
            .attr("stroke-width", 1);
          g.append("text")
            .attr("class", "callout-text")
            .attr("fill", storyColors.textPrimary)
            .call(s => applyType(s, typography.caption));
          return g;
        },
        update => update,
        exit => exit.call(e => e.transition().duration(TRANSITION_MS / 2).attr("opacity", 0).remove())
      );

    groups.each(function (d) {
      const g = d3.select(this);
      g.select("line.callout-leader")
        .attr("x1", d.anchorX)
        .attr("y1", d.anchorY)
        .attr("x2", d.boxX + d.textW / 2)
        .attr("y2", d.boxY + d.boxH / 2);
      g.select("rect.callout-box")
        .attr("x", d.boxX)
        .attr("y", d.boxY)
        .attr("width", d.textW)
        .attr("height", d.boxH);
      g.select("text.callout-text")
        .attr("x", d.boxX + 6)
        .attr("y", d.boxY + 15)
        .text(d.text);
    });

    groups.transition().duration(TRANSITION_MS / 2).attr("opacity", 1);
  }

  function renderStep(step) {
    const cfg = steps[step];
    console.log(`[Scene 1] mini-step ${step + 1} of ${steps.length}: ${cfg.key} (y-scale 0\u2013${commaFmt(cfg.yMax)})`);

    const titleLineCount = setWrappedHeaderText(
      titleText,
      cfg.title,
      HEADER_TEXT_MAX_WIDTH,
      TITLE_LINE_HEIGHT,
      titleMeasure
    );
    const subtitleY = titleLineCount
      ? HEADER_GRID.titleY + titleLineCount * TITLE_LINE_HEIGHT + 8
      : HEADER_GRID.subtitleY;
    subtitleText
      .attr("y", subtitleY)
      .attr("display", cfg.subtitle ? null : "none");
    setWrappedHeaderText(
      subtitleText,
      cfg.subtitle,
      HEADER_TEXT_MAX_WIDTH,
      SUBTITLE_LINE_HEIGHT,
      subtitleMeasure
    );

    // Rescale: the lines and the y-axis animate to the new tier together.
    yScale.domain([0, cfg.yMax]).nice();
    const line = makeLine();

    yAxisG.transition().duration(TRANSITION_MS)
      .call(d3.axisLeft(yScale).ticks(6).tickFormat(commaFmt));

    lineLayer.selectAll("path.series-line")
      .data(cfg.series, d => d.id)
      .join(
        enter => enter.append("path")
          .attr("class", "series-line")
          .attr("fill", "none")
          .attr("stroke", d => d.color)
          .attr("stroke-width", 2.5)
          .attr("opacity", 0)
          .attr("d", d => line(d.points))
          .call(e => e.transition().duration(TRANSITION_MS).attr("opacity", 0.95)),
        update => update
          .call(u => u.transition().duration(TRANSITION_MS)
            .attr("stroke", d => d.color)
            .attr("opacity", 0.95)
            .attr("d", d => line(d.points))),
        exit => exit
          // Old tier flies up off the rescaled chart while fading out.
          .call(e => e.transition().duration(TRANSITION_MS)
            .attr("opacity", 0)
            .attr("d", d => line(d.points))
            .remove())
      );

    const labelData = repelLabels(cfg.series);

    leaderLayer.selectAll("line.series-leader")
      .data(labelData, d => d.id)
      .join(
        enter => enter.append("line")
          .attr("class", "series-leader")
          .attr("stroke", "#c9c9c4")
          .attr("stroke-width", 1)
          .attr("opacity", 0)
          .attr("x1", d => d.ex).attr("y1", d => d.ey)
          .attr("x2", d => d.ex + 8).attr("y2", d => d.ly)
          .call(e => e.transition().duration(TRANSITION_MS).attr("opacity", 0.8)),
        update => update
          .call(u => u.transition().duration(TRANSITION_MS)
            .attr("opacity", 0.8)
            .attr("x1", d => d.ex).attr("y1", d => d.ey)
            .attr("x2", d => d.ex + 8).attr("y2", d => d.ly)),
        exit => exit.call(e => e.transition().duration(TRANSITION_MS).attr("opacity", 0).remove())
      );

    labelLayer.selectAll("text.series-label")
      .data(labelData, d => d.id)
      .join(
        enter => enter.append("text")
          .attr("class", "series-label")
          .attr("alignment-baseline", "middle")
          .attr("fill", d => d.color)
          .attr("opacity", 0)
          .attr("x", d => d.ex + 11)
          .attr("y", d => d.ly)
          .call(s => applyType(s, typography.label))
          .text(d => d.label)
          .call(e => e.transition().duration(TRANSITION_MS).attr("opacity", 1)),
        update => update
          .call(u => u.transition().duration(TRANSITION_MS)
            .attr("fill", d => d.color)
            .attr("opacity", 1)
            .attr("x", d => d.ex + 11)
            .attr("y", d => d.ly)),
        exit => exit.call(e => e.transition().duration(TRANSITION_MS).attr("opacity", 0).remove())
      );

    renderCallouts(cfg.callouts, cfg);
  }

  // ---- Detail stack (vertical) ---------------------------------------------
  // Step 0 (All Organs) is this scene's HEADLINE view. The remaining zoom tiers
  // are its DOWN/UP detail stack, driven by the global navigator (js/main.js).
  // No in-scene buttons or key handlers: one consistent control scheme show-wide.
  let step = 0;

  function goTo(next) {
    const clamped = Math.max(0, Math.min(steps.length - 1, next));
    if (clamped === step) return;
    step = clamped;
    renderStep(step);
  }

  // Expose the tiers as a detail stack: depth 0 = headline (All Organs), and
  // there are steps.length - 1 deeper levels reachable with DOWN.
  if (typeof window.__setDetailStack === "function") {
    window.__setDetailStack({
      depth: steps.length - 1,
      goToDepth: (d) => goTo(d)
    });
  }

  if (typeof window.__scene1PendingDepth === "number") {
    const pending = window.__scene1PendingDepth;
    delete window.__scene1PendingDepth;
    goTo(pending);
  } else {
    renderStep(step);
  }
}

function lastDefined(points) {
  const defined = points.filter(p => Number.isFinite(p.value) && p.value > 0);
  return defined.length ? defined[defined.length - 1] : points[points.length - 1];
}
