import { calculateResults, controlDefinitions, presets } from "./model.js";

const state = { ...presets.baseCase };

const controlsEl = document.querySelector("#controls");
const chartEl = document.querySelector("#revenueChart");
const presetButtons = document.querySelectorAll(".preset-btn");

const metricElements = {
  ticketRevenue: document.querySelector("#ticketRevenue"),
  artistCost: document.querySelector("#artistCost"),
  ancillaryRevenue: document.querySelector("#ancillaryRevenue"),
  rentalRevenue: document.querySelector("#rentalRevenue"),
  totalRevenue: document.querySelector("#totalRevenue"),
  operatingResult: document.querySelector("#operatingResult"),
  expectedTicketedEvents: document.querySelector("#expectedTicketedEvents"),
  breakEvenAttendanceRate: document.querySelector("#breakEvenAttendanceRate"),
  breakEvenEvents: document.querySelector("#breakEvenEvents")
};
const chartContextEl = document.querySelector("#chartContext");

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1
});

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0
});

function formatValue(value, format) {
  if (format === "currency") return currencyFormatter.format(value);
  if (format === "percent") return percentFormatter.format(value);
  return numberFormatter.format(value);
}

function renderControls() {
  controlsEl.innerHTML = "";
  controlDefinitions.forEach((def) => {
    const group = document.createElement("div");
    group.className = "control-group";

    const labelRow = document.createElement("div");
    labelRow.className = "control-label-row";

    const label = document.createElement("label");
    label.htmlFor = def.key;
    label.textContent = def.label;

    const valueEl = document.createElement("span");
    valueEl.className = "control-value";
    valueEl.id = `${def.key}-value`;
    valueEl.textContent = formatValue(state[def.key], def.format);

    labelRow.append(label, valueEl);

    const input = document.createElement("input");
    input.id = def.key;
    input.type = def.type;
    input.min = String(def.min);
    input.max = String(def.max);
    input.step = String(def.step);
    input.value = String(state[def.key]);

    const eventType = def.type === "range" ? "input" : "change";
    input.addEventListener(eventType, () => {
      const parsed = Number(input.value);
      if (Number.isFinite(parsed)) {
        state[def.key] = parsed;
        valueEl.textContent = formatValue(parsed, def.format);
        render();
      }
    });

    group.append(labelRow, input);
    controlsEl.appendChild(group);
  });
}

function applyPreset(presetKey) {
  Object.assign(state, presets[presetKey]);
  renderControls();
  setActivePresetButton(presetKey);
  render();
}

function setActivePresetButton(activeKey) {
  presetButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.preset === activeKey);
  });
}

function updateMetrics(results) {
  metricElements.ticketRevenue.textContent = currencyFormatter.format(
    results.ticketRevenue
  );
  metricElements.artistCost.textContent = currencyFormatter.format(
    results.artistCost
  );
  metricElements.ancillaryRevenue.textContent = currencyFormatter.format(
    results.ancillaryRevenue
  );
  metricElements.rentalRevenue.textContent = currencyFormatter.format(
    results.rentalRevenue
  );
  metricElements.totalRevenue.textContent = currencyFormatter.format(
    results.totalRevenue
  );
  metricElements.operatingResult.textContent = currencyFormatter.format(
    results.operatingResult
  );
  metricElements.expectedTicketedEvents.textContent = numberFormatter.format(
    Math.round(results.expectedTicketedEvents)
  );
  metricElements.breakEvenAttendanceRate.textContent = Number.isFinite(
    results.breakEvenAttendanceRate
  )
    ? percentFormatter.format(results.breakEvenAttendanceRate)
    : "N/A";
  metricElements.breakEvenEvents.textContent = Number.isFinite(
    results.breakEvenTicketedEvents
  )
    ? numberFormatter.format(Math.ceil(results.breakEvenTicketedEvents))
    : "N/A";

  metricElements.operatingResult.classList.toggle(
    "positive",
    results.operatingResult >= 0
  );
  metricElements.operatingResult.classList.toggle(
    "negative",
    results.operatingResult < 0
  );

  chartContextEl.textContent = `Based on ${numberFormatter.format(
    Math.round(results.expectedTicketedEvents)
  )} expected ticketed events per year`;
}

function drawRevenueChart(results) {
  const data = results.revenueBreakdown;
  const margin = { top: 12, right: 12, bottom: 56, left: 68 };
  const width = chartEl.clientWidth || 700;
  const height = 300;
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  d3.select(chartEl).selectAll("*").remove();

  const svg = d3
    .select(chartEl)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMinYMin meet");

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3
    .scaleBand()
    .domain(data.map((d) => d.category))
    .range([0, innerWidth])
    .padding(0.2);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.value) || 1])
    .nice()
    .range([innerHeight, 0]);

  g.selectAll(".bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", (d) => x(d.category))
    .attr("y", (d) => y(d.value))
    .attr("width", x.bandwidth())
    .attr("height", (d) => innerHeight - y(d.value))
    .attr("fill", "var(--bar)");

  const axisBottom = d3.axisBottom(x).tickSizeOuter(0);
  const axisLeft = d3
    .axisLeft(y)
    .ticks(5)
    .tickSize(-innerWidth)
    .tickFormat((v) => currencyFormatter.format(v));

  g.append("g")
    .attr("class", "axis axis-x")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(axisBottom)
    .selectAll("text")
    .attr("transform", "rotate(-18)")
    .style("text-anchor", "end");

  g.append("g")
    .attr("class", "axis axis-y")
    .call(axisLeft)
    .call((selection) => selection.select(".domain").remove());
}

function render() {
  const results = calculateResults(state);
  updateMetrics(results);
  drawRevenueChart(results);
}

presetButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    applyPreset(btn.dataset.preset);
  });
});

window.addEventListener("resize", render);

renderControls();
setActivePresetButton("baseCase");
render();
