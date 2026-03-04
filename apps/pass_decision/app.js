import { calculateCosts } from "./cost_model.js";
import { loadPricing, getPricingForModel } from "./pricing_data.js";

// Chart size
const WIDTH = 600;
const HEIGHT = 400;
const MARGIN = 40;
const MAX_ROUNDS = 120;

/**
 * Read all slider/control values into a single scenario object.
 * Extensible: add new properties here when new inputs (weekend mix, 9-hole mix, etc.) are added.
 * @returns {{ rounds: number, cartPercent: number, twilightPercent: number, practiceSessionsPerWeek: number, rangeBucketSize: string }}
 */
function readScenario() {
  const rounds = Math.max(0, Math.min(MAX_ROUNDS, parseInt(document.getElementById("rounds")?.value, 10) || 0));
  const cartPercent = Math.max(0, Math.min(100, parseInt(document.getElementById("cart")?.value, 10) || 0));
  const twilightPercent = Math.max(0, Math.min(50, parseInt(document.getElementById("twilight")?.value, 10) || 0));
  const practiceSessionsPerWeek = Math.max(0, Math.min(7, parseInt(document.getElementById("practice")?.value, 10) || 0));
  const rangeBucketSize = (document.getElementById("range-bucket")?.value || "medium").toLowerCase();
  return { rounds, cartPercent, twilightPercent, practiceSessionsPerWeek, rangeBucketSize };
}

/** Update the number labels next to each slider. */
function updateSliderLabels() {
  document.getElementById("rounds-value").textContent = document.getElementById("rounds").value;
  document.getElementById("cart-value").textContent = document.getElementById("cart").value;
  document.getElementById("twilight-value").textContent = document.getElementById("twilight").value;
  const practiceEl = document.getElementById("practice-value");
  if (practiceEl) practiceEl.textContent = document.getElementById("practice").value;
}

/**
 * Build the cost curve by calling the cost model for each round count.
 * Uses scenario (rounds varied 0..MAX_ROUNDS) and pricing from the data layer.
 */
function buildCurve(scenario, pricing) {
  const curve = [];
  for (let r = 0; r <= MAX_ROUNDS; r++) {
    const costs = calculateCosts({ ...scenario, rounds: r }, pricing);
    curve.push({
      rounds: r,
      payAsYouGo: costs.payAsYouGo,
      coursePass: costs.coursePass,
      allInclusive: costs.allInclusive
    });
  }
  return curve;
}

/**
 * Find break-even rounds where PayGo cost equals the given flat cost.
 * Uses linear interpolation between curve points. Returns null if no cross in [0, MAX_ROUNDS].
 */
function findBreakEven(curve, flatCost) {
  for (let i = 1; i < curve.length; i++) {
    if (curve[i].payAsYouGo >= flatCost) {
      const a = curve[i - 1];
      const b = curve[i];
      const t = (flatCost - a.payAsYouGo) / (b.payAsYouGo - a.payAsYouGo);
      const rounds = a.rounds + t * (b.rounds - a.rounds);
      return Math.max(0, Math.min(MAX_ROUNDS, rounds));
    }
  }
  return null;
}

