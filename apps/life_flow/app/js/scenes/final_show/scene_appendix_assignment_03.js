import { organColors, storyColors } from "../../constants/colors.js";
import { typography } from "../../constants/typography.js";
import {
  applyType,
  beginChartScene,
  drawSource,
  HEADER_GRID,
  HEADER_TOP_VH,
  STAGE
} from "./show_helpers.js";
import { OPTN_DIAGNOSIS_SOURCE } from "./scene_references.js";

const WAITLIST_CSV =
  "../assignments/assignment_03_hierarchial/data/raw/Organ_by_Diagnosis.csv";
const TRANSPLANT_CSV =
  "../assignments/assignment_03_hierarchial/data/raw/Transplant___Organ_by_Recipient_Diagnosis.csv";

const TOP_N = 8;
const PANEL_TOP = STAGE.contentTop + 36;
const PANEL_HEIGHT = 368;
const PANEL_WIDTH = 468;
const PANEL_GAP = 48;
const PANEL_LEFT = STAGE.marginX;
const PANEL_RIGHT = STAGE.marginX + PANEL_WIDTH + PANEL_GAP;

const ORGAN_PRIORITY = [
  "Kidney",
  "Liver",
  "Heart",
  "Lung",
  "Pancreas",
  "Kidney / Pancreas",
  "Heart / Lung",
  "Intestine"
];

/** One concise callout per organ — placed in margin whitespace, not over treemap tiles. */
const ORGAN_CALLOUTS = {
  Kidney: "Diabetes dominates kidney waitlist and transplants",
  Liver: "Cirrhosis diagnoses lead liver waitlist demand",
  Heart: "Cardiomyopathy is the top heart waitlist driver",
  Lung: "Pulmonary fibrosis leads lung waitlist registrations",
  Pancreas: "Type I diabetes drives pancreas waitlist volume",
  "Kidney / Pancreas": "Diabetes underlies most kidney\u2013pancreas listings",
  "Heart / Lung": "Congenital and cardiomyopathy cases fill this rare pairing",
  Intestine: "Short gut syndrome leads intestine transplants"
};

const INCH_PX = 96;
const CALLOUT_CENTER_X = STAGE.width / 2;
const QUARTER_IN = 24;
const EIGHTH_IN = 12;
const CALLOUT_TOP_Y = STAGE.contentTop + 8 - QUARTER_IN - EIGHTH_IN;
/** When the organ-selector callout is shown, shift the diagnosis callout left to make room. */
const ORGAN_CALLOUT_SHIFT_LEFT = 2 * INCH_PX;
const SELECTOR_CALLOUT_GAP = 20;

