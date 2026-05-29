"use strict";

/* ---------------------------------------------------------------------------
 * Map registry. Add future maps here, then point plots.csv `map_id` at them.
 * Positions in plots.csv are percentage-based (x_pct / y_pct, 0-100), so no
 * GIS coordinates are required.
 * ------------------------------------------------------------------------- */
const MAPS = [
  { id: "uplands_base", label: "Uplands base map", src: "assets/map_base.jpg" }
  // { id: "columbia_2026", label: "Columbia Terrace 2026", src: "assets/maps/columbia_terrace_2026.jpg" }
];

const DATA = {
  plots: [],
  responsibilities: [],
  plantings: [],
  movePlan: [],
  siteNotes: []
};

let activeMapId = MAPS[0] ? MAPS[0].id : null;

/* ----------------------------- CSV parsing ------------------------------- */
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else { field += c; }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field); field = "";
    } else if (c === "\n") {
      row.push(field); field = "";
      rows.push(row); row = [];
    } else if (c === "\r") {
      // ignore
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter(r => r.length > 1 || (r.length === 1 && r[0].trim() !== ""));
}

function csvToObjects(text) {
  const rows = parseCSV(text);
  if (rows.length === 0) return [];
  const headers = rows[0].map(h => h.trim());
  return rows.slice(1).map(r => {
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = (r[idx] !== undefined ? r[idx].trim() : ""); });
    return obj;
  });
}

