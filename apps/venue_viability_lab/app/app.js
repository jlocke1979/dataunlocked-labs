import {
  HARD_CONSTRAINTS,
  FACILITY_PROFILE,
  EVENT_TYPES,
  DAY_UTILIZATION_KEYS,
  constraintDefinitions,
  financeDefinitions,
  calendarDefinitions,
  eventFieldDefinitions,
  fixedCostLineItems,
  rangeVariableDefinitions,
  presets,
  defaultRanges,
  calculateResults,
  computeTicketedEventsPerYear,
  computeAnnualFixedCosts,
  computeDebtMetrics,
  sumDailyUtilization,
  cloneRanges,
  cloneInputs,
  syncTicketedFromRangeBase,
  computeTicketedGrossPerEvent,
  snapshotCurrentScenario
} from "./model.js";

const SCENARIO_STORAGE_KEY = "venue-viability-lab-scenarios";

const state = {
  ...presets.baseCase,
  finance: structuredClone(presets.baseCase.finance),
  ranges: cloneRanges(presets.baseCase.ranges || defaultRanges),
  fixedCostBreakdown: structuredClone(presets.baseCase.fixedCostBreakdown),
  eventTypes: structuredClone(presets.baseCase.eventTypes)
};
syncTicketedFromRangeBase(state);

let activeVariant = "base";
let savedScenarios = loadSavedScenarios();

const collapsibleRefs = {
  calendar: null,
  fixedCosts: null,
  ranges: null,
  eventTypes: {},
  savedScenarios: null
};

const hardConstraintsListEl = document.querySelector("#hardConstraintsList");
const constraintsControlsEl = document.querySelector("#constraintsControls");
const financeControlsEl = document.querySelector("#financeControls");
const financeSummaryEl = document.querySelector("#financeSummary");
const fixedCostControlsEl = document.querySelector("#fixedCostControls");
const fixedCostRefEl = document.querySelector("#fixedCostRef");
const carryCostRefEl = document.querySelector("#carryCostRef");
const eventTypeControlsEl = document.querySelector("#eventTypeControls");
const warningsPanelEl = document.querySelector("#warningsPanel");
const warningsListEl = document.querySelector("#warningsList");
const eventSummaryBodyEl = document.querySelector("#eventSummaryTable tbody");
const contributionChartEl = document.querySelector("#contributionChart");
const sensitivityChartEl = document.querySelector("#sensitivityChart");
const rangeControlsEl = document.querySelector("#rangeControls");
const rangeOutcomesBodyEl = document.querySelector("#rangeOutcomesTable tbody");
const rangeOutcomesNoteEl = document.querySelector("#rangeOutcomesNote");
const savedScenariosBodyEl = document.querySelector("#savedScenariosTable tbody");
const scenarioNameInputEl = document.querySelector("#scenarioNameInput");
const saveScenarioBtnEl = document.querySelector("#saveScenarioBtn");
const presetButtons = document.querySelectorAll(".preset-btn");
const variantButtons = document.querySelectorAll(".variant-btn");

const metricElements = {
  totalGrossRevenue: document.querySelector("#totalGrossRevenue"),
  totalDirectCosts: document.querySelector("#totalDirectCosts"),
  totalNetContribution: document.querySelector("#totalNetContribution"),
  annualFixedCosts: document.querySelector("#annualFixedCosts"),
  annualOperatingResult: document.querySelector("#annualOperatingResult"),
  gapToTarget: document.querySelector("#gapToTarget"),
  requiredAdditionalContribution: document.querySelector("#requiredAdditionalContribution"),
  avgContributionPerActiveEvent: document.querySelector("#avgContributionPerActiveEvent"),
  expectedTicketedEvents: document.querySelector("#expectedTicketedEvents")
};

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

