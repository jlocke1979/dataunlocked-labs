import { organColorByName, storyColors } from "../../constants/colors.js";
import { typography } from "../../constants/typography.js";
import { beginChartScene, drawSource, applyType, renderPlaceholder, STAGE } from "./show_helpers.js";

// ---------------------------------------------------------------------------
// Scene 2 — Distribution of wait times by organ.
//
// Headline: vertically stacked organ histograms.
// Detail (↓): Assignment 4 heatmap + continuous colorbar legend.
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

/** Light museum white → organ hue; keeps Scene 2 aligned with Scene 1 / 4 palette. */
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
        subtitle: "Wait-time distribution from Assignment 4.",
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

function renderHeatmap(container, header, rawRows) {
  const { chartSvg: svg } = beginChartScene(container, {
    sceneLabel: "Scene 2  \u00b7  detail",
    title: "Distribution of wait times by organ",
    subtitle: "Heatmap view — share of each organ's waitlist by waiting period"
  });

  const { organIdx, rowByBucket } = buildDataContext(header, rawRows);
  const { cells, maxPct } = buildHeatmapCells(organIdx, rowByBucket);

  const gridLeft = STAGE.contentLeft + 116;
  const gridTop = STAGE.contentTop + 32;
  const gridRight = STAGE.contentRight - 96;
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

  applyType(
    svg.append("text")
      .attr("x", (gridLeft + gridRight) / 2)
      .attr("y", gridBottom + 50)
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
    .attr("fill", d => organShareFill(ORGANS[d.ri], d.pct, maxPct))
    .attr("stroke", storyColors.museumWhite)
    .attr("stroke-width", 2);

  drawHeatmapCallouts(svg, {
    gridLeft,
    gridTop,
    cellW,
    cellH,
    intestineRow: 0,
    lungRow: ORGANS.length - 1,
    fivePlusCol: BUCKETS.length - 1,
    under30Col: 0
  });

  drawShareAxis(svg, maxPct, { gridRight, gridTop, gridBottom });

  drawSource(
    svg,
    "Source: Organ Procurement and Transplantation Network (OPTN), 2025. Adapted from Assignment 04 (relational).",
    STAGE.captionY + 48
  );
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
  drawShareAxis(svg, yMax, layout);

  drawSource(
    svg,
    "Source: Organ Procurement and Transplantation Network (OPTN), 2025. Adapted from Assignment 04 (relational).",
    STAGE.captionY + 48
  );
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

function drawStackedOrganHistograms(svg, organSeries, { yMax }) {
  const labelW = 108;
  const plotLeft = STAGE.contentLeft + labelW;
  const plotRight = STAGE.contentRight - 96;
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
      .attr("fill", d => organShareFill(series.organ, d.pct, yMax))
      .attr("stroke", storyColors.museumWhite)
      .attr("stroke-width", 1)
      .attr("rx", 1.5);
  });

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
      .attr("y", plotBottom + 34)
      .attr("text-anchor", "middle")
      .attr("fill", storyColors.textSecondary)
      .text("Candidate waiting period"),
    typography.label
  );

  return {
    gridRight: plotRight,
    gridTop: plotTop,
    gridBottom: plotBottom
  };
}

function drawHeatmapCallouts(
  svg,
  { gridLeft, gridTop, cellW, cellH, intestineRow, lungRow, fivePlusCol, under30Col }
) {
  const HALF_IN = 48;
  const QUARTER_IN = 24;
  const TWO_IN = 192;
  const padY = 11;
  const textLineH = typography.caption.size * 1.35;
  const boxH = padY * 2 + textLineH;

  const fivePlusCx = gridLeft + fivePlusCol * cellW + cellW / 2;
  const under30Cx = gridLeft + under30Col * cellW + cellW / 2;
  const longWaitBoxW = 176;
  const shortWaitBoxW = 188;
  const under30BoxCx = gridLeft + under30Col * cellW + 18 - TWO_IN + 105;

  const callouts = [
    {
      anchorX: fivePlusCx,
      anchorY: gridTop + intestineRow * cellH + cellH / 2,
      text: "High proportion have long waits",
      boxX: fivePlusCx - longWaitBoxW / 2,
      boxY: gridTop + intestineRow * cellH - 34 - QUARTER_IN,
      boxW: longWaitBoxW,
      boxH
    },
    {
      anchorX: under30Cx,
      anchorY: gridTop + lungRow * cellH + cellH / 2,
      text: "More candidates have short waits",
      boxX: under30BoxCx - shortWaitBoxW / 2,
      boxY: gridTop + lungRow * cellH + cellH / 2 + 8 + HALF_IN,
      boxW: shortWaitBoxW,
      boxH
    }
  ];

  const layer = svg.append("g").attr("class", "heatmap-callouts");
  callouts.forEach(d => {
    const g = layer.append("g").attr("class", "heatmap-callout");
    const boxCx = d.boxX + d.boxW / 2;
    const boxCy = d.boxY + d.boxH / 2;

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
      .attr("height", d.boxH)
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
        .text(d.text),
      typography.caption
    );
  });
}

function drawShareAxis(svg, maxPct, { gridRight, gridTop, gridBottom }) {
  const axisX = gridRight + 34;
  const axisTop = gridTop;
  const axisBottom = gridBottom;

  const legendScale = d3.scaleLinear().domain([0, maxPct]).range([axisBottom, axisTop]);
  d3.ticks(0, maxPct, 5).forEach(t => {
    svg.append("line")
      .attr("x1", axisX)
      .attr("x2", axisX + 6)
      .attr("y1", legendScale(t))
      .attr("y2", legendScale(t))
      .attr("stroke", storyColors.divider)
      .attr("stroke-width", 1);
    applyType(
      svg.append("text")
        .attr("x", axisX + 10)
        .attr("y", legendScale(t))
        .attr("dy", "0.32em")
        .attr("fill", storyColors.textSecondary)
        .text(d3.format("d")(t)),
      typography.label
    );
  });

  applyType(
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(axisTop + axisBottom) / 2)
      .attr("y", axisX + 44)
      .attr("text-anchor", "middle")
      .attr("fill", storyColors.textSecondary)
      .text("% share within organ"),
    typography.label
  );

  applyType(
    svg.append("text")
      .attr("x", axisX)
      .attr("y", axisBottom + 18)
      .attr("fill", storyColors.textMuted)
      .text("Darker = larger share"),
    typography.caption
  );
}