const toNum = s => +String(s == null ? "" : s).replace(/[",\s]/g, "") || 0;

/** Wide OPTN diagnosis × organ export → { organs, byOrgan }. */
function parseDiagnosisByOrgan(csvText) {
  const rows = d3.csvParseRows(csvText);
  const headers = rows[0].map(h => String(h || "").trim());
  const organs = headers.slice(2).filter(name => name && name !== "All Organs");
  const organColIndex = Object.fromEntries(organs.map(name => [name, headers.indexOf(name)]));
  const byOrgan = Object.fromEntries(organs.map(name => [name, []]));

  for (let i = 1; i < rows.length; i++) {
    const diagnosis = (rows[i][0] || "").trim();
    if (!diagnosis || /^All Diagnos/i.test(diagnosis)) continue;

    organs.forEach(organ => {
      const value = toNum(rows[i][organColIndex[organ]]);
      if (value > 0) byOrgan[organ].push({ diagnosis, value });
    });
  }

  return { organs, byOrgan };
}

/** Keep top diagnoses; roll remainder into Other. */
function rollupTopN(entries, topN = TOP_N) {
  const sorted = [...entries].sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, topN);
  const otherSum = d3.sum(sorted.slice(topN), d => d.value);
  if (otherSum > 0) top.push({ diagnosis: "Other", value: otherSum });
  return top;
}

function isVcaOrgan(organ) {
  return /^VCA\b/i.test(organ);
}

function selectableOrgans(waitlist, transplants) {
  const names = new Set([...waitlist.organs, ...transplants.organs]);
  const withData = [...names].filter(organ => {
    if (isVcaOrgan(organ)) return false;
    const wait = d3.sum(waitlist.byOrgan[organ] || [], d => d.value);
    const txp = d3.sum(transplants.byOrgan[organ] || [], d => d.value);
    return wait > 0 || txp > 0;
  });
  const ordered = ORGAN_PRIORITY.filter(o => withData.includes(o));
  const rest = withData.filter(o => !ORGAN_PRIORITY.includes(o)).sort();
  return [...ordered, ...rest];
}

function truncateLabel(text, max = 24) {
  return text.length <= max ? text : `${text.slice(0, max - 1)}\u2026`;
}

function diagnosisColor(index, count, baseHex) {
  const t = count <= 1 ? 0.5 : index / (count - 1);
  return d3.interpolateRgb(baseHex, storyColors.museumWhite)(0.35 + t * 0.45);
}

function ensureTreemapTooltip(container) {
  let tip = container.select(".treemap-diagnosis-tooltip");
  if (!tip.empty()) return tip;
  return container
    .append("div")
    .attr("class", "treemap-diagnosis-tooltip")
    .style("position", "fixed")
    .style("left", "0")
    .style("top", "0")
    .style("display", "none")
    .style("max-width", "300px")
    .style("padding", "8px 10px")
    .style("background", storyColors.museumWhite)
    .style("border", `1px solid ${storyColors.softAshGray}`)
    .style("border-radius", "4px")
    .style("box-shadow", "0 2px 8px rgba(32, 38, 35, 0.12)")
    .style("font-family", typography.caption.family)
    .style("font-size", `${typography.caption.size}px`)
    .style("color", storyColors.textPrimary)
    .style("line-height", "1.35")
    .style("pointer-events", "none")
    .style("z-index", "30");
}

function positionTreemapTooltip(tip, event) {
  const pad = 12;
  const rect = tip.node().getBoundingClientRect();
  let x = event.clientX + pad;
  let y = event.clientY + pad;
  if (x + rect.width > window.innerWidth - 8) x = event.clientX - rect.width - pad;
  if (y + rect.height > window.innerHeight - 8) y = event.clientY - rect.height - pad;
  tip.style("left", `${x}px`).style("top", `${y}px`);
}

function hideTreemapTooltip(tip) {
  tip.style("display", "none").selectAll("*").remove();
}

function appendBrassCallout(parent, { text, centerX, boxY, className, padX = 10, padY = 8 }) {
  const lineH = typography.caption.size * 1.4;
  const textW = Math.max(96, Math.min(340, text.length * 6.2));
  const boxW = textW + padX * 2;
  const boxH = lineH + padY * 2;
  const boxX = centerX - boxW / 2;
  const g = parent.append("g").attr("class", className);

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
      .attr("x", centerX)
      .attr("y", boxY + padY + lineH * 0.72)
      .attr("text-anchor", "middle")
      .attr("fill", storyColors.textPrimary)
      .text(text),
    typography.caption
  );

  return { g, boxX, boxY, boxW, boxH, centerX };
}

function measureOrganLabelAnchor(container, svgRoot) {
  const fallback = {
    x: STAGE.width - 196,
    y: HEADER_GRID.dividerY + 16
  };
  const label = container.select(".treemap-organ-selector-label").node();
  if (!label || !svgRoot) return fallback;

  const rect = label.getBoundingClientRect();
  const pt = svgRoot.createSVGPoint();
  pt.x = rect.left + rect.width * 0.5 - 10;
  pt.y = rect.bottom - 3;
  const svgPt = pt.matrixTransform(svgRoot.getScreenCTM().inverse());
  return { x: svgPt.x, y: svgPt.y };
}

function drawOrganCallouts(parent, organText, showSelectorCallout = false, container = null) {
  parent
    .selectAll("g.organ-callout, g.organ-selector-callout, g.organ-selector-callout-leader")
    .remove();

  const organCenterX = showSelectorCallout
    ? CALLOUT_CENTER_X - ORGAN_CALLOUT_SHIFT_LEFT
    : CALLOUT_CENTER_X;
  const boxY = CALLOUT_TOP_Y;
  let organBox = null;

  if (organText) {
    organBox = appendBrassCallout(parent, {
      text: organText,
      centerX: organCenterX,
      boxY,
      className: "organ-callout"
    });
  }

  if (!showSelectorCallout) return;

  const selectorText = "Select an organ";
  const selectorPadX = 8;
  const selectorTextW = Math.max(96, selectorText.length * 6.4);
  const selectorBoxW = selectorTextW + selectorPadX * 2;
  const selectorCenterX = organBox
    ? organBox.boxX + organBox.boxW + SELECTOR_CALLOUT_GAP + selectorBoxW / 2
    : CALLOUT_CENTER_X + selectorBoxW / 2 + SELECTOR_CALLOUT_GAP;
  const selectorBox = appendBrassCallout(parent, {
    text: selectorText,
    centerX: selectorCenterX,
    boxY,
    className: "organ-selector-callout",
    padX: selectorPadX,
    padY: 6
  });

  const svgRoot = parent.node()?.ownerSVGElement;
  const apex = measureOrganLabelAnchor(container, svgRoot);
  const leader = parent.append("g").attr("class", "organ-selector-callout-leader");
  const yStart = selectorBox.boxY + 2;
  const leftStartX = selectorBox.boxX + selectorBox.boxW * 0.22;
  const rightStartX = selectorBox.boxX + selectorBox.boxW * 0.78;

  leader
    .append("line")
    .attr("stroke", storyColors.weatheredBrass)
    .attr("stroke-width", 1)
    .attr("x1", leftStartX)
    .attr("y1", yStart)
    .attr("x2", apex.x)
    .attr("y2", apex.y);
  leader
    .append("line")
    .attr("stroke", storyColors.weatheredBrass)
    .attr("stroke-width", 1)
    .attr("x1", rightStartX)
    .attr("y1", yStart)
    .attr("x2", apex.x)
    .attr("y2", apex.y);
}

