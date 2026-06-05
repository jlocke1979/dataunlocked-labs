import { storyColors } from "../../constants/colors.js";
import { typography } from "../../constants/typography.js";
import {
  applyType,
  beginChartScene,
  drawSource,
  renderPlaceholder,
  STAGE
} from "./show_helpers.js";

const WAITLIST_CSV = "data/waitlist_wait_time.csv";
const TRANSPLANT_CSV = "data/optn_transplants_clean.csv";
const PEOPLE_PER_DOT = 500;
const TOP_N = 5;

const ROW_START_Y = STAGE.contentTop + 16;
const ROW_GAP = 56;
const LABEL_X = STAGE.marginX;
const TRACK_X = STAGE.marginX + 168;
const MAX_TRACK_WIDTH = 760;
const TRACK_HEIGHT = 28;
const DOT_RADIUS = 3.2;
const DOT_PITCH = DOT_RADIUS * 2 + 3;

const toNum = s => +String(s == null ? "" : s).replace(/[",\s]/g, "") || 0;

function parseWaitlistAllTime(csvText) {
  const rows = d3.csvParseRows(csvText);
  const headers = rows[0].map(h => String(h || "").trim());
  const allTime = rows.find(r => (r[0] || "").trim() === "All Time");
  if (!allTime) return {};

  const organs = headers.slice(2).filter(name => name && name !== "All Organs");
  return Object.fromEntries(
    organs.map(organ => [organ, toNum(allTime[headers.indexOf(organ)])])
  );
}

function parseTransplants2025(csvText) {
  const rows = d3.csvParse(csvText);
  const out = {};
  rows
    .filter(
      r =>
        String(r.year) === "2025" &&
        String(r.donor_type).trim() === "All Donor Types" &&
        r.organ &&
        r.organ !== "All Organs"
    )
    .forEach(r => {
      out[String(r.organ).trim()] = toNum(r.transplants);
    });
  return out;
}

/** Top 5 organ/combo rows by waitlist; remainder rolled into Other. */
function buildDisplayRows(waitlistByOrgan, transplantsByOrgan) {
  const entries = Object.entries(waitlistByOrgan)
    .map(([organ, waitlist]) => ({
      organ,
      waitlist,
      transplants: transplantsByOrgan[organ] || 0
    }))
    .filter(row => row.waitlist > 0 || row.transplants > 0)
    .sort((a, b) => b.waitlist - a.waitlist);

  const top = entries.slice(0, TOP_N);
  const rest = entries.slice(TOP_N);
  const otherWait = d3.sum(rest, d => d.waitlist);
  const otherTxp = d3.sum(rest, d => d.transplants);

  if (otherWait > 0 || otherTxp > 0) {
    top.push({ organ: "Other", waitlist: otherWait, transplants: otherTxp });
  }

  return top;
}

function dotsForCount(count) {
  if (count <= 0) return 0;
  return Math.max(1, Math.round(count / PEOPLE_PER_DOT));
}

function layoutDots(count, maxWidth) {
  const maxCols = Math.max(1, Math.floor((maxWidth + 3) / DOT_PITCH));
  const cols = Math.min(count, maxCols);
  const rows = Math.ceil(count / cols);
  return d3.range(count).map(index => ({
    x: (index % cols) * DOT_PITCH + DOT_RADIUS,
    y: Math.floor(index / cols) * DOT_PITCH + DOT_RADIUS,
    rows,
    cols
  }));
}

function drawRow(g, row, y, maxWaitlist) {
  const demandDots = dotsForCount(row.waitlist);
  const transplantDots = dotsForCount(row.transplants);
  const trackWidth = Math.max(48, (row.waitlist / maxWaitlist) * MAX_TRACK_WIDTH);
  const trackHeight = Math.max(TRACK_HEIGHT, layoutDots(demandDots, trackWidth).rows * DOT_PITCH + 6);

  const rowG = g.append("g").attr("class", "supply-demand-row");

  applyType(
    rowG
      .append("text")
      .attr("x", LABEL_X)
      .attr("y", y + trackHeight / 2 + 4)
      .attr("fill", storyColors.textPrimary)
      .text(row.organ),
    typography.label
  );

  const track = rowG
    .append("g")
    .attr("transform", `translate(${TRACK_X},${y})`);

  track
    .append("rect")
    .attr("class", "demand-outline")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", trackWidth)
    .attr("height", trackHeight)
    .attr("rx", 6)
    .attr("fill", "none")
    .attr("stroke", storyColors.softAshGray)
    .attr("stroke-width", 1.2)
    .attr("stroke-dasharray", "4 3")
    .attr("opacity", 0.85);

  const positions = layoutDots(demandDots, trackWidth);
  const filledCount = Math.min(transplantDots, demandDots);

  track
    .selectAll("circle.supply-dot")
    .data(positions.slice(0, demandDots))
    .enter()
    .append("circle")
    .attr("class", "supply-dot")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y + (trackHeight - d.rows * DOT_PITCH) / 2)
    .attr("r", DOT_RADIUS)
    .attr("fill", (d, i) =>
      i < filledCount ? storyColors.deepSlateHarbor : storyColors.museumWhite)
    .attr("stroke", (d, i) =>
      i < filledCount ? storyColors.deepSlateHarbor : storyColors.softAshGray)
    .attr("stroke-width", 1)
    .append("title")
    .text((d, i) => {
      const kind = i < filledCount ? "Transplanted" : "Still waiting";
      return `${row.organ} \u2014 ${kind} (\u2248${PEOPLE_PER_DOT} per dot)`;
    });

  const metShare = row.waitlist > 0 ? row.transplants / row.waitlist : 0;
  applyType(
    rowG
      .append("text")
      .attr("x", TRACK_X + trackWidth + 14)
      .attr("y", y + trackHeight / 2 + 4)
      .attr("fill", storyColors.textMuted)
      .text(
        `${d3.format(",")(row.waitlist)} waiting \u00b7 ${d3.format(",")(row.transplants)} transplants` +
          (row.waitlist > 0 ? ` (${d3.format(".1%")(Math.min(metShare, 1))} annual pace)` : "")
      ),
    typography.caption
  );
}

function drawLegend(svg, y) {
  const legend = svg.append("g").attr("class", "supply-demand-legend").attr("transform", `translate(${TRACK_X},${y})`);

  legend
    .append("rect")
    .attr("x", 0)
    .attr("y", -10)
    .attr("width", 120)
    .attr("height", 22)
    .attr("rx", 5)
    .attr("fill", "none")
    .attr("stroke", storyColors.softAshGray)
    .attr("stroke-width", 1.2)
    .attr("stroke-dasharray", "4 3");

  legend
    .append("circle")
    .attr("cx", 148)
    .attr("cy", 0)
    .attr("r", DOT_RADIUS)
    .attr("fill", storyColors.deepSlateHarbor);

  applyType(
    legend
      .append("text")
      .attr("x", 162)
      .attr("y", 4)
      .attr("fill", storyColors.textPrimary)
      .text("Transplanted (2025)"),
    typography.caption
  );

  applyType(
    legend
      .append("text")
      .attr("x", 0)
      .attr("y", 28)
      .attr("fill", storyColors.textMuted)
      .text(
        "Each row\u2019s outline scales to that organ\u2019s waitlist. One dot \u2248 500 people. Empty outline = gap."
      ),
    typography.caption
  );
}

export function runScene3SupplyDemand(options = {}) {
  const container = d3.select("#viz");
  container.selectAll("*").remove();

  const { chartSvg: svg } = beginChartScene(container, {
    sceneLabel: options.sceneLabel ?? "Chopping block  \u00b7  archived",
    title: options.title ?? "Why are people waiting? (dot prototype)",
    subtitle:
      options.subtitle !== undefined
        ? options.subtitle
        : "Per-row demand outline with transplant dots \u2014 top organ groups, 2025"
  });

  const chart = svg.append("g").attr("class", "supply-demand-dots");

  Promise.all([d3.text(WAITLIST_CSV), d3.text(TRANSPLANT_CSV)])
    .then(([waitText, txpText]) => {
      const waitlistByOrgan = parseWaitlistAllTime(waitText);
      const transplantsByOrgan = parseTransplants2025(txpText);
      const rows = buildDisplayRows(waitlistByOrgan, transplantsByOrgan);
      const maxWaitlist = d3.max(rows, d => d.waitlist) || 1;

      rows.forEach((row, index) => {
        drawRow(chart, row, ROW_START_Y + index * ROW_GAP, maxWaitlist);
      });

      drawLegend(svg, ROW_START_Y + rows.length * ROW_GAP + 8);
      if (options.showSource !== false) {
        drawSource(svg, "Source: OPTN / HRSA waitlist registrations (all time) and 2025 transplants.");
      }
    })
    .catch(err => {
      console.error("[Scene 3 supply/demand] data load error:", err);
      renderPlaceholder(container, {
        sceneLabel: "Scene 3",
        title: "Why are people waiting?",
        subtitle: "Supply vs demand by organ group.",
        note: "Could not load waitlist / transplant data."
      });
    });
}
