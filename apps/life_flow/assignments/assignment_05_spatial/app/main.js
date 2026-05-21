/**
 * MSDS 455 Assignment 05 — rough D3 flow map prototype
 *
 * Shows top 50 donor-recovery DSA → transplant center flows using
 * state-centroid coordinates (not facility-level geocodes).
 */

// --- Configuration (map SVG only; legend lives in HTML panel) ---
const MAP_WIDTH = 820;
const MAP_HEIGHT = 560;
const MARGIN = { top: 20, right: 20, bottom: 20, left: 20 };

// Paths relative to /app/ page URL (../ → assignment_05_spatial/data/processed/)
const DATA = {
  edges: "../data/processed/top_50_edges_all_organs.csv",
  nodes: "../data/processed/top50_all_nodes_with_state_centroids.csv",
  // US states mesh for Albers background (TopoJSON from us-atlas)
  states: "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json",
};

// Slight jitter so nodes sharing a state centroid remain visible
const JITTER_RADIUS = 2.2;

// --- Load data and render ---
async function init() {
  console.log("Loading CSV paths (resolved from /app/):");
  console.log("  edges:", new URL(DATA.edges, window.location.href).href);
  console.log("  nodes:", new URL(DATA.nodes, window.location.href).href);

  const [edges, nodes, statesTopo] = await Promise.all([
    d3.csv(DATA.edges, d3.autoType),
    d3.csv(DATA.nodes, d3.autoType),
    d3.json(DATA.states),
  ]);

  console.log("Loaded row counts:");
  console.log("  edges:", edges.length);
  console.log("  nodes:", nodes.length);

  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  // Attach projected coordinates to each edge endpoint
  const links = edges
    .map((e) => ({
      sourceId: e.source_dsa_id,
      targetId: e.destination_center_id,
      flow: e.flow_count,
      source: nodeById.get(e.source_dsa_id),
      target: nodeById.get(e.destination_center_id),
    }))
    .filter((l) => l.source && l.target);

  render({ nodes, links, statesTopo });
}

function render({ nodes, links, statesTopo }) {
  const innerW = MAP_WIDTH - MARGIN.left - MARGIN.right;
  const innerH = MAP_HEIGHT - MARGIN.top - MARGIN.bottom;

  // Albers USA fits the lower 48 + AK/HI inset for a map-like layout
  const projection = d3.geoAlbersUsa().fitSize([innerW, innerH], geoFeatureCollection(statesTopo));
  const path = d3.geoPath(projection);

  // Project nodes; apply tiny jitter per id when lat/lon collide
  nodes.forEach((n) => {
    const lon = +n.lon;
    const lat = +n.lat;
    if (Number.isFinite(lon) && Number.isFinite(lat)) {
      const [x, y] = projection([lon, lat]);
      const jitter = jitterOffset(n.id);
      n.px = x + jitter.dx;
      n.py = y + jitter.dy;
    }
  });

  const placedNodes = nodes.filter((n) => Number.isFinite(n.px));
  const placedLinks = links.filter(
    (l) => Number.isFinite(l.source.px) && Number.isFinite(l.target.px)
  );

  const flows = placedLinks.map((l) => l.flow);
  const strokeScale = d3
    .scaleLinear()
    .domain(d3.extent(flows))
    .range([0.8, 7])
    .clamp(true);

  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("viewBox", [0, 0, MAP_WIDTH, MAP_HEIGHT])
    .attr("role", "img");

  const g = svg
    .append("g")
    .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

  // --- Base map: state outlines ---
  const states = topojson.feature(statesTopo, statesTopo.objects.states);
  g.append("g")
    .attr("class", "states")
    .selectAll("path")
    .data(states.features)
    .join("path")
    .attr("class", "state")
    .attr("d", path);

  // --- Flow lines (curved quadratic paths) ---
  g.append("g")
    .attr("class", "links")
    .selectAll("path")
    .data(placedLinks)
    .join("path")
    .attr("class", "link")
    .attr("d", (d) => curvedLink(d.source, d.target))
    .attr("stroke-width", (d) => strokeScale(d.flow))
    .append("title")
    .text(
      (d) =>
        `${d.sourceId} → ${d.targetId}\n${d.flow} transplants`
    );

  // --- Nodes ---
  const nodeG = g.append("g").attr("class", "nodes");

  nodeG
    .selectAll("circle.source")
    .data(placedNodes.filter((n) => n.type === "source_dsa"))
    .join("circle")
    .attr("class", "node node--source")
    .attr("cx", (d) => d.px)
    .attr("cy", (d) => d.py)
    .attr("r", 5)
    .append("title")
    .text((d) => `${d.id}\n${d.name}\n${d.state}`);

  nodeG
    .selectAll("circle.destination")
    .data(placedNodes.filter((n) => n.type === "transplant_center"))
    .join("circle")
    .attr("class", "node node--destination")
    .attr("cx", (d) => d.px)
    .attr("cy", (d) => d.py)
    .attr("r", 4.5)
    .append("title")
    .text((d) => `${d.id}\n${d.name}\n${d.state}`);

  renderLegendPanel(strokeScale);
}

/** Convert states TopoJSON to a GeoJSON feature collection for fitSize. */
function geoFeatureCollection(statesTopo) {
  return topojson.feature(statesTopo, statesTopo.objects.states);
}

/** Deterministic micro-jitter from node id (degrees → ~few px on screen). */
function jitterOffset(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  const angle = ((hash % 360) * Math.PI) / 180;
  return {
    dx: Math.cos(angle) * JITTER_RADIUS,
    dy: Math.sin(angle) * JITTER_RADIUS,
  };
}

/**
 * Quadratic Bézier between two projected points.
 * Control point is offset perpendicular to the chord for a gentle arc.
 */
function curvedLink(source, target) {
  const sx = source.px;
  const sy = source.py;
  const tx = target.px;
  const ty = target.py;
  const mx = (sx + tx) / 2;
  const my = (sy + ty) / 2;
  const dx = tx - sx;
  const dy = ty - sy;
  const len = Math.hypot(dx, dy) || 1;
  const bend = Math.min(40, len * 0.15);
  const cx = mx + (-dy / len) * bend;
  const cy = my + (dx / len) * bend;
  return `M${sx},${sy} Q${cx},${cy} ${tx},${ty}`;
}

/** Sync HTML legend sample lines with the map's stroke width scale. */
function renderLegendPanel(strokeScale) {
  const [minFlow, maxFlow] = strokeScale.domain();
  d3.select(".legend-line--low").style("stroke-width", `${strokeScale(minFlow)}px`);
  d3.select(".legend-line--high").style("stroke-width", `${strokeScale(maxFlow)}px`);
}

init().catch((err) => {
  console.error(err);
  d3.select("#chart").append("p").attr("class", "error").text(`Failed to load: ${err.message}`);
});
