/**
 * Assignment 02 scene 6/7 — multi-organ transplant combinations (f_static_slide.js).
 * Ported for Final Show appendix; source logic unchanged from assignment2.
 */
import { organColors, storyColors } from "../../constants/colors.js";
import { typography } from "../../constants/typography.js";
import { applyType, beginChartScene, drawSource, STAGE } from "./show_helpers.js";

const MULTI_ORGAN_DATA_PATH = "data/optn_multiple_organs_clean.csv";
const TRANSPLANT_DATA_PATH = "data/optn_transplants_clean.csv";

// Reported as single categories in the transplant CSV, not as 2-organ rows in the multi-organ CSV.
const FEATURED_TRANSPLANT_COMBOS = [
  { organKey: "Kidney / Pancreas", organs: ["Kidney", "Pancreas"] },
  { organKey: "Heart / Lung", organs: ["Heart", "Lung"] }
];

// Matches proportion waffle transplant tiles (scene3_flow_waffle_proportion.js).
const COUNT_DOT_COLOR = storyColors.deepSlateHarbor;
const WAFFLE_TILE_SIZE = 8;
const WAFFLE_TILE_GAP = 2;
const WAFFLE_TILE_RX = 1.3;
const WAFFLE_TILE_STEP = WAFFLE_TILE_SIZE + WAFFLE_TILE_GAP;

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

function parseComboOrgans(organKey) {
  return organKey.split("-").map(part => (part === "VCA" ? "VCA" : part));
}

function comboLabel(organs) {
  return organs.join(" + ");
}

function countForYear(rows, year) {
  const row = rows.find(d => +d.year === year);
  return row ? +row.transplants : 0;
}

function buildCombinationsFromCsv(multiRows, transplantRows) {
  const byOrgan = d3.group(
    multiRows.filter(d => d.organ && d.organ !== "organ"),
    d => d.organ.trim()
  );

  const combinations = [...byOrgan.entries()].map(([organKey, rows]) => {
    const organs = parseComboOrgans(organKey);
    return {
      organKey,
      organs,
      label: comboLabel(organs),
      count2025: countForYear(rows, 2025),
      featured: false
    };
  });

  const existingKeys = new Set(combinations.map(c => c.organKey));

  FEATURED_TRANSPLANT_COMBOS.forEach(({ organKey, organs }) => {
    if (existingKeys.has(organKey.replace(" / ", "-"))) return;
    const rows = transplantRows.filter(
      d =>
        d.donor_type === "All Donor Types" &&
        d.organ === organKey
    );
    combinations.push({
      organKey,
      organs,
      label: comboLabel(organs),
      count2025: countForYear(rows, 2025),
      featured: true
    });
  });

  return combinations.sort((a, b) => b.count2025 - a.count2025);
}

function drawComboCallout(parent, { anchorX, anchorY, text }) {
  const padX = 7;
  const padY = 5;
  const lineH = typography.caption.size * 1.35;
  const textW = Math.max(108, text.length * 5.8);
  const boxW = textW + padX * 2;
  const boxH = lineH + padY * 2;
  const boxX = anchorX + 52;
  const boxY = anchorY + 14;
  const boxCx = boxX + boxW / 2;
  const boxCy = boxY + boxH / 2;
  const g = parent.append("g").attr("class", "combo-callout");

  g.append("line")
    .attr("stroke", storyColors.weatheredBrass)
    .attr("stroke-width", 1)
    .attr("x1", anchorX)
    .attr("y1", anchorY)
    .attr("x2", boxX)
    .attr("y2", boxCy);
  g.append("rect")
    .attr("x", boxX)
    .attr("y", boxY)
    .attr("width", boxW)
    .attr("height", boxH)
    .attr("rx", 3)
    .attr("fill", storyColors.museumWhite)
    .attr("stroke", storyColors.weatheredBrass)
    .attr("stroke-width", 1);
  applyType(
    g.append("text")
      .attr("x", boxCx)
      .attr("y", boxCy)
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("fill", storyColors.textPrimary)
      .text(text),
    typography.caption
  );
}

