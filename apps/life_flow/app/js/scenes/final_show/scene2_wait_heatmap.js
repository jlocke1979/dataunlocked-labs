import { organColorByName, storyColors } from "../../constants/colors.js";
import { typography } from "../../constants/typography.js";
import { beginChartScene, drawSource, applyType, renderPlaceholder, STAGE } from "./show_helpers.js";
import { OPTN_WAIT_TIME_SOURCE } from "./scene_references.js";

// ---------------------------------------------------------------------------
// Scene 2 — Distribution of wait times by organ.
//
// Headline: vertically stacked organ histograms + brass wait-time callouts.
// Detail (↓): Assignment 4 heatmap (no duplicate callouts).
// ---------------------------------------------------------------------------

const DATA_PATH = "./data/waitlist_wait_time.csv";

const ORGANS = [
  "Intestine",
  "Pancreas",
  "Kidney",
  "Kidney / Pancreas",
  "Heart",
  "Liver",
  "Lung"
];

const BUCKETS = [
  ["< 30 Days", "<30 d"],
  ["30 to < 90 Days", "30\u201390 d"],
  ["90 Days to < 6 Months", "90 d\u2013<6 mo"],
  ["6 Months to < 1 Year", "6 mo\u2013<1 yr"],
  ["1 Year to < 2 Years", "1\u20132 yr"],
  ["2 Years to < 3 Years", "2\u20133 yr"],
  ["3 Years to < 5 Years", "3\u20135 yr"],
  ["5 or More Years", "5+ yr"]
];