function loadSavedScenarios() {
  try {
    return JSON.parse(localStorage.getItem(SCENARIO_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function persistSavedScenarios() {
  localStorage.setItem(SCENARIO_STORAGE_KEY, JSON.stringify(savedScenarios));
}

function createCollapsibleSection({ title, meta = "", defaultOpen = false, className = "" }) {
  const details = document.createElement("details");
  details.className = `collapsible ${className}`.trim();
  if (defaultOpen) {
    details.open = true;
  }

  const summary = document.createElement("summary");
  summary.className = "collapsible-summary";
  summary.innerHTML = `
    <span class="collapsible-title">${title}</span>
    <span class="collapsible-meta"></span>
  `;

  const content = document.createElement("div");
  content.className = "collapsible-content";

  details.append(summary, content);

  const setMeta = (text) => {
    summary.querySelector(".collapsible-meta").textContent = text || meta;
  };
  setMeta(meta);

  return { details, content, setMeta };
}

function calendarSummaryText() {
  const weeklyNights = sumDailyUtilization(state);
  const events = Math.round(computeTicketedEventsPerYear(state));
  return `${weeklyNights.toFixed(2)} nights/wk — ${numberFormatter.format(events)} events/yr`;
}

function copyCalendarFromPreset(preset) {
  for (const key of DAY_UTILIZATION_KEYS) {
    state[key] = preset[key] ?? 0;
  }
}

function createRangeControl(def) {
  const group = document.createElement("div");
  group.className = "control-group range-group";

  const header = document.createElement("div");
  header.className = "range-header";
  header.innerHTML = `<label>${def.label}</label>`;
  group.appendChild(header);

  const grid = document.createElement("div");
  grid.className = "range-grid";

  ["min", "base", "max"].forEach((bound) => {
    const col = document.createElement("div");
    col.className = "range-col";

    const colLabel = document.createElement("span");
    colLabel.className = "range-col-label";
    colLabel.textContent =
      bound === "min" ? "Conservative" : bound === "max" ? "Aggressive" : "Base";

    const valueEl = document.createElement("span");
    valueEl.className = "control-value";
    valueEl.textContent = formatValue(state.ranges[def.key][bound], def.format);

    const input = document.createElement("input");
    input.type = "number";
    input.step = String(def.step);
    input.min = String(def.min);
    input.max = String(def.max);
    input.value = String(state.ranges[def.key][bound]);
    input.id = `range-${def.key}-${bound}`;

    input.addEventListener("change", () => {
      const parsed = Number(input.value);
      if (!Number.isFinite(parsed)) return;
      state.ranges[def.key][bound] = parsed;
      valueEl.textContent = formatValue(parsed, def.format);
      if (bound === "base") {
        syncTicketedFromRangeBase(state);
        if (def.key === "weddingEventsPerYear") {
          state.eventTypes.weddings.eventsPerYear = Math.round(parsed);
        }
        if (def.key === "sponsorshipTotal") {
          state.eventTypes.sponsorship.grossRevenuePerEvent = Math.round(parsed);
        }
      }
      render();
    });

    col.append(colLabel, valueEl, input);
    grid.appendChild(col);
  });

  group.appendChild(grid);

  if (def.note) {
    const note = document.createElement("p");
    note.className = "field-note";
    note.textContent = def.note;
    group.appendChild(note);
  }

  return group;
}

function renderRangeControls() {
  rangeControlsEl.innerHTML = "";
  const shell = createCollapsibleSection({
    title: "Uncertainty ranges",
    meta: "Min / base / max levers",
    defaultOpen: false,
    className: "collapsible-nested"
  });
  collapsibleRefs.ranges = shell;
  rangeControlsEl.appendChild(shell.details);

  rangeVariableDefinitions.forEach((def) => {
    shell.content.appendChild(createRangeControl(def));
  });
}

function renderTicketedDerivedRows(section) {
  const sellout = state.ranges.ticketedSelloutPct.base;
  const attendance = Math.round(sellout * HARD_CONSTRAINTS.maxStandingCapacity);
  const gross = computeTicketedGrossPerEvent(
    sellout,
    state.ranges.ticketedAvgTicketPrice.base,
    state.ranges.ticketedAncillaryPerAttendee.base
  );

  const rows = [
    ["Base sellout attendance (calculated)", numberFormatter.format(attendance)],
    ["Base gross per event (calculated)", currencyFormatter.format(gross)]
  ];

  rows.forEach(([label, value]) => {
    const row = document.createElement("div");
    row.className = "computed-row";
    row.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
    section.appendChild(row);
  });
}

function formatValue(value, format) {
  if (format === "currency") return currencyFormatter.format(value);
  if (format === "percent") return percentFormatter.format(value);
  return numberFormatter.format(value);
}

function renderHardConstraints() {
  hardConstraintsListEl.innerHTML = `
    <li><strong>Approximate footprint:</strong> ${numberFormatter.format(FACILITY_PROFILE.approximateSquareFeet)} sq ft</li>
    <li><strong>Max seated capacity:</strong> ${HARD_CONSTRAINTS.maxSeatedCapacity}</li>
    <li><strong>Max standing/event capacity:</strong> ${HARD_CONSTRAINTS.maxStandingCapacity}</li>
  `;
}

function createControl(def, value, onChange, idPrefix = "") {
  const inputId = idPrefix ? `${idPrefix}-${def.key}` : def.key;
  const group = document.createElement("div");
  group.className = "control-group";

  const labelRow = document.createElement("div");
  labelRow.className = "control-label-row";

  const label = document.createElement("label");
  label.htmlFor = inputId;
  label.textContent = def.label;

  const valueEl = document.createElement("span");
  valueEl.className = "control-value";
  valueEl.textContent = formatValue(value, def.format);

  labelRow.append(label, valueEl);

  const input = document.createElement("input");
  input.id = inputId;
  input.type = def.type;
  input.min = String(def.min);
  input.max = String(def.max);
  input.step = String(def.step);
  input.value = String(value);

  const eventType = def.type === "range" ? "input" : "change";
  input.addEventListener(eventType, () => {
    const parsed = Number(input.value);
    if (Number.isFinite(parsed)) {
      onChange(parsed);
      valueEl.textContent = formatValue(parsed, def.format);
      render();
    }
  });

  group.append(labelRow, input);
  return group;
}

function renderConstraintsControls() {
  constraintsControlsEl.innerHTML = "";
  constraintDefinitions.forEach((def) => {
    constraintsControlsEl.appendChild(
      createControl(def, state[def.key], (value) => {
        state[def.key] = value;
      })
    );
  });
}

function renderFinanceControls() {
  financeControlsEl.innerHTML = "";
  financeDefinitions.forEach((def) => {
    financeControlsEl.appendChild(
      createControl(def, state.finance[def.key], (value) => {
        state.finance[def.key] = value;
      })
    );
  });

  const debt = computeDebtMetrics(state.finance);
  financeSummaryEl.textContent = `Loan principal ${currencyFormatter.format(
    debt.loanPrincipal
  )} with annual debt service ${currencyFormatter.format(
    debt.annualDebtService
  )}.`;
}

function renderEventTypeControls() {
  eventTypeControlsEl.innerHTML = "";
  collapsibleRefs.eventTypes = {};

  EVENT_TYPES.forEach((typeDef) => {
    const shell = createCollapsibleSection({
      title: typeDef.label,
      meta: "",
      defaultOpen: typeDef.id === "ticketed",
      className: "event-type-section"
    });
    collapsibleRefs.eventTypes[typeDef.id] = shell;
    const section = shell.content;

    if (typeDef.hasCalendar) {
      const calendarNote = document.createElement("p");
      calendarNote.className = "panel-note";
      calendarNote.textContent =
        "Expected ticketed events = active weeks × sum of Mon–Sun utilization rates.";
      section.appendChild(calendarNote);

      const calendarShell = createCollapsibleSection({
        title: "Mon–Sun utilization",
        meta: calendarSummaryText(),
        defaultOpen: false,
        className: "collapsible-nested collapsible-calendar"
      });
      collapsibleRefs.calendar = calendarShell;
      section.appendChild(calendarShell.details);

      calendarDefinitions.forEach((def) => {
        calendarShell.content.appendChild(
          createControl(def, state[def.key], (value) => {
            state[def.key] = value;
            calendarShell.setMeta(calendarSummaryText());
          })
        );
      });

      const eventsRow = document.createElement("div");
      eventsRow.className = "computed-row";
      eventsRow.innerHTML = `
        <span>Calculated ticketed events per year</span>
        <strong class="computed-events-value" data-type="ticketed">${numberFormatter.format(
          Math.round(computeTicketedEventsPerYear(state))
        )}</strong>
      `;
      calendarShell.content.appendChild(eventsRow);

      renderTicketedDerivedRows(section);
    }

    eventFieldDefinitions.forEach((fieldDef) => {
      if (fieldDef.hideFor?.includes(typeDef.id)) return;
      if (fieldDef.computedFor?.includes(typeDef.id)) {
        const computedField = document.createElement("div");
        computedField.className = "computed-row";
        computedField.innerHTML = `
          <span>${fieldDef.label}</span>
          <strong class="computed-events-value" data-type="${typeDef.id}">${numberFormatter.format(
            Math.round(computeTicketedEventsPerYear(state))
          )}</strong>
        `;
        section.appendChild(computedField);
        return;
      }

      section.appendChild(
        createControl(
          fieldDef,
          state.eventTypes[typeDef.id][fieldDef.key],
          (value) => {
            state.eventTypes[typeDef.id][fieldDef.key] = value;
          },
          typeDef.id
        )
      );
    });

    const netRow = document.createElement("div");
    netRow.className = "computed-row";
    netRow.innerHTML = `
      <span>Net contribution (calculated)</span>
      <strong class="net-contribution-value" data-type="${typeDef.id}">$0</strong>
    `;
    section.appendChild(netRow);

    eventTypeControlsEl.appendChild(shell.details);
  });
}

function fixedCostMetaText(total) {
  const perSqFt = total / FACILITY_PROFILE.approximateSquareFeet;
  return `${currencyFormatter.format(total)} · ${currencyFormatter.format(perSqFt)}/sq ft`;
}

function renderFixedCostControls() {
  fixedCostControlsEl.innerHTML = "";

  const total = computeAnnualFixedCosts(state);
  const shell = createCollapsibleSection({
    title: "Edit line items",
    meta: fixedCostMetaText(total),
    defaultOpen: false,
    className: "collapsible-fixed-costs"
  });
  collapsibleRefs.fixedCosts = shell;
  fixedCostControlsEl.appendChild(shell.details);

  fixedCostLineItems.forEach((def) => {
    shell.content.appendChild(
      createControl(
        def,
        state.fixedCostBreakdown[def.key],
        (value) => {
          state.fixedCostBreakdown[def.key] = value;
        },
        "fixed"
      )
    );
  });
}

function renderFixedCostRef(totals) {
  const headroom = state.maxAnnualFixedCosts / totals.annualFixedCosts - 1;
  fixedCostRefEl.textContent = `Fixed costs (sidebar): ${fixedCostMetaText(
    totals.annualFixedCosts
  )}. Ceiling ${currencyFormatter.format(state.maxAnnualFixedCosts)} (${percentFormatter.format(headroom)} headroom).`;

  const carry = totals.carryCosts;
  carryCostRefEl.textContent = `Carry cost check: taxes ${currencyFormatter.format(
    carry.propertyTaxes
  )}, insurance ${currencyFormatter.format(
    carry.insurance
  )}, utilities ${currencyFormatter.format(
    carry.utilities
  )}, debt service ${currencyFormatter.format(
    carry.annualDebtService
  )}.`;
}

function renderControls() {
  renderHardConstraints();
  renderConstraintsControls();
  renderFinanceControls();
  renderFixedCostControls();
  renderRangeControls();
  renderEventTypeControls();
}

function applyPreset(presetKey) {
  const preset = presets[presetKey];
  Object.assign(state, {
    activeWeeksPerYear: preset.activeWeeksPerYear,
    maxUsableEventNightsPerWeek: preset.maxUsableEventNightsPerWeek,
    minOperatingResultTarget: preset.minOperatingResultTarget,
    maxAnnualFixedCosts: preset.maxAnnualFixedCosts
  });
  state.finance = structuredClone(preset.finance);
  copyCalendarFromPreset(preset);
  state.fixedCostBreakdown = structuredClone(preset.fixedCostBreakdown);
  state.ranges = cloneRanges(preset.ranges || defaultRanges);
  state.eventTypes = structuredClone(preset.eventTypes);
  syncTicketedFromRangeBase(state);
  state.eventTypes.weddings.eventsPerYear = Math.round(
    state.ranges.weddingEventsPerYear.base
  );
  state.eventTypes.sponsorship.grossRevenuePerEvent = Math.round(
    state.ranges.sponsorshipTotal.base
  );
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
  const { totals } = results;

  metricElements.totalGrossRevenue.textContent = currencyFormatter.format(
    totals.totalGrossRevenue
  );
  metricElements.totalDirectCosts.textContent = currencyFormatter.format(
    totals.totalDirectCosts
  );
  metricElements.totalNetContribution.textContent = currencyFormatter.format(
    totals.totalNetContribution
  );
  metricElements.annualFixedCosts.textContent = currencyFormatter.format(
    totals.annualFixedCosts
  );
  metricElements.annualOperatingResult.textContent = currencyFormatter.format(
    totals.annualOperatingResult
  );
  metricElements.gapToTarget.textContent = currencyFormatter.format(totals.gapToTarget);
  metricElements.requiredAdditionalContribution.textContent = currencyFormatter.format(
    totals.requiredAdditionalContribution
  );
  metricElements.avgContributionPerActiveEvent.textContent = currencyFormatter.format(
    totals.avgContributionPerActiveEvent
  );
  metricElements.expectedTicketedEvents.textContent = numberFormatter.format(
    Math.round(totals.ticketedEventsPerYear)
  );

  document.querySelectorAll(".computed-events-value").forEach((el) => {
    el.textContent = numberFormatter.format(Math.round(totals.ticketedEventsPerYear));
  });

  document.querySelectorAll(".net-contribution-value").forEach((el) => {
    const row = results.eventResults.find((item) => item.id === el.dataset.type);
    el.textContent = currencyFormatter.format(row?.netContribution || 0);
  });
}

function renderWarnings(warnings) {
  if (warnings.length === 0) {
    warningsPanelEl.hidden = true;
    warningsListEl.innerHTML = "";
    return;
  }

  warningsPanelEl.hidden = false;
  warningsListEl.innerHTML = warnings
    .map((warning) => `<li>${warning.message}</li>`)
    .join("");
}

function renderEventSummary(eventResults) {
  eventSummaryBodyEl.innerHTML = eventResults
    .map(
      (row) => `
      <tr>
        <td>${row.label}</td>
        <td>${numberFormatter.format(Math.round(row.eventsPerYear))}</td>
        <td>${
          row.capacityMode === "none"
            ? "—"
            : numberFormatter.format(Math.round(row.avgAttendance))
        }</td>
        <td>${currencyFormatter.format(row.grossRevenuePerEvent)}</td>
        <td>${percentFormatter.format(row.directCostPct)}</td>
        <td>${currencyFormatter.format(row.netContribution)}</td>
      </tr>
    `
    )
    .join("");
}

function drawBarChart(containerEl, data, valueKey = "value") {
  const margin = { top: 12, right: 12, bottom: 56, left: 68 };
  const width = containerEl.clientWidth || 700;
  const height = 300;
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  d3.select(containerEl).selectAll("*").remove();

  const svg = d3
    .select(containerEl)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMinYMin meet");

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3
    .scaleBand()
    .domain(data.map((d) => d.category || d.label))
    .range([0, innerWidth])
    .padding(0.2);

  const maxValue = d3.max(data, (d) => Math.abs(d[valueKey])) || 1;
  const y = d3
    .scaleLinear()
    .domain([0, maxValue])
    .nice()
    .range([innerHeight, 0]);

  g.selectAll(".bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", (d) => x(d.category || d.label))
    .attr("y", (d) => y(Math.abs(d[valueKey])))
    .attr("width", x.bandwidth())
    .attr("height", (d) => innerHeight - y(Math.abs(d[valueKey])))
    .attr("fill", "var(--bar)");

  g.append("g")
    .attr("class", "axis axis-x")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x).tickSizeOuter(0))
    .selectAll("text")
    .attr("transform", "rotate(-18)")
    .style("text-anchor", "end");

  g.append("g")
    .attr("class", "axis axis-y")
    .call(
      d3
        .axisLeft(y)
        .ticks(5)
        .tickSize(-innerWidth)
        .tickFormat((v) => currencyFormatter.format(v))
    )
    .call((selection) => selection.select(".domain").remove());
}

function drawTornadoChart(sensitivity) {
  const margin = { top: 12, right: 24, bottom: 12, left: 180 };
  const width = sensitivityChartEl.clientWidth || 700;
  const height = Math.max(220, sensitivity.length * 42 + margin.top + margin.bottom);
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  d3.select(sensitivityChartEl).selectAll("*").remove();

  const svg = d3
    .select(sensitivityChartEl)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMinYMin meet");

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const maxImpact = d3.max(sensitivity, (d) => d.impact) || 1;
  const x = d3.scaleLinear().domain([-maxImpact, maxImpact]).range([0, innerWidth]);
  const y = d3
    .scaleBand()
    .domain(sensitivity.map((d) => d.label))
    .range([0, innerHeight])
    .padding(0.25);

  g.append("line")
    .attr("x1", x(0))
    .attr("x2", x(0))
    .attr("y1", 0)
    .attr("y2", innerHeight)
    .attr("stroke", "var(--line)");

  sensitivity.forEach((item) => {
    const lowX = x(Math.min(item.lowDelta, 0));
    const highX = x(Math.max(item.highDelta, 0));
    g.append("rect")
      .attr("x", lowX)
      .attr("y", y(item.label))
      .attr("width", Math.max(1, highX - lowX))
      .attr("height", y.bandwidth())
      .attr("fill", "var(--bar)");
  });

  g.append("g")
    .attr("class", "axis axis-y")
    .call(d3.axisLeft(y).tickSizeOuter(0));

  g.append("g")
    .attr("class", "axis axis-x")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(5)
        .tickFormat((v) => currencyFormatter.format(v))
    )
    .call((selection) => selection.select(".domain").remove());
}

function setActiveVariantButton(activeKey) {
  variantButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.variant === activeKey);
  });
}