function renderTreemapPanel(g, entries, bbox, { title, panelKind, organ, tooltip }) {
  const total = d3.sum(entries, d => d.value);
  const base = organColors[organ] || storyColors.deepSlateHarbor;

  g.selectAll("*").remove();

  applyType(
    g.append("text").attr("x", bbox.x).attr("y", bbox.y - 10).attr("fill", storyColors.textPrimary).text(title),
    typography.label
  );

  if (!entries.length || total === 0) {
    applyType(
      g.append("text")
        .attr("x", bbox.x + bbox.width / 2)
        .attr("y", bbox.y + bbox.height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", storyColors.textMuted)
        .text("No data for this organ"),
      typography.caption
    );
    return;
  }

  const root = d3
    .hierarchy({ children: entries })
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value);

  d3
    .treemap()
    .tile(d3.treemapSquarify)
    .size([bbox.width, bbox.height])
    .paddingInner(2)
    .round(true)(root);

  const leaves = root.leaves();
  const unitLabel =
    panelKind === "waitlist" ? "waitlist registrations" : "transplants";

  const cell = g
    .selectAll("g.cell")
    .data(leaves)
    .join("g")
    .attr("class", "cell")
    .attr("transform", d => `translate(${bbox.x + d.x0},${bbox.y + d.y0})`)
    .style("cursor", "pointer");

  cell
    .append("rect")
    .attr("class", "cell-rect")
    .attr("width", d => Math.max(0, d.x1 - d.x0))
    .attr("height", d => Math.max(0, d.y1 - d.y0))
    .attr("fill", (d, i) => diagnosisColor(i, leaves.length, base))
    .attr("stroke", storyColors.museumWhite)
    .attr("stroke-width", 1);

  cell
    .filter(d => d.x1 - d.x0 > 54 && d.y1 - d.y0 > 22)
    .append("text")
    .attr("pointer-events", "none")
    .attr("x", 4)
    .attr("y", 14)
    .attr("fill", storyColors.textPrimary)
    .text(d => truncateLabel(d.data.diagnosis, d.x1 - d.x0 > 120 ? 28 : 16))
    .call(applyType, typography.caption);

  if (tooltip) {
    cell
      .on("mouseenter", function (event, d) {
        const share = ((d.data.value / total) * 100).toFixed(1);
        tooltip.selectAll("*").remove();
        tooltip
          .append("div")
          .style("font-weight", "600")
          .style("margin-bottom", "3px")
          .text(d.data.diagnosis);
        tooltip.append("div").text(`${d3.format(",")(d.data.value)} ${unitLabel}`);
        tooltip
          .append("div")
          .style("color", storyColors.textSecondary)
          .style("margin-top", "2px")
          .text(`${share}% of ${organ}`);
        tooltip.style("display", "block");
        positionTreemapTooltip(tooltip, event);
        d3.select(this)
          .select("rect.cell-rect")
          .attr("stroke", storyColors.weatheredBrass)
          .attr("stroke-width", 2);
      })
      .on("mousemove", function (event) {
        positionTreemapTooltip(tooltip, event);
      })
      .on("mouseleave", function () {
        hideTreemapTooltip(tooltip);
        d3.select(this)
          .select("rect.cell-rect")
          .attr("stroke", storyColors.museumWhite)
          .attr("stroke-width", 1);
      });
  }
}

/**
 * Organ-filtered diagnosis treemaps (normalized within organ).
 * @param {{ sceneLabel?: string, title?: string, subtitle?: string, showOrganSelectorCallout?: boolean }} [options]
 */
