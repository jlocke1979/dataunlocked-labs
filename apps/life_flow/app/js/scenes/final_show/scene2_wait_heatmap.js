import { storyColors } from "../../constants/colors.js";
import { typography } from "../../constants/typography.js";
import { beginChartScene, drawSource, applyType, renderPlaceholder, STAGE } from "./show_helpers.js";

// ---------------------------------------------------------------------------
// Scene 2 — Distribution of wait times by organ.
//
// Wires in the Assignment 4 (relational) heatmap. The strongest Assignment 4
// version is the final deliverable:
//   apps/life_flow/assignments/assignment_04_relational/final/final_heatmap.png
//   (produced by assignment_04_relational/exploratory/eda.ipynb; the chosen
//    palette is exploratory/output/iteration_16f_charcoal_forrest.png)
//
// Design choices restored from Assignment 4 (vs the earlier rough Scene 2):
//   - organs on the Y axis (rows), candidate waiting period on the X axis
//     (columns)  -- the axes are switched back to the Assignment 4 layout
//   - sequential CHARCOAL / muted grayscale hue (museum white -> charcoal
//     forest) with a continuous colorbar legend
//   - normalized as "% of waitlist candidates by organ" (each organ row sums
//     to 100% across the wait buckets)
//   - Assignment 4 organ ordering (Kidney longest waits -> Lung shortest)
//   - no numbers printed in the cells (clean static read)
//
// No extra interactions and no bottom navigation bars: global final-show
// navigation (arrow keys in js/main.js) is the only navigation.
// ---------------------------------------------------------------------------

const DATA_PATH = "./data/waitlist_wait_time.csv"; // relative -> GitHub Pages-safe
const HEATMAP_SOURCE = "assignment_04_relational/final/final_heatmap.png";

// Organ order (top -> bottom): longest waits first — Intestine & Pancreas heaviest
// in 3–5 yr / 5+ yr buckets; Heart, Liver, Lung shortest.
const ORGANS = [
  "Intestine",
  "Pancreas",
  "Kidney",
  "Kidney / Pancreas",
  "Heart",
  "Liver",
  "Lung"
];

// Raw waiting-period bucket -> short column label, in left-to-right order.
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

export function runScene2() {
  const container = d3.select("#viz");
  container.selectAll("*").remove();

  console.log("[Scene 2] loaded");
  console.log("[Scene 2] Assignment 4 heatmap source:", HEATMAP_SOURCE);

  fetch(DATA_PATH)
    .then(r => r.text())
    .then(text => {
      const matrix = d3.csvParseRows(text);
      const header = matrix[0];
      // Bucket rows in the raw file (organs are columns there); skip "All Time".
      const rawRows = matrix.slice(1).filter(r => r[0] && r[0] !== "All Time");

      console.log("[Scene 2] data file loaded:", DATA_PATH);
      console.log("[Scene 2] row count:", rawRows.length);

      render(container, header, rawRows);
    })
    .catch(err => {
      console.error("[Scene 2] wait-time data failed to load:", err);
      renderPlaceholder(container, {
        sceneLabel: "Scene 2",
        title: "Distribution of wait times by organ",
        subtitle: "Wait-time heatmap from Assignment 4.",
        note: "Scene 2 will show the Assignment 4 wait-time heatmap."
      });
    });
}