function renderRangeOutcomes(rangeOutcomes) {
  const minOp = rangeOutcomes.find((r) => r.id === "min")?.annualOperatingResult ?? 0;
  const maxOp = rangeOutcomes.find((r) => r.id === "max")?.annualOperatingResult ?? 0;
  rangeOutcomesNoteEl.textContent = `Auto-run from uncertainty ranges. Operating result spans ${currencyFormatter.format(minOp)} – ${currencyFormatter.format(maxOp)}.`;

  rangeOutcomesBodyEl.innerHTML = rangeOutcomes
    .map(
      (row) => `
      <tr>
        <td>${row.label}</td>
        <td>${percentFormatter.format(row.ticketedSelloutPct)}</td>
        <td>${currencyFormatter.format(row.ticketedAvgTicketPrice)}</td>
        <td>${numberFormatter.format(Math.round(row.ticketedEvents))}</td>
        <td>${currencyFormatter.format(row.totalNetContribution)}</td>
        <td>${currencyFormatter.format(row.annualOperatingResult)}</td>
        <td>${currencyFormatter.format(row.gapToTarget)}</td>
        <td>${row.warningCount}</td>
      </tr>
    `
    )
    .join("");
}

function initSavedScenariosShell() {
  if (collapsibleRefs.savedScenarios) return;
  const panel = document.querySelector("#savedScenariosPanel");
  const saveRow = panel.querySelector(".scenario-save-row");
  const tableWrap = panel.querySelector(".table-wrap");
  panel.querySelector(".panel-note")?.remove();

  const shell = createCollapsibleSection({
    title: "Saved comparisons",
    meta: "None saved",
    defaultOpen: false,
    className: "collapsible-nested"
  });
  shell.content.append(tableWrap);
  saveRow.after(shell.details);
  collapsibleRefs.savedScenarios = shell;
}

