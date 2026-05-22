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





const CHART_TITLE = "Regional Yet Connected";
const CHART_SUBTITLE =
  "Organ transplant flows form a dense national network anchored by regional medical hubs.";

const EDGE_MODES = {
  all: {
    minFlow: 0,
    mapNote: "Showing all flows with available coordinates",
  },
  ge_200: {
    minFlow: 200,
    mapNote: "Showing flows ≥ 200 transplants (available coordinates)",
  },
  ge_100: {
    minFlow: 100,
    mapNote: "Showing flows ≥ 100 transplants (available coordinates)",
  },
  ge_50: {
    minFlow: 50,
    mapNote: "Showing flows ≥ 50 transplants (available coordinates)",
  },
  ge_25: {
    minFlow: 25,
    mapNote: "Showing flows ≥ 25 transplants (available coordinates)",
  },
  top50: {
    minFlow: 0,
    useTop50File: true,
    mapNote: "Showing top 50 flows by volume (available coordinates)",
  },
};

// --- Configuration (map SVG only; legend lives in HTML panel) ---
const MAP_WIDTH = 820;
/** Breathing room below geography (methodology notes live in HTML panel) */
const MAP_FOOTNOTE_STRIP_HEIGHT = 28;
/** Full SVG height includes footnote strip (map geography uses area above strip) */
const MAP_HEIGHT = 560 + MAP_FOOTNOTE_STRIP_HEIGHT;
const MARGIN = { top: 20, right: 20, bottom: 20, left: 20 };

/** Translates coastline + overlays slightly downward inside the geography band */
const GEOGRAPHY_VERTICAL_OFFSET_PX = 22;

/** US Atlas state ids for inset framing on the Albers USA composite */
const STATE_ID_ALASKA = "02";
const STATE_ID_HAWAII = "15";
const STATE_ID_PUERTO_RICO = "72";

/** Fixed screen-space panel for Puerto Rico (local Albers fit, not Mercator) */
const PUERTO_RICO_INSET_BOX = {
  /** Narrower panel, right-aligned — shifts left edge ~½″ right vs prior 108px-wide box */
  width: 58,
  height: 64,
  marginBottom: 34,
  padding: 2,
  labelOffset: 5,
  edgePad: 6,
};

const DATA = {
  edgesAll: "../data/processed/d2t_edges_all_organs_enriched.csv",
  edgesTop50: "../data/processed/top_50_edges_all_organs.csv",
  nodes: "../data/processed/all_nodes_with_coordinates.csv",
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
      showFlowLegend: true,
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

function geoPointFinite(p) {
  return Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]);
}

function findStateFeatureById(statesTopo, stateId) {
  const fc = topojson.feature(statesTopo, statesTopo.objects.states);
  return fc.features.find((f) => String(f.id) === String(stateId));
}


/**
 * Same rule as scripts/check_coordinate_coverage.py (`has_coordinates`):
 * trimmed lat/lon must parse as finite floats.
 */
function workbookRowHasParsableCoordinates(node) {
  if (!node) return false;
  const latRaw = node.lat;
  const lonRaw = node.lon;
  if (latRaw == null || lonRaw == null) return false;
  const latStr = String(latRaw).trim();
  const lonStr = String(lonRaw).trim();
  if (!latStr || !lonStr) return false;
  const lat = Number.parseFloat(latStr);
  const lon = Number.parseFloat(lonStr);
  return Number.isFinite(lat) && Number.isFinite(lon);
}

function isPuertoRicoNode(node) {
  const s = (node?.state ?? "").trim().toLowerCase();
  return s === "puerto rico" || s === "pr";
}

function findPuertoRicoStateFeature(statesTopo) {
  return findStateFeatureById(statesTopo, STATE_ID_PUERTO_RICO);
}

function inflateBounds(bounds, pad) {
  const [[x0, y0], [x1, y1]] = bounds;
  return [
    [x0 - pad, y0 - pad],
    [x1 + pad, y1 + pad],
  ];
}

/**
 * Alaska & Hawaii frames follow the Albers USA composite positions already on the main map.
 * @returns {{ id: string, bounds: [[number, number], [number, number]] }[]}
 */
