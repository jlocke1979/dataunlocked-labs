/**
 * MSDS 455 Assignment 05 — D3 flow map prototype
 *
 * EDGE_MODE options:
 *   all, ge_200, ge_100, ge_50, ge_25, top50
 */

// --- Edge mode switch ---
const EDGE_MODE = "all";
//const EDGE_MODE = "ge_200";
//const EDGE_MODE = "ge_100";
//const EDGE_MODE = "ge_50";
//const EDGE_MODE = "ge_25";
// const EDGE_MODE = "top50";





const EDGE_MODES = {
  all: {
    minFlow: 0,
    title: "Donor Recovery → Transplant Center Flows",
    subtitle: "Circulation field · all flows with available coordinates",
    mapNote: "Showing all flows with available coordinates",
  },
  ge_200: {
    minFlow: 200,
    title: "Donor Recovery → Transplant Center Flows",
    subtitle: "Flows ≥ 200 transplants · available coordinates only",
    mapNote: "Showing flows ≥ 200 transplants (available coordinates)",
  },
  ge_100: {
    minFlow: 100,
    title: "Donor Recovery → Transplant Center Flows",
    subtitle: "Flows ≥ 100 transplants · available coordinates only",
    mapNote: "Showing flows ≥ 100 transplants (available coordinates)",
  },
  ge_50: {
    minFlow: 50,
    title: "Donor Recovery → Transplant Center Flows",
    subtitle: "Flows ≥ 50 transplants · available coordinates only",
    mapNote: "Showing flows ≥ 50 transplants (available coordinates)",
  },
  ge_25: {
    minFlow: 25,
    title: "Donor Recovery → Transplant Center Flows",
    subtitle: "Flows ≥ 25 transplants · available coordinates only",
    mapNote: "Showing flows ≥ 25 transplants (available coordinates)",
  },
  top50: {
    minFlow: 0,
    useTop50File: true,
    title: "Donor Recovery → Transplant Center Flows (Top 50)",
    subtitle: "Proof-of-concept · state centroid coordinates · OPTN D2T all organs",
    mapNote: "Showing top 50 flows by volume (available coordinates)",
  },
};

// --- Configuration (map SVG only; legend lives in HTML panel) ---
const MAP_WIDTH = 820;
const MAP_HEIGHT = 560;
const MARGIN = { top: 20, right: 20, bottom: 20, left: 20 };

const DATA = {
  edgesAll: "../data/processed/d2t_edges_all_organs_enriched.csv",
  edgesTop50: "../data/processed/top_50_edges_all_organs.csv",
  nodes: "../data/processed/top50_all_nodes_partial_real_coordinates.csv",
  states: "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json",
};

/** Visual tier keyed to EDGE_MODE. */
function styleForMode(edgeMode) {
  const tiers = {
    all: {
      linkStroke: "#8a9490",
      linkOpacity: 0.065,
      widthRange: [0.25, 1.05],
      showNodes: true,
      sourceRadius: 1.2,
      destinationRadius: 1,
      nodeOpacity: 0.22,
      showFlowLegend: false,
      showNodeLegend: false,
    },
    filteredStrong: {
      linkStroke: null,
      linkOpacity: 0.38,
      widthRange: [0.7, 6.5],
      showNodes: true,
      sourceRadius: 3.5,
      destinationRadius: 3,
      nodeOpacity: 0.85,
      showFlowLegend: true,
      showNodeLegend: true,
    },
    filteredMid: {
      linkStroke: null,
      linkOpacity: 0.28,
      widthRange: [0.55, 5],
      showNodes: true,
      sourceRadius: 3,
      destinationRadius: 2.6,
      nodeOpacity: 0.75,
      showFlowLegend: true,
      showNodeLegend: true,
    },
    filteredLight: {
      linkStroke: "#7a8f98",
      linkOpacity: 0.2,
      widthRange: [0.45, 3.8],
      showNodes: true,
      sourceRadius: 2.2,
      destinationRadius: 2,
      nodeOpacity: 0.55,
      showFlowLegend: true,
      showNodeLegend: false,
    },
    top50: {
      linkStroke: null,
      linkOpacity: null,
      widthRange: [0.8, 7],
      showNodes: true,
      sourceRadius: 5,
      destinationRadius: 4.5,
      nodeOpacity: 1,
      showFlowLegend: true,
      showNodeLegend: true,
    },
  };

  if (edgeMode === "all") return tiers.all;
  if (edgeMode === "top50") return tiers.top50;
  if (edgeMode === "ge_200") return tiers.filteredStrong;
  if (edgeMode === "ge_100") return tiers.filteredMid;
  if (edgeMode === "ge_50" || edgeMode === "ge_25") return tiers.filteredLight;
  return tiers.filteredLight;
}