export function runDiagnosisTreemap(options = {}) {
  const container = d3.select("#viz");
  container.selectAll("*").remove();

  const { chartSvg: svg } = beginChartScene(container, {
    sceneLabel: options.sceneLabel ?? "Appendix",
    title: options.title ?? "Waitlist demand vs. transplants by diagnosis",
    subtitle:
      options.subtitle ??
      "Select an organ \u2014 each treemap shows diagnosis share within that organ (top 8 + Other)"
  });

  const chart = svg.append("g").attr("class", "appendix-a03-chart");
  const waitPanel = chart.append("g").attr("class", "waitlist-panel");
  const txpPanel = chart.append("g").attr("class", "transplant-panel");
  const summary = chart.append("g").attr("class", "appendix-a03-summary");
  const tooltip = ensureTreemapTooltip(container);

  const control = container
    .append("div")
    .attr("class", "treemap-organ-selector")
    .style("position", "absolute")
    .style("top", `calc(${HEADER_TOP_VH}vh + 8px)`)
    .style("right", "48px")
    .style("font-family", typography.label.family)
    .style("font-size", `${typography.label.size}px`)
    .style("color", storyColors.textSecondary)
    .style("z-index", "2");

  control
    .append("span")
    .attr("class", "treemap-organ-selector-label")
    .text("Organ: ")
    .style("margin-right", "6px");
  const select = control
    .append("select")
    .style("font", "inherit")
    .style("padding", "4px 8px")
    .style("border", `1px solid ${storyColors.divider}`)
    .style("border-radius", "6px")
    .style("background", storyColors.museumWhite)
    .style("color", storyColors.textPrimary);

  let waitlistData = null;
  let transplantData = null;
  let selectedOrgan = "Kidney";

  function draw(organ) {
    selectedOrgan = organ;
    hideTreemapTooltip(tooltip);
    const waitEntries = rollupTopN(waitlistData.byOrgan[organ] || []);
    const txpEntries = rollupTopN(transplantData.byOrgan[organ] || []);
    const waitTotal = d3.sum(waitlistData.byOrgan[organ] || [], d => d.value);
    const txpTotal = d3.sum(transplantData.byOrgan[organ] || [], d => d.value);

    renderTreemapPanel(waitPanel, waitEntries, {
      x: PANEL_LEFT,
      y: PANEL_TOP,
      width: PANEL_WIDTH,
      height: PANEL_HEIGHT
    }, {
      title: "Waitlist registrations (share within organ)",
      panelKind: "waitlist",
      organ,
      tooltip
    });

    renderTreemapPanel(txpPanel, txpEntries, {
      x: PANEL_RIGHT,
      y: PANEL_TOP,
      width: PANEL_WIDTH,
      height: PANEL_HEIGHT
    }, {
      title: "2025 transplants (share within organ)",
      panelKind: "transplant",
      organ,
      tooltip
    });

    summary.selectAll("*").remove();
    applyType(
      summary
        .append("text")
        .attr("x", STAGE.marginX)
        .attr("y", PANEL_TOP + PANEL_HEIGHT + 28)
        .attr("fill", storyColors.textSecondary)
        .text(
          `${organ}: ${d3.format(",")(waitTotal)} waitlist registrations vs ${d3.format(",")(txpTotal)} transplants. ` +
            "Tile area = diagnosis share within the selected organ, not national totals."
        ),
      typography.caption
    );

    drawOrganCallouts(chart, ORGAN_CALLOUTS[organ], options.showOrganSelectorCallout, container);
  }

  Promise.all([d3.text(WAITLIST_CSV), d3.text(TRANSPLANT_CSV)])
    .then(([waitText, txpText]) => {
      waitlistData = parseDiagnosisByOrgan(waitText);
      transplantData = parseDiagnosisByOrgan(txpText);
      const organs = selectableOrgans(waitlistData, transplantData);

      select.selectAll("option").remove();
      select
        .selectAll("option")
        .data(organs)
        .join("option")
        .attr("value", d => d)
        .text(d => d);

      if (!organs.includes(selectedOrgan)) selectedOrgan = organs[0] || "Kidney";
      select.property("value", selectedOrgan);
      select.on("change", function () {
        draw(this.value);
      });

      draw(selectedOrgan);
      drawSource(svg, OPTN_DIAGNOSIS_SOURCE);
    })
    .catch(err => {
      console.error("[Appendix A03] data load error:", err);
      applyType(
        chart
          .append("text")
          .attr("x", STAGE.marginX)
          .attr("y", STAGE.contentTop + 40)
          .attr("fill", storyColors.textMuted)
          .text("Could not load OPTN diagnosis data."),
        typography.body
      );
    });
}

export function runAppendixAssignment03() {
  return runDiagnosisTreemap();
}

/** Scene 3 detail — same treemap, story framing. */
export function runScene3TreemapDetail() {
  return runDiagnosisTreemap({
    sceneLabel: "Scene 3  \u00b7  detail",
    title: "What is driving transplant demand?",
    subtitle: "Diagnosis patterns emerge for each organ.",
    showOrganSelectorCallout: true
  });
}