function collectAlaskaHawaiiInsetFrames(statesTopo, path, pad = 5) {
  const frames = [];
  for (const id of [STATE_ID_ALASKA, STATE_ID_HAWAII]) {
    const feature = findStateFeatureById(statesTopo, id);
    if (!feature) continue;
    const bounds = path.bounds(feature);
    if (!(Number.isFinite(bounds[0][0]) && Number.isFinite(bounds[1][0]))) continue;
    frames.push({ id, bounds: inflateBounds(bounds, pad) });
  }
  return frames;
}

/**
 * Puerto Rico inset: local Albers fit inside a fixed labeled panel (separate from mainland Albers USA).
 * @returns {null | {
 *   prFeature,
 *   prProjection: d3.GeoProjection,
 *   prPath: d3.GeoPath,
 *   boxBounds: [[number, number], [number, number]],
 *   targetCentroidPx: [number, number],
 *   labelX: number,
 *   labelY: number,
 * }}
 */
function buildPuertoRicoInset({ statesTopo, innerW, innerH }) {
  const prFeature = findPuertoRicoStateFeature(statesTopo);
  if (!prFeature) {
    console.warn("[map inset] Puerto Rico feature missing from US Atlas TopoJSON.");
    return null;
  }

  const { width, height, marginBottom, padding, labelOffset, edgePad = 8 } =
    PUERTO_RICO_INSET_BOX;
  const boxX1 = innerW - edgePad;
  const boxX0 = boxX1 - width;
  const boxY0 = innerH - marginBottom - height;
  const boxY1 = boxY0 + height;
  const boxBounds = /** @type {[[number, number], [number, number]]} */ ([
    [boxX0, boxY0],
    [boxX1, boxY1],
  ]);

  const prProjection = d3
    .geoAlbers()
    .center([-66.25, 18.25])
    .parallels([18, 18])
    .fitExtent(
      [
        [boxX0 + padding, boxY0 + padding],
        [boxX1 - padding, boxY1 - padding],
      ],
      prFeature
    );

  const prPath = d3.geoPath(prProjection);
  const prCentroidPx = prProjection(d3.geoCentroid(prFeature));
  if (!geoPointFinite(prCentroidPx)) {
    console.warn("[map inset] Puerto Rico centroid failed in local Albers inset.");
    return null;
  }

  console.log("[map inset] Puerto Rico panel (local Albers, fixed box)", {
    boxBounds,
    centroidPx: prCentroidPx.map((v) => Number(v.toFixed(2))),
  });

  return {
    prFeature,
    prProjection,
    prPath,
    boxBounds,
    targetCentroidPx: prCentroidPx,
    labelX: (boxX0 + boxX1) / 2,
    labelY: boxY0 - labelOffset,
  };
}

function appendInsetFrame(parent, bounds, className) {
  const [[x0, y0], [x1, y1]] = bounds;
  return parent
    .append("rect")
    .attr("class", className)
    .attr("x", x0)
    .attr("y", y0)
    .attr("width", Math.max(0, x1 - x0))
    .attr("height", Math.max(0, y1 - y0))
    .attr("rx", 2);
}

/**
 * Mainland nodes use geoAlbersUsa; Puerto Rico nodes use the labeled inset's local Albers projection.
 */