function render(container, header, rawRows) {
  const { chartSvg: svg } = beginChartScene(container, {
    sceneLabel: "Scene 2",
    title: "Distribution of wait times by organ",
    subtitle:
      "Candidates may experience vastly different wait times depending on the organ"
  });

  // Look up a raw cell by organ (column) and bucket (row).
  const organIdx = Object.fromEntries(ORGANS.map(o => [o, header.indexOf(o)]));
  const rowByBucket = Object.fromEntries(rawRows.map(r => [r[0], r]));

  // Row-normalize by organ: each organ's share across the wait buckets -> 100%.
  const cells = [];
  let maxPct = 0;
  ORGANS.forEach((organ, ri) => {
    const ci0 = organIdx[organ];
    const organTotal = d3.sum(BUCKETS, ([raw]) => {
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

  // Grid geometry: organs as rows, wait buckets as columns; colorbar at right.
  const gridLeft = STAGE.contentLeft + 116;
  const gridTop = STAGE.contentTop + 32;
  const gridRight = STAGE.contentRight - 96;
  const gridBottom = STAGE.contentBottom - 34;
  const cellW = (gridRight - gridLeft) / BUCKETS.length;
  const cellH = (gridBottom - gridTop) / ORGANS.length;

  // Sequential charcoal hue (museum white -> charcoal forest), Assignment 4.
  const color = d3.scaleSequential()
    .domain([0, maxPct])
    .interpolator(d3.interpolateRgb(storyColors.museumWhite, storyColors.charcoalForest));

  // Organ (row) labels.
  ORGANS.forEach((organ, ri) => {
    applyType(
      svg.append("text")
        .attr("x", gridLeft - 12)
        .attr("y", gridTop + ri * cellH + cellH / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .attr("fill", storyColors.textPrimary)
        .text(organ),
      typography.label
    );
  });

  // Wait-bucket (column) labels.
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

  // X-axis title.
  applyType(
    svg.append("text")
      .attr("x", (gridLeft + gridRight) / 2)
      .attr("y", gridBottom + 50)
      .attr("text-anchor", "middle")
      .attr("fill", storyColors.textSecondary)
      .text("Candidate waiting period"),
    typography.label
  );

  // Heatmap cells (museum-white gaps mimic the Assignment 4 gridlines).
  svg.append("g")
    .selectAll("rect")
    .data(cells)
    .join("rect")
    .attr("x", d => gridLeft + d.ci * cellW)
    .attr("y", d => gridTop + d.ri * cellH)
    .attr("width", cellW)
    .attr("height", cellH)
    .attr("fill", d => color(d.pct))
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

  drawColorbar(svg, color, maxPct, { gridRight, gridTop, gridBottom });

  drawSource(
    svg,
    "Source: Organ Procurement and Transplantation Network (OPTN), 2025. Adapted from Assignment 04 (relational).",
    STAGE.captionY + 48
  );
}

function drawHeatmapCallouts(
  svg,
  { gridLeft, gridTop, cellW, cellH, intestineRow, lungRow, fivePlusCol, under30Col }
) {
  const HALF_IN = 48;
  const TWO_IN = 192;
  const fivePlusCx = gridLeft + fivePlusCol * cellW + cellW / 2;
  const under30Cx = gridLeft + under30Col * cellW + cellW / 2;
  const fivePlusBoxW = 162;
  const under30BoxW = 152;
  const under30BoxH = 32;
  const under30BoxCx = gridLeft + under30Col * cellW + 18 - TWO_IN + 105;

  const callouts = [
    {
      id: "five-plus",
      anchorX: fivePlusCx,
      anchorY: gridTop + intestineRow * cellH + cellH / 2,
      text: "Highest proportion of candidates waiting 5+",
      boxX: fivePlusCx - fivePlusBoxW / 2,
      boxY: gridTop + intestineRow * cellH - 34,
      boxW: fivePlusBoxW,
      boxH: 36
    },
    {
      id: "under-30",
      anchorX: under30Cx,
      anchorY: gridTop + lungRow * cellH + cellH / 2,
      text: "Highest proportion < 30 days",
      boxX: under30BoxCx - under30BoxW / 2,
      boxY: gridTop + lungRow * cellH + cellH / 2 + 8 + HALF_IN,
      boxW: under30BoxW,
      boxH: under30BoxH,
      textY: 12
    }
  ];

  const layer = svg.append("g").attr("class", "heatmap-callouts");

  callouts.forEach(d => {
    const g = layer.append("g").attr("class", "heatmap-callout");
    g.append("line")
      .attr("stroke", storyColors.weatheredBrass)
      .attr("stroke-width", 1)
      .attr("x1", d.anchorX)
      .attr("y1", d.anchorY)
      .attr("x2", d.boxX + d.boxW / 2)
      .attr("y2", d.boxY + d.boxH / 2);
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
        .attr("x", d.boxX + 6)
        .attr("y", d.boxY + (d.textY ?? 14))
        .attr("fill", storyColors.textPrimary)
        .text(d.text),
      typography.caption
    );
  });
}

function drawColorbar(svg, color, maxPct, { gridRight, gridTop, gridBottom }) {
  const barX = gridRight + 34;
  const barW = 15;
  const barTop = gridTop;
  const barBottom = gridBottom;

  const gradId = "scene2-colorbar";
  const grad = svg.append("defs").append("linearGradient")
    .attr("id", gradId)
    .attr("x1", "0").attr("y1", "0").attr("x2", "0").attr("y2", "1");

  d3.range(0, 1.0001, 0.1).forEach(t => {
    grad.append("stop")
      .attr("offset", `${t * 100}%`)
      // top of the bar = high %, bottom = 0 %
      .attr("stop-color", color(maxPct * (1 - t)));
  });

  svg.append("rect")
    .attr("x", barX)
    .attr("y", barTop)
    .attr("width", barW)
    .attr("height", barBottom - barTop)
    .attr("fill", `url(#${gradId})`)
    .attr("stroke", storyColors.divider)
    .attr("stroke-width", 0.5);

  const legendScale = d3.scaleLinear().domain([0, maxPct]).range([barBottom, barTop]);
  d3.ticks(0, maxPct, 5).forEach(t => {
    applyType(
      svg.append("text")
        .attr("x", barX + barW + 6)
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
      .attr("x", -(barTop + barBottom) / 2)
      .attr("y", barX + barW + 42)
      .attr("text-anchor", "middle")
      .attr("fill", storyColors.textSecondary)
      .text("% of waitlist candidates by organ"),
    typography.label
  );
}
