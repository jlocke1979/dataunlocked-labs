/**
 * Scene 3 detail 4/4 (potential addition) — honest shared-scale transplant dot plot.
 * Single-organ rows + multi-organ combinations on one legend; preserves 3/3 as-is.
 */
import { organColors, storyColors } from "../../constants/colors.js";
import { typography } from "../../constants/typography.js";
import {
  applyType,
  beginChartScene,
  drawSource,
  renderPlaceholder,
  STAGE
} from "./show_helpers.js";
import { OPTN_TRANSPLANT_COMBO_SOURCE } from "./scene_references.js";

const TRANSPLANT_CSV = "data/optn_transplants_clean.csv";
const MULTI_ORGAN_CSV = "data/optn_multiple_organs_clean.csv";
const PEOPLE_PER_DOT = 500;

const ROW_START_Y = STAGE.contentTop + 12;
const ROW_GAP = 42;
const LABEL_X = STAGE.marginX;
const TRACK_X = STAGE.marginX + 168;
const MAX_TRACK_WIDTH = STAGE.contentRight - TRACK_X - 24;
const DOT_RADIUS = 3.4;
const DOT_PITCH = DOT_RADIUS * 2 + 4;
const MINI_DOT_R = 2.1;

const ORGAN_COLOR = {
  Kidney: organColors.Kidney,
  Liver: organColors.Liver,
  Heart: organColors.Heart,
  Lung: organColors.Lung,
  Pancreas: organColors.Pancreas,
  Intestine: organColors.Intestine,
  VCA: organColors["VCA - upper limb"] || "#8A8A8A",
  Other: storyColors.softAshGray
};

const SINGLE_ORGAN_KEYS = [
  "Kidney",
  "Liver",
  "Heart",
  "Lung",
  "Pancreas",
  "Intestine"
];

const FEATURED_SINGLE_COMBOS = [
  { organKey: "Kidney / Pancreas", organs: ["Kidney", "Pancreas"] },
  { organKey: "Heart / Lung", organs: ["Heart", "Lung"] }
];

function parseComboOrgans(organKey) {
  return organKey.split("-").map(part => (part === "VCA" ? "VCA" : part));
}

function comboLabel(organs) {
  return organs.join(" + ");
}

function countForYear(rows, year, organKey) {
  const row = rows.find(d => +d.year === year && String(d.organ).trim() === organKey);
  return row ? +row.transplants : 0;
}

function dotsForCount(count) {
  if (count <= 0) return 0;
  return Math.max(1, Math.round(count / PEOPLE_PER_DOT));
}

function layoutDots(count, maxWidth) {
  const maxCols = Math.max(1, Math.floor((maxWidth + 4) / DOT_PITCH));
  const cols = Math.min(count, maxCols);
  const rows = Math.ceil(count / cols);
  return d3.range(count).map(index => ({
    x: (index % cols) * DOT_PITCH + DOT_RADIUS,
    y: Math.floor(index / cols) * DOT_PITCH + DOT_RADIUS,
    rows,
    cols
  }));
}

function moleculeOffsets(count, r) {
  if (count === 2) {
    return [
      { x: -r, y: 0 },
      { x: r, y: 0 }
    ];
  }
  if (count === 3) {
    return [
      { x: 0, y: -r * 1.15 },
      { x: -r, y: r * 0.7 },
      { x: r, y: r * 0.7 }
    ];
  }
  return [
    { x: -r, y: -r },
    { x: r, y: -r },
    { x: -r, y: r },
    { x: r, y: r }
  ];
}

function buildRows(transplantRows, multiRows) {
  const singles = SINGLE_ORGAN_KEYS.map(organ => ({
    organKey: organ,
    label: organ,
    organs: [organ],
    kind: "single",
    count2025: countForYear(transplantRows, 2025, organ)
  }));

  const featured = FEATURED_SINGLE_COMBOS.map(({ organKey, organs }) => ({
    organKey,
    label: comboLabel(organs),
    organs,
    kind: "combo",
    count2025: countForYear(transplantRows, 2025, organKey),
    featured: true
  }));

  const multiByOrgan = d3.group(
    multiRows.filter(d => d.organ && d.organ !== "organ"),
    d => d.organ.trim()
  );

  const multis = [...multiByOrgan.entries()]
    .map(([organKey, rows]) => {
      const organs = parseComboOrgans(organKey);
      const yearRow = rows.find(d => +d.year === 2025);
      return {
        organKey,
        label: comboLabel(organs),
        organs,
        kind: "combo",
        count2025: yearRow ? +yearRow.transplants : 0,
        featured: false
      };
    })
    .filter(d => d.count2025 > 0)
    .sort((a, b) => b.count2025 - a.count2025)
    .slice(0, 10);

  const seen = new Set();
  const merged = [];

  [...singles, ...featured, ...multis]
    .filter(d => d.count2025 > 0)
    .sort((a, b) => b.count2025 - a.count2025)
    .forEach(row => {
      if (seen.has(row.organKey)) return;
      seen.add(row.organKey);
      merged.push(row);
    });

  return merged;
}