function assignPositionsWithPuertoRicoOverlay(nodes, projection, innerW, innerH, overlay) {
  const projected = [];
  const insetPlaced = [];

  const fallbackCornerX = innerW - 112;
  const fallbackCornerY = innerH - 92;

  const prForcedInset = [];
  const fallbackRadial = [];

  function prLonLatToPx(lon, lat) {
    if (!overlay?.prProjection) return null;
    const lp = overlay.prProjection([lon, lat]);
    return geoPointFinite(lp) ? lp : null;
  }

  nodes.forEach((n) => {
    delete n.px;
    delete n.py;
    delete n.prInsetAnchored;
    delete n.projectionFailureFallback;

    if (!workbookRowHasParsableCoordinates(n)) return;

    const lon = +n.lon;
    const lat = +n.lat;
    const j = jitterOffset(n.id);

    /** @type {[number, number] | null} */
    let raw = null;
    let rawFinite = false;
    try {
      const p = projection([lon, lat]);
      raw = Array.isArray(p) ? p : null;
      rawFinite = Boolean(raw && Number.isFinite(raw[0]) && Number.isFinite(raw[1]));
    } catch (_) {
      rawFinite = false;
    }

    if (isPuertoRicoNode(n)) {
      prForcedInset.push({ node: n, lon, lat, projectedRaw: raw, reason: "puerto_rico_overlay" });
      return;
    }

    if (rawFinite && raw) {
      n.px = raw[0] + j.dx;
      n.py = raw[1] + j.dy;
      n.prInsetAnchored = false;
      projected.push({
        id: n.id,
        lon,
        lat,
        x: n.px,
        y: n.py,
      });
      return;
    }

    fallbackRadial.push({ node: n, lon, lat, projectedRaw: raw, reason: "projection_non_finite" });
  });

  prForcedInset.forEach(({ node: n, lon, lat, projectedRaw: raw, reason }) => {
    const jPix = jitterOffset(n.id);
    let xy = prLonLatToPx(lon, lat);

    if (!xy && overlay?.targetCentroidPx) {
      xy = [
        overlay.targetCentroidPx[0] + jPix.dx * 0.15,
        overlay.targetCentroidPx[1] + jPix.dy * 0.15,
      ];
    }
    if (!xy) {
      xy = [
        fallbackCornerX + jPix.dx * 0.2,
        fallbackCornerY + jPix.dy * 0.2,
      ];
      console.warn("[map nodes] Puerto Rico overlay unavailable; radial fallback:", n.id);
    }

    n.px = xy[0];
    n.py = xy[1];
    n.prInsetAnchored = true;
    insetPlaced.push({
      id: n.id,
      lon,
      lat,
      projectedRaw: raw,
      reason,
    });
  });

  const fx = overlay?.targetCentroidPx?.[0] ?? fallbackCornerX;
  const fy = overlay?.targetCentroidPx?.[1] ?? fallbackCornerY;
  const step = Math.max(4.8, 6.5);
  fallbackRadial.forEach(({ node: n, lon, lat, projectedRaw: raw, reason }, i) => {
    const jInset = jitterOffset(n.id);
    const angle = i * 2.51327;
    const ring = Math.floor(Math.sqrt(i)) * step;
    n.px = fx + 42 + Math.cos(angle) * ring + jInset.dx * 0.25;
    n.py = fy + 26 + Math.sin(angle) * ring + jInset.dy * 0.25;
    n.px = Math.min(innerW - 6, Math.max(6, n.px));
    n.py = Math.min(innerH - 6, Math.max(6, n.py));
    /** Not Puerto Rico — avoids fake PR↔PR arcs into the east cluster */
    n.prInsetAnchored = false;
    n.projectionFailureFallback = true;
    insetPlaced.push({
      id: n.id,
      lon,
      lat,
      projectedRaw: raw,
      reason,
    });
  });

  console.log("[map nodes] projected (Albers USA, finite): count =", projected.length);
  console.table(projected.slice(0, Math.min(projected.length, 25)));

  console.log("[map nodes] anchored overlay / fallback: count =", insetPlaced.length);
  console.table(insetPlaced);

  return { projected, insetPlaced };
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

  d3.select("#chart-title").text(CHART_TITLE);
  d3.select(".subtitle").text(CHART_SUBTITLE);
  d3.select("body").attr("class", `edge-mode-${EDGE_MODE}`);

  const [rawEdges, allOrganD2TCoverageEdges, nodes, statesTopo] = await Promise.all([
    d3.csv(edgePath, d3.autoType),
    d3.csv(DATA.edgesAll, d3.autoType),
    d3.csv(DATA.nodes, d3.autoType),
    d3.json(DATA.states),
  ]);

  console.log("Using full node coordinate dataset");
  console.log(
    `[map metrics] View edge file (${EDGE_MODE}) rows:`,
    rawEdges.length,
    "| Full all-organ list rows:",
    allOrganD2TCoverageEdges.length
  );
  console.log("Nodes loaded:", nodes.length);

  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  /** Denominator/numerator aligned with scripts/check_coordinate_coverage.py (`d2t_edges_all_organs_enriched.csv`). */
  let coverageTotalFlow = 0;
  let coordinateEligibleFlow = 0;
  allOrganD2TCoverageEdges.forEach((e) => {
    const flowCount = Number(e.flow_count);
    if (!Number.isFinite(flowCount)) return;
    coverageTotalFlow += flowCount;
    const src = nodeById.get(String(e.source_dsa_id ?? "").trim());
    const tgt = nodeById.get(String(e.destination_center_id ?? "").trim());
    if (workbookRowHasParsableCoordinates(src) && workbookRowHasParsableCoordinates(tgt)) {
      coordinateEligibleFlow += flowCount;
    }
  });
  const pctCoordinateEligible =
    coverageTotalFlow > 0 ? (coordinateEligibleFlow / coverageTotalFlow) * 100 : null;

  console.log("[map metrics] Total flow (all-organ D2T edge list denominator):", coverageTotalFlow);
  console.log(
    "[map metrics] Coverage numerator — transplant volume where both endpoints are geocoded (matches check_coordinate_coverage.py):",
    coordinateEligibleFlow
  );
  if (pctCoordinateEligible != null) {
    console.log("[map metrics] Retained percentage (flow_count):", pctCoordinateEligible.toFixed(1) + "%");
  }

  let missingSource = 0;
  let missingDestination = 0;

  const coordLinks = [];
  rawEdges.forEach((e) => {
    const source = nodeById.get(String(e.source_dsa_id ?? "").trim());
    const target = nodeById.get(String(e.destination_center_id ?? "").trim());
    const sourceOk = workbookRowHasParsableCoordinates(source);
    const targetOk = workbookRowHasParsableCoordinates(target);

    if (!sourceOk) missingSource += 1;
    if (!targetOk) missingDestination += 1;

    if (sourceOk && targetOk) {
      coordLinks.push({
        sourceId: e.source_dsa_id,
        targetId: e.destination_center_id,
        flow: e.flow_count,
        source,
        target,
      });
    }
  });

  console.log(
    "Edges retained after coordinate filtering for current EDGE_MODE:",
    coordLinks.length
  );
  console.log("Missing source refs (edges in view missing src coords):", missingSource);
  console.log(
    "Missing destination refs (edges in view missing dest coords):",
    missingDestination
  );

  const links =
    modeConfig.minFlow > 0 ? coordLinks.filter((l) => l.flow >= modeConfig.minFlow) : coordLinks;

  const viewportCoordinateEligibleFlow = d3.sum(links, (l) => Number(l.flow) || 0);
  console.log("[map metrics] Coordinate-eligible flow in current EDGE_MODE view (links array):", viewportCoordinateEligibleFlow);

  if (modeConfig.minFlow > 0) {
    console.log(`Edges after flow threshold (≥ ${modeConfig.minFlow}):`, links.length);
  }

  render({
    nodes,
    links,
    statesTopo,
    edgeMode: EDGE_MODE,
    modeConfig,
    d2tFlowCoverageMetrics:
      pctCoordinateEligible != null && EDGE_MODE !== "top50"
        ? {
            pctCoordinateEligible,
            coverageTotalFlow,
            coordinateEligibleFlow,
          }
        : null,
    coordinateEligibleViewportFlow: viewportCoordinateEligibleFlow,
    coverageTotalFlow,
  });
}

