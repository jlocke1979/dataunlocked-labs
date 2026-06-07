/**
 * Assignment 02 scene 6/7 — multi-organ transplant combinations (f_static_slide.js).
 * Ported for Final Show appendix; source logic unchanged from assignment2.
 */
import { organColors, storyColors } from "../../constants/colors.js";
import { typography } from "../../constants/typography.js";
import {
  applyType,
  beginChartScene,
  drawSource,
  HEADER_GRID,
  STAGE
} from "./show_helpers.js";
import {
  OPTN_MULTI_ORGAN_SOURCE,
  OPTN_MULTI_ORGAN_SINGLE_ORGAN_SOURCE
} from "./scene_references.js";

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

const LIVER_LUNG_COMBO_KEY = "Liver-Lung";
const SUE_ELLEN_SUNSHINE = "#FFD524";
const SUE_ELLEN_SUNSHINE_OUTLINE = "#C77800";
const SUE_ELLEN_COMBO_LABEL = "SueEllen Mobley Stephenson";
const SUE_ELLEN_CALLOUT_OFFSET_X = 96; // 2″ right of anchor dot
const SUE_ELLEN_CALLOUT_OFFSET_Y = 48; // 1″ below anchor dot

function parseComboOrgans(organKey) {
  return organKey.split("-").map(part => (part === "VCA" ? "VCA" : part));
}

function comboLabel(organs) {
  return organs.join(" + ");
}

const COMBO_LABEL_HIGHLIGHT = {
  padX: 4,
  padY: 1,
  fillOpacity: 0.22,
  rx: 3,
  organGap: 4,
  plusGap: 5
};

function appendOrganHighlightLabel(parent, organ, text, x, y) {
  const color = ORGAN_COLOR[organ] || ORGAN_COLOR.Other;
  const wrap = parent.append("g").attr("class", "combo-organ-highlight");
  const textSel = applyType(
    wrap
      .append("text")
      .attr("x", x)
      .attr("y", y)
      .attr("fill", color)
      .text(text),
    typography.label
  );
  const bbox = textSel.node().getBBox();
  wrap
    .insert("rect", "text")
    .attr("x", bbox.x - COMBO_LABEL_HIGHLIGHT.padX)
    .attr("y", bbox.y - COMBO_LABEL_HIGHLIGHT.padY)
    .attr("width", bbox.width + COMBO_LABEL_HIGHLIGHT.padX * 2)
    .attr("height", bbox.height + COMBO_LABEL_HIGHLIGHT.padY * 2)
    .attr("rx", COMBO_LABEL_HIGHLIGHT.rx)
    .attr("fill", color)
    .attr("fill-opacity", COMBO_LABEL_HIGHLIGHT.fillOpacity);
  return x + bbox.width;
}

function drawComboLabelWithOrganHighlights(row, d, { x, y }) {
  const labelG = row.append("g").attr("class", "combo-row-label");
  let cursorX = x;

  d.organs.forEach((organ, index) => {
    if (index > 0) {
      const plus = applyType(
        labelG
          .append("text")
          .attr("x", cursorX)
          .attr("y", y)
          .attr("fill", storyColors.textPrimary)
          .text(" + "),
        typography.label
      );
      cursorX += plus.node().getComputedTextLength() + COMBO_LABEL_HIGHLIGHT.plusGap;
    }
    cursorX =
      appendOrganHighlightLabel(labelG, organ, organ, cursorX, y) +
      COMBO_LABEL_HIGHLIGHT.organGap;
  });

  const suffix = ` \u00b7 ${d.count2025}${d.featured ? "*" : ""}`;
  applyType(
    labelG
      .append("text")
      .attr("x", cursorX)
      .attr("y", y)
      .attr("fill", storyColors.textPrimary)
      .text(suffix),
    typography.label
  );
}