/** Draw the D3 chart with cost lines, break-even guides, shaded regions, and user marker. */
function drawChart(curve, selectedRounds) {
  if (!curve || curve.length === 0) {
    console.warn("[drawChart] No curve data, skipping render");
    return;
  }
  const chartEl = document.getElementById("chart");
  if (!chartEl) {
    console.warn("[drawChart] #chart element not found");
    return;
  }
  if (typeof d3 === "undefined") {
    console.warn("[drawChart] D3 not loaded");
    return;
  }

  const coursePass = curve[0].coursePass;
  const allInclusive = curve[0].allInclusive;

  // Break-even: rounds where PayGo equals Course Pass / All Inclusive
  const bePayGoVsCoursePass = findBreakEven(curve, coursePass);
  const bePayGoVsAllInclusive = findBreakEven(curve, allInclusive);

  const yMax = Math.max(
    d3.max(curve, d => d.payAsYouGo),
    coursePass,
    allInclusive
  );

  const x = d3.scaleLinear()
    .domain([0, MAX_ROUNDS])
    .range([MARGIN, WIDTH - MARGIN]);

  const y = d3.scaleLinear()
    .domain([0, yMax * 1.05])
    .range([HEIGHT - MARGIN, MARGIN]);

  const linePayg = d3.line()
    .x(d => x(d.rounds))
    .y(d => y(d.payAsYouGo));

  d3.select("#chart").selectAll("*").remove();

  const svg = d3.select("#chart")
    .append("svg")
    .attr("width", WIDTH)
    .attr("height", HEIGHT)
    .style("overflow", "visible");

  // ---- 1. Shaded optimal regions (draw first so behind lines) ----
  const x0 = x(0);
  const x120 = x(MAX_ROUNDS);
  const yTop = MARGIN;
  const yBottom = HEIGHT - MARGIN;
  // If no break-even in range, use axis end so region widths are 0 or full
  const be1X = bePayGoVsCoursePass != null ? x(bePayGoVsCoursePass) : x120;
  const be2X = bePayGoVsAllInclusive != null ? x(bePayGoVsAllInclusive) : x120;

  // Left: PayGo best [0, be1]
  svg.append("rect")
    .attr("x", x0)
    .attr("y", yTop)
    .attr("width", Math.max(0, be1X - x0))
    .attr("height", yBottom - yTop)
    .attr("fill", "rgba(70, 130, 180, 0.12)")
    .attr("stroke", "none");

  // Middle: Course Pass best [be1, be2]
  svg.append("rect")
    .attr("x", be1X)
    .attr("y", yTop)
    .attr("width", Math.max(0, be2X - be1X))
    .attr("height", yBottom - yTop)
    .attr("fill", "rgba(255, 140, 0, 0.1)")
    .attr("stroke", "none");

  // Right: All Inclusive best [be2, 120]
  svg.append("rect")
    .attr("x", be2X)
    .attr("y", yTop)
    .attr("width", Math.max(0, x120 - be2X))
    .attr("height", yBottom - yTop)
    .attr("fill", "rgba(0, 128, 0, 0.1)")
    .attr("stroke", "none");

  // ---- 2. Cost lines ----
  svg.append("path")
    .datum(curve)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2)
    .attr("d", linePayg);

  svg.append("path")
    .datum(curve)
    .attr("fill", "none")
    .attr("stroke", "darkorange")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "4,4")
    .attr("d", d3.line().x(d => x(d.rounds)).y(() => y(coursePass)));

  svg.append("path")
    .datum(curve)
    .attr("fill", "none")
    .attr("stroke", "green")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "4,4")
    .attr("d", d3.line().x(d => x(d.rounds)).y(() => y(allInclusive)));

  // ---- 3. Axes ----
  svg.append("g")
    .attr("transform", `translate(0,${HEIGHT - MARGIN})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .attr("transform", `translate(${MARGIN},0)`)
    .call(d3.axisLeft(y));

  // ---- 4. Vertical guide lines at break-even ----
  if (bePayGoVsCoursePass != null && bePayGoVsCoursePass > 0 && bePayGoVsCoursePass < MAX_ROUNDS) {
    const xBe1 = x(bePayGoVsCoursePass);
    svg.append("line")
      .attr("x1", xBe1)
      .attr("x2", xBe1)
      .attr("y1", yTop)
      .attr("y2", yBottom)
      .attr("stroke", "darkorange")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "6,4")
      .attr("opacity", 0.9);
  }
  if (bePayGoVsAllInclusive != null && bePayGoVsAllInclusive > 0 && bePayGoVsAllInclusive < MAX_ROUNDS) {
    const xBe2 = x(bePayGoVsAllInclusive);
    svg.append("line")
      .attr("x1", xBe2)
      .attr("x2", xBe2)
      .attr("y1", yTop)
      .attr("y2", yBottom)
      .attr("stroke", "green")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "6,4")
      .attr("opacity", 0.9);
  }

  // ---- 5. Break-even labels on chart ----
  if (bePayGoVsCoursePass != null && bePayGoVsCoursePass > 0 && bePayGoVsCoursePass < MAX_ROUNDS) {
    const xBe1 = x(bePayGoVsCoursePass);
    const label = Math.round(bePayGoVsCoursePass) + " rounds";
    svg.append("text")
      .attr("x", xBe1)
      .attr("y", yTop + 14)
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("fill", "#b36b00")
      .text("PayGo ↔ Pass: " + label);
  }
  if (bePayGoVsAllInclusive != null && bePayGoVsAllInclusive > 0 && bePayGoVsAllInclusive < MAX_ROUNDS) {
    const xBe2 = x(bePayGoVsAllInclusive);
    const label = Math.round(bePayGoVsAllInclusive) + " rounds";
    svg.append("text")
      .attr("x", xBe2)
      .attr("y", yTop + 26)
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("fill", "#006400")
      .text("PayGo ↔ All-in: " + label);
  }

  // ---- 6. User's expected rounds marker ----
  const roundsNum = Math.max(0, Math.min(MAX_ROUNDS, selectedRounds));
  if (roundsNum > 0) {
    const xRounds = x(roundsNum);
    svg.append("line")
      .attr("x1", xRounds)
      .attr("x2", xRounds)
      .attr("y1", yTop)
      .attr("y2", yBottom)
      .attr("stroke", "#333")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "4,4")
      .attr("opacity", 0.8);
  }

  // ---- 6b. "You Are Here" dot: (rounds, optimal plan cost) ----
  const pointIndex = Math.min(Math.round(roundsNum), curve.length - 1);
  const point = curve[pointIndex];
  const optimalCost = Math.min(point.payAsYouGo, point.coursePass, point.allInclusive);
  const cx = x(roundsNum);
  const cy = y(optimalCost);
  svg.append("circle")
    .attr("cx", cx)
    .attr("cy", cy)
    .attr("r", 10)
    .attr("fill", "#c41e3a")
    .attr("stroke", "white")
    .attr("stroke-width", 2);
  svg.append("text")
    .attr("x", cx + 14)
    .attr("y", cy - 4)
    .attr("text-anchor", "start")
    .style("font-size", "11px")
    .style("font-weight", "bold")
    .style("fill", "#c41e3a")
    .text("You are here");

  // ---- 7. Axis labels and legend ----
  svg.append("text")
    .attr("x", WIDTH / 2)
    .attr("y", HEIGHT - 6)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Rounds per year");

  svg.append("text")
    .attr("transform", `translate(-7, ${HEIGHT / 2}) rotate(-90)`)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Annual cost ($)");

  const legend = [
    { label: "Pay As You Go", stroke: "steelblue", dash: "none" },
    { label: "Course Pass", stroke: "darkorange", dash: "4,4" },
    { label: "All Inclusive", stroke: "green", dash: "4,4" }
  ];
  const legendX = WIDTH - MARGIN - 120;
  const legendTop = 14;
  legend.forEach((item, i) => {
    const g = svg.append("g").attr("transform", `translate(${legendX}, ${legendTop + i * 20})`);
    g.append("line")
      .attr("x1", 0)
      .attr("x2", 24)
      .attr("y1", 0)
      .attr("y2", 0)
      .attr("stroke", item.stroke)
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", item.dash);
    g.append("text")
      .attr("x", 28)
      .attr("y", 4)
      .attr("font-size", "11px")
      .text(item.label);
  });

  console.log("[drawChart] Rendered; break-evens:", bePayGoVsCoursePass, bePayGoVsAllInclusive);
}

/** Update the plan comparison table from the cost model. */
function updateOutput(scenario, pricing) {
  const costs = calculateCosts(scenario, pricing);
  const { rounds } = scenario;

  const plans = [
    { plan: "Pay As You Go", cost: costs.payAsYouGo },
    { plan: "Course Pass", cost: costs.coursePass },
    { plan: "All Inclusive", cost: costs.allInclusive }
  ];
  plans.forEach(p => {
    p.costPerRound = rounds > 0 ? p.cost / rounds : 0;
  });
  plans.sort((a, b) => a.cost - b.cost);
  const best = plans[0];
  const savingsVsNext = plans.length > 1 ? plans[1].cost - best.cost : 0;

  const summaryHtml = `
    <div class="you-are-here-summary" style="margin-bottom:14px; padding:12px; background:#fff8f0; border-left:4px solid #c41e3a; border-radius:4px;">
      <strong>Estimated annual cost:</strong> $${best.cost.toFixed(0)}<br>
      <strong>Recommended plan:</strong> ${best.plan}<br>
      <strong>Savings vs next best:</strong> $${savingsVsNext.toFixed(0)}
    </div>
  `;

  const rows = plans.map((p, i) => `
    <tr style="background:${i === 0 ? "#dff5e1" : "white"}; font-weight:${i === 0 ? "bold" : "normal"};">
      <td>${p.plan}</td>
      <td>$${p.cost.toFixed(0)}</td>
      <td>$${p.costPerRound.toFixed(2)}</td>
    </tr>
  `).join("");

  document.getElementById("output").innerHTML = summaryHtml + `
    <h3>Best option: ${best.plan}</h3>
    <table border="1" cellpadding="8" style="border-collapse:collapse; margin-top:10px;">
      <tr><th>Plan</th><th>Total cost</th><th>Cost per round</th></tr>
      ${rows}
    </table>
  `;
}

/** Recalculate and redraw when any input changes. Uses current pricing from data layer. */
function refresh() {
  console.log("[refresh] Running chart pipeline");
  updateSliderLabels();
  const scenario = readScenario();
  const pricing = getPricingForModel(null, scenario.rangeBucketSize);
  const curve = buildCurve(scenario, pricing);
  drawChart(curve, scenario.rounds);
  updateOutput(scenario, pricing);
  console.log("[refresh] Done. Scenario:", scenario);
}

// Run when DOM is ready; render chart immediately, then load pricing and update
function init() {
  if (!document.getElementById("chart")) {
    console.error("[init] #chart not found");
    return;
  }
  if (!document.getElementById("rounds")) {
    console.error("[init] Slider #rounds not found");
    return;
  }
  // Render chart right away (uses fallback pricing if CSV not loaded yet)
  refresh();
  document.getElementById("rounds").addEventListener("input", refresh);
  document.getElementById("cart").addEventListener("input", refresh);
  document.getElementById("twilight").addEventListener("input", refresh);
  const practiceEl = document.getElementById("practice");
  if (practiceEl) practiceEl.addEventListener("input", refresh);
  const rangeBucketEl = document.getElementById("range-bucket");
  if (rangeBucketEl) rangeBucketEl.addEventListener("change", refresh);

  const csvPath = "../../data/legacy/rounds_cost.csv";
  loadPricing(csvPath)
    .then(() => {
      console.log("[init] Pricing loaded, updating chart");
      refresh();
    })
    .catch((err) => {
      console.warn("[init] Pricing CSV failed, using defaults:", err);
    });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