function drawSingleDot(parent, x, y, organ) {
  parent
    .append("circle")
    .attr("class", "transplant-dot")
    .attr("cx", x)
    .attr("cy", y)
    .attr("r", DOT_RADIUS)
    .attr("fill", ORGAN_COLOR[organ] || ORGAN_COLOR.Other)
    .attr("stroke", storyColors.museumWhite)
    .attr("stroke-width", 0.6)
    .attr("opacity", 0.92);
}

function drawComboDot(parent, x, y, organs) {
  const g = parent.append("g").attr("class", "transplant-dot-combo").attr("transform", `translate(${x},${y})`);
  const offsets = moleculeOffsets(organs.length, MINI_DOT_R);
  organs.forEach((organ, i) => {
    g.append("circle")
      .attr("cx", offsets[i].x)
      .attr("cy", offsets[i].y)
      .attr("r", MINI_DOT_R)
      .attr("fill", ORGAN_COLOR[organ] || ORGAN_COLOR.Other)
      .attr("stroke", storyColors.museumWhite)
      .attr("stroke-width", 0.45)
      .attr("opacity", 0.95);
  });
}

function drawRow(g, row, y, maxCount) {
  const dotCount = dotsForCount(row.count2025);
  const trackWidth = Math.max(40, (row.count2025 / maxCount) * MAX_TRACK_WIDTH);
  const positions = layoutDots(dotCount, trackWidth);
  const trackHeight = Math.max(22, positions[0]?.rows * DOT_PITCH + 8);

  const rowG = g.append("g").attr("class", "transplant-dotplot-row");

  applyType(
    rowG
      .append("text")
      .attr("x", LABEL_X)
      .attr("y", y + trackHeight / 2 + 4)
      .attr("fill", storyColors.textPrimary)
      .text(row.label + (row.featured ? "*" : "")),
    typography.label
  );

  const track = rowG.append("g").attr("transform", `translate(${TRACK_X},${y})`);

  track
    .append("rect")
    .attr("class", "dotplot-track")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", trackWidth)
    .attr("height", trackHeight)
    .attr("rx", 4)
    .attr("fill", storyColors.museumWhite)
    .attr("stroke", storyColors.softAshGray)
    .attr("stroke-width", 1)
    .attr("opacity", 0.55);

  const dotLayer = track.append("g").attr("class", "dotplot-dots");
  const yOffset = (trackHeight - positions[0]?.rows * DOT_PITCH) / 2;

  positions.forEach(pos => {
    const cx = pos.x;
    const cy = pos.y + yOffset;
    if (row.kind === "single") {
      drawSingleDot(dotLayer, cx, cy, row.organs[0]);
    } else {
      drawComboDot(dotLayer, cx, cy, row.organs);
    }
  });

  applyType(
    rowG
      .append("text")
      .attr("x", TRACK_X + trackWidth + 10)
      .attr("y", y + trackHeight / 2 + 4)
      .attr("fill", storyColors.textMuted)
      .text(`${d3.format(",")(row.count2025)} transplants`),
    typography.caption
  );
}