const INCH_PX = 96;
/** Max row height for the largest combo matrix — favors wide, shallow dot grids. */
const TRUE_SCALE_ROW_MAX_H = 1.25 * INCH_PX;
const TRUE_SCALE_DOT_GAP = 1;
const TRUE_SCALE_MIN_DOT = 5;

/** Pick the widest column layout that fits maxCount within width × row-height budget. */
function computePatientDotGrid(maxCount, budgetW, budgetH, gap = TRUE_SCALE_DOT_GAP) {
  let best = null;

  for (let dotSize = 12; dotSize >= TRUE_SCALE_MIN_DOT; dotSize--) {
    const step = dotSize + gap;
    const cols = Math.max(1, Math.floor(budgetW / step));
    const rows = Math.ceil(maxCount / cols);
    const matrixH = rows * step - gap;
    if (matrixH > budgetH) continue;

    const candidate = {
      dotSize,
      gap,
      step,
      cols,
      rowsForMax: rows,
      matrixW: cols * step - gap,
      matrixH
    };

    if (
      !best ||
      candidate.cols > best.cols ||
      (candidate.cols === best.cols && candidate.dotSize > best.dotSize)
    ) {
      best = candidate;
    }
  }

  if (best) return best;

  const dotSize = TRUE_SCALE_MIN_DOT;
  const step = dotSize + gap;
  const cols = Math.max(1, Math.floor(budgetW / step));
  const rows = Math.ceil(maxCount / cols);
  return {
    dotSize,
    gap,
    step,
    cols,
    rowsForMax: rows,
    matrixW: cols * step - gap,
    matrixH: rows * step - gap
  };
}

function countForYear(rows, year) {
  const row = rows.find(d => +d.year === year);
  return row ? +row.transplants : 0;
}