function render({
  nodes,
  links,
  statesTopo,
  edgeMode,
  modeConfig,
  d2tFlowCoverageMetrics,
  coordinateEligibleViewportFlow,
  coverageTotalFlow,
}) {
  const style = styleForMode(edgeMode);
  const innerW = MAP_WIDTH - MARGIN.left - MARGIN.right;
  const innerH = MAP_HEIGHT - MARGIN.top - MARGIN.bottom;

  const geoPlotBottomY = innerH - MAP_FOOTNOTE_STRIP_HEIGHT;
  /** Albers-fit height before vertical offset pushes landmass downward */
  const geoFitHeightPx = geoPlotBottomY - GEOGRAPHY_VERTICAL_OFFSET_PX;

  const projection = d3
    .geoAlbersUsa()
    .fitSize([innerW, geoFitHeightPx], geoFeatureCollection(statesTopo));
  const path = d3.geoPath(projection);

  const puertoRicoInset = buildPuertoRicoInset({
    statesTopo,
    innerW,
    innerH: geoFitHeightPx,
  });

  assignPositionsWithPuertoRicoOverlay(nodes, projection, innerW, geoFitHeightPx, puertoRicoInset);

  const placedNodes = nodes.filter((n) => Number.isFinite(n.px));

  let omittedPuertoRicoArcs = 0;
  let omittedPuertoRicoArcFlow = 0;
  const placedLinks = links.filter((l) => {
    if (!Number.isFinite(l.source.px) || !Number.isFinite(l.target.px)) return false;
    if (l.source.projectionFailureFallback || l.target.projectionFailureFallback) return false;

    const touchesPuertoInset =
      Boolean(l.source.prInsetAnchored) !== Boolean(l.target.prInsetAnchored);
    if (touchesPuertoInset && !puertoRicoInset) {
      omittedPuertoRicoArcs += 1;
      omittedPuertoRicoArcFlow += l.flow;
      return false;
    }
    return true;
  });

  if (omittedPuertoRicoArcs > 0) {
    console.log(
      "[map edges] Puerto Rico cross-inset arcs omitted (inset unavailable):",
      omittedPuertoRicoArcs,
      `count, ${omittedPuertoRicoArcFlow} transplants`
    );
  }

  const drawnFlowSum = d3.sum(placedLinks, (l) => Number(l.flow) || 0);
  console.log("[map metrics] Rendered flow (slice actually drawn after projection/inset filters):", drawnFlowSum);
  let projectionOnlyWithheldFlow = 0;
  if (
    typeof coordinateEligibleViewportFlow === "number" &&
    Number.isFinite(coordinateEligibleViewportFlow)
  ) {
    projectionOnlyWithheldFlow = Math.max(
      0,
      coordinateEligibleViewportFlow - omittedPuertoRicoArcFlow - drawnFlowSum
    );
    if (projectionOnlyWithheldFlow > 0) {
      console.log(
        "[map metrics] Coordinate-eligible viewport flow withheld (no projected map position/fallback placement):",
        projectionOnlyWithheldFlow
      );
    }
  }

  const flows = placedLinks.map((l) => l.flow);
  const strokeScale = buildStrokeScale(flows, style.widthRange);

  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("viewBox", [0, 0, MAP_WIDTH, MAP_HEIGHT])
    .attr("role", "img")
    .attr("class", `map-svg map-svg--${edgeMode}`);

  const g = svg.append("g").attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

  /** Offset shifts Alaska/Hawaii/low-48 (+ PR overlay/links/nodes together) downward in the geography band */
  const geoPane = g
    .append("g")
    .attr("class", "map-geo-pane")
    .attr("transform", `translate(0,${GEOGRAPHY_VERTICAL_OFFSET_PX})`);

  const statesFc = geoFeatureCollection(statesTopo);
  const alaskaHawaiiInsetFrames = collectAlaskaHawaiiInsetFrames(statesTopo, path);

  geoPane
    .append("g")
    .attr("class", "states")
    .selectAll("path")
    .data(statesFc.features)
    .join("path")
    .attr("class", "state")
    .attr("d", path);

  if (puertoRicoInset) {
    geoPane
      .append("g")
      .attr("class", "pr-geography-inset")
      .append("path")
      .datum(puertoRicoInset.prFeature)
      .attr("class", "state state--pr-inset")
      .attr("d", puertoRicoInset.prPath);
  }

  const insetFrameLayer = geoPane.append("g").attr("class", "inset-frames");
  alaskaHawaiiInsetFrames.forEach((frame) => {
    appendInsetFrame(
      insetFrameLayer,
      frame.bounds,
      `inset-frame inset-frame--${frame.id === STATE_ID_ALASKA ? "alaska" : "hawaii"}`
    );
  });
  if (puertoRicoInset) {
    appendInsetFrame(insetFrameLayer, puertoRicoInset.boxBounds, "inset-frame inset-frame--pr");

    geoPane
      .append("text")
      .attr("class", "inset-label")
      .attr("x", puertoRicoInset.labelX)
      .attr("y", puertoRicoInset.labelY)
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "baseline")
      .text("Puerto Rico");
  }

  const linkSel = geoPane
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
    const nodeG = geoPane.append("g").attr("class", "nodes").attr("opacity", style.nodeOpacity);

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

  renderLegendPanel({ strokeScale, style });
  renderAuditPanel({
    edgeMode,
    d2tFlowCoverageMetrics,
    projectionOnlyWithheldFlow,
    coverageTotalFlow,
  });
}