const JITTER_RADIUS = 2.2;

function hasCoordinates(node) {
  if (!node) return false;
  const lon = +node.lon;
  const lat = +node.lat;
  return Number.isFinite(lon) && Number.isFinite(lat);
}

function edgeFileForMode(modeConfig) {
  return modeConfig.useTop50File ? DATA.edgesTop50 : DATA.edgesAll;
}

function buildStrokeScale(flows, widthRange) {
  const [lo, hi] = d3.extent(flows);
  if (!Number.isFinite(lo) || lo === hi) {
    return () => (widthRange[0] + widthRange[1]) / 2;
  }
  return d3.scaleSqrt().domain([lo, hi]).range(widthRange).clamp(true);
}

// --- Load data and render ---
async function init() {
  const modeConfig = EDGE_MODES[EDGE_MODE];
  if (!modeConfig) {
    throw new Error(
      `Unknown EDGE_MODE "${EDGE_MODE}". Use: all, ge_200, ge_100, ge_50, ge_25, top50`
    );
  }

  const edgePath = edgeFileForMode(modeConfig);

  console.log("Edge mode:", EDGE_MODE);
  console.log("Edge file:", edgePath);
  console.log("  resolved:", new URL(edgePath, window.location.href).href);

  d3.select("#chart-title").text(modeConfig.title);
  d3.select(".subtitle").text(modeConfig.subtitle);
  d3.select("body").attr("class", `edge-mode-${EDGE_MODE}`);

  const [rawEdges, nodes, statesTopo] = await Promise.all([
    d3.csv(edgePath, d3.autoType),
    d3.csv(DATA.nodes, d3.autoType),
    d3.json(DATA.states),
  ]);

  console.log("Raw edges loaded:", rawEdges.length);
  console.log("Nodes loaded:", nodes.length);

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const totalFlowRaw = d3.sum(rawEdges, (e) => e.flow_count);

  let missingSource = 0;
  let missingDestination = 0;

  const coordLinks = [];
  let retainedFlow = 0;

  rawEdges.forEach((e) => {
    const source = nodeById.get(e.source_dsa_id);
    const target = nodeById.get(e.destination_center_id);
    const sourceOk = hasCoordinates(source);
    const targetOk = hasCoordinates(target);

    if (!sourceOk) missingSource += 1;
    if (!targetOk) missingDestination += 1;

    if (sourceOk && targetOk) {
      const link = {
        sourceId: e.source_dsa_id,
        targetId: e.destination_center_id,
        flow: e.flow_count,
        source,
        target,
      };
      coordLinks.push(link);
      retainedFlow += link.flow;
    }
  });

  console.log("Edges retained after coordinate filtering:", coordLinks.length);
  console.log("Missing source nodes:", missingSource);
  console.log("Missing destination nodes:", missingDestination);
  console.log(
    "Percent of flow represented after coordinate filtering:",
    totalFlowRaw > 0 ? `${((retainedFlow / totalFlowRaw) * 100).toFixed(1)}%` : "n/a"
  );

  const links =
    modeConfig.minFlow > 0
      ? coordLinks.filter((l) => l.flow >= modeConfig.minFlow)
      : coordLinks;

  if (modeConfig.minFlow > 0) {
    console.log(`Edges after flow threshold (≥ ${modeConfig.minFlow}):`, links.length);
  }

  render({
    nodes,
    links,
    statesTopo,
    edgeMode: EDGE_MODE,
    modeConfig,
    flowCoveragePct: totalFlowRaw > 0 ? (retainedFlow / totalFlowRaw) * 100 : null,
  });
}