const toNumber = s => +String(s).replace(/[",]/g, "") || 0;

/** Heatmap share shading saturates by this % (matches row legend + headline axis). */
const HEATMAP_PCT_COLOR_CAP = 25;

/** Headline bars — one bold organ hue per row (no within-row value shading). */
function stackedHistogramBarFill(organ) {
  const base = d3.color(organColorByName(organ));
  return base ? base.darker(0.12).formatHex() : storyColors.deepSlateHarbor;
}

/** Heatmap cells — light museum white → organ hue by share within row. */
function organShareFill(organ, pct, scaleMax) {
  const t = scaleMax > 0 ? Math.min(1, pct / scaleMax) : 0;
  const base = d3.color(organColorByName(organ));
  if (!base) {
    return d3.interpolateRgb(storyColors.museumWhite, storyColors.charcoalForest)(t);
  }
  const light = base.copy();
  light.opacity = 0.1;
  light.r += (255 - light.r) * 0.82;
  light.g += (255 - light.g) * 0.82;
  light.b += (255 - light.b) * 0.82;
  const dark = base.copy();
  dark.opacity = 0.9;
  return d3.interpolateRgb(light.formatRgb(), dark.formatRgb())(t);
}

function loadWaitTimeData(onReady) {
  const container = d3.select("#viz");
  container.selectAll("*").remove();

  fetch(DATA_PATH)
    .then(r => r.text())
    .then(text => {
      const matrix = d3.csvParseRows(text);
      const header = matrix[0];
      const rawRows = matrix.slice(1).filter(r => r[0] && r[0] !== "All Time");
      console.log("[Scene 2] data file loaded:", DATA_PATH);
      onReady(container, header, rawRows);
    })
    .catch(err => {
      console.error("[Scene 2] wait-time data failed to load:", err);
      renderPlaceholder(container, {
        sceneLabel: "Scene 2",
        title: "Distribution of wait times by organ",
        subtitle: "Wait-time distribution by organ.",
        note: "Scene 2 will show the wait-time heatmap and histogram detail."
      });
    });
}

/** Headline — vertically stacked organ rows. */
export function runScene2() {
  console.log("[Scene 2] loaded (stacked histograms)");
  loadWaitTimeData(renderStackedHistograms);
}

/** Detail — heatmap + colorbar (↓ from Scene 2). */
export function runScene2WaitHeatmap() {
  console.log("[Scene 2] loaded (heatmap detail)");
  loadWaitTimeData(renderHeatmap);
}

function buildDataContext(header, rawRows) {
  const organIdx = Object.fromEntries(ORGANS.map(o => [o, header.indexOf(o)]));
  const rowByBucket = Object.fromEntries(rawRows.map(r => [r[0], r]));
  return { organIdx, rowByBucket };
}

function buildHeatmapCells(organIdx, rowByBucket) {
  const cells = [];
  let maxPct = 0;
  ORGANS.forEach((organ, ri) => {
    const ci0 = organIdx[organ];
    const organTotal =
      d3.sum(BUCKETS, ([raw]) => {
        const row = rowByBucket[raw];
        return row ? toNumber(row[ci0]) : 0;
      }) || 1;
    BUCKETS.forEach(([raw], ci) => {
      const row = rowByBucket[raw];
      const value = row ? toNumber(row[ci0]) : 0;
      const pct = (value / organTotal) * 100;
      maxPct = Math.max(maxPct, pct);
      cells.push({ ri, ci, pct, value });
    });
  });
  return { cells, maxPct };
}

function heatmapRowLegendEndColor(organ) {
  return organShareFill(organ, HEATMAP_PCT_COLOR_CAP, HEATMAP_PCT_COLOR_CAP);
}

function drawHeatmapRowColorLegends(svg, { gridTop, cellH, gridRight }) {
  const legendLeft = gridRight + 14;
  const legendW = 54;
  const legendH = 6;
  const defs = svg.append("defs");

  ORGANS.forEach((organ, ri) => {
    const gradId = `scene2-heatmap-row-grad-${ri}`;
    const gradient = defs
      .append("linearGradient")
      .attr("id", gradId)
      .attr("x1", "0%")
      .attr("x2", "100%")
      .attr("y1", "0%")
      .attr("y2", "0%");

    gradient.append("stop").attr("offset", "0%").attr("stop-color", storyColors.museumWhite);
    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", heatmapRowLegendEndColor(organ));

    const rowCy = gridTop + ri * cellH + cellH / 2;
    svg
      .append("rect")
      .attr("class", "scene2-heatmap-row-legend")
      .attr("x", legendLeft)
      .attr("y", rowCy - legendH / 2)
      .attr("width", legendW)
      .attr("height", legendH)
      .attr("fill", `url(#${gradId})`)
      .attr("stroke", storyColors.softAshGray)
      .attr("stroke-opacity", 0.55)
      .attr("stroke-width", 0.5);
  });

  const firstRowCy = gridTop + cellH / 2;
  const labelY = firstRowCy - legendH / 2 - 5;
  applyType(
    svg
      .append("text")
      .attr("x", legendLeft)
      .attr("y", labelY)
      .attr("text-anchor", "start")
      .attr("fill", storyColors.textMuted)
      .text("0%"),
    typography.caption
  );
  applyType(
    svg
      .append("text")
      .attr("x", legendLeft + legendW)
      .attr("y", labelY)
      .attr("text-anchor", "end")
      .attr("fill", storyColors.textMuted)
      .text("25%"),
    typography.caption
  );
  applyType(
    svg
      .append("text")
      .attr("class", "scene2-heatmap-legend-note")
      .attr("x", legendLeft + legendW / 2)
      .attr("y", gridTop - 18)
      .attr("text-anchor", "middle")
      .attr("fill", storyColors.textMuted)
      .text("% of organ waitlist"),
    typography.caption
  );
}

function renderHeatmap(container, header, rawRows) {
  const { chartSvg: svg } = beginChartScene(container, {
    sceneLabel: "Scene 2  \u00b7  detail",
    title: "Distribution of wait times by organ",
    subtitle: "Share of each organ's waitlist by waiting period."
  });

  const { organIdx, rowByBucket } = buildDataContext(header, rawRows);
  const { cells } = buildHeatmapCells(organIdx, rowByBucket);

  const gridLeft = STAGE.contentLeft + 116;
  const gridTop = STAGE.contentTop + 32;
  const gridRight = STAGE.contentRight - 88;
  const gridBottom = STAGE.contentBottom - 34;
  const cellW = (gridRight - gridLeft) / BUCKETS.length;
  const cellH = (gridBottom - gridTop) / ORGANS.length;

  ORGANS.forEach((organ, ri) => {
    applyType(
      svg.append("text")
        .attr("x", gridLeft - 12)
        .attr("y", gridTop + ri * cellH + cellH / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .attr("fill", organColorByName(organ))
        .text(organ),
      typography.label
    );
  });

  BUCKETS.forEach(([, short], ci) => {
    applyType(
      svg.append("text")
        .attr("x", gridLeft + ci * cellW + cellW / 2)
        .attr("y", gridBottom + 22)
        .attr("text-anchor", "middle")
        .attr("fill", storyColors.textSecondary)
        .text(short),
      typography.label
    );
  });

  const HALF_IN = 48;
  const THREE_QUARTER_IN = 72;
  applyType(
    svg.append("text")
      .attr("x", (gridLeft + gridRight) / 2)
      .attr("y", gridBottom + 104 - THREE_QUARTER_IN + HALF_IN)
      .attr("text-anchor", "middle")
      .attr("fill", storyColors.textSecondary)
      .text("Candidate waiting period"),
    typography.label
  );

  svg.append("g")
    .selectAll("rect")
    .data(cells)
    .join("rect")
    .attr("x", d => gridLeft + d.ci * cellW)
    .attr("y", d => gridTop + d.ri * cellH)
    .attr("width", cellW)
    .attr("height", cellH)
    .attr("fill", d => organShareFill(ORGANS[d.ri], d.pct, HEATMAP_PCT_COLOR_CAP))
    .attr("stroke", storyColors.museumWhite)
    .attr("stroke-width", 2);

  drawHeatmapRowColorLegends(svg, { gridTop, cellH, gridRight });

  drawSource(svg, OPTN_WAIT_TIME_SOURCE, STAGE.captionY + 48);
}

function renderStackedHistograms(container, header, rawRows) {
  const { chartSvg: svg } = beginChartScene(container, {
    sceneLabel: "Scene 2",
    title: "Distribution of wait times by organ",
    subtitle:
      "Candidates may experience vastly different wait times depending on the organ"
  });

  const { organIdx, rowByBucket } = buildDataContext(header, rawRows);
  const organSeries = buildOrganSeries(organIdx, rowByBucket);
  const maxPct = d3.max(organSeries, d => d3.max(d.buckets, b => b.pct)) ?? 0;
  const yMax = Math.ceil(maxPct / 5) * 5;

  const layout = drawStackedOrganHistograms(svg, organSeries, { yMax });
  drawScene2WaitCallouts(svg, stackedHistogramCallouts(layout));

  drawSource(svg, OPTN_WAIT_TIME_SOURCE, STAGE.captionY + 48);
}

function buildOrganSeries(organIdx, rowByBucket) {
  return ORGANS.map(organ => {
    const ci0 = organIdx[organ];
    const organTotal =
      d3.sum(BUCKETS, ([raw]) => {
        const row = rowByBucket[raw];
        return row ? toNumber(row[ci0]) : 0;
      }) || 1;
    const buckets = BUCKETS.map(([raw, short], bucketIndex) => {
      const row = rowByBucket[raw];
      const value = row ? toNumber(row[ci0]) : 0;
      const pct = (value / organTotal) * 100;
      return { bucketIndex, short, pct, value };
    });
    return { organ, buckets };
  });
}

const ROW_PCT_AXIS_TICKS = [0, 25];

function drawRowPercentAxis(g, { plotRight, baseline, heightScale, rowIndex, rowCount }) {
  const axisG = g.append("g").attr("class", "scene2-row-axis");
  const tickX0 = plotRight + 3;
  const tickLen = 5;
  const labelX = plotRight + 11;

  ROW_PCT_AXIS_TICKS.forEach(pct => {
    const y = baseline - heightScale(pct);
    axisG.append("line")
      .attr("x1", tickX0)
      .attr("x2", tickX0 + tickLen)
      .attr("y1", y)
      .attr("y2", y)
      .attr("stroke", storyColors.softAshGray)
      .attr("stroke-opacity", 0.65)
      .attr("stroke-width", 0.75);

    const label =
      pct === 0 ? (rowIndex === rowCount - 1 ? "0" : null) : `${pct}%`;
    if (!label) return;

    applyType(
      axisG.append("text")
        .attr("x", labelX)
        .attr("y", y)
        .attr("dy", "0.32em")
        .attr("text-anchor", "start")
        .attr("fill", storyColors.textMuted)
        .text(label),
      typography.caption
    );
  });
}

function drawStackedOrganHistograms(svg, organSeries, { yMax }) {
  const labelW = 108;
  const plotLeft = STAGE.contentLeft + labelW;
  const plotRight = STAGE.contentRight - 118;
  const plotTop = STAGE.contentTop + 4;
  const plotBottom = STAGE.contentBottom - 46;
  const rowH = (plotBottom - plotTop) / organSeries.length;
  const rowPadY = 5;
  const barPadX = 6;

  const x = d3.scaleBand()
    .domain(BUCKETS.map((_, i) => i))
    .range([plotLeft + barPadX, plotRight - barPadX])
    .padding(0.1);

  const heightScale = d3.scaleLinear()
    .domain([0, yMax])
    .range([0, rowH - rowPadY * 2]);

  const stack = svg.append("g").attr("class", "scene2-stacked-histograms");

  organSeries.forEach((series, ri) => {
    const rowTop = plotTop + ri * rowH;
    const rowBottom = rowTop + rowH;
    const baseline = rowBottom - rowPadY;

    if (ri > 0) {
      stack.append("line")
        .attr("x1", plotLeft)
        .attr("x2", plotRight)
        .attr("y1", rowTop)
        .attr("y2", rowTop)
        .attr("stroke", storyColors.divider)
        .attr("stroke-opacity", 0.35);
    }

    applyType(
      stack.append("text")
        .attr("x", plotLeft - 10)
        .attr("y", rowTop + rowH / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .attr("fill", organColorByName(series.organ))
        .text(series.organ),
      typography.label
    );

    const rowG = stack.append("g").attr("class", "scene2-stacked-row");

    rowG.selectAll("rect.bar")
      .data(series.buckets)
      .join("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.bucketIndex))
      .attr("y", d => baseline - heightScale(d.pct))
      .attr("width", x.bandwidth())
      .attr("height", d => heightScale(d.pct))
      .attr("fill", stackedHistogramBarFill(series.organ))
      .attr("stroke", storyColors.museumWhite)
      .attr("stroke-width", 1.25)
      .attr("rx", 1.5);

    drawRowPercentAxis(stack, {
      plotRight,
      baseline,
      heightScale,
      rowIndex: ri,
      rowCount: organSeries.length
    });
  });

  applyType(
    svg.append("text")
      .attr("class", "scene2-row-axis-title")
      .attr("x", plotRight + 11)
      .attr("y", plotTop - 2)
      .attr("text-anchor", "start")
      .attr("fill", storyColors.textMuted)
      .text("% of organ waitlist"),
    typography.caption
  );

  BUCKETS.forEach(([, short], bucketIndex) => {
    applyType(
      svg.append("text")
        .attr("x", x(bucketIndex) + x.bandwidth() / 2)
        .attr("y", plotBottom + 16)
        .attr("text-anchor", "middle")
        .attr("fill", storyColors.textMuted)
        .text(short),
      typography.label
    );
  });

  applyType(
    svg.append("text")
      .attr("x", (plotLeft + plotRight) / 2)
      .attr("y", plotBottom + 88)
      .attr("text-anchor", "middle")
      .attr("fill", storyColors.textSecondary)
      .text("Candidate waiting period"),
    typography.label
  );

  return {
    plotTop,
    plotBottom,
    plotRight,
    rowH,
    rowPadY,
    x,
    heightScale,
    organSeries
  };
}

function stackedHistogramCallouts({ plotTop, rowH, rowPadY, x, heightScale, organSeries }) {
  const intestineRow = 0;
  const lungRow = organSeries.length - 1;
  const fivePlusCol = BUCKETS.length - 1;
  const under30Col = 0;
  const HALF_IN = 48;
  const QUARTER_IN = 24;
  const TWO_IN = 192;
  const padY = 11;
  const textLineH = typography.caption.size * 1.35;
  const boxH = padY * 2 + textLineH * 2;
  const longWaitBoxW = 252;
  const shortWaitBoxW = 264;

  const fivePlusCx = x(fivePlusCol) + x.bandwidth() / 2;
  const under30Cx = x(under30Col) + x.bandwidth() / 2;
  const under30BoxCx = x(under30Col) + 18 - TWO_IN + 105;

  const intestineRowTop = plotTop + intestineRow * rowH;
  const intestineBaseline = intestineRowTop + rowH - rowPadY;
  const intestineFivePlusPct = organSeries[intestineRow].buckets[fivePlusCol].pct;
  const intestineAnchorY = intestineBaseline - heightScale(intestineFivePlusPct) / 2;

  const lungRowTop = plotTop + lungRow * rowH;
  const lungBaseline = lungRowTop + rowH - rowPadY;
  const lungUnder30Pct = organSeries[lungRow].buckets[under30Col].pct;
  const lungAnchorY = lungBaseline - heightScale(lungUnder30Pct) / 2;

  const longWaitBoxShiftLeft = 96;
  const longWaitBoxShiftDown = HALF_IN - QUARTER_IN;

  return [
    {
      anchorX: fivePlusCx,
      anchorY: intestineAnchorY,
      text: "Intestine has a high % of candidates waiting 5+ years",
      boxX: fivePlusCx - longWaitBoxW / 2 - longWaitBoxShiftLeft,
      boxY: intestineRowTop - 34 - QUARTER_IN + longWaitBoxShiftDown,
      boxW: longWaitBoxW,
      boxH
    },
    {
      anchorX: under30Cx,
      anchorY: lungAnchorY,
      text: "Lung has a high % of candidates waiting 30 days or less",
      boxX: under30BoxCx - shortWaitBoxW / 2,
      boxY: lungRowTop + rowH / 2 + 8 + HALF_IN,
      boxW: shortWaitBoxW,
      boxH
    }
  ];
}

function wrapScene2CalloutText(text, boxW, padX = 10) {
  const maxWidth = boxW - padX * 2;
  const charWidth = typography.caption.size * 0.52;
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  words.forEach(word => {
    const next = line ? `${line} ${word}` : word;
    if (next.length * charWidth > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function drawScene2WaitCallouts(svg, callouts) {
  const layer = svg.append("g").attr("class", "scene2-wait-callouts");
  const textLineH = typography.caption.size * 1.35;
  callouts.forEach(d => {
    const g = layer.append("g").attr("class", "scene2-wait-callout");
    const lines = wrapScene2CalloutText(d.text, d.boxW);
    const padY = 11;
    const boxH = d.boxH ?? padY * 2 + textLineH * lines.length;
    const boxCx = d.boxX + d.boxW / 2;
    const boxCy = d.boxY + boxH / 2;

    g.append("line")
      .attr("stroke", storyColors.weatheredBrass)
      .attr("stroke-width", 1)
      .attr("x1", d.anchorX)
      .attr("y1", d.anchorY)
      .attr("x2", boxCx)
      .attr("y2", boxCy);
    g.append("rect")
      .attr("x", d.boxX)
      .attr("y", d.boxY)
      .attr("width", d.boxW)
      .attr("height", boxH)
      .attr("rx", 3)
      .attr("fill", storyColors.museumWhite)
      .attr("stroke", storyColors.weatheredBrass)
      .attr("stroke-width", 1);
    const text = applyType(
      g.append("text")
        .attr("x", boxCx)
        .attr("y", boxCy - ((lines.length - 1) * textLineH) / 2)
        .attr("text-anchor", "middle")
        .attr("fill", storyColors.textPrimary),
      typography.caption
    );
    lines.forEach((line, i) => {
      text.append("tspan")
        .attr("x", boxCx)
        .attr("dy", i === 0 ? "0.35em" : textLineH)
        .text(line);
    });
  });
}