function wrapSvgText(textSel, value, maxWidth, lineHeight) {
  const x = +textSel.attr("x");
  const y = +textSel.attr("y");
  textSel.selectAll("tspan").remove();
  textSel.text(null);
  if (!value) return 0;

  const words = value.split(/\s+/);
  const lines = [];
  let line = "";
  const measure = textSel.text(null);

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    measure.text(next);
    if (measure.node().getComputedTextLength() > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);

  textSel.text(null);

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

function measureFooterHeight(g, options, sourceY, lineHeight, maxWidth) {
  let height = 10;

  const notes = [options.asteriskNote, options.footerNote].filter(Boolean);
  notes.forEach(text => {
    const measure = g.append("text").attr("visibility", "hidden");
    applyType(measure, typography.caption);
    height += wrapSvgText(measure, text, maxWidth, lineHeight) * lineHeight;
    measure.remove();
  });

  const sourceLines = options.sources ?? [
    "Source: OPTN/UNOS 2025 (multi-organ combinations)."
  ];
  height += sourceLines.length * lineHeight;
  return height;
}

function renderFooter(svg, g, options, sourceY, lineHeight, maxWidth) {
  let y = sourceY;
  const sourceLines = options.sources ?? [
    "Source: OPTN/UNOS 2025 (multi-organ combinations)."
  ];

  [...sourceLines].reverse().forEach(text => {
    drawSource(svg, text, y);
    y -= lineHeight;
  });

  const notes = [options.asteriskNote, options.footerNote].filter(Boolean);
  notes.reverse().forEach(text => {
    y -= 4;
    const measure = g.append("text").attr("visibility", "hidden");
    applyType(measure, typography.caption);
    const lineCount = wrapSvgText(measure, text, maxWidth, lineHeight);
    measure.remove();
    const noteY = y - lineCount * lineHeight;
    const noteText = applyType(
      g.append("text")
        .attr("class", "combo-footer-note")
        .attr("x", STAGE.marginX)
        .attr("y", noteY)
        .attr("fill", storyColors.textMuted),
      typography.caption
    );
    wrapSvgText(noteText, text, maxWidth, lineHeight);
    y = noteY - 4;
  });

  return y;
}

function renderMultiOrganChart(container, combinations, options = {}) {
  const { chartSvg: svg } = beginChartScene(container, {
    sceneLabel: options.sceneLabel ?? "Appendix",
    title: options.title ?? "Multi-organ transplants",
    subtitle:
      options.subtitle ??
      "Some patients need coordinated multi-organ transplants (2025 counts)"
  });

  const g = svg.append("g").attr("class", "appendix-multi-organ");
  const listG = g.append("g").attr("class", "combo-list");

  const SOURCE_Y = STAGE.captionY;
  const FOOTER_LINE_HEIGHT = 14;
  const FOOTER_NOTE_MAX_WIDTH = STAGE.contentRight - STAGE.marginX;
  const footerHeight = measureFooterHeight(
    g,
    options,
    SOURCE_Y,
    FOOTER_LINE_HEIGHT,
    FOOTER_NOTE_MAX_WIDTH
  );
  const footerBlockTop = SOURCE_Y - footerHeight;

  const listStartY = STAGE.contentTop + 8;
  const ICON_X = STAGE.contentLeft + 20;
  const LABEL_X = STAGE.contentLeft + 54;
  const MATRIX_X = STAGE.contentLeft + 300;
  const MATRIX_MAX_X = STAGE.contentRight - 16;
  const LABEL_MAX_WIDTH = MATRIX_X - LABEL_X - 20;
  const MOLECULE_DOT_R = 4.8;
  const COUNT_DOT_R = 2.6;
  const CASES_PER_DOT = 20;
  const useWaffleCountMarkers = options.useWaffleCountMarkers ?? false;
  const countMarkerSize = useWaffleCountMarkers ? WAFFLE_TILE_SIZE : COUNT_DOT_R * 2;
  const countMarkerRx = useWaffleCountMarkers ? WAFFLE_TILE_RX : 0;
  const matrixStepX = useWaffleCountMarkers ? WAFFLE_TILE_STEP : 7;
  const matrixStepY = useWaffleCountMarkers ? WAFFLE_TILE_STEP : 7;
  const LABEL_LINE_HEIGHT = 14;
  const ROW_PAD = 10;
  const matrixWidth = Math.max(120, MATRIX_MAX_X - MATRIX_X);
  const MATRIX_COLS = Math.max(18, Math.floor(matrixWidth / matrixStepX));
  const rowGap = 26;

  applyType(
    listG.append("text")
      .attr("x", MATRIX_X)
      .attr("y", listStartY - 10)
      .attr("fill", storyColors.textMuted)
      .text(
        useWaffleCountMarkers
          ? `Each small square \u2248 ${CASES_PER_DOT} transplants`
          : `Each small dot \u2248 ${CASES_PER_DOT} transplants`
      ),
    typography.label
  );

  const rowLayouts = combinations.map(d => {
    const label = `${d.label} \u00b7 ${d.count2025}${d.featured ? "*" : ""}`;
    const measure = listG.append("text").attr("visibility", "hidden");
    applyType(measure, typography.label);
    const labelLines = wrapSvgText(measure, label, LABEL_MAX_WIDTH, LABEL_LINE_HEIGHT);
    measure.remove();
    const scaledCount = Math.max(1, Math.round(d.count2025 / CASES_PER_DOT));
    const matrixRows = Math.ceil(scaledCount / MATRIX_COLS);
    const matrixHeight = Math.max(0, (matrixRows - 1) * matrixStepY);
    const labelHeight = Math.max(LABEL_LINE_HEIGHT, labelLines * LABEL_LINE_HEIGHT);
    const rowHeight = Math.max(rowGap, labelHeight + matrixHeight + ROW_PAD);
    return { ...d, label, labelLines, scaledCount, matrixRows, rowHeight };
  });

  let accY = listStartY;
  rowLayouts.forEach(row => {
    row.y = accY;
    accY += row.rowHeight;
  });

  const clipId = "multi-organ-list-clip";
  svg
    .append("defs")
    .append("clipPath")
    .attr("id", clipId)
    .append("rect")
    .attr("x", STAGE.contentLeft - 20)
    .attr("y", STAGE.contentTop)
    .attr("width", STAGE.contentRight - STAGE.contentLeft + 40)
    .attr("height", Math.max(0, footerBlockTop - STAGE.contentTop));
  listG.attr("clip-path", `url(#${clipId})`);

  const comboGroups = listG
    .selectAll("g.combo-row")
    .data(rowLayouts)
    .enter()
    .append("g")
    .attr("class", "combo-row")
    .attr("transform", d => `translate(0, ${d.y})`);

  comboGroups.each(function (d) {
    const row = d3.select(this);
    const offsets = moleculeOffsets(d.organs.length, MOLECULE_DOT_R);
    const moleculeDots = d.organs.map((organ, i) => ({
      organ,
      x: offsets[i].x,
      y: offsets[i].y
    }));

    row
      .selectAll("circle.molecule-dot")
      .data(moleculeDots)
      .enter()
      .append("circle")
      .attr("class", "molecule-dot")
      .attr("cx", ICON_X)
      .attr("cy", 0)
      .attr("r", MOLECULE_DOT_R)
      .attr("transform", p => `translate(${p.x}, ${p.y})`)
      .attr("fill", p => ORGAN_COLOR[p.organ] || ORGAN_COLOR.Other)
      .attr("stroke", storyColors.museumWhite)
      .attr("stroke-width", 0.7)
      .attr("opacity", 0.95);

    const matrixDots = d3.range(d.scaledCount).map(i => {
      const col = i % MATRIX_COLS;
      const matrixRow = Math.floor(i / MATRIX_COLS);
      return {
        x: MATRIX_X + col * matrixStepX,
        y: (matrixRow - (d.matrixRows - 1) / 2) * matrixStepY
      };
    });

    const countDots = row
      .selectAll(useWaffleCountMarkers ? "rect.count-dot" : "circle.count-dot")
      .data(matrixDots)
      .enter();

    if (useWaffleCountMarkers) {
      const highlightTile = d.organKey === options.highlightComboKey;
      countDots
        .append("rect")
        .attr("class", "count-dot")
        .attr("x", p => p.x - countMarkerSize / 2)
        .attr("y", p => p.y - countMarkerSize / 2)
        .attr("width", countMarkerSize)
        .attr("height", countMarkerSize)
        .attr("rx", countMarkerRx)
        .attr("fill", (_, i) =>
          highlightTile && i === 0 ? storyColors.warmSand : COUNT_DOT_COLOR)
        .attr("stroke", (_, i) =>
          highlightTile && i === 0 ? storyColors.deepSlateHarbor : "none")
        .attr("stroke-width", (_, i) => (highlightTile && i === 0 ? 1.5 : 0))
        .attr("opacity", 0.95);
    } else {
      countDots
        .append("circle")
        .attr("class", "count-dot")
        .attr("cx", p => p.x)
        .attr("cy", p => p.y)
        .attr("r", COUNT_DOT_R)
        .attr("fill", COUNT_DOT_COLOR)
        .attr("opacity", 0.95);
    }
  });

  comboGroups.each(function (d) {
    const labelText = applyType(
      d3.select(this)
        .append("text")
        .attr("x", LABEL_X)
        .attr("y", 4)
        .attr("text-anchor", "start")
        .attr("fill", storyColors.textPrimary),
      typography.label
    );
    wrapSvgText(labelText, d.label, LABEL_MAX_WIDTH, LABEL_LINE_HEIGHT);
  });

  if (options.highlightComboKey && options.featuredComboLabel) {
    const featured = rowLayouts.find(r => r.organKey === options.highlightComboKey);
    if (featured) {
      drawComboCallout(listG, {
        anchorX: MATRIX_X + countMarkerSize / 2,
        anchorY: featured.y + 4,
        text: options.featuredComboLabel
      });
    }
  }

  renderFooter(svg, g, options, SOURCE_Y, FOOTER_LINE_HEIGHT, FOOTER_NOTE_MAX_WIDTH);
}

/**
 * @param {{
 *   sceneLabel?: string,
 *   title?: string,
 *   subtitle?: string,
 *   footerNote?: string,
 *   asteriskNote?: string,
 *   sources?: string[],
 *   useWaffleCountMarkers?: boolean
 * }} [options]
 */
export function runMultiOrganTransplants(options = {}) {
  const container = d3.select("#viz");
  container.selectAll("*").remove();

  Promise.all([d3.csv(MULTI_ORGAN_DATA_PATH), d3.csv(TRANSPLANT_DATA_PATH)])
    .then(([multiRows, transplantRows]) => {
      multiRows.forEach(d => {
        d.year = +d.year;
        d.transplants = +d.transplants;
      });
      transplantRows.forEach(d => {
        d.year = +d.year;
        d.transplants = +d.transplants;
      });

      const combinations = buildCombinationsFromCsv(multiRows, transplantRows);
      renderMultiOrganChart(container, combinations, options);
    })
    .catch(err => {
      console.error("[multi-organ] CSV load error:", err);
    });
}

export function runAppendixMultiOrgan() {
  return runMultiOrganTransplants();
}

/** Scene 1 final detail — multi-organ combinations after the zoom tiers. */
export function runScene1MultiOrganDetail() {
  return runMultiOrganTransplants({
    sceneLabel: "",
    title:
      "Multi-organ transplants, while less common, have a wide assortment of combinations.",
    subtitle:
      "In 2025, OPTN recorded more than two dozen distinct combination types\u2014from kidney\u2013liver pairings in the hundreds to rare procedures counted in single digits.",
    asteriskNote:
      "* Information on these organ types is reported in OPTN single-organ advanced reporting, not the multi-organ combination file.",
    sources: [
      "Source 1: OPTN/UNOS 2025 (multi-organ combinations).",
      "Source 2: OPTN single-organ advanced reporting (entries marked *)."
    ]
  });
}

/** Gap (flow) detail — multi-organ combinations after proportion waffle. */
export function runScene3MultiOrganDetail() {
  return runMultiOrganTransplants({
    sceneLabel: "Scene 3  \u00b7  detail",
    title: "Multi-organ transplants range from numerous to rare.",
    subtitle: "Waitlist data is not available for multi-organ transplants.",
    useWaffleCountMarkers: true,
    highlightComboKey: "Liver-Lung",
    featuredComboLabel: "SueEllen Mobley Stepenson",
    sources: [
      "Source 1: OPTN/UNOS 2025 (multi-organ combinations).",
      "Source 2: OPTN single-organ advanced reporting (entries marked *)."
    ]
  });
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
      { x: 0, y: -r * 1.2 },
      { x: -r, y: r * 0.75 },
      { x: r, y: r * 0.75 }
    ];
  }
  return [
    { x: -r, y: -r },
    { x: r, y: -r },
    { x: -r, y: r },
    { x: r, y: r }
  ];
}