function renderSavedScenarios() {
  initSavedScenariosShell();
  const shell = collapsibleRefs.savedScenarios;
  shell.setMeta(
    savedScenarios.length === 0
      ? "None saved"
      : `${savedScenarios.length} saved`
  );

  if (savedScenarios.length === 0) {
    savedScenariosBodyEl.innerHTML = `<tr><td colspan="6">No saved scenarios yet.</td></tr>`;
    return;
  }

  savedScenariosBodyEl.innerHTML = savedScenarios
    .map((scenario) => {
      const min = scenario.rangeOutcomes.find((r) => r.id === "min");
      const base = scenario.rangeOutcomes.find((r) => r.id === "base");
      const max = scenario.rangeOutcomes.find((r) => r.id === "max");
      const savedDate = new Date(scenario.savedAt).toLocaleDateString();
      return `
      <tr>
        <td>${scenario.name}</td>
        <td>${savedDate}</td>
        <td>${currencyFormatter.format(min?.annualOperatingResult ?? 0)}</td>
        <td>${currencyFormatter.format(base?.annualOperatingResult ?? 0)}</td>
        <td>${currencyFormatter.format(max?.annualOperatingResult ?? 0)}</td>
        <td><button type="button" class="link-btn" data-load="${scenario.id}">Load</button>
        <button type="button" class="link-btn" data-delete="${scenario.id}">Delete</button></td>
      </tr>
    `;
    })
    .join("");

  savedScenariosBodyEl.querySelectorAll("[data-load]").forEach((btn) => {
    btn.addEventListener("click", () => loadScenario(btn.dataset.load));
  });
  savedScenariosBodyEl.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", () => deleteScenario(btn.dataset.delete));
  });
}