function drawLegend(svg, y, rows) {
  const legend = svg.append("g").attr("class", "transplant-dotplot-legend").attr("transform", `translate(${TRACK_X},${y})`);

  applyType(
    legend
      .append("text")
      .attr("x", 0)
      .attr("y", 0)
      .attr("fill", storyColors.textPrimary)
      .text("Volume scale (shared)"),
    typography.label
  );

  const scaleY = 16;
  drawSingleDot(legend, DOT_RADIUS + 2, scaleY, "Kidney");
  applyType(
    legend
      .append("text")
      .attr("x", DOT_RADIUS * 2 + 10)
      .attr("y", scaleY + 4)
      .attr("fill", storyColors.textSecondary)
      .text(`1 dot \u2248 ${d3.format(",")(PEOPLE_PER_DOT)} transplants`),
    typography.caption
  );

  drawComboDot(legend, 248, scaleY, ["Liver", "Kidney"]);
  applyType(
    legend
      .append("text")
      .attr("x", 268)
      .attr("y", scaleY + 4)
      .attr("fill", storyColors.textSecondary)
      .text("Multi-organ cluster"),
    typography.caption
  );

  const swatchOrgans = ["Kidney", "Liver", "Heart", "Lung", "Pancreas", "Intestine"];
  const swatchG = legend.append("g").attr("transform", `translate(0,${scaleY + 28})`);
  let swatchX = 0;
  swatchOrgans.forEach(organ => {
    swatchG
      .append("circle")
      .attr("cx", swatchX + 5)
      .attr("cy", 0)
      .attr("r", 4.5)
      .attr("fill", ORGAN_COLOR[organ]);
    applyType(
      swatchG
        .append("text")
        .attr("x", swatchX + 14)
        .attr("y", 4)
        .attr("fill", storyColors.textMuted)
        .text(organ),
      typography.caption
    );
    swatchX += 14 + organ.length * 5.8 + 14;
  });

  applyType(
    legend
      .append("text")
      .attr("x", 0)
      .attr("y", scaleY + 52)
      .attr("fill", storyColors.textMuted)
      .text("Track width and dot count use the same scale for every row \u2014 larger organs fill more space."),
    typography.caption
  );

  if (rows.some(r => r.featured)) {
    applyType(
      legend
        .append("text")
        .attr("x", 0)
        .attr("y", scaleY + 68)
        .attr("fill", storyColors.textMuted)
        .text("* Reported in OPTN single-organ advanced reporting."),
      typography.caption
    );
  }
}

export function runScene3TransplantDotplotDetail() {
  const container = d3.select("#viz");
  container.selectAll("*").remove();

  const { chartSvg: svg } = beginChartScene(container, {
    sceneLabel: "Scene 3  \u00b7  detail",
    title: "Transplant volume on one honest scale",
    subtitle: "Single organs and multi-organ combinations \u2014 each dot is the same unit of volume."
  });

  const chart = svg.append("g").attr("class", "transplant-dotplot");

  Promise.all([d3.csv(TRANSPLANT_CSV), d3.csv(MULTI_ORGAN_CSV)])
    .then(([transplantRows, multiRows]) => {
      transplantRows.forEach(d => {
        d.year = +d.year;
        d.transplants = +d.transplants;
      });
      multiRows.forEach(d => {
        d.year = +d.year;
        d.transplants = +d.transplants;
      });

      const rows = buildRows(transplantRows, multiRows);
      const maxCount = d3.max(rows, d => d.count2025) || 1;
      const legendReserve = 118;

      const clipId = "scene3-dotplot-clip";
      svg
        .append("defs")
        .append("clipPath")
        .attr("id", clipId)
        .append("rect")
        .attr("x", STAGE.contentLeft - 20)
        .attr("y", STAGE.contentTop)
        .attr("width", STAGE.contentRight - STAGE.contentLeft + 40)
        .attr("height", Math.max(0, STAGE.captionY - legendReserve - STAGE.contentTop));
      chart.attr("clip-path", `url(#${clipId})`);

      let y = ROW_START_Y;
      rows.forEach(row => {
        const dotCount = dotsForCount(row.count2025);
        const trackWidth = Math.max(40, (row.count2025 / maxCount) * MAX_TRACK_WIDTH);
        const positions = layoutDots(dotCount, trackWidth);
        const trackHeight = Math.max(22, positions[0]?.rows * DOT_PITCH + 8);
        drawRow(chart, row, y, maxCount);
        y += Math.max(ROW_GAP, trackHeight + 14);
      });

      drawLegend(svg, y + 4, rows);
      drawSource(
        svg,
        OPTN_TRANSPLANT_COMBO_SOURCE
      );
    })
    .catch(err => {
      console.error("[Scene 3 transplant dotplot] data load error:", err);
      renderPlaceholder(container, {
        sceneLabel: "Scene 3  \u00b7  detail",
        title: "Transplant volume on one honest scale",
        subtitle: "Could not load OPTN transplant data.",
        note: String(err?.message ?? err)
      });
    });
}