function geoFeatureCollection(statesTopo) {
  const fc = topojson.feature(statesTopo, statesTopo.objects.states);
  return {
    ...fc,
    // Omit PR polygon from the mainland layer; it draws in the labeled inset panel (US Atlas id 72).
    features: fc.features.filter((f) => String(f.id) !== STATE_ID_PUERTO_RICO),
  };
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
  const dx = tx - sx;
  const dy = ty - sy;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;

  const bothOnPrOverlay = Boolean(source.prInsetAnchored && target.prInsetAnchored);
  const crossesPuertoInset = Boolean(source.prInsetAnchored !== target.prInsetAnchored);

  /** Short true PR arcs: straight segment avoids quadratic control points dangling east/west offshore */
  if (bothOnPrOverlay && len < 44) {
    return `M${sx},${sy}L${tx},${ty}`;
  }

  const mx = (sx + tx) / 2;
  const my = (sy + ty) / 2;

  let bend;
  if (crossesPuertoInset) {
    bend = Math.min(32, Math.max(8, len * 0.034));
  } else if (bothOnPrOverlay) {
    bend = Math.min(12, len * 0.2);
  } else {
    bend = Math.min(40, len * 0.15);
  }

  const cx = mx - uy * bend;
  const cy = my + ux * bend;
  return `M${sx},${sy} Q${cx},${cy} ${tx},${ty}`;
}