function pieSlicePath(cx, cy, r, startAngle, endAngle) {
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

function comboDotSlices(organCount) {
  if (organCount === 2) {
    return [
      { start: Math.PI / 2, end: (3 * Math.PI) / 2 },
      { start: -Math.PI / 2, end: Math.PI / 2 }
    ];
  }
  return d3.range(organCount).map(index => {
    const start = -Math.PI / 2 + ((2 * Math.PI) / organCount) * index;
    return { start, end: start + (2 * Math.PI) / organCount };
  });
}

function appendComboPatientDot(
  parent,
  { cx, cy, r, organs, solidColor = null, solidStroke = null, solidStrokeWidth = 0 }
) {
  const dot = parent.append("g").attr("class", "count-dot");
  if (solidColor) {
    dot
      .append("circle")
      .attr("cx", cx)
      .attr("cy", cy)
      .attr("r", r)
      .attr("fill", solidColor)
      .attr("stroke", solidStroke || "none")
      .attr("stroke-width", solidStroke ? solidStrokeWidth || 1.75 : 0)
      .attr("opacity", 0.98);
    return dot;
  }

  const colors = organs.map(organ => ORGAN_COLOR[organ] || ORGAN_COLOR.Other);
  comboDotSlices(organs.length).forEach((slice, index) => {
    dot
      .append("path")
      .attr("d", pieSlicePath(cx, cy, r, slice.start, slice.end))
      .attr("fill", colors[index])
      .attr("opacity", 0.98);
  });

  dot
    .append("circle")
    .attr("cx", cx)
    .attr("cy", cy)
    .attr("r", r)
    .attr("fill", "none")
    .attr("stroke", storyColors.museumWhite)
    .attr("stroke-width", 0.35);

  return dot;
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

function drawComboCallout(
  parent,
  { anchorX, anchorY, text, boxOffsetX = 52, boxOffsetY = 14, leaderEnd = "left" }
) {
  const padX = 7;
  const padY = 5;
  const lineH = typography.caption.size * 1.35;
  const textW = Math.max(108, text.length * 5.8);
  const boxW = textW + padX * 2;
  const boxH = lineH + padY * 2;
  const boxX = anchorX + boxOffsetX;
  const boxY = anchorY + boxOffsetY;
  const boxCx = boxX + boxW / 2;
  const boxCy = boxY + boxH / 2;
  const g = parent.append("g").attr("class", "combo-callout");
  let leaderX2 = boxX;
  let leaderY2 = boxCy;
  if (leaderEnd === "top-center") {
    leaderX2 = boxCx;
    leaderY2 = boxY;
  } else if (leaderEnd === "bottom-center") {
    leaderX2 = boxCx;
    leaderY2 = boxY + boxH;
  }

  g.append("line")
    .attr("stroke", storyColors.weatheredBrass)
    .attr("stroke-width", 1)
    .attr("x1", anchorX)
    .attr("y1", anchorY)
    .attr("x2", leaderX2)
    .attr("y2", leaderY2);
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

  const sourceLines = options.sources ?? [OPTN_MULTI_ORGAN_SOURCE];
  height += sourceLines.length * lineHeight;
  return height;
}

function renderFooter(svg, g, options, sourceY, lineHeight, maxWidth) {
  let y = sourceY;
  const sourceLines = options.sources ?? [OPTN_MULTI_ORGAN_SOURCE];

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
  container.style("overflow-y", null);

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

  const oneDotPerPatient = options.oneDotPerPatient ?? false;
  const listStartY = STAGE.contentTop + (oneDotPerPatient ? 30 : 8);
  const ICON_X = STAGE.contentLeft + 20;
  const LABEL_X = oneDotPerPatient ? STAGE.contentLeft + 20 : STAGE.contentLeft + 54;
  const MATRIX_X = oneDotPerPatient ? STAGE.contentLeft + 248 : STAGE.contentLeft + 300;
  const MATRIX_MAX_X = STAGE.contentRight - 16;
  const LABEL_MAX_WIDTH = MATRIX_X - LABEL_X - 20;
  const MOLECULE_DOT_R = 4.8;
  const COUNT_DOT_R = 2.6;
  const CASES_PER_DOT = options.casesPerDot ?? 20;
  const useWaffleCountMarkers = options.useWaffleCountMarkers ?? false;
  const countMarkerSize = useWaffleCountMarkers ? WAFFLE_TILE_SIZE : COUNT_DOT_R * 2;
  const countMarkerRx = useWaffleCountMarkers ? WAFFLE_TILE_RX : 0;
  const LABEL_LINE_HEIGHT = 14;
  const ROW_PAD = oneDotPerPatient ? 6 : 10;
  const matrixWidth = Math.max(120, MATRIX_MAX_X - MATRIX_X);
  const rowGap = oneDotPerPatient ? 8 : 26;
  /** True-scale supplemental: ~30% extra inter-row space from row 4 onward. */
  const tailRowExtraGap = oneDotPerPatient ? Math.round((ROW_PAD + rowGap) * 0.3) : 0;

  const displayCombinations = oneDotPerPatient
    ? combinations.filter(d => d.count2025 > 0)
    : combinations;

  const maxCount = oneDotPerPatient
    ? d3.max(displayCombinations, d => d.count2025) ?? 0
    : 0;
  const patientGrid = oneDotPerPatient
    ? computePatientDotGrid(maxCount, matrixWidth, TRUE_SCALE_ROW_MAX_H)
    : null;

  const matrixStepX = oneDotPerPatient
    ? patientGrid.step
    : useWaffleCountMarkers
      ? WAFFLE_TILE_STEP
      : 7;
  const matrixStepY = oneDotPerPatient
    ? patientGrid.step
    : useWaffleCountMarkers
      ? WAFFLE_TILE_STEP
      : 7;
  const MATRIX_COLS = oneDotPerPatient
    ? patientGrid.cols
    : Math.max(18, Math.floor(matrixWidth / matrixStepX));
  const patientDotR = oneDotPerPatient ? patientGrid.dotSize / 2 : COUNT_DOT_R;

  if (!oneDotPerPatient) {
    const scaleLegend = useWaffleCountMarkers
      ? `Each small square \u2248 ${CASES_PER_DOT} transplants`
      : `Each small dot \u2248 ${CASES_PER_DOT} transplants`;
    applyType(
      listG
        .append("g")
        .attr("class", "combo-scale-legend")
        .append("text")
        .attr("x", MATRIX_X)
        .attr("y", listStartY - 10)
        .attr("fill", storyColors.textMuted)
        .text(scaleLegend),
      typography.label
    );
  }

  const rowLayouts = displayCombinations.map(d => {
    const label = `${d.label} \u00b7 ${d.count2025}${d.featured ? "*" : ""}`;
    let labelLines = 1;
    if (!oneDotPerPatient) {
      const measure = listG.append("text").attr("visibility", "hidden");
      applyType(measure, typography.label);
      labelLines = wrapSvgText(measure, label, LABEL_MAX_WIDTH, LABEL_LINE_HEIGHT);
      measure.remove();
    }
    const dotCount = oneDotPerPatient
      ? d.count2025
      : Math.max(1, Math.round(d.count2025 / CASES_PER_DOT));
    const matrixRows = Math.ceil(dotCount / MATRIX_COLS);
    const matrixHeight = matrixRows * matrixStepY;
    const labelHeight = Math.max(LABEL_LINE_HEIGHT, labelLines * LABEL_LINE_HEIGHT);
    const rowHeight = oneDotPerPatient
      ? Math.max(labelHeight, matrixHeight) + ROW_PAD
      : Math.max(rowGap, labelHeight + Math.max(0, (matrixRows - 1) * matrixStepY) + ROW_PAD);
    return { ...d, label, labelLines, dotCount, matrixRows, rowHeight };
  });

  let accY = listStartY;
  rowLayouts.forEach((row, index) => {
    if (tailRowExtraGap && index >= 3) {
      accY += tailRowExtraGap;
    }
    row.y = accY;
    accY += row.rowHeight;
  });

  if (!oneDotPerPatient) {
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
  }

  const comboGroups = listG
    .selectAll("g.combo-row")
    .data(rowLayouts)
    .enter()
    .append("g")
    .attr("class", "combo-row")
    .attr("transform", d => `translate(0, ${d.y})`);

  comboGroups.each(function (d) {
    const row = d3.select(this);
    if (!oneDotPerPatient) {
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
    }

    const matrixTop = oneDotPerPatient ? 0 : null;
    const matrixDots = d3.range(d.dotCount).map(i => {
      const col = i % MATRIX_COLS;
      const matrixRow = Math.floor(i / MATRIX_COLS);
      if (oneDotPerPatient) {
        return {
          x: MATRIX_X + col * matrixStepX + patientDotR,
          y: matrixTop + matrixRow * matrixStepY + patientDotR
        };
      }
      return {
        x: MATRIX_X + col * matrixStepX,
        y: (matrixRow - (d.matrixRows - 1) / 2) * matrixStepY
      };
    });

    if (oneDotPerPatient) {
      const sueEllenDotIndex =
        d.organKey === LIVER_LUNG_COMBO_KEY ? d.dotCount - 1 : -1;
      matrixDots.forEach((point, index) => {
        const isSueEllenDot = index === sueEllenDotIndex;
        appendComboPatientDot(row, {
          cx: point.x,
          cy: point.y,
          r: patientDotR,
          organs: d.organs,
          solidColor: isSueEllenDot ? SUE_ELLEN_SUNSHINE : null,
          solidStroke: isSueEllenDot ? SUE_ELLEN_SUNSHINE_OUTLINE : null,
          solidStrokeWidth: isSueEllenDot ? 1.85 : 0
        });
      });
    } else {
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
    }
  });

  comboGroups.each(function (d) {
    const row = d3.select(this);
    if (oneDotPerPatient) {
      drawComboLabelWithOrganHighlights(row, d, { x: LABEL_X, y: 4 });
      return;
    }
    const labelText = applyType(
      row
        .append("text")
        .attr("x", LABEL_X)
        .attr("y", 4)
        .attr("text-anchor", "start")
        .attr("fill", storyColors.textPrimary),
      typography.label
    );
    wrapSvgText(labelText, d.label, LABEL_MAX_WIDTH, LABEL_LINE_HEIGHT);
  });

  if (oneDotPerPatient) {
    const sueEllenRow = rowLayouts.find(r => r.organKey === LIVER_LUNG_COMBO_KEY);
    if (sueEllenRow && sueEllenRow.dotCount > 0) {
      const lastIndex = sueEllenRow.dotCount - 1;
      const lastCol = lastIndex % MATRIX_COLS;
      const lastMatrixRow = Math.floor(lastIndex / MATRIX_COLS);
      drawComboCallout(listG, {
        anchorX: MATRIX_X + lastCol * matrixStepX + patientDotR,
        anchorY: sueEllenRow.y + lastMatrixRow * matrixStepY + patientDotR,
        text: SUE_ELLEN_COMBO_LABEL,
        boxOffsetX: SUE_ELLEN_CALLOUT_OFFSET_X,
        boxOffsetY: SUE_ELLEN_CALLOUT_OFFSET_Y,
        leaderEnd: "left"
      });
    }
  } else if (options.highlightComboKey && options.featuredComboLabel) {
    const featured = rowLayouts.find(r => r.organKey === options.highlightComboKey);
    if (featured) {
      drawComboCallout(listG, {
        anchorX: MATRIX_X + countMarkerSize / 2,
        anchorY: featured.y + 4,
        text: options.featuredComboLabel
      });
    }
  }

  const footerY = oneDotPerPatient && rowLayouts.length
    ? d3.max(rowLayouts, r => r.y + r.rowHeight) + 36
    : SOURCE_Y;
  renderFooter(svg, g, options, footerY, FOOTER_LINE_HEIGHT, FOOTER_NOTE_MAX_WIDTH);

  if (oneDotPerPatient && rowLayouts.length) {
    const contentEnd = footerY + footerHeight;
    const chartSpan = contentEnd - HEADER_GRID.dividerY;
    const defaultChartH = STAGE.height - HEADER_GRID.dividerY;
    if (chartSpan > defaultChartH) {
      svg
        .attr("viewBox", `0 ${HEADER_GRID.dividerY} ${STAGE.width} ${chartSpan}`)
        .style("flex", "0 0 auto");
      container.style("overflow-y", "auto");
    }
  }
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
    sources: [OPTN_MULTI_ORGAN_SOURCE, OPTN_MULTI_ORGAN_SINGLE_ORGAN_SOURCE]
  });
}

/** Gap (flow) detail 2/5 — multi-organ overview (minimum one marker per row). */
export function runScene3MultiOrganDetail() {
  return runMultiOrganTransplants({
    sceneLabel: "Scene 3  \u00b7  detail",
    title: "Multi-organ transplants range from numerous to rare.",
    subtitle:
      "Each square represents about 20 transplants. Waitlist data is not available for multi-organ combinations.",
    useWaffleCountMarkers: true,
    highlightComboKey: "Liver-Lung",
    featuredComboLabel: "SueEllen Mobley Stepenson",
    sources: [OPTN_MULTI_ORGAN_SOURCE, OPTN_MULTI_ORGAN_SINGLE_ORGAN_SOURCE]
  });
}

/** Supplemental appendix — one dot per patient on a shared wide matrix scale. */
export function runAppendixMultiOrganTrueScaleDetail() {
  return runMultiOrganTransplants({
    sceneLabel: "Appendix",
    title: "Appendix: Multi-organ transplants at one patient per dot",
    subtitle: "Scale: 1 patient is 1 dot. Reflect 2025 OPTN patient counts.",
    oneDotPerPatient: true,
    sources: [OPTN_MULTI_ORGAN_SOURCE]
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
