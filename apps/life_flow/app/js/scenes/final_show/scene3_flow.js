import { storyColors } from "../../constants/colors.js";
import { typography } from "../../constants/typography.js";
import { createStage, drawHeader, applyType, renderPlaceholder, STAGE } from "./show_helpers.js";

/* ---------------------------------------------------------------------------
 * Scene 3 — two-sided system flow.
 *   Demand (waitlist) enters from the LEFT, Supply (donors) from the RIGHT,
 *   and they meet in the CENTER at "Transplanted".
 *
 *   The supply chain is now modelled in three real stages:
 *     Donors  ->  Organs recovered  ->  { Transplanted (center) | Discarded }
 *   One donor yields multiple organs, so the Donors -> Organs link is drawn
 *   as an expanding wedge whose slope IS the organs-per-donor multiplier.
 *
 * Data (all REAL, OPTN/SRTR national reports, "All Donor Types" row):
 *   - Donors:               data/donors_by_type.csv             (Rpt 1.1)
 *   - Organs recovered:     data/organs_recovered_by_type.csv   (Rpt 1.3)
 *   - Organs transplanted:  data/organs_transplanted_by_type.csv(Rpt 1.4)  = center
 *   - Organs discarded:     data/organs_discarded_by_type.csv   (Rpt 1.2)
 *   - Active waitlist:      data/waitlist_wait_time.csv (All Time row, Rpt 2.1)
 *
 *   PLACEHOLDER (demand losses only): died-waiting and removed/other are
 *   illustrative ratios of the transplant count — swap RATIO for real data.
 * ------------------------------------------------------------------------- */
const WAITLIST_PATH = "data/waitlist_wait_time.csv";
const DONOR_FILES = {
  donors: "data/donors_by_type.csv",
  recovered: "data/organs_recovered_by_type.csv",
  transplanted: "data/organs_transplanted_by_type.csv",
  discarded: "data/organs_discarded_by_type.csv"
};

const ORGAN_OPTIONS = [
  { label: "All organs", csv: "All Organs" },
  { label: "Kidney", csv: "Kidney" },
  { label: "Liver", csv: "Liver" },
  { label: "Heart", csv: "Heart" },
  { label: "Lung", csv: "Lung" },
  { label: "Pancreas", csv: "Pancreas" }
];

// Column index of each organ within the donor-report rows (positional: the
// header names differ per file, e.g. "Kidney" vs "Kidneys Recovered").
const ORGAN_COL = { "All Organs": 2, Kidney: 3, Liver: 4, Heart: 5, Pancreas: 6, Lung: 7 };

// PLACEHOLDER demand-loss ratios, relative to the real transplant count.
const RATIO = { diedWaiting: 0.10, removedOther: 0.16 };

const C = {
  transplant: storyColors.deepSlateHarbor, // center: where supply meets demand
  waiting: storyColors.softAshGray,        // demand still waiting
  loss: storyColors.mutedClayRose,         // died waiting / discarded
  neutral: storyColors.deepAshStone,       // removed / other
  supply: storyColors.mistHarborBlue       // donors / recovered movement
};

const fmt = d3.format(",");