/** Legend sample strokes — higher contrast than map circulation field */
const LEGEND_LINE_STYLES = {
  high: { color: "#2f5f6e", opacity: 1 },
  mid: { color: "#3d6d7d", opacity: 0.88 },
  low: { color: "#5a8494", opacity: 0.72 },
};

function renderLegendPanel({ strokeScale, style }) {
  const legend = d3.select("#legend-panel");
  legend
    .select(".legend-section--flows")
    .style("display", style.showFlowLegend ? null : "none");

  const applyLineStyle = (selector, widthPx, tier) => {
    const tierStyle = LEGEND_LINE_STYLES[tier];
    d3.select(selector)
      .style("border-top-color", tierStyle.color)
      .style("border-top-width", `${widthPx}px`)
      .style("opacity", tierStyle.opacity);
  };

  if (typeof strokeScale.domain === "function") {
    const [minFlow, maxFlow] = strokeScale.domain();
    const midFlow = minFlow + (maxFlow - minFlow) / 2;
    applyLineStyle(".legend-line--low", strokeScale(minFlow), "low");
    applyLineStyle(".legend-line--mid", strokeScale(midFlow), "mid");
    applyLineStyle(".legend-line--high", strokeScale(maxFlow), "high");
  } else {
    const [w0, w1] = style.widthRange;
    const wMid = (w0 + w1) / 2;
    applyLineStyle(".legend-line--low", w0, "low");
    applyLineStyle(".legend-line--mid", wMid, "mid");
    applyLineStyle(".legend-line--high", w1, "high");
  }
}

function renderAuditPanel({
  edgeMode,
  d2tFlowCoverageMetrics,
  projectionOnlyWithheldFlow,
  coverageTotalFlow,
}) {
  const notes = [];

  if (d2tFlowCoverageMetrics != null && edgeMode !== "top50") {
    const pct = d2tFlowCoverageMetrics.pctCoordinateEligible;
    notes.push(
      `Coverage: Rendered flows represent ${pct.toFixed(1)}% of transplant volume in the all-organ D2T edge list.`
    );
  }

  if (projectionOnlyWithheldFlow > 0 && coverageTotalFlow > 0) {
    const omittedPct = (projectionOnlyWithheldFlow / coverageTotalFlow) * 100;
    notes.push(
      `Omitted: ${projectionOnlyWithheldFlow.toLocaleString()} transplant volume (${omittedPct.toFixed(1)}%) not drawn because an endpoint lacks a projected map position.`
    );
  }

  notes.push(
    "Insets: Alaska and Hawaii follow the Albers USA composite; Puerto Rico is shown in inset, not to scale. Contiguous mainland ↔ Puerto Rico flows are omitted."
  );
  notes.push("Line opacity on map encodes density of flows in full-network view.");

  d3.select("#audit-panel")
    .select(".audit-list")
    .selectAll("li")
    .data(notes)
    .join("li")
    .attr("class", "audit-item")
    .text((d) => d);
}

init().catch((err) => {
  console.error(err);
  d3.select("#chart").append("p").attr("class", "error").text(`Failed to load: ${err.message}`);
});
