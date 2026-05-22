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
/** Extra vertical space below geography for caption lines (~1.25–1.5″ at ~96dpi) */
const MAP_FOOTNOTE_STRIP_HEIGHT = 130;
/** Full SVG height includes footnote strip (map geography uses area above strip) */
const MAP_HEIGHT = 560 + MAP_FOOTNOTE_STRIP_HEIGHT;
const MARGIN = { top: 20, right: 20, bottom: 20, left: 20 };

/** Translates coastline + overlays slightly downward inside the geography band */
const GEOGRAPHY_VERTICAL_OFFSET_PX = 22;

/** After placement, bump Puerto Rico further east/south from Florida polygons */
const PUERTO_RICO_CLEARANCE_NUDGE_PX = [10, 88];

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

/** Florida SE corner estimated from TopoJSON spherical bounds ([east, south] of bbox) */
function geoBoundsSouthEastLonLat(bounds) {
  const [[west, south], [east]] = bounds;
  return [east, south];
}

function geoPointFinite(p) {
  return Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]);
}

function findFloridaStateFeature(statesTopo) {
  const fc = topojson.feature(statesTopo, statesTopo.objects.states);
  return fc.features.find((f) => {
    const id = f.id != null ? String(f.id) : "";
    const name = String(f.properties?.name ?? "").toLowerCase();
    return id === "12" || name === "florida";
  });
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

function isAlaskaOrHawaiiNode(node) {
  const s = (node?.state ?? "").trim().toLowerCase();
  return (
    s === "alaska" ||
    s === "ak" ||
    s === "hawaii" ||
    s === "hi"
  );
}

/**
 * Omit only contiguous-U.S. ↔ Puerto Rico overlay links. Keep Alaska & Hawaii connected to PR.
 */
function shouldOmitContiguousUsVersusPuertoLink(source, target) {
  const sPr = Boolean(source.prInsetAnchored);
  const tPr = Boolean(target.prInsetAnchored);
  if (sPr === tPr) return false;
  const nonPuerto = sPr ? target : source;
  if (isAlaskaOrHawaiiNode(nonPuerto)) return false;
  return true;
}

function findPuertoRicoStateFeature(statesTopo) {
  const fc = topojson.feature(statesTopo, statesTopo.objects.states);
  return fc.features.find((f) => {
    const id = f.id != null ? String(f.id) : "";
    const name = String(f.properties?.name ?? "").toLowerCase();
    return id === "72" || name === "puerto rico";
  });
}

function inflateBounds(bounds, pad) {
  const [[x0, y0], [x1, y1]] = bounds;
  return [
    [x0 - pad, y0 - pad],
    [x1 + pad, y1 + pad],
  ];
}

/** Axis-aligned rects [[xmin,ymin],[xmax,ymax]] */
function rectsOverlap(a, b, gap = 0) {
  const [[ax0, ay0], [ax1, ay1]] = a;
  const [[bx0, by0], [bx1, by1]] = b;
  return !(ax1 + gap < bx0 || ax0 - gap > bx1 || ay1 + gap < by0 || ay0 - gap > by1);
}

/**
 * Albers mainland cannot evaluate Puerto Rico lng/lat (−66°, 18°) — fall back to anchored Mercator coastline.
 * Target screen position derives from Florida’s TopoJSON southeastern bbox corner plus a tangent-plane extrapolation toward PR centroid,
 * damped so islands stay inside the viewport and outside Florida’s projected bounds (see console log).
 *
 * @returns {null | {
 *   prFeature,
 *   prMercLocal: d3.GeoProjection,
 *   groupTranslate: [number, number],
 *   targetCentroidPx: [number, number],
 *   floridaAnchorLonLat: [number, number],
 *   prCentroidLonLat: [number, number],
 *   capFracUsed: number,
 * }}
 */
function buildPuertoRicoGeographyOverlay({ statesTopo, projection, innerW, innerH }) {
  const prFeature = findPuertoRicoStateFeature(statesTopo);
  const flFeature = findFloridaStateFeature(statesTopo);

  const marginPx = 7;
  const lonLatEpsilonDeg = 0.35;

  if (!(prFeature && flFeature)) {
    console.warn("[map overlay] Missing Florida / Puerto Rico from US Atlas TopoJSON.");
    return null;
  }

  const prCentLonLat = d3.geoCentroid(prFeature);
  const floridaBoundsLl = d3.geoBounds(flFeature);
  const floridaAnchLl = geoBoundsSouthEastLonLat(floridaBoundsLl);

  const pKw = projection(floridaAnchLl);
  if (!geoPointFinite(pKw)) {
    console.warn("[map overlay] Florida SE bbox anchor does not project; cannot anchor PR.");
    return null;
  }

  const floridaPxBoundsMain = d3.geoPath(projection).bounds(flFeature);
  const floridaExclusion = inflateBounds(floridaPxBoundsMain, 22);

  const llE = [floridaAnchLl[0] + lonLatEpsilonDeg, floridaAnchLl[1]];
  const llN = [floridaAnchLl[0], floridaAnchLl[1] + lonLatEpsilonDeg];
  const pE = projection(llE);
  const pN = projection(llN);

  const invEpsilon = 1 / lonLatEpsilonDeg;
  if (!(geoPointFinite(pE) && geoPointFinite(pN))) {
    console.warn("[map overlay] Nearby Florida directional samples not finite; anchor failed.");
    return null;
  }

  const vxLon = [(pE[0] - pKw[0]) * invEpsilon, (pE[1] - pKw[1]) * invEpsilon];
  const vxLat = [(pN[0] - pKw[0]) * invEpsilon, (pN[1] - pKw[1]) * invEpsilon];

  const dLonLl = prCentLonLat[0] - floridaAnchLl[0];
  const dLatLl = prCentLonLat[1] - floridaAnchLl[1];

  let rawDisplacement = [dLonLl * vxLon[0] + dLatLl * vxLat[0], dLonLl * vxLon[1] + dLatLl * vxLat[1]];
  let rawHyp = Math.hypot(rawDisplacement[0], rawDisplacement[1]);
  if (rawHyp === 0) rawHyp = 1;

  /** Mercator local fit for coastline + node alignment */
  const localPixelW = 118;
  const [[prW0, prS0], [prE0, prN0]] = d3.geoBounds(prFeature);
  const prLonSpanDeg = Math.max(1e-6, prE0 - prW0);
  const prLatSpanDeg = Math.max(1e-6, prN0 - prS0);
  const localPixelH = Math.max(74, Math.round((localPixelW * prLatSpanDeg) / prLonSpanDeg));

  const mercLocal = d3.geoMercator();
  mercLocal.fitExtent(
    [[0, 0], [localPixelW, localPixelH]],
    { type: "FeatureCollection", features: [prFeature] }
  );

  const mercPrPath = d3.geoPath(mercLocal);
  let prGeomBoundsMerc = mercPrPath.bounds(prFeature);
  if (!(Number.isFinite(prGeomBoundsMerc[0][0]) && Number.isFinite(prGeomBoundsMerc[1][0]))) {
    console.warn("[map overlay] PR Mercator path bounds invalid.");
    return null;
  }

  const cenLocMerc = mercLocal(prCentLonLat);
  if (!geoPointFinite(cenLocMerc)) {
    console.warn("[map overlay] PR centroid failed in inset Mercator.");
    return null;
  }

  const diagPx = Math.hypot(innerW, innerH);
  let capFrac = 0.24;
  let groupTranslate = /** @type {[number, number]} */ ([0, 0]);
  let tgtCentroid = /** @type {[number, number]} */ ([0, 0]);
  let kUsed = /** @type {number|null} */ (null);
  let lastGlobalGeomBounds = /** @type {[[number, number], [number, number]]|null} */ (null);
  let lastOk = false;
  let iter = 0;

  while (capFrac >= 8e-4 && iter++ < 60) {
    const capPx = capFrac * diagPx;

    rawDisplacement = [dLonLl * vxLon[0] + dLatLl * vxLat[0], dLonLl * vxLon[1] + dLatLl * vxLat[1]];
    rawHyp = Math.hypot(rawDisplacement[0], rawDisplacement[1]) || 1;

    const k = Math.min(1, capPx / rawHyp);
    tgtCentroid = [pKw[0] + k * rawDisplacement[0], pKw[1] + k * rawDisplacement[1]];

    groupTranslate = [
      tgtCentroid[0] - cenLocMerc[0],
      tgtCentroid[1] - cenLocMerc[1],
    ];

    groupTranslate = snapMercOverlayIntoViewport(prGeomBoundsMerc, groupTranslate, innerW, innerH, marginPx);

    tgtCentroid = [
      groupTranslate[0] + cenLocMerc[0],
      groupTranslate[1] + cenLocMerc[1],
    ];

    const gb = mercBoundsToGlobal(prGeomBoundsMerc, groupTranslate[0], groupTranslate[1]);
    lastGlobalGeomBounds = gb;

    const insideViewport =
      gb[0][0] >= marginPx &&
      gb[0][1] >= marginPx &&
      gb[1][0] <= innerW - marginPx &&
      gb[1][1] <= innerH - marginPx;

    const hitsFlorida = rectsOverlap(inflateBounds(gb, 1.5), floridaExclusion, 0);
    lastOk = insideViewport && !hitsFlorida;

    kUsed = k;

    if (lastOk) break;
    capFrac *= 0.9;
  }

  console.log("[map overlay] Puerto Rico placement (Florida bbox SE anchor + damped extrapolation)", {
    floridaAnchorLonLat: floridaAnchLl,
    puertoCentroidLonLat: prCentLonLat,
    centroidTargetPxAfterSnap: tgtCentroid.map((v) => Number(v.toFixed(2))),
    groupTranslatePx: groupTranslate.map((v) => Number(v.toFixed(2))),
    k: kUsed != null ? Number(kUsed.toFixed(4)) : null,
    attempts: iter,
    convergedInsideViewNoFloridaOverlap: lastOk,
    approxGeomBounds: lastGlobalGeomBounds,
    capFracEnding: Number(capFrac.toFixed(6)),
  });

  if (!(kUsed != null && lastGlobalGeomBounds)) return null;

  groupTranslate[0] += PUERTO_RICO_CLEARANCE_NUDGE_PX[0];
  groupTranslate[1] += PUERTO_RICO_CLEARANCE_NUDGE_PX[1];
  tgtCentroid = [
    groupTranslate[0] + cenLocMerc[0],
    groupTranslate[1] + cenLocMerc[1],
  ];
  lastGlobalGeomBounds = mercBoundsToGlobal(prGeomBoundsMerc, groupTranslate[0], groupTranslate[1]);

  return {
    prFeature,
    prMercLocal: mercLocal,
    groupTranslate,
    targetCentroidPx: tgtCentroid,
    floridaAnchorLonLat: floridaAnchLl,
    prCentroidLonLat: prCentLonLat,
    capFracUsed: capFrac,
    centroidLocalMerc: cenLocMerc,
    floridaPxBoundsInflatedForGuard: floridaExclusion,
  };
}

/** @returns {[[number, number], [number, number]]} */
function mercBoundsToGlobal(mercBounds, gx, gy) {
  const [[x0, y0], [x1, y1]] = mercBounds;
  return [
    [x0 + gx, y0 + gy],
    [x1 + gx, y1 + gy],
  ];
}

/** Nudge Puerto Rico Mercator group's translate until path bounds respect inner-map margins */
function snapMercOverlayIntoViewport(mercBounds, translate, innerW, innerH, margin) {
  const [[x0m, y0m], [x1m, y1m]] = mercBounds;
  let gx = translate[0];
  let gy = translate[1];
  let left = x0m + gx;
  let top = y0m + gy;
  let right = x1m + gx;
  let bottom = y1m + gy;
  if (left < margin) gx += margin - left;
  if (top < margin) gy += margin - top;
  if (right > innerW - margin) gx -= right - (innerW - margin);
  if (bottom > innerH - margin) gy -= bottom - (innerH - margin);
  return /** @type {[number, number]} */ ([gx, gy]);
}

/**
 * Nodes on Albers mainland + anchored Puerto Rico Mercator layer (matches AK/HI styling: outline only).
 */
function assignPositionsWithPuertoRicoOverlay(nodes, projection, innerW, innerH, overlay) {
  const projected = [];
  const insetPlaced = [];

  const fallbackCornerX = innerW - 112;
  const fallbackCornerY = innerH - 92;

  const prForcedInset = [];
  const fallbackRadial = [];

  function prLonLatToPx(lon, lat) {
    if (!overlay?.prMercLocal) return null;
    const lp = overlay.prMercLocal([lon, lat]);
    if (!geoPointFinite(lp)) return null;
    return [overlay.groupTranslate[0] + lp[0], overlay.groupTranslate[1] + lp[1]];
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

  d3.select("#chart-title").text(modeConfig.title);
  d3.select(".subtitle").text(modeConfig.subtitle);
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

  const puertoRicoGeographyOverlay = buildPuertoRicoGeographyOverlay({
    statesTopo,
    projection,
    innerW,
    innerH: geoFitHeightPx,
  });

  assignPositionsWithPuertoRicoOverlay(nodes, projection, innerW, geoFitHeightPx, puertoRicoGeographyOverlay);

  const placedNodes = nodes.filter((n) => Number.isFinite(n.px));

  let omittedContiguousPuerto = 0;
  let omittedContiguousPuertoFlow = 0;
  const placedLinks = links.filter((l) => {
    if (!Number.isFinite(l.source.px) || !Number.isFinite(l.target.px)) return false;
    if (l.source.projectionFailureFallback || l.target.projectionFailureFallback) return false;

    const sIns = Boolean(l.source.prInsetAnchored);
    const tIns = Boolean(l.target.prInsetAnchored);
    if (sIns !== tIns) {
      if (shouldOmitContiguousUsVersusPuertoLink(l.source, l.target)) {
        omittedContiguousPuerto += 1;
        omittedContiguousPuertoFlow += l.flow;
        return false;
      }
    }
    return true;
  });

  if (omittedContiguousPuerto > 0) {
    console.log(
      "[map edges] omitted contiguous U.S. ↔ Puerto Rico overlay edges:",
      omittedContiguousPuerto,
      `count, ${omittedContiguousPuertoFlow} transplants (Alaska/Hawaii ↔ Puerto Rico are drawn)`
    );
  } else {
    console.log("[map edges] contiguous U.S. ↔ Puerto Rico overlay exclusions: none");
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
      coordinateEligibleViewportFlow - omittedContiguousPuertoFlow - drawnFlowSum
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
  geoPane
    .append("g")
    .attr("class", "states")
    .selectAll("path")
    .data(statesFc.features)
    .join("path")
    .attr("class", "state")
    .attr("d", path);

  if (puertoRicoGeographyOverlay) {
    const [gx, gy] = puertoRicoGeographyOverlay.groupTranslate;
    geoPane
      .append("g")
      .attr("class", "pr-geography-overlay")
      .attr("transform", `translate(${gx},${gy})`)
      .append("path")
      .datum(puertoRicoGeographyOverlay.prFeature)
      .attr("class", "state")
      .attr("d", d3.geoPath(puertoRicoGeographyOverlay.prMercLocal));
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

  /** Captions stacked below coastline (footnote strip — no overlap over Florida/Puerto Rico) */
  const noteLineDy = 16;
  let mapFootY = geoPlotBottomY + 13;

  g.append("text")
    .attr("class", "map-note")
    .attr("x", 8)
    .attr("y", mapFootY)
    .attr("alignment-baseline", "hanging")
    .text(modeConfig.mapNote);
  mapFootY += noteLineDy;

  if (d2tFlowCoverageMetrics != null && edgeMode !== "top50") {
    const pct = d2tFlowCoverageMetrics.pctCoordinateEligible;
    g.append("text")
      .attr("class", "map-note map-note--coverage")
      .attr("x", 8)
      .attr("y", mapFootY)
      .attr("alignment-baseline", "hanging")
      .text(
        `Rendered flows represent ${pct.toFixed(1)}% of transplant volume in the all-organ D2T edge list.`
      );
    mapFootY += noteLineDy;

    if (omittedContiguousPuertoFlow > 0) {
      g.append("text")
        .attr("class", "map-note map-note--coverage")
        .attr("x", 8)
        .attr("y", mapFootY)
        .attr("alignment-baseline", "hanging")
        .text(
          `Contiguous U.S. mainland ↔ Puerto Rico pairs are omitted from drawing (${omittedContiguousPuertoFlow.toLocaleString()} transplants withheld) even when geocoded; Alaska/Hawaii ↔ Puerto Rico are drawn.`
        );
      mapFootY += noteLineDy;
    }
    if (projectionOnlyWithheldFlow > 0) {
      g.append("text")
        .attr("class", "map-note map-note--coverage")
        .attr("x", 8)
        .attr("y", mapFootY)
        .attr("alignment-baseline", "hanging")
        .text(
          `${projectionOnlyWithheldFlow.toLocaleString()} transplant volume in this screen's edge set is geocoded but not drawn because an endpoint lacks a projected map position.`
        );
      mapFootY += noteLineDy;
    }
  }

  // When top50-only mode omits contiguous↔Puerto Rico, still annotate (coverage line hidden).
  if (d2tFlowCoverageMetrics == null && omittedContiguousPuertoFlow > 0 && edgeMode === "top50") {
    g.append("text")
      .attr("class", "map-note map-note--coverage")
      .attr("x", 8)
      .attr("y", mapFootY)
      .attr("alignment-baseline", "hanging")
      .text(
        `Contiguous U.S. mainland ↔ Puerto Rico pairs are omitted from drawing (${omittedContiguousPuertoFlow.toLocaleString()} transplants withheld); Alaska/Hawaii ↔ Puerto Rico are drawn.`
      );
    mapFootY += noteLineDy;
  }

  g.append("text")
    .attr("class", "map-note map-note--coverage map-note--inset-caption")
    .attr("x", 8)
    .attr("y", mapFootY)
    .attr("alignment-baseline", "hanging")
    .text(
      "Alaska, Hawaii, and Puerto Rico are shown at customary reduced inset scale (not geographically proportional)."
    );

  renderLegendPanel({ strokeScale, edgeMode, style, modeConfig });
}

function geoFeatureCollection(statesTopo) {
  const fc = topojson.feature(statesTopo, statesTopo.objects.states);
  return {
    ...fc,
    // Omit PR polygon from the mainland layer; it draws in pr-geography-overlay (US Atlas id 72).
    features: fc.features.filter((f) => String(f.id) !== "72"),
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