export function runScene3() {
  const container = d3.select("#viz");
  container.selectAll("*").remove();
  container.style("position", "relative");

  console.log("Scene 3 loaded");

  Promise.all([
    fetch(WAITLIST_PATH).then(r => r.text()),
    fetch(DONOR_FILES.donors).then(r => r.text()),
    fetch(DONOR_FILES.recovered).then(r => r.text()),
    fetch(DONOR_FILES.transplanted).then(r => r.text()),
    fetch(DONOR_FILES.discarded).then(r => r.text())
  ])
    .then(([wText, donText, recText, txpText, discText]) => {
      const waitMatrix = d3.csvParseRows(wText);
      const waitHeader = waitMatrix[0];
      const waitAllTime = waitMatrix.find(r => r[0] === "All Time") || [];

      const ctx = {
        waitHeader,
        waitAllTime,
        donorsRow: allDonorTypesRow(donText),
        recoveredRow: allDonorTypesRow(recText),
        transplantedRow: allDonorTypesRow(txpText),
        discardedRow: allDonorTypesRow(discText)
      };

      console.log("Scene 3 data sources:", WAITLIST_PATH, "+", Object.values(DONOR_FILES).join(", "));
      mount(container, ctx);
    })
    .catch(err => {
      console.error("Scene 3 data load error:", err);
      renderPlaceholder(container, {
        sceneLabel: "Scene 3",
        title: "What happens between need, donation, and transplant?",
        subtitle: "Demand and supply meeting at transplant.",
        note: "Placeholder: connect waitlist + donor data here."
      });
    });
}

// Pull the "All Donor Types" total row from a donor report.
function allDonorTypesRow(text) {
  const rows = d3.csvParseRows(text);
  return rows.find(r => (r[0] || "").trim() === "All Donor Types") || [];
}