function loadScenario(id) {
  const scenario = savedScenarios.find((s) => s.id === id);
  if (!scenario) return;
  const inputs = scenario.inputs;
  Object.assign(state, {
    activeWeeksPerYear: inputs.activeWeeksPerYear,
    maxUsableEventNightsPerWeek: inputs.maxUsableEventNightsPerWeek,
    minOperatingResultTarget: inputs.minOperatingResultTarget,
    maxAnnualFixedCosts: inputs.maxAnnualFixedCosts
  });
  state.finance = structuredClone(inputs.finance);
  copyCalendarFromPreset(inputs);
  state.fixedCostBreakdown = structuredClone(inputs.fixedCostBreakdown);
  state.ranges = cloneRanges(inputs.ranges);
  state.eventTypes = structuredClone(inputs.eventTypes);
  renderControls();
  render();
}

function deleteScenario(id) {
  savedScenarios = savedScenarios.filter((s) => s.id !== id);
  persistSavedScenarios();
  renderSavedScenarios();
}

function updateCollapsibleSummaries(results) {
  if (collapsibleRefs.calendar) {
    collapsibleRefs.calendar.setMeta(calendarSummaryText());
  }
  if (collapsibleRefs.fixedCosts) {
    collapsibleRefs.fixedCosts.setMeta(fixedCostMetaText(results.totals.annualFixedCosts));
  }
  if (collapsibleRefs.ranges) {
    const minOp = results.rangeOutcomes.find((r) => r.id === "min")?.annualOperatingResult;
    const maxOp = results.rangeOutcomes.find((r) => r.id === "max")?.annualOperatingResult;
    collapsibleRefs.ranges.setMeta(
      `${currencyFormatter.format(minOp)} – ${currencyFormatter.format(maxOp)}`
    );
  }
  Object.entries(collapsibleRefs.eventTypes).forEach(([id, shell]) => {
    const row = results.eventResults.find((r) => r.id === id);
    shell.setMeta(row ? currencyFormatter.format(row.netContribution) : "");
  });
}

function render() {
  const results = calculateResults(state, activeVariant);
  updateMetrics(results);
  renderWarnings(results.warnings);
  renderFixedCostRef(results.totals);
  renderRangeOutcomes(results.rangeOutcomes);
  renderSavedScenarios();
  updateCollapsibleSummaries(results);
  renderEventSummary(results.eventResults);
  drawBarChart(contributionChartEl, results.contributionBreakdown);
  drawTornadoChart(results.sensitivity);
}

presetButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    applyPreset(btn.dataset.preset);
  });
});

variantButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    activeVariant = btn.dataset.variant;
    setActiveVariantButton(activeVariant);
    render();
  });
});

saveScenarioBtnEl.addEventListener("click", () => {
  const name = scenarioNameInputEl.value.trim() || `Scenario ${savedScenarios.length + 1}`;
  savedScenarios.push(snapshotCurrentScenario(state, name));
  persistSavedScenarios();
  scenarioNameInputEl.value = "";
  renderSavedScenarios();
});

window.addEventListener("resize", render);

renderControls();
initSavedScenariosShell();
setActivePresetButton("baseCase");
setActiveVariantButton("base");
render();
