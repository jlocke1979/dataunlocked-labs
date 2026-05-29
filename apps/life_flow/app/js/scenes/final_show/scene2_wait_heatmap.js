import { storyColors } from "../../constants/colors.js";
import { typography } from "../../constants/typography.js";
import { createStage, drawHeader, drawSource, applyType, renderPlaceholder, STAGE } from "./show_helpers.js";

// Adapted from Assignment 04 (relational) wait-time heatmap concept.
// Source matrix: OPTN Rpt2.1 Waitlist Organ by Waiting Time, copied to app/data.
const DATA_PATH = "data/waitlist_wait_time.csv";
const ORGANS = ["Kidney", "Liver", "Heart", "Lung", "Pancreas", "Kidney / Pancreas"];

const toNumber = s => +String(s).replace(/[",]/g, "") || 0;

export function runScene2() {
  const container = d3.select("#viz");
  container.selectAll("*").remove();

  fetch(DATA_PATH)
    .then(r => r.text())
    .then(text => {
      const matrix = d3.csvParseRows(text);
      const header = matrix[0];
      const dataRows = matrix.slice(1).filter(r => r[0] && r[0] !== "All Time");

      console.log("[Scene 2] wait-time data loaded:", DATA_PATH);
      console.log("[Scene 2] row count:", dataRows.length);
      console.log("[Scene 2] first row:", dataRows[0]);

      render(container, header, dataRows);
    })
    .catch(err => {
      console.error("[Scene 2] wait-time data failed to load:", err);
      renderPlaceholder(container, {
        sceneLabel: "Scene 2",
        title: "How long do people wait?",
        subtitle: "Wait-time heatmap prototype.",
        note: "Scene in progress: wait-time heatmap prototype"
      });
    });
}

function render(container, header, dataRows) {
  const svg = createStage(container);
  drawHeader(svg, {
    sceneLabel: "Scene 2",
    title: "How long do people wait?",
    subtitle: "Share of the active waitlist by time waiting, per organ"
  });

  const organCols = ORGANS
    .map(name => ({ name, idx: header.indexOf(name) }))
    .filter(o => o.idx >= 0);
  const buckets = dataRows.map(r => r[0]);

  // Column-normalized share so each organ sums to 100% across wait buckets.
  const colTotals = organCols.map(o => d3.sum(dataRows, r => toNumber(r[o.idx])));
  const cells = [];
  let maxPct = 0;
  dataRows.forEach((r, ri) => {
    organCols.forEach((o, ci) => {
      const total = colTotals[ci] || 1;
      const pct = (toNumber(r[o.idx]) / total) * 100;
      maxPct = Math.max(maxPct, pct);
      cells.push({ ri, ci, pct, value: toNumber(r[o.idx]) });
    });
  });

  const gridLeft = STAGE.contentLeft + 168;
  const gridTop = STAGE.contentTop + 44;
  const gridRight = STAGE.contentRight - 8;
  const gridBottom = STAGE.contentBottom - 8;
  const cellW = (gridRight - gridLeft) / organCols.length;
  const cellH = (gridBottom - gridTop) / buckets.length;

  const color = d3.scaleSequential()
    .domain([0, maxPct])
    .interpolator(d3.interpolateRgb(storyColors.museumWhite, storyColors.slateFogBlue));

  // Bucket (row) labels.
  buckets.forEach((b, ri) => {
    applyType(
      svg.append("text")
        .attr("x", gridLeft - 12)
        .attr("y", gridTop + ri * cellH + cellH / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .attr("fill", storyColors.textSecondary)
        .text(b),
      typography.label
    );
  });

  // Organ (column) headers.
  organCols.forEach((o, ci) => {
    applyType(
      svg.append("text")
        .attr("x", gridLeft + ci * cellW + cellW / 2)
        .attr("y", gridTop - 14)
        .attr("text-anchor", "middle")
        .attr("fill", storyColors.textPrimary)
        .text(o.name),
      typography.label
    );
  });

  // Heatmap cells.
  const cell = svg.append("g")
    .selectAll("g")
    .data(cells)
    .join("g")
    .attr("transform", d => `translate(${gridLeft + d.ci * cellW},${gridTop + d.ri * cellH})`);

  cell.append("rect")
    .attr("width", cellW - 2)
    .attr("height", cellH - 2)
    .attr("rx", 2)
    .attr("fill", d => color(d.pct))
    .attr("stroke", storyColors.divider)
    .attr("stroke-width", 0.5);

  cell.append("text")
    .attr("x", (cellW - 2) / 2)
    .attr("y", (cellH - 2) / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .attr("fill", d => (d.pct > maxPct * 0.55 ? storyColors.museumWhite : storyColors.textSecondary))
    .call(applyType, typography.label)
    .text(d => (d.pct >= 1 ? `${Math.round(d.pct)}%` : ""));

  drawSource(svg, "Source: OPTN Rpt2.1 \u2014 Waitlist, organ by waiting time. Adapted from Assignment 04 heatmap.");
}