const toNum = s => +String(s == null ? "" : s).replace(/[",\s]/g, "") || 0;

function buildFlow(ctx, organCsv) {
  const col = ORGAN_COL[organCsv] ?? ORGAN_COL["All Organs"];

  // --- Supply (REAL) -------------------------------------------------------
  const donors = toNum(ctx.donorsRow[col]);
  const recovered = toNum(ctx.recoveredRow[col]);
  const transplanted = toNum(ctx.transplantedRow[col]); // = center
  const discarded = toNum(ctx.discardedRow[col]);
  // Recovered ~= transplanted + discarded (within a few units of rounding).
  const recOther = Math.max(0, recovered - transplanted - discarded);
  const yieldPerDonor = donors > 0 ? recovered / donors : 0;
  const txpPerDonor = donors > 0 ? transplanted / donors : 0;

  // --- Demand --------------------------------------------------------------
  const wIdx = ctx.waitHeader.indexOf(organCsv);
  const stillWaiting = wIdx >= 0 ? toNum(ctx.waitAllTime[wIdx]) : 0; // REAL
  const diedWaiting = Math.round(transplanted * RATIO.diedWaiting);  // PLACEHOLDER
  const removedOther = Math.round(transplanted * RATIO.removedOther); // PLACEHOLDER

  return {
    organCsv,
    donors,
    recovered,
    transplanted,
    discarded,
    recOther,
    yieldPerDonor,
    txpPerDonor,
    stillWaiting,
    diedWaiting,
    removedOther,
    demandTotal: transplanted + stillWaiting + diedWaiting + removedOther,
    supplyTotal: recovered
  };
}

function mount(container, ctx) {
  const svg = createStage(container);
  drawHeader(svg, {
    sceneLabel: "Scene 3  \u00b7  prototype",
    title: "What happens between need, donation, and transplant?",
    subtitle: "Each donor gives several organs \u2014 supply runs donors \u2192 organs recovered \u2192 transplanted, meeting waitlist demand in the middle"
  });

  const flowGroup = svg.append("g").attr("class", "flow");
  let organCsv = ORGAN_OPTIONS[0].csv;

  // Simple organ selector (default "All organs" works with no interaction).
  const control = container.append("div")
    .style("position", "absolute")
    .style("top", "70px")
    .style("right", "48px")
    .style("font-family", typography.label.family)
    .style("font-size", `${typography.label.size}px`)
    .style("color", storyColors.textSecondary);
  control.append("span").text("Organ: ").style("margin-right", "6px");
  const select = control.append("select")
    .style("font", "inherit")
    .style("padding", "4px 8px")
    .style("border", `1px solid ${storyColors.divider}`)
    .style("border-radius", "6px")
    .style("background", storyColors.museumWhite)
    .style("color", storyColors.textPrimary);
  select.selectAll("option")
    .data(ORGAN_OPTIONS)
    .join("option")
    .attr("value", d => d.csv)
    .text(d => d.label);
  select.on("change", function () {
    organCsv = this.value;
    drawFlow(svg, flowGroup, buildFlow(ctx, organCsv));
  });

  drawFlow(svg, flowGroup, buildFlow(ctx, organCsv));
}

// Smooth filled ribbon between two vertical edges.
function ribbon(x0, t0, b0, x1, t1, b1) {
  const mx = (x0 + x1) / 2;
  return `M${x0},${t0} C${mx},${t0} ${mx},${t1} ${x1},${t1} L${x1},${b1} C${mx},${b1} ${mx},${b0} ${x0},${b0} Z`;
}

function drawFlow(svg, g, flow) {
  console.log("Scene 3 flow values:", flow);
  g.selectAll("*").remove();

  const labelOrgan = ORGAN_OPTIONS.find(o => o.csv === flow.organCsv)?.label || flow.organCsv;

  const top = 232;
  const baseB = 568;       // shared baseline; transplant bands sit on it
  const H = baseB - top;
  const maxTotal = Math.max(flow.demandTotal, flow.supplyTotal, 1);
  const scale = H / maxTotal;

  // Column x-bands (left -> right).
  const demandSrc = [150, 168];
  const demandOut = [336, 354];
  const center = [592, 650];
  const supplyOut = [840, 858];    // discarded terminal
  const supplyRec = [1004, 1022];  // organs recovered (supply source stack)
  const supplyDonor = [1108, 1126]; // donors origin

  // Bottom-aligned stacks (bottom -> top): Transplanted pinned to the baseline.
  const demandStack = stackUp([
    ["transplanted", flow.transplanted],
    ["removedOther", flow.removedOther],
    ["diedWaiting", flow.diedWaiting],
    ["stillWaiting", flow.stillWaiting]
  ], baseB, scale);

  const supplyStack = stackUp([
    ["transplanted", flow.transplanted],
    ["discarded", flow.discarded]
  ], baseB, scale);

  const recTop = supplyStack.discarded.t;            // top of the recovered stack
  const donorH = Math.max(2, flow.donors * scale);
  const donorTop = baseB - donorH;

  const tHeight = Math.max(2, flow.transplanted * scale);
  const centerTop = baseB - tHeight;
  const centerBot = baseB;

  const colorFor = key => ({
    transplanted: C.transplant,
    stillWaiting: C.waiting,
    diedWaiting: C.loss,
    removedOther: C.neutral,
    discarded: C.loss
  }[key] || C.neutral);

  // --- Ribbons ---------------------------------------------------------------
  const ribbons = [
    // Demand transplanted -> center, supply transplanted <- center.
    { x0: demandSrc[1], s: demandStack.transplanted, x1: center[0], d: { t: centerTop, b: centerBot }, key: "transplanted" },
    { x0: center[1], s: { t: centerTop, b: centerBot }, x1: supplyRec[0], d: supplyStack.transplanted, key: "transplanted" },
    // Demand losses -> terminal nodes.
    { x0: demandSrc[1], s: demandStack.stillWaiting, x1: demandOut[0], d: demandStack.stillWaiting, key: "stillWaiting" },
    { x0: demandSrc[1], s: demandStack.diedWaiting, x1: demandOut[0], d: demandStack.diedWaiting, key: "diedWaiting" },
    { x0: demandSrc[1], s: demandStack.removedOther, x1: demandOut[0], d: demandStack.removedOther, key: "removedOther" },
    // Supply discarded -> terminal node.
    { x0: supplyOut[1], s: supplyStack.discarded, x1: supplyRec[0], d: supplyStack.discarded, key: "discarded" }
  ];

  g.append("g")
    .selectAll("path")
    .data(ribbons)
    .join("path")
    .attr("d", r => ribbon(r.x0, r.s.t, r.s.b, r.x1, r.d.t, r.d.b))
    .attr("fill", r => colorFor(r.key))
    .attr("fill-opacity", 0.5);

  // Donors -> Organs recovered: an expanding wedge whose slope is the yield.
  g.append("path")
    .attr("d", ribbon(supplyDonor[0], donorTop, baseB, supplyRec[1], recTop, baseB))
    .attr("fill", C.supply)
    .attr("fill-opacity", 0.32);

  // --- Source bars -----------------------------------------------------------
  drawBar(g, demandSrc, demandStack, colorFor);
  drawBar(g, supplyRec, supplyStack, colorFor);

  // Donors origin node.
  g.append("rect")
    .attr("x", supplyDonor[0])
    .attr("y", donorTop)
    .attr("width", supplyDonor[1] - supplyDonor[0])
    .attr("height", donorH)
    .attr("fill", C.supply);

  // --- Terminal outcome nodes ------------------------------------------------
  const demandTerminals = [
    { key: "stillWaiting", name: "Still waiting", v: flow.stillWaiting, real: true },
    { key: "diedWaiting", name: "Died waiting", v: flow.diedWaiting, real: false },
    { key: "removedOther", name: "Removed / other", v: flow.removedOther, real: false }
  ];
  demandTerminals.forEach(o => {
    const seg = demandStack[o.key];
    node(g, demandOut, seg, colorFor(o.key));
    label(g, demandOut[1] + 10, (seg.t + seg.b) / 2, "start", `${o.name} \u2014 ${fmt(o.v)}${o.real ? "" : " *"}`);
  });

  // Supply discarded terminal (REAL).
  const discSeg = supplyStack.discarded;
  node(g, supplyOut, discSeg, colorFor("discarded"));
  label(g, supplyOut[0] - 10, (discSeg.t + discSeg.b) / 2, "end", `Discarded \u2014 ${fmt(flow.discarded)}`);

  // --- Center transplant node (on the baseline) ------------------------------
  g.append("rect")
    .attr("x", center[0])
    .attr("y", centerTop)
    .attr("width", center[1] - center[0])
    .attr("height", tHeight)
    .attr("fill", C.transplant)
    .attr("rx", 3);

  const cx = (center[0] + center[1]) / 2;
  applyType(g.append("text").attr("x", cx).attr("y", centerTop - 26).attr("text-anchor", "middle")
    .attr("fill", storyColors.textPrimary).text("ORGANS TRANSPLANTED"), typography.label);
  applyType(g.append("text").attr("x", cx).attr("y", centerTop - 8).attr("text-anchor", "middle")
    .attr("fill", C.transplant).text(fmt(flow.transplanted)), typography.dataValue);
  applyType(g.append("text").attr("x", cx).attr("y", baseB + 18).attr("text-anchor", "middle")
    .attr("fill", storyColors.textSecondary).text("where supply meets demand"), typography.caption);

  // --- Side headers ----------------------------------------------------------
  const demandX = (demandSrc[0] + demandSrc[1]) / 2;
  const supplyHeaderX = (supplyOut[0] + supplyDonor[1]) / 2;
  applyType(g.append("text").attr("x", demandX).attr("y", top - 14).attr("text-anchor", "middle")
    .attr("fill", storyColors.textPrimary).text("DEMAND"), typography.label);
  applyType(g.append("text").attr("x", supplyHeaderX).attr("y", top - 14).attr("text-anchor", "middle")
    .attr("fill", storyColors.textPrimary).text("SUPPLY"), typography.label);

  // --- Column captions below the baseline ------------------------------------
  applyType(g.append("text").attr("x", demandX).attr("y", baseB + 18).attr("text-anchor", "middle")
    .attr("fill", storyColors.textSecondary).text("Waitlist / candidates"), typography.label);

  const recX = (supplyRec[0] + supplyRec[1]) / 2;
  const donorX = (supplyDonor[0] + supplyDonor[1]) / 2;
  applyType(g.append("text").attr("x", recX).attr("y", baseB + 18).attr("text-anchor", "middle")
    .attr("fill", storyColors.textSecondary).text("Organs recovered"), typography.label);
  applyType(g.append("text").attr("x", recX).attr("y", baseB + 34).attr("text-anchor", "middle")
    .attr("fill", storyColors.textMuted).text(fmt(flow.recovered)), typography.caption);
  applyType(g.append("text").attr("x", donorX).attr("y", baseB + 18).attr("text-anchor", "middle")
    .attr("fill", storyColors.textSecondary).text("Donors"), typography.label);
  applyType(g.append("text").attr("x", donorX).attr("y", baseB + 34).attr("text-anchor", "middle")
    .attr("fill", storyColors.textMuted).text(fmt(flow.donors)), typography.caption);

  // Yield annotation sitting on the expanding wedge.
  const wedgeX = (supplyRec[1] + supplyDonor[0]) / 2;
  const wedgeY = (recTop + donorTop) / 2 - 12;
  applyType(g.append("text").attr("x", wedgeX).attr("y", wedgeY).attr("text-anchor", "middle")
    .attr("fill", storyColors.textSecondary)
    .text(`\u00d7 ${flow.yieldPerDonor.toFixed(1)} organs / donor`), typography.caption);

  applyType(g.append("text").attr("x", demandX).attr("y", baseB + 34).attr("text-anchor", "middle")
    .attr("fill", storyColors.textMuted).text(`Active waitlist: ${fmt(flow.stillWaiting)}`), typography.caption);
  applyType(g.append("text").attr("x", cx).attr("y", baseB + 34).attr("text-anchor", "middle")
    .attr("fill", storyColors.textMuted).text(labelOrgan), typography.caption);

  // --- Footer: real source line + placeholder footnote ----------------------
  applyType(
    g.append("text").attr("x", STAGE.marginX).attr("y", 648)
      .attr("fill", storyColors.textSecondary)
      .text("Source: OPTN/SRTR national data \u2014 donors, organs recovered, transplanted, and discarded (Rpt 1.1\u20131.4); active waitlist snapshot (Rpt 2.1)."),
    typography.caption
  );
  applyType(
    g.append("text").attr("x", STAGE.marginX).attr("y", 664)
      .attr("fill", storyColors.textMuted)
      .text("* Died-waiting and removed/other are illustrative placeholders. Center counts organs transplanted, not unique recipients (multi-organ recipients receive more than one)."),
    typography.caption
  );
}

// Bottom-aligned stack: items listed bottom -> top, growing upward from baseB.
function stackUp(items, baseB, scale) {
  let y = baseB;
  const out = {};
  items.forEach(([key, value]) => {
    const h = Math.max((value || 0) * scale, value > 0 ? 1 : 0);
    out[key] = { t: y - h, b: y, h, value: value || 0 };
    y -= h;
  });
  return out;
}

function drawBar(g, xBand, stackObj, colorFor) {
  Object.entries(stackObj).forEach(([key, seg]) => {
    g.append("rect")
      .attr("x", xBand[0])
      .attr("y", seg.t)
      .attr("width", xBand[1] - xBand[0])
      .attr("height", Math.max(1, seg.h))
      .attr("fill", colorFor(key));
  });
}

function node(g, xBand, seg, fill) {
  g.append("rect")
    .attr("x", xBand[0])
    .attr("y", seg.t)
    .attr("width", xBand[1] - xBand[0])
    .attr("height", Math.max(2, seg.h))
    .attr("fill", fill)
    .attr("rx", 2);
}

function label(g, x, y, anchor, text) {
  applyType(
    g.append("text")
      .attr("x", x)
      .attr("y", y)
      .attr("dy", "0.35em")
      .attr("text-anchor", anchor)
      .attr("fill", storyColors.textSecondary)
      .text(text),
    typography.label
  );
}