function render({ nodes, links, statesTopo, edgeMode, modeConfig, flowCoveragePct }) {
  const style = styleForMode(edgeMode);
  const innerW = MAP_WIDTH - MARGIN.left - MARGIN.right;
  const innerH = MAP_HEIGHT - MARGIN.top - MARGIN.bottom;

  const projection = d3.geoAlbersUsa().fitSize([innerW, innerH], geoFeatureCollection(statesTopo));
  const path = d3.geoPath(projection);

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
  const strokeScale = buildStrokeScale(flows, style.widthRange);

  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("viewBox", [0, 0, MAP_WIDTH, MAP_HEIGHT])
    .attr("role", "img")
    .attr("class", `map-svg map-svg--${edgeMode}`);

  const g = svg
    .append("g")
    .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

  const states = topojson.feature(statesTopo, statesTopo.objects.states);
  g.append("g")
    .attr("class", "states")
    .selectAll("path")
    .data(states.features)
    .join("path")
    .attr("class", "state")
    .attr("d", path);

  const linkSel = g
    .append("g")
    .attr("class", "links")
    .selectAll("path")
    .data(placedLinks)
    .join("path")
    .attr("class", "link")
    .attr("d", (d) => curvedLink(d.source, d.target))
    .attr("stroke-width", (d) => strokeScale(d.flow));

  if (style.linkStroke) {
    linkSel.attr("stroke", style.linkStroke);
  }
  if (style.linkOpacity != null) {
    linkSel.attr("stroke-opacity", style.linkOpacity);
  }

  if (edgeMode !== "all") {
    linkSel.append("title").text(
      (d) => `${d.sourceId} → ${d.targetId}\n${d.flow} transplants`
    );
  }

  if (style.showNodes) {
    const nodeG = g.append("g").attr("class", "nodes").attr("opacity", style.nodeOpacity);

    nodeG
      .selectAll("circle.source")
      .data(placedNodes.filter((n) => n.type === "source_dsa"))
      .join("circle")
      .attr("class", "node node--source")
      .attr("cx", (d) => d.px)
      .attr("cy", (d) => d.py)
      .attr("r", style.sourceRadius)
      .append("title")
      .text((d) => `${d.id}\n${d.name}\n${d.state}`);

    nodeG
      .selectAll("circle.destination")
      .data(placedNodes.filter((n) => n.type === "transplant_center"))
      .join("circle")
      .attr("class", "node node--destination")
      .attr("cx", (d) => d.px)
      .attr("cy", (d) => d.py)
      .attr("r", style.destinationRadius)
      .append("title")
      .text((d) => `${d.id}\n${d.name}\n${d.state}`);
  }

  g.append("text")
    .attr("class", "map-note")
    .attr("x", 8)
    .attr("y", innerH - 8)
    .text(modeConfig.mapNote);

  if (flowCoveragePct != null && edgeMode !== "top50") {
    g.append("text")
      .attr("class", "map-note map-note--coverage")
      .attr("x", 8)
      .attr("y", innerH - 24)
      .text(`${flowCoveragePct.toFixed(1)}% of total flow has coordinates`);
  }

  renderLegendPanel({ strokeScale, edgeMode, style, modeConfig });
}

function geoFeatureCollection(statesTopo) {
  return topojson.feature(statesTopo, statesTopo.objects.states);
}

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

function renderLegendPanel({ strokeScale, edgeMode, style, modeConfig }) {
  const legend = d3.select("#legend-panel");
  legend
    .selectAll(".legend-section")
    .filter(function () {
      return this.querySelector(".legend-swatch--source") != null;
    })
    .style("display", style.showNodeLegend ? null : "none");
  legend
    .selectAll(".legend-section")
    .filter(function () {
      return this.querySelector(".legend-flow-scale") != null;
    })
    .style("display", style.showFlowLegend ? null : "none");

  if (edgeMode === "all") {
    legend.select(".legend-footnote").text(
      "Full network with both endpoints in the partial coordinate table. Line width varies subtly by volume; low opacity encodes density."
    );
    return;
  }

  if (typeof strokeScale.domain === "function") {
    const [minFlow, maxFlow] = strokeScale.domain();
    d3.select(".legend-line--low").style("stroke-width", `${strokeScale(minFlow)}px`);
    d3.select(".legend-line--high").style("stroke-width", `${strokeScale(maxFlow)}px`);
  }

  const thresholdNote =
    modeConfig.minFlow > 0 ? ` Threshold: ≥ ${modeConfig.minFlow} transplants.` : "";
  legend.select(".legend-footnote").text(
    `State-centroid coordinates (proof-of-concept).${thresholdNote}`
  );
}

init().catch((err) => {
  console.error(err);
  d3.select("#chart").append("p").attr("class", "error").text(`Failed to load: ${err.message}`);
});