async function loadCSV(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path} (${res.status})`);
  return csvToObjects(await res.text());
}

/* ----------------------------- Helpers ----------------------------------- */
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (m) => (
  { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]
));

const slug = (s) => String(s || "").toLowerCase().trim().replace(/\s+/g, "-");

function badge(value) {
  if (!value) return '<span class="muted">—</span>';
  return `<span class="badge ${slug(value)}">${esc(value)}</span>`;
}

function priorityBadge(value) {
  if (!value) return '<span class="muted">—</span>';
  return `<span class="badge priority-${slug(value)}">${esc(value)}</span>`;
}

function isTrue(v) {
  return String(v).trim().toUpperCase() === "TRUE";
}

function plotsForMap(mapId) {
  return DATA.plots.filter(p => p.map_id === mapId);
}

function respForPlot(plotId) {
  return DATA.responsibilities.find(r => r.plot_id === plotId) || null;
}

function plantsForPlot(plotId) {
  return DATA.plantings.filter(p => p.plot_id === plotId);
}

/* Privacy: only reveal the real name when contact_ok is TRUE. */
function publicSteward(resp) {
  if (!resp) return { text: "Seeking steward", isPrivate: false };
  const display = resp.public_display_name || "Steward";
  if (isTrue(resp.contact_ok) && resp.responsible_name) {
    return { text: `${display} — ${resp.responsible_name}`, isPrivate: false };
  }
  return { text: display, isPrivate: true };
}

/* ----------------------------- Overview ---------------------------------- */
function renderOverview() {
  const totalPlots = DATA.plots.length;
  const stewarded = DATA.plots.filter(p => {
    const r = respForPlot(p.plot_id);
    return r && r.public_display_name && !/seeking/i.test(r.public_display_name);
  }).length;
  const plantCount = DATA.plantings.reduce((n, p) => n + (parseInt(p.quantity, 10) || 0), 0);
  const moves = DATA.movePlan.length;
  const stats = [
    { num: totalPlots, lbl: "Plots tracked" },
    { num: stewarded, lbl: "Plots with a steward" },
    { num: plantCount, lbl: "Plants logged" },
    { num: moves, lbl: "Planned moves" }
  ];
  document.getElementById("overviewStats").innerHTML = stats.map(s =>
    `<div class="stat"><div class="num">${s.num}</div><div class="lbl">${esc(s.lbl)}</div></div>`
  ).join("");
}

/* ----------------------------- Map --------------------------------------- */
function renderMapSelector() {
  const sel = document.getElementById("mapSelect");
  sel.innerHTML = MAPS.map(m => `<option value="${esc(m.id)}">${esc(m.label)}</option>`).join("");
  sel.value = activeMapId;
  sel.addEventListener("change", () => {
    activeMapId = sel.value;
    renderMap();
    clearPlotDetail();
  });
}

function renderMap() {
  const map = MAPS.find(m => m.id === activeMapId);
  const img = document.getElementById("mapImage");
  const fallback = document.getElementById("mapFallback");
  const layer = document.getElementById("markerLayer");
  layer.innerHTML = "";

  if (!map) { fallback.hidden = false; img.removeAttribute("src"); return; }

  img.src = map.src;
  img.onerror = () => { img.style.display = "none"; fallback.hidden = false; };
  img.onload = () => { img.style.display = "block"; fallback.hidden = true; };

  plotsForMap(activeMapId).forEach(plot => {
    const m = document.createElement("button");
    m.className = "marker";
    m.type = "button";
    m.style.left = `${parseFloat(plot.x_pct) || 0}%`;
    m.style.top = `${parseFloat(plot.y_pct) || 0}%`;
    m.dataset.status = plot.status || "";
    m.dataset.plotId = plot.plot_id;
    m.textContent = plot.label || "•";
    m.setAttribute("aria-label", `Plot ${plot.label || plot.plot_id}`);
    m.addEventListener("click", () => selectPlot(plot.plot_id));
    layer.appendChild(m);
  });
}

function clearPlotDetail() {
  document.querySelectorAll(".marker.is-active").forEach(el => el.classList.remove("is-active"));
  document.getElementById("plotDetail").innerHTML =
    '<p class="plot-detail-empty">Select a plot marker to view its details.</p>';
}

function selectPlot(plotId) {
  const plot = DATA.plots.find(p => p.plot_id === plotId);
  if (!plot) return;
  document.querySelectorAll(".marker.is-active").forEach(el => el.classList.remove("is-active"));
  const marker = document.querySelector(`.marker[data-plot-id="${CSS.escape(plotId)}"]`);
  if (marker) marker.classList.add("is-active");

  const resp = respForPlot(plotId);
  const steward = publicSteward(resp);
  const plants = plantsForPlot(plotId);

  const plantsHtml = plants.length
    ? `<ul class="pd-plants">${plants.map(p =>
        `<li>${esc(p.plant_name)} ${p.quantity ? `(${esc(p.quantity)})` : ""} — ${badge(p.current_status)}</li>`
      ).join("")}</ul>`
    : '<p class="muted">No plants logged yet.</p>';

  document.getElementById("plotDetail").innerHTML = `
    <h3>Plot ${esc(plot.label)} <span style="font-weight:400;color:var(--text-soft);font-size:0.8rem">(${esc(plot.plot_id)})</span></h3>
    <p class="pd-loc">${esc(plot.street)} — ${esc(plot.location_description)}</p>
    <dl>
      <dt>Steward</dt><dd>${esc(steward.text)}${steward.isPrivate ? ' <span class="muted">(contact limited)</span>' : ""}</dd>
      <dt>Role</dt><dd>${esc(resp ? resp.role : "—")}</dd>
      <dt>Status</dt><dd>${badge(plot.status)}</dd>
      <dt>Notes</dt><dd>${esc(plot.notes || "—")}</dd>
    </dl>
    <strong style="font-size:0.85rem">Related plants</strong>
    ${plantsHtml}
  `;
}

/* ----------------------------- Responsibility table ---------------------- */
function renderResponsibilityTable() {
  const tbody = document.querySelector("#responsibilityTable tbody");
  tbody.innerHTML = DATA.plots.map(plot => {
    const resp = respForPlot(plot.plot_id);
    const steward = publicSteward(resp);
    return `<tr>
      <td><strong>${esc(plot.label)}</strong></td>
      <td>${esc(plot.street)}<br><span class="muted">${esc(plot.location_description)}</span></td>
      <td>${esc(steward.text)}</td>
      <td>${esc(resp ? resp.role : "—")}</td>
      <td>${badge(plot.status)}</td>
      <td>${esc(resp ? resp.notes : plot.notes)}</td>
    </tr>`;
  }).join("");
}

/* ----------------------------- Inventory table --------------------------- */
function plotLabel(plotId) {
  const p = DATA.plots.find(x => x.plot_id === plotId);
  return p ? p.label : plotId;
}

function renderInventoryTable(filterPlot = "") {
  const tbody = document.querySelector("#inventoryTable tbody");
  const rows = DATA.plantings.filter(p => !filterPlot || p.plot_id === filterPlot);
  tbody.innerHTML = rows.map(p => `<tr>
    <td><strong>${esc(p.plant_name)}</strong></td>
    <td>${esc(plotLabel(p.plot_id))}</td>
    <td>${esc(p.map_code)}</td>
    <td>${esc(p.quantity)}</td>
    <td>${badge(p.current_status)}</td>
    <td>${priorityBadge(p.priority)}</td>
    <td>${esc(p.notes)}</td>
  </tr>`).join("");
}

function renderPlotFilter() {
  const sel = document.getElementById("plotFilter");
  DATA.plots.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.plot_id;
    opt.textContent = `${p.label} — ${p.street}`;
    sel.appendChild(opt);
  });
  sel.addEventListener("change", () => renderInventoryTable(sel.value));
}

/* ----------------------------- Move plan table --------------------------- */
function renderMovePlanTable() {
  const tbody = document.querySelector("#movePlanTable tbody");
  tbody.innerHTML = DATA.movePlan.map(m => {
    const plant = DATA.plantings.find(p => p.plant_id === m.plant_id);
    const name = plant ? plant.plant_name : m.plant_id;
    return `<tr>
      <td><strong>${esc(name)}</strong></td>
      <td>${esc(m.current_location)}</td>
      <td>${esc(m.new_location)}</td>
      <td>${esc(m.move_window)}</td>
      <td>${esc(m.prep_needed)}</td>
      <td>${esc(m.assigned_to)}</td>
      <td>${badge(m.status)}</td>
      <td>${esc(m.notes)}</td>
    </tr>`;
  }).join("");
}

/* ----------------------------- Site notes -------------------------------- */
function renderSiteNotes() {
  const list = document.getElementById("siteNotesList");
  const sorted = [...DATA.siteNotes].sort((a, b) => (a.date < b.date ? 1 : -1));
  list.innerHTML = sorted.map(n => `<li>
    <div class="note-meta"><span class="date">${esc(n.date)}</span> · ${esc(n.location)}</div>
    <div>${esc(n.note)}</div>
  </li>`).join("");
}

/* ----------------------------- Boot -------------------------------------- */
async function init() {
  try {
    const [plots, responsibilities, plantings, movePlan, siteNotes] = await Promise.all([
      loadCSV("data/plots.csv"),
      loadCSV("data/responsibilities.csv"),
      loadCSV("data/plantings.csv"),
      loadCSV("data/move_plan.csv"),
      loadCSV("data/site_notes.csv")
    ]);
    DATA.plots = plots;
    DATA.responsibilities = responsibilities;
    DATA.plantings = plantings;
    DATA.movePlan = movePlan;
    DATA.siteNotes = siteNotes;

    renderOverview();
    renderMapSelector();
    renderMap();
    renderResponsibilityTable();
    renderPlotFilter();
    renderInventoryTable();
    renderMovePlanTable();
    renderSiteNotes();
  } catch (err) {
    console.error(err);
    const overview = document.getElementById("overviewStats");
    if (overview) {
      overview.innerHTML =
        '<p class="muted">Could not load data files. Serve this folder over HTTP ' +
        '(e.g. <code>python3 -m http.server</code>) so the CSVs can be fetched.</p>';
    }
  }
}

document.addEventListener("DOMContentLoaded", init);
