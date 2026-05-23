/**
 * MSDS 455 Assignment 05 — D3 flow map prototype
 *
 * ORGAN_MODE:
 *   all, kidney, liver, heart, lung, pancreas, kidney_pancreas, multi_liver_kidney
 *
 * LAYOUT_MODE:
 *   single                 — Iteration 01 single map (+ optional hub emphasis toggle)
 *   small_multiples        — Iteration 02 comparative 2×4 organ panels
 *   geography_comparison   — Iteration 03 donor vs transplant geography (2 panels)
 *   dot_map                — Iteration 04 simplified dot maps (no flows)
 *   dot_map_volume         — Iteration 05 proportional bubbles (2 panels)
 *
 * EDGE_MODE options:
 *   all, ge_200, ge_100, ge_50, ge_25, top50  (top50: all-organ only)
 */

// --- Layout switch ---
// const LAYOUT_MODE = "single";
// const LAYOUT_MODE = "small_multiples";
// const LAYOUT_MODE = "geography_comparison";
// const LAYOUT_MODE = "dot_map";
const LAYOUT_MODE = "dot_map_volume";

// --- Organ switch (per-organ D2T experiment; used when LAYOUT_MODE = single) ---
const ORGAN_MODE = "all";
// const ORGAN_MODE = "kidney";
// const ORGAN_MODE = "liver";
// const ORGAN_MODE = "heart";
// const ORGAN_MODE = "lung";
// const ORGAN_MODE = "pancreas";
// const ORGAN_MODE = "kidney_pancreas";
// const ORGAN_MODE = "multi_liver_kidney";

/** Single-map hub experiment (not Iteration 03 layout); false = Iteration 01 nodes */
const SHOW_DESTINATION_HUBS = false;
// const SHOW_DESTINATION_HUBS = true;

/** Iteration 02 small-multiples panels (shared stroke scale across panels) */
const SMALL_MULTIPLES_PANELS = [
  { slug: "all", title: "All organs" },
  { slug: "kidney", title: "Kidney" },
  { slug: "liver", title: "Liver" },
  { slug: "heart", title: "Heart" },
  { slug: "lung", title: "Lung" },
  { slug: "pancreas", title: "Pancreas" },
  { slug: "kidney_pancreas", title: "Kidney–pancreas" },
  { slug: "multi_liver_kidney", title: "Liver–kidney (multi-organ)" },
];

const SM_COLS = 2;
const SM_ROWS = 4;
const SM_GAP = 14;
const SM_PANEL_TITLE_DY = 17;
const SM_FOOTNOTE_STRIP = 12;
const SM_SVG_WIDTH = 920;
/** Taller canvas so 2×4 panels stay legible */
const SM_SVG_HEIGHT = 1120;
const SM_MARGIN = { top: 10, right: 14, bottom: 10, left: 14 };

/**
 * Small-multiples encoding (2×4 panels are small — bubbles read clearer than hairlines).
 *   flows  — shared-weight flow lines (boosted opacity/width)
 *   bubbles — destination center volume only (shared bubble scale)
 */
const SM_VIS_MODE = "bubbles";
// const SM_VIS_MODE = "flows";

/** Iteration 02 palette: default (slate/teal) or Tufte-style charcoal forest */
const SM_COLOR_THEME = "charcoal_forest";
// const SM_COLOR_THEME = "default";

/** Iteration 03 — donor recovery vs transplant center geography (2 panels) */
const GEOGRAPHY_COMPARISON_PANELS = [
  {
    slug: "donor",
    title: "Donor Recovery Geography",
    subtitle: "Where organs enter the transplant system",
    emphasis: "source",
  },
  {
    slug: "transplant",
    title: "Transplant Center Geography",
    subtitle: "Where transplant expertise concentrates",
    emphasis: "destination",
  },
];

const GEO_CMP_SVG_WIDTH = 920;
const GEO_CMP_SVG_HEIGHT = 548;
const GEO_CMP_COLS = 2;
const GEO_CMP_GAP = 22;
const GEO_CMP_MARGIN = { top: 18, right: 14, bottom: 10, left: 14 };
const GEO_CMP_PANEL_TITLE_DY = 18;
const GEO_CMP_PANEL_SUBTITLE_DY = 13;
const GEO_CMP_FOOTNOTE_STRIP = 12;

/** Iteration 04 — combined dot map (donor + transplant sites, no flow arcs) */
const DOT_MAP_DOT_RADIUS = 1.72;
/** Match co-located OPO + transplant center sites (shared geocode in node file) */
const DUAL_ROLE_COORD_DECIMALS = 4;

/** Iteration 05 — proportional volume bubbles (2 panels, all organs) */
const DOT_MAP_VOLUME_PANELS = [
  {
    slug: "donor",
    title: "Donor Recovery Organizations",
    subtitle: "Bubble area = total donor outflow",
    nodeType: "source_dsa",
  },
  {
    slug: "transplant",
    title: "Transplant Centers",
    subtitle: "Bubble area = total transplant inflow",
    nodeType: "transplant_center",
  },
];

const DOT_VOL_SVG_WIDTH = GEO_CMP_SVG_WIDTH;
const DOT_VOL_SVG_HEIGHT = GEO_CMP_SVG_HEIGHT;
const DOT_VOL_COLS = 2;
const DOT_VOL_GAP = GEO_CMP_GAP;
const DOT_VOL_MARGIN = GEO_CMP_MARGIN;
const DOT_VOL_PANEL_TITLE_DY = GEO_CMP_PANEL_TITLE_DY;
const DOT_VOL_PANEL_SUBTITLE_DY = GEO_CMP_PANEL_SUBTITLE_DY;
const DOT_VOL_FOOTNOTE_STRIP = GEO_CMP_FOOTNOTE_STRIP;
/** Restrained sqrt radius range (px) per panel */
const DOT_VOL_RADIUS_RANGE = [2.6, 10.8];

/** Reference inner width for scaling PR inset box on smaller panels */
const REF_PANEL_INNER_W = 780;
const REF_PANEL_GEO_H = 510;

// --- Edge mode switch ---
const EDGE_MODE = "all";
//const EDGE_MODE = "ge_200";
//const EDGE_MODE = "ge_100";
//const EDGE_MODE = "ge_50";
//const EDGE_MODE = "ge_25";
// const EDGE_MODE = "top50";

/** Display labels for title/subtitle copy */
const ORGAN_MODE_META = {
  all: { label: "Organ", iteration: "01", edgesEnriched: "../data/processed/d2t_edges_all_organs_enriched.csv" },
  kidney: { label: "Kidney", iteration: "02" },
  liver: { label: "Liver", iteration: "02" },
  heart: { label: "Heart", iteration: "02" },
  lung: { label: "Lung", iteration: "02" },
  pancreas: { label: "Pancreas", iteration: "02" },
  kidney_pancreas: { label: "Kidney–pancreas", iteration: "02" },
  multi_liver_kidney: { label: "Liver–kidney (multi-organ)", iteration: "02" },
};

function buildOrganModes() {
  const modes = {};
  for (const [slug, meta] of Object.entries(ORGAN_MODE_META)) {
    const coverageSlug = slug === "all" ? "all-organ" : slug.replace(/_/g, "-");
    modes[slug] = {
      iteration: meta.iteration,
      chartTitle: "Regional Yet Connected",
      chartSubtitle:
        slug === "all"
          ? "Organ transplant flows form a dense national network anchored by regional medical hubs."
          : `${meta.label} transplant flows form a dense national network anchored by regional medical hubs.`,
      documentTitle:
        slug === "all"
          ? "Regional Yet Connected — Organ Transplant Flows"
          : `Regional Yet Connected — ${meta.label} Transplant Flows`,
      edgesEnriched:
        meta.edgesEnriched ?? `../data/processed/d2t_edges_${slug}_enriched.csv`,
      coverageLabel: `${coverageSlug} D2T edge list`,
    };
  }
  return modes;
}

const ORGAN_MODES = buildOrganModes();

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
  edgesTop50: "../data/processed/top_50_edges_all_organs.csv",
  nodes: "../data/processed/all_nodes_with_coordinates.csv",
  sourceSummary: "../data/processed/d2t_source_summary.csv",
  destinationSummary: "../data/processed/d2t_destination_summary.csv",
  states: "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json",
};

function logOrganRunSummary({
  organMode,
  totalFlow,
  renderedFlow,
  edgeCount,
}) {
  const renderedPct =
    totalFlow > 0 ? ((renderedFlow / totalFlow) * 100).toFixed(1) : "n/a";
  console.log("[organ summary]", {
    organMode,
    totalFlow,
    renderedFlow,
    renderedFlowPercent: renderedPct === "n/a" ? renderedPct : `${renderedPct}%`,
    edgeCount,
  });
}

function resolveOrganConfig() {
  const organConfig = ORGAN_MODES[ORGAN_MODE];
  if (!organConfig) {
    throw new Error(
      `Unknown ORGAN_MODE "${ORGAN_MODE}". Use: ${Object.keys(ORGAN_MODES).join(", ")}`
    );
  }
  return organConfig;
}

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

/** Hub circle radius (px) from total destination inflow in the active edge view */
const HUB_RADIUS_RANGE = [3, 17];

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

function inflateBoundsAsymmetric(bounds, { top = 0, right = 0, bottom = 0, left = 0 }) {
  const [[x0, y0], [x1, y1]] = bounds;
  return [
    [x0 - left, y0 - top],
    [x1 + right, y1 + bottom],
  ];
}

function boundsOverlap(a, b) {
  const [[ax0, ay0], [ax1, ay1]] = a;
  const [[bx0, by0], [bx1, by1]] = b;
  return ax0 < bx1 && bx0 < ax1 && ay0 < by1 && by0 < ay1;
}

/** Pad/gap for AK/HI frames; scales down on smaller geography bands */
function insetFrameMetricsForGeo(innerW, geoBandHeightPx) {
  const scale = Math.min(innerW / REF_PANEL_INNER_W, geoBandHeightPx / REF_PANEL_GEO_H);
  return {
    pad: Math.max(2, Math.round(3 + 2 * scale)),
    gap: Math.max(3, Math.round(4 + 2 * scale)),
  };
}

/**
 * Alaska & Hawaii frames follow the Albers USA composite positions already on the main map.
 * Uses a shared bottom baseline and interior gap so padded boxes do not overlap.
 * @returns {{ id: string, bounds: [[number, number], [number, number]] }[]}
 */
function collectAlaskaHawaiiInsetFrames(statesTopo, path, pad = 5, gap = 5) {
  const raw = [];
  for (const id of [STATE_ID_ALASKA, STATE_ID_HAWAII]) {
    const feature = findStateFeatureById(statesTopo, id);
    if (!feature) continue;
    const bounds = path.bounds(feature);
    if (!(Number.isFinite(bounds[0][0]) && Number.isFinite(bounds[1][0]))) continue;
    raw.push({ id, bounds });
  }
  if (raw.length === 0) return [];
  if (raw.length === 1) {
    return [{ id: raw[0].id, bounds: inflateBounds(raw[0].bounds, pad) }];
  }

  const ak = raw.find((r) => r.id === STATE_ID_ALASKA) ?? raw[0];
  const hi = raw.find((r) => r.id === STATE_ID_HAWAII) ?? raw[1];
  const sharedBottom = Math.max(ak.bounds[1][1], hi.bounds[1][1]);

  const buildPair = (outerPad, interior) => {
    const bottomAk = outerPad + (sharedBottom - ak.bounds[1][1]);
    const bottomHi = outerPad + (sharedBottom - hi.bounds[1][1]);
    return [
      inflateBoundsAsymmetric(ak.bounds, {
        top: outerPad,
        right: interior,
        bottom: bottomAk,
        left: outerPad,
      }),
      inflateBoundsAsymmetric(hi.bounds, {
        top: outerPad,
        right: outerPad,
        bottom: bottomHi,
        left: interior,
      }),
    ];
  };

  let [akBounds, hiBounds] = buildPair(pad, gap / 2);

  let interior = gap / 2;
  while (boundsOverlap(akBounds, hiBounds) && interior > 0) {
    interior = Math.max(0, interior - 0.35);
    [akBounds, hiBounds] = buildPair(pad, interior);
  }

  let effectivePad = pad;
  while (boundsOverlap(akBounds, hiBounds) && effectivePad > 1.5) {
    effectivePad -= 0.5;
    [akBounds, hiBounds] = buildPair(effectivePad, Math.max(1.5, gap / 2));
  }

  return [
    { id: ak.id, bounds: akBounds },
    { id: hi.id, bounds: hiBounds },
  ];
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
function scalePrInsetBox(innerW, innerH) {
  const geoH = innerH - GEOGRAPHY_VERTICAL_OFFSET_PX - SM_FOOTNOTE_STRIP;
  const sx = innerW / REF_PANEL_INNER_W;
  const sy = geoH / REF_PANEL_GEO_H;
  return {
    width: Math.max(34, Math.round(PUERTO_RICO_INSET_BOX.width * sx)),
    height: Math.max(38, Math.round(PUERTO_RICO_INSET_BOX.height * sy)),
    marginBottom: Math.round(PUERTO_RICO_INSET_BOX.marginBottom * sy),
    padding: Math.max(2, Math.round(PUERTO_RICO_INSET_BOX.padding * sx)),
    labelOffset: 4,
    edgePad: Math.max(4, Math.round(PUERTO_RICO_INSET_BOX.edgePad * sx)),
  };
}

function buildPuertoRicoInset({
  statesTopo,
  innerW,
  innerH,
  boxConfig = PUERTO_RICO_INSET_BOX,
  quiet = false,
}) {
  const prFeature = findPuertoRicoStateFeature(statesTopo);
  if (!prFeature) {
    console.warn("[map inset] Puerto Rico feature missing from US Atlas TopoJSON.");
    return null;
  }

  const { width, height, marginBottom, padding, labelOffset, edgePad = 8 } = boxConfig;
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

  if (!quiet) {
    console.log("[map inset] Puerto Rico panel (local Albers, fixed box)", {
      boxBounds,
      centroidPx: prCentroidPx.map((v) => Number(v.toFixed(2))),
    });
  }

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

function edgeFileForMode(modeConfig, organConfig) {
  if (modeConfig.useTop50File) {
    if (ORGAN_MODE !== "all") {
      console.warn("[map] top50 EDGE_MODE uses all-organ edges only; ORGAN_MODE ignored for file path.");
    }
    return DATA.edgesTop50;
  }
  return organConfig.edgesEnriched;
}

function buildStrokeScale(flows, widthRange, domainOverride = null) {
  const [lo, hi] =
    domainOverride ?? d3.extent(flows.filter((f) => Number.isFinite(f) && f > 0));
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo === hi) {
    return () => (widthRange[0] + widthRange[1]) / 2;
  }
  return d3.scaleSqrt().domain([lo, hi]).range(widthRange).clamp(true);
}

function bubbleRadiusRangeForPanel(panelInnerH) {
  const scale = panelInnerH / REF_PANEL_GEO_H;
  return [Math.max(2.5, 3.2 * scale), Math.max(7, 15 * scale)];
}

/** Iteration 03 — atmospheric flows + opacity/node emphasis (no hub bubbles) */
function styleForGeographyComparison(emphasis, primaryRadiusScale) {
  return {
    drawFlows: true,
    linkStroke: "#4a524c",
    linkOpacity: emphasis === "source" ? 0.058 : 0.052,
    widthRange: [0.22, 1.05],
    showNodes: false,
    showFlowLegend: false,
    showInsetFrames: true,
    showPrLabel: true,
    showLinkTooltips: false,
    nodeEmphasis: emphasis,
    primaryRadiusScale,
    primaryRadiusMin: 1.35,
    primaryOpacity: emphasis === "source" ? 0.78 : 0.74,
    secondaryRadius: 0.8,
    secondaryOpacity: 0.13,
  };
}

function styleForSmallMultiples(panelInnerH) {
  const rowBoost = SM_ROWS >= 4 ? 1.25 : 1;
  if (SM_VIS_MODE === "bubbles") {
    return {
      /** Faint flow context under destination bubbles */
      drawFlows: true,
      linkStroke: "#8a9490",
      linkOpacity: 0.045,
      widthRange: [0.22, 0.72],
      showNodes: false,
      showFlowLegend: false,
      showInsetFrames: true,
      showPrLabel: false,
      showLinkTooltips: false,
      bubbleRadiusRange: bubbleRadiusRangeForPanel(panelInnerH),
      bubbleFillOpacity: 0.55,
    };
  }
  return {
    drawFlows: true,
    linkStroke: "#8a9490",
    linkOpacity: 0.1 * rowBoost,
    widthRange: [0.34 * rowBoost, 1.35 * rowBoost],
    showNodes: false,
    showFlowLegend: false,
    showInsetFrames: true,
    showPrLabel: false,
    showLinkTooltips: false,
  };
}

function buildCoordLinksFromRawEdges(rawEdges, nodeById) {
  const links = [];
  rawEdges.forEach((e) => {
    const source = nodeById.get(String(e.source_dsa_id ?? "").trim());
    const target = nodeById.get(String(e.destination_center_id ?? "").trim());
    if (workbookRowHasParsableCoordinates(source) && workbookRowHasParsableCoordinates(target)) {
      links.push({
        sourceId: e.source_dsa_id,
        targetId: e.destination_center_id,
        flow: e.flow_count,
        source,
        target,
      });
    }
  });
  return links;
}

function filterPlacedLinks(links, puertoRicoInset) {
  return links.filter((l) => {
    if (!Number.isFinite(l.source.px) || !Number.isFinite(l.target.px)) return false;
    if (l.source.projectionFailureFallback || l.target.projectionFailureFallback) return false;
    const crossesPr =
      Boolean(l.source.prInsetAnchored) !== Boolean(l.target.prInsetAnchored);
    if (crossesPr && !puertoRicoInset) return false;
    return true;
  });
}

function drawMapLayers(
  geoPane,
  {
    statesTopo,
    path,
    puertoRicoInset,
    placedLinks,
    strokeScale,
    style,
    placedNodes,
    edgeMode,
    layerOptions = {},
  }
) {
  const showInsetFrames = layerOptions.showInsetFrames ?? true;
  const showPrLabel = layerOptions.showPrLabel ?? true;
  const showNodes = layerOptions.showNodes ?? false;
  const showHubs = layerOptions.showHubs ?? false;
  const showLinkTooltips = layerOptions.showLinkTooltips ?? false;

  const statesFc = geoFeatureCollection(statesTopo);
  const insetMetrics = layerOptions.insetFrameMetrics ?? { pad: 5, gap: 5 };
  const alaskaHawaiiInsetFrames = collectAlaskaHawaiiInsetFrames(
    statesTopo,
    path,
    insetMetrics.pad,
    insetMetrics.gap
  );

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

  if (showInsetFrames) {
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
      if (showPrLabel) {
        geoPane
          .append("text")
          .attr("class", "inset-label")
          .attr("x", puertoRicoInset.labelX)
          .attr("y", puertoRicoInset.labelY)
          .attr("text-anchor", "middle")
          .attr("alignment-baseline", "baseline")
          .text("Puerto Rico");
      }
    }
  }

  const drawFlows = layerOptions.drawFlows !== false && placedLinks.length > 0;
  if (drawFlows) {
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

    if (showLinkTooltips && edgeMode !== "all") {
      linkSel.append("title").text(
        (d) => `${d.sourceId} → ${d.targetId}\n${d.flow} transplants`
      );
    }
  }

  if (showHubs) {
    const hubLinks = layerOptions.hubLinks ?? placedLinks;
    drawDestinationHubs(geoPane, placedNodes, hubLinks, layerOptions.hubDrawOptions);
  } else if (layerOptions.nodeEmphasis) {
    drawEmphasisNodes(geoPane, placedNodes, layerOptions.nodeEmphasis, style, layerOptions.flowWeights);
  } else if (layerOptions.dotMapBoth) {
    const dotR = layerOptions.dotRadius ?? DOT_MAP_DOT_RADIUS;
    drawDotMapNodes(geoPane, placedNodes, "transplant_center", dotR);
    drawDotMapNodes(geoPane, placedNodes, "source_dsa", dotR);
  } else if (layerOptions.dotMapProportional) {
    const { nodeType, volumeById, radiusScale, roleClass } = layerOptions.dotMapProportional;
    drawProportionalDotMapNodes(geoPane, placedNodes, nodeType, volumeById, radiusScale, roleClass);
  } else if (layerOptions.dotNodeType) {
    drawDotMapNodes(geoPane, placedNodes, layerOptions.dotNodeType, layerOptions.dotRadius ?? DOT_MAP_DOT_RADIUS);
  } else if (showNodes && style.showNodes) {
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
}

function computeSmallMultiplesPanelSize() {
  const gridW = SM_SVG_WIDTH - SM_MARGIN.left - SM_MARGIN.right - SM_GAP * (SM_COLS - 1);
  const gridH =
    SM_SVG_HEIGHT -
    SM_MARGIN.top -
    SM_MARGIN.bottom -
    SM_GAP * (SM_ROWS - 1) -
    SM_ROWS * SM_PANEL_TITLE_DY;
  return {
    panelInnerW: gridW / SM_COLS,
    panelInnerH: gridH / SM_ROWS,
  };
}

async function initSmallMultiples() {
  const { panelInnerW, panelInnerH } = computeSmallMultiplesPanelSize();
  const smStyle = styleForSmallMultiples(panelInnerH);
  const geoFitHeightPx = panelInnerH - SM_FOOTNOTE_STRIP - GEOGRAPHY_VERTICAL_OFFSET_PX;

  const subtitleBubbles =
    "Organ-specific transplant center concentration — circle area uses a shared scale across panels.";
  const subtitleFlows =
    "Organ-specific flow patterns — line weight uses a shared scale across panels (boosted for 2×4 layout).";

  document.title = "Regional Yet Connected — Organ Flow Comparison";
  d3.select("#chart-title").text("Regional Yet Connected");
  d3.select(".subtitle").text(SM_VIS_MODE === "bubbles" ? subtitleBubbles : subtitleFlows);
  const paletteClass =
    SM_COLOR_THEME === "charcoal_forest" ? "palette-charcoal-forest" : "palette-default";
  d3.select("body").attr(
    "class",
    [
      "layout-small-multiples",
      "iteration-02-sm",
      "edge-mode-all",
      "organ-mode-comparison",
      `sm-vis-${SM_VIS_MODE}`,
      paletteClass,
    ].join(" ")
  );
  d3.select(".viz-card").attr("data-iteration", "02-sm-final");
  d3.select("#legend-panel").style("display", "none");
  d3.select("#audit-panel").style("display", "none");

  const edgePaths = SMALL_MULTIPLES_PANELS.map((p) => ORGAN_MODES[p.slug].edgesEnriched);
  const [nodes, statesTopo, ...rawEdgeSets] = await Promise.all([
    d3.csv(DATA.nodes, d3.autoType),
    d3.json(DATA.states),
    ...edgePaths.map((path) => d3.csv(path, d3.autoType)),
  ]);

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const projection = d3
    .geoAlbersUsa()
    .fitSize([panelInnerW, geoFitHeightPx], geoFeatureCollection(statesTopo));
  const path = d3.geoPath(projection);
  const prInset = buildPuertoRicoInset({
    statesTopo,
    innerW: panelInnerW,
    innerH: geoFitHeightPx,
    boxConfig: scalePrInsetBox(panelInnerW, geoFitHeightPx),
    quiet: true,
  });

  assignPositionsWithPuertoRicoOverlay(nodes, projection, panelInnerW, geoFitHeightPx, prInset);
  const placedNodes = nodes.filter((n) => Number.isFinite(n.px));

  const panelData = SMALL_MULTIPLES_PANELS.map((panel, i) => {
    const coordLinks = buildCoordLinksFromRawEdges(rawEdgeSets[i], nodeById);
    const eligibleFlow = d3.sum(coordLinks, (l) => Number(l.flow) || 0);
    const placedLinks = filterPlacedLinks(coordLinks, prInset);
    const renderedFlow = d3.sum(placedLinks, (l) => Number(l.flow) || 0);
    const renderedFlowPercent =
      eligibleFlow > 0 ? (renderedFlow / eligibleFlow) * 100 : null;
    return {
      ...panel,
      placedLinks,
      eligibleFlow,
      renderedFlow,
      renderedFlowPercent,
      edgeCount: placedLinks.length,
    };
  });

  const allFlows = panelData.flatMap((p) => p.placedLinks.map((l) => l.flow));
  const sharedFlowDomain = d3.extent(allFlows.filter((f) => f > 0));
  const strokeScale = buildStrokeScale(allFlows, smStyle.widthRange, sharedFlowDomain);

  let sharedBubbleRadiusScale = null;
  let sharedBubbleDomain = null;
  if (SM_VIS_MODE === "bubbles") {
    const allInflows = [];
    panelData.forEach((p) => {
      for (const v of buildDestinationInflowFromLinks(p.placedLinks).values()) {
        if (v > 0) allInflows.push(v);
      }
    });
    sharedBubbleDomain = d3.extent(allInflows);
    sharedBubbleRadiusScale = buildStrokeScale(
      allInflows,
      smStyle.bubbleRadiusRange,
      sharedBubbleDomain
    );
  }

  console.log("[small multiples] layout:", LAYOUT_MODE, "| vis:", SM_VIS_MODE);
  if (SM_VIS_MODE === "flows") {
    console.log("[small multiples] shared stroke domain (flow_count):", sharedFlowDomain);
  } else {
    console.log("[small multiples] shared bubble domain (inflow):", sharedBubbleDomain);
  }
  panelData.forEach((p) => {
    console.log(`[small multiples] organ mode: ${p.slug}`);
    console.log(`[small multiples] ${p.slug}:`, {
      title: p.title,
      edgeCount: p.edgeCount,
      totalFlow: p.eligibleFlow,
      renderedFlow: p.renderedFlow,
      renderedFlowPercent:
        p.renderedFlowPercent != null ? `${p.renderedFlowPercent.toFixed(1)}%` : "n/a",
    });
  });

  const sourceNote =
    SM_VIS_MODE === "bubbles"
      ? "Source: OPTN/UNOS Advanced Reports; donor and transplant flows, 2025. Current waitlist reference data pulled 2026. Circle size = transplant center inflow (shared scale)."
      : "Source: OPTN/UNOS Advanced Reports; donor and transplant flows, 2025. Current waitlist reference data pulled 2026. Line weight = flow volume (shared scale).";
  d3.select(".viz-source").text(sourceNote);

  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("viewBox", [0, 0, SM_SVG_WIDTH, SM_SVG_HEIGHT])
    .attr("role", "img")
    .attr("class", `map-svg map-svg--small-multiples map-svg--sm-${SM_VIS_MODE}`);

  const root = svg.append("g").attr("transform", `translate(${SM_MARGIN.left},${SM_MARGIN.top})`);

  panelData.forEach((panel, idx) => {
    const col = idx % SM_COLS;
    const row = Math.floor(idx / SM_COLS);
    const originX = col * (panelInnerW + SM_GAP);
    const originY = row * (panelInnerH + SM_GAP + SM_PANEL_TITLE_DY);

    const panelG = root
      .append("g")
      .attr("class", `sm-panel sm-panel--${panel.slug}`)
      .attr("transform", `translate(${originX},${originY})`);

    panelG
      .append("text")
      .attr("class", "sm-panel-title")
      .attr("x", 0)
      .attr("y", 0)
      .attr("alignment-baseline", "hanging")
      .text(panel.title);

    const geoPane = panelG
      .append("g")
      .attr("class", "map-geo-pane")
      .attr("transform", `translate(0,${SM_PANEL_TITLE_DY + GEOGRAPHY_VERTICAL_OFFSET_PX})`);

    drawMapLayers(geoPane, {
      statesTopo,
      path,
      puertoRicoInset: prInset,
      placedLinks: panel.placedLinks,
      strokeScale,
      style: smStyle,
      placedNodes,
      edgeMode: "all",
      layerOptions: {
        insetFrameMetrics: insetFrameMetricsForGeo(panelInnerW, geoFitHeightPx),
        drawFlows: smStyle.drawFlows !== false,
        hubLinks: panel.placedLinks,
        showInsetFrames: smStyle.showInsetFrames,
        showPrLabel: smStyle.showPrLabel,
        showNodes: false,
        showHubs: SM_VIS_MODE === "bubbles",
        showLinkTooltips: false,
        hubDrawOptions: {
          radiusScale: sharedBubbleRadiusScale,
          radiusRange: smStyle.bubbleRadiusRange,
          fillOpacity: smStyle.bubbleFillOpacity,
          quiet: true,
        },
      },
    });
  });
}

function computeDualPanelLayoutSize({
  svgWidth,
  svgHeight,
  margin,
  gap,
  cols,
  panelTitleDy,
  panelSubtitleDy,
}) {
  const gridW = svgWidth - margin.left - margin.right - gap * (cols - 1);
  const gridH =
    svgHeight - margin.top - margin.bottom - panelTitleDy - panelSubtitleDy;
  return {
    panelInnerW: gridW / cols,
    panelInnerH: gridH,
  };
}

function computeGeographyComparisonPanelSize() {
  return computeDualPanelLayoutSize({
    svgWidth: GEO_CMP_SVG_WIDTH,
    svgHeight: GEO_CMP_SVG_HEIGHT,
    margin: GEO_CMP_MARGIN,
    gap: GEO_CMP_GAP,
    cols: GEO_CMP_COLS,
    panelTitleDy: GEO_CMP_PANEL_TITLE_DY,
    panelSubtitleDy: GEO_CMP_PANEL_SUBTITLE_DY,
  });
}

async function initGeographyComparison() {
  const organConfig = ORGAN_MODES[ORGAN_MODE] ?? ORGAN_MODES.all;
  const { panelInnerW, panelInnerH } = computeGeographyComparisonPanelSize();
  const geoFitHeightPx = panelInnerH - GEO_CMP_FOOTNOTE_STRIP - GEOGRAPHY_VERTICAL_OFFSET_PX;

  document.title = "Regional Yet Connected — Donor vs Transplant Geography";
  d3.select("#chart-title").text("Regional Yet Connected");
  d3.select(".subtitle").text(
    "Donor recovery infrastructure and transplant-center concentration as distinct but related geographies."
  );
  d3.select("body").attr(
    "class",
    [
      "layout-geography-comparison",
      "iteration-03-geo",
      "palette-charcoal-forest",
      `organ-mode-${ORGAN_MODE}`,
      "edge-mode-all",
    ].join(" ")
  );
  d3.select(".viz-card").attr("data-iteration", "03-geo");
  d3.select("#legend-panel").style("display", "none");
  d3.select("#audit-panel").style("display", "");

  const edgePath = organConfig.edgesEnriched;
  const coverageEdgePath = organConfig.edgesEnriched;
  const [rawEdges, coverageEdges, nodes, statesTopo] = await Promise.all([
    d3.csv(edgePath, d3.autoType),
    d3.csv(coverageEdgePath, d3.autoType),
    d3.csv(DATA.nodes, d3.autoType),
    d3.json(DATA.states),
  ]);

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  let coverageTotalFlow = 0;
  let coordinateEligibleFlow = 0;
  coverageEdges.forEach((e) => {
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

  const coordLinks = buildCoordLinksFromRawEdges(rawEdges, nodeById);
  const projection = d3
    .geoAlbersUsa()
    .fitSize([panelInnerW, geoFitHeightPx], geoFeatureCollection(statesTopo));
  const path = d3.geoPath(projection);
  const prInset = buildPuertoRicoInset({
    statesTopo,
    innerW: panelInnerW,
    innerH: geoFitHeightPx,
    boxConfig: scalePrInsetBox(panelInnerW, geoFitHeightPx),
    quiet: true,
  });

  assignPositionsWithPuertoRicoOverlay(nodes, projection, panelInnerW, geoFitHeightPx, prInset);
  const placedNodes = nodes.filter((n) => Number.isFinite(n.px));
  const placedLinks = filterPlacedLinks(coordLinks, prInset);
  const renderedFlow = d3.sum(placedLinks, (l) => Number(l.flow) || 0);
  const eligibleFlow = d3.sum(coordLinks, (l) => Number(l.flow) || 0);
  const projectionOnlyWithheldFlow = Math.max(0, eligibleFlow - renderedFlow);

  logOrganRunSummary({
    organMode: ORGAN_MODE,
    totalFlow: eligibleFlow,
    renderedFlow,
    edgeCount: placedLinks.length,
  });

  const allFlows = placedLinks.map((l) => l.flow);
  const sharedFlowDomain = d3.extent(allFlows.filter((f) => f > 0));
  const baseStyle = styleForGeographyComparison("source", null);
  const sharedStrokeScale = buildStrokeScale(allFlows, baseStyle.widthRange, sharedFlowDomain);

  const sourceOutflow = buildSourceOutflowFromLinks(placedLinks);
  const destInflow = buildDestinationInflowFromLinks(placedLinks);
  const sourceFlows = [...sourceOutflow.values()].filter((v) => v > 0);
  const destFlows = [...destInflow.values()].filter((v) => v > 0);
  const sourceRadiusScale = buildStrokeScale(sourceFlows, [1.35, 3.1], d3.extent(sourceFlows));
  const destRadiusScale = buildStrokeScale(destFlows, [1.35, 3.1], d3.extent(destFlows));

  console.log("[geography comparison] layout:", LAYOUT_MODE, "| organ:", ORGAN_MODE);
  console.log("[geography comparison] shared flow domain:", sharedFlowDomain);
  console.log("[geography comparison] edges drawn:", placedLinks.length);

  d3.select(".viz-source").text(
    "Source: OPTN/UNOS Advanced Reports; donor and transplant flows, 2025. Current waitlist reference data pulled 2026. Same projection and flow scale on both panels; node size reflects endpoint-weighted volume."
  );

  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("viewBox", [0, 0, GEO_CMP_SVG_WIDTH, GEO_CMP_SVG_HEIGHT])
    .attr("role", "img")
    .attr("class", "map-svg map-svg--geography-comparison");

  const root = svg
    .append("g")
    .attr("transform", `translate(${GEO_CMP_MARGIN.left},${GEO_CMP_MARGIN.top})`);

  GEOGRAPHY_COMPARISON_PANELS.forEach((panel, idx) => {
    const originX = idx * (panelInnerW + GEO_CMP_GAP);
    const panelG = root
      .append("g")
      .attr("class", `geo-cmp-panel geo-cmp-panel--${panel.slug}`)
      .attr("transform", `translate(${originX},0)`);

    panelG
      .append("text")
      .attr("class", "geo-cmp-panel-title")
      .attr("x", 0)
      .attr("y", 0)
      .attr("alignment-baseline", "hanging")
      .text(panel.title);

    panelG
      .append("text")
      .attr("class", "geo-cmp-panel-subtitle")
      .attr("x", 0)
      .attr("y", GEO_CMP_PANEL_TITLE_DY)
      .attr("alignment-baseline", "hanging")
      .text(panel.subtitle);

    const geoPane = panelG
      .append("g")
      .attr("class", "map-geo-pane")
      .attr(
        "transform",
        `translate(0,${GEO_CMP_PANEL_TITLE_DY + GEO_CMP_PANEL_SUBTITLE_DY + GEOGRAPHY_VERTICAL_OFFSET_PX})`
      );

    const flowWeights = panel.emphasis === "source" ? sourceOutflow : destInflow;
    const primaryRadiusScale =
      panel.emphasis === "source" ? sourceRadiusScale : destRadiusScale;
    const panelStyle = styleForGeographyComparison(panel.emphasis, primaryRadiusScale);

    drawMapLayers(geoPane, {
      statesTopo,
      path,
      puertoRicoInset: prInset,
      placedLinks,
      strokeScale: sharedStrokeScale,
      style: panelStyle,
      placedNodes,
      edgeMode: "all",
      layerOptions: {
        insetFrameMetrics: insetFrameMetricsForGeo(panelInnerW, geoFitHeightPx),
        drawFlows: true,
        nodeEmphasis: panel.emphasis,
        flowWeights,
        showInsetFrames: true,
        showPrLabel: idx === GEOGRAPHY_COMPARISON_PANELS.length - 1,
        showNodes: false,
        showHubs: false,
        showLinkTooltips: false,
      },
    });
  });

  renderAuditPanel({
    edgeMode: "all",
    organConfig: { ...organConfig, iteration: "03-geo" },
    d2tFlowCoverageMetrics:
      pctCoordinateEligible != null
        ? {
            pctCoordinateEligible,
            coverageTotalFlow,
            coordinateEligibleFlow,
            coverageLabel: organConfig.coverageLabel,
          }
        : null,
    projectionOnlyWithheldFlow,
    coverageTotalFlow,
    geographyComparison: true,
  });
}

function computeDotMapVolumePanelSize() {
  return computeDualPanelLayoutSize({
    svgWidth: DOT_VOL_SVG_WIDTH,
    svgHeight: DOT_VOL_SVG_HEIGHT,
    margin: DOT_VOL_MARGIN,
    gap: DOT_VOL_GAP,
    cols: DOT_VOL_COLS,
    panelTitleDy: DOT_VOL_PANEL_TITLE_DY,
    panelSubtitleDy: DOT_VOL_PANEL_SUBTITLE_DY,
  });
}

function buildVolumeLookup(rows, idField, volumeField) {
  const lookup = new Map();
  rows.forEach((row) => {
    const id = String(row[idField] ?? "").trim();
    const volume = Number(row[volumeField]);
    if (!id || !Number.isFinite(volume) || volume <= 0) return;
    lookup.set(id, volume);
  });
  return lookup;
}

function buildRadiusScaleForVolumes(volumeById, placedNodes, nodeType, radiusRange = DOT_VOL_RADIUS_RANGE) {
  const volumes = [];
  placedNodes.forEach((n) => {
    if (n.type !== nodeType) return;
    const v = volumeById.get(String(n.id).trim());
    if (v > 0) volumes.push(v);
  });
  if (!volumes.length) {
    return () => radiusRange[0];
  }
  return buildStrokeScale(volumes, radiusRange, d3.extent(volumes));
}

async function initDotMapVolume() {
  const { panelInnerW, panelInnerH } = computeDotMapVolumePanelSize();
  const geoFitHeightPx = panelInnerH - DOT_VOL_FOOTNOTE_STRIP - GEOGRAPHY_VERTICAL_OFFSET_PX;

  document.title = "Transplant System Sites — Volume by Geography";
  d3.select("#chart-title").text("Transplant System Sites");
  d3.select(".subtitle").text(
    "Donor recovery and transplant center geography with bubble area scaled to total activity volume (all organs, 2025)."
  );
  d3.select("body").attr(
    "class",
    ["layout-dot-map-volume", "iteration-05-volume", "palette-dot-map-volume"].join(" ")
  );
  d3.select(".viz-card").attr("data-iteration", "05-volume");
  d3.select("#audit-panel").style("display", "none");

  const [nodes, statesTopo, sourceSummary, destinationSummary] = await Promise.all([
    d3.csv(DATA.nodes, d3.autoType),
    d3.json(DATA.states),
    d3.csv(DATA.sourceSummary, d3.autoType),
    d3.csv(DATA.destinationSummary, d3.autoType),
  ]);

  const sourceVolumeById = buildVolumeLookup(sourceSummary, "source_dsa_id", "total_outflow");
  const destinationVolumeById = buildVolumeLookup(
    destinationSummary,
    "destination_center_id",
    "total_inflow"
  );

  const projection = d3
    .geoAlbersUsa()
    .fitSize([panelInnerW, geoFitHeightPx], geoFeatureCollection(statesTopo));
  const path = d3.geoPath(projection);
  const prInset = buildPuertoRicoInset({
    statesTopo,
    innerW: panelInnerW,
    innerH: geoFitHeightPx,
    boxConfig: scalePrInsetBox(panelInnerW, geoFitHeightPx),
    quiet: true,
  });

  assignPositionsWithPuertoRicoOverlay(nodes, projection, panelInnerW, geoFitHeightPx, prInset);
  const placedNodes = nodes.filter(
    (n) => Number.isFinite(n.px) && !n.projectionFailureFallback
  );

  const donorRadiusScale = buildRadiusScaleForVolumes(
    sourceVolumeById,
    placedNodes,
    "source_dsa"
  );
  const transplantRadiusScale = buildRadiusScaleForVolumes(
    destinationVolumeById,
    placedNodes,
    "transplant_center"
  );

  const donorPlaced = placedNodes.filter(
    (n) => n.type === "source_dsa" && (sourceVolumeById.get(String(n.id).trim()) ?? 0) > 0
  ).length;
  const transplantPlaced = placedNodes.filter(
    (n) =>
      n.type === "transplant_center" && (destinationVolumeById.get(String(n.id).trim()) ?? 0) > 0
  ).length;

  console.log("[dot map volume] donor bubbles:", donorPlaced, "| transplant bubbles:", transplantPlaced);

  d3.select(".viz-notes").attr("hidden", true);
  renderDotMapVolumeFooter();
  renderDotMapVolumeLegend({ donorRadiusScale, transplantRadiusScale });

  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("viewBox", [0, 0, DOT_VOL_SVG_WIDTH, DOT_VOL_SVG_HEIGHT])
    .attr("role", "img")
    .attr("class", "map-svg map-svg--dot-map-volume");

  const root = svg
    .append("g")
    .attr("transform", `translate(${DOT_VOL_MARGIN.left},${DOT_VOL_MARGIN.top})`);

  DOT_MAP_VOLUME_PANELS.forEach((panel, idx) => {
    const originX = idx * (panelInnerW + DOT_VOL_GAP);
    const volumeById = panel.nodeType === "source_dsa" ? sourceVolumeById : destinationVolumeById;
    const radiusScale =
      panel.nodeType === "source_dsa" ? donorRadiusScale : transplantRadiusScale;
    const roleClass = panel.nodeType === "source_dsa" ? "donor" : "transplant";

    const panelG = root
      .append("g")
      .attr("class", `dot-map-volume-panel dot-map-volume-panel--${panel.slug}`)
      .attr("transform", `translate(${originX},0)`);

    panelG
      .append("text")
      .attr("class", "dot-map-volume-panel-title")
      .attr("x", 0)
      .attr("y", 0)
      .attr("alignment-baseline", "hanging")
      .text(panel.title);

    panelG
      .append("text")
      .attr("class", "dot-map-volume-panel-subtitle")
      .attr("x", 0)
      .attr("y", DOT_VOL_PANEL_TITLE_DY)
      .attr("alignment-baseline", "hanging")
      .text(panel.subtitle);

    const geoPane = panelG
      .append("g")
      .attr("class", "map-geo-pane")
      .attr(
        "transform",
        `translate(0,${DOT_VOL_PANEL_TITLE_DY + DOT_VOL_PANEL_SUBTITLE_DY + GEOGRAPHY_VERTICAL_OFFSET_PX})`
      );

    drawMapLayers(geoPane, {
      statesTopo,
      path,
      puertoRicoInset: prInset,
      placedLinks: [],
      strokeScale: () => 0,
      style: {},
      placedNodes,
      edgeMode: "all",
      layerOptions: {
        drawFlows: false,
        dotMapProportional: {
          nodeType: panel.nodeType,
          volumeById,
          radiusScale,
          roleClass,
        },
        insetFrameMetrics: insetFrameMetricsForGeo(panelInnerW, geoFitHeightPx),
        showInsetFrames: true,
        showPrLabel: idx === DOT_MAP_VOLUME_PANELS.length - 1,
        showNodes: false,
        showHubs: false,
        showLinkTooltips: false,
      },
    });
  });
}

async function initDotMap() {
  const innerW = MAP_WIDTH - MARGIN.left - MARGIN.right;
  const innerH = MAP_HEIGHT - MARGIN.top - MARGIN.bottom;
  const geoPlotBottomY = innerH - MAP_FOOTNOTE_STRIP_HEIGHT;
  const geoFitHeightPx = geoPlotBottomY - GEOGRAPHY_VERTICAL_OFFSET_PX;

  document.title = "Transplant System Sites — OPTN 2025";
  d3.select("#chart-title").text("Transplant System Sites");
  d3.select(".subtitle").text(
    "Geocoded donor recovery organizations and transplant centers in the 2025 national network."
  );
  d3.select("body").attr(
    "class",
    ["layout-dot-map", "iteration-04-dots", "palette-dot-map"].join(" ")
  );
  d3.select(".viz-card").attr("data-iteration", "04-dots");
  d3.select("#audit-panel").style("display", "none");

  const coverageEdgePath = ORGAN_MODES.all.edgesEnriched;
  const [nodes, statesTopo, coverageEdges] = await Promise.all([
    d3.csv(DATA.nodes, d3.autoType),
    d3.json(DATA.states),
    d3.csv(coverageEdgePath, d3.autoType),
  ]);

  const projection = d3
    .geoAlbersUsa()
    .fitSize([innerW, geoFitHeightPx], geoFeatureCollection(statesTopo));
  const path = d3.geoPath(projection);
  const prInset = buildPuertoRicoInset({
    statesTopo,
    innerW,
    innerH: geoFitHeightPx,
  });

  assignPositionsWithPuertoRicoOverlay(nodes, projection, innerW, geoFitHeightPx, prInset);
  const placedNodes = nodes.filter(
    (n) => Number.isFinite(n.px) && !n.projectionFailureFallback
  );

  const geocodedCount = placedNodes.length;
  const totalNetworkSites = nodes.length;

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  let coverageTotalFlow = 0;
  let coordinateEligibleFlow = 0;
  coverageEdges.forEach((e) => {
    const flowCount = Number(e.flow_count);
    if (!Number.isFinite(flowCount)) return;
    coverageTotalFlow += flowCount;
    const src = nodeById.get(String(e.source_dsa_id ?? "").trim());
    const tgt = nodeById.get(String(e.destination_center_id ?? "").trim());
    if (workbookRowHasParsableCoordinates(src) && workbookRowHasParsableCoordinates(tgt)) {
      coordinateEligibleFlow += flowCount;
    }
  });
  const flowCoveragePct =
    coverageTotalFlow > 0 ? (coordinateEligibleFlow / coverageTotalFlow) * 100 : null;

  console.log("[dot map] geocoded sites placed:", geocodedCount);
  if (flowCoveragePct != null) {
    console.log("[dot map] flow coverage (geocoded endpoints):", `${flowCoveragePct.toFixed(1)}%`);
  }

  renderDotMapFooter({
    geocodedCount,
    totalNetworkSites,
    flowCoveragePct,
  });
  renderDotMapLegend();

  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("viewBox", [0, 0, MAP_WIDTH, MAP_HEIGHT])
    .attr("role", "img")
    .attr("class", "map-svg map-svg--dot-map");

  const g = svg.append("g").attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

  const geoPane = g
    .append("g")
    .attr("class", "map-geo-pane")
    .attr("transform", `translate(0,${GEOGRAPHY_VERTICAL_OFFSET_PX})`);

  drawMapLayers(geoPane, {
    statesTopo,
    path,
    puertoRicoInset: prInset,
    placedLinks: [],
    strokeScale: () => 0,
    style: {},
    placedNodes,
    edgeMode: "all",
    layerOptions: {
      drawFlows: false,
      dotMapBoth: true,
      dotRadius: DOT_MAP_DOT_RADIUS,
      insetFrameMetrics: insetFrameMetricsForGeo(innerW, geoFitHeightPx),
      showInsetFrames: true,
      showPrLabel: true,
      showNodes: false,
      showHubs: false,
      showLinkTooltips: false,
    },
  });
}

async function init() {
  hideAuditNotesPanel();

  if (LAYOUT_MODE === "small_multiples") {
    return initSmallMultiples();
  }
  if (LAYOUT_MODE === "geography_comparison") {
    return initGeographyComparison();
  }
  if (LAYOUT_MODE === "dot_map") {
    return initDotMap();
  }
  if (LAYOUT_MODE === "dot_map_volume") {
    return initDotMapVolume();
  }

  const organConfig = resolveOrganConfig();
  const modeConfig = EDGE_MODES[EDGE_MODE];
  if (!modeConfig) {
    throw new Error(
      `Unknown EDGE_MODE "${EDGE_MODE}". Use: all, ge_200, ge_100, ge_50, ge_25, top50`
    );
  }

  const edgePath = edgeFileForMode(modeConfig, organConfig);
  const coverageEdgePath = organConfig.edgesEnriched;

  console.log("Organ mode:", ORGAN_MODE);
  console.log("Edge mode:", EDGE_MODE, `(iteration ${organConfig.iteration})`);
  console.log("Edge file:", edgePath);
  console.log("  resolved:", new URL(edgePath, window.location.href).href);

  document.title = organConfig.documentTitle;
  d3.select("#chart-title").text(organConfig.chartTitle);
  d3.select(".subtitle").text(organConfig.chartSubtitle);
  const displayIteration = SHOW_DESTINATION_HUBS ? "hub" : organConfig.iteration;
  d3.select("body").attr(
    "class",
    [
      "layout-single",
      `organ-mode-${ORGAN_MODE}`,
      `edge-mode-${EDGE_MODE}`,
      `iteration-${displayIteration}`,
      SHOW_DESTINATION_HUBS ? "destination-hubs-on" : "",
    ]
      .filter(Boolean)
      .join(" ")
  );
  d3.select(".viz-card").attr("data-iteration", displayIteration);
  if (SHOW_DESTINATION_HUBS) {
    console.log("Destination hubs: ON (single-map hub experiment)");
  }

  const [rawEdges, coverageEdges, nodes, statesTopo] = await Promise.all([
    d3.csv(edgePath, d3.autoType),
    d3.csv(coverageEdgePath, d3.autoType),
    d3.csv(DATA.nodes, d3.autoType),
    d3.json(DATA.states),
  ]);

  console.log("Using full node coordinate dataset");
  console.log(
    `[map metrics] View edge file (${ORGAN_MODE}/${EDGE_MODE}) rows:`,
    rawEdges.length,
    "| Coverage list rows:",
    coverageEdges.length
  );
  console.log("Nodes loaded:", nodes.length);

  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  /** Denominator/numerator aligned with scripts/check_coordinate_coverage.py (`d2t_edges_all_organs_enriched.csv`). */
  let coverageTotalFlow = 0;
  let coordinateEligibleFlow = 0;
  coverageEdges.forEach((e) => {
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

  console.log(
    `[map metrics] Total flow (${organConfig.coverageLabel} denominator):`,
    coverageTotalFlow
  );
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
    organConfig,
    modeConfig,
    d2tFlowCoverageMetrics:
      pctCoordinateEligible != null && EDGE_MODE !== "top50"
        ? {
            pctCoordinateEligible,
            coverageTotalFlow,
            coordinateEligibleFlow,
            coverageLabel: organConfig.coverageLabel,
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
  organConfig,
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
    const crossesPr =
      Boolean(l.source.prInsetAnchored) !== Boolean(l.target.prInsetAnchored);
    if (crossesPr && !puertoRicoInset) {
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
  logOrganRunSummary({
    organMode: ORGAN_MODE,
    totalFlow: coverageTotalFlow,
    renderedFlow: drawnFlowSum,
    edgeCount: placedLinks.length,
  });
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

  drawMapLayers(geoPane, {
    statesTopo,
    path,
    puertoRicoInset,
    placedLinks,
    strokeScale,
    style,
    placedNodes,
    edgeMode,
    layerOptions: {
      insetFrameMetrics: insetFrameMetricsForGeo(innerW, geoFitHeightPx),
      showInsetFrames: true,
      showPrLabel: true,
      showNodes: style.showNodes && !SHOW_DESTINATION_HUBS,
      showHubs: SHOW_DESTINATION_HUBS,
      showLinkTooltips: edgeMode !== "all",
    },
  });

  renderLegendPanel({ strokeScale, style, hubInflowExtent: getHubInflowExtent(placedLinks) });
  renderAuditPanel({
    edgeMode,
    organConfig,
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

/** Sum outflow (recovery volume) per donor/OPO source from edges in the current view */
function buildSourceOutflowFromLinks(links) {
  const bySource = new Map();
  links.forEach((l) => {
    const srcId = String(l.source?.id ?? l.sourceId ?? "").trim();
    if (!srcId) return;
    bySource.set(srcId, (bySource.get(srcId) || 0) + (Number(l.flow) || 0));
  });
  return bySource;
}

/** Sum inflow (transplant volume) per destination from edges in the current view */
function buildDestinationInflowFromLinks(links) {
  const byDest = new Map();
  links.forEach((l) => {
    const destId = String(l.target?.id ?? l.targetId ?? "").trim();
    if (!destId) return;
    byDest.set(destId, (byDest.get(destId) || 0) + (Number(l.flow) || 0));
  });
  return byDest;
}

function getHubInflowExtent(links) {
  const inflow = buildDestinationInflowFromLinks(links);
  const values = [...inflow.values()].filter((v) => v > 0);
  if (!values.length) return null;
  return d3.extent(values);
}

function coordLocationKey(node) {
  const lat = Number.parseFloat(String(node.lat ?? "").trim());
  const lon = Number.parseFloat(String(node.lon ?? "").trim());
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return `${lat.toFixed(DUAL_ROLE_COORD_DECIMALS)}|${lon.toFixed(DUAL_ROLE_COORD_DECIMALS)}`;
}

/**
 * Campuses where both an OPO (source_dsa) and transplant_center share the same geocode.
 * @returns {{ dualNodeIds: Set<string>, dualSites: object[] }}
 */
function buildDualRoleSiteIndex(placedNodes) {
  const byLoc = new Map();
  placedNodes.forEach((n) => {
    const key = coordLocationKey(n);
    if (!key) return;
    if (!byLoc.has(key)) byLoc.set(key, []);
    byLoc.get(key).push(n);
  });

  const dualNodeIds = new Set();
  const dualSites = [];

  byLoc.forEach((group, locationKey) => {
    const types = new Set(group.map((n) => n.type));
    if (!types.has("source_dsa") || !types.has("transplant_center")) return;

    const donors = group.filter((n) => n.type === "source_dsa");
    const transplants = group.filter((n) => n.type === "transplant_center");
    group.forEach((n) => dualNodeIds.add(String(n.id).trim()));

    dualSites.push({
      locationKey,
      px: group[0].px,
      py: group[0].py,
      state: group[0].state,
      donors,
      transplants,
      nodes: group,
    });
  });

  return { dualNodeIds, dualSites };
}

/** Iteration 05 — sqrt-scaled bubbles by total volume (no outlines) */
function drawProportionalDotMapNodes(geoPane, placedNodes, nodeType, volumeById, radiusScale, roleClass) {
  const data = placedNodes
    .filter((n) => n.type === nodeType)
    .map((n) => ({
      node: n,
      volume: volumeById.get(String(n.id).trim()) ?? 0,
    }))
    .filter((d) => d.volume > 0);

  geoPane
    .append("g")
    .attr("class", `dot-map-nodes dot-map-nodes--${roleClass}`)
    .selectAll("circle")
    .data(data)
    .join("circle")
    .attr("class", `dot-node dot-node--${roleClass} dot-node--scaled`)
    .attr("cx", (d) => d.node.px)
    .attr("cy", (d) => d.node.py)
    .attr("r", (d) => radiusScale(d.volume))
    .append("title")
    .text(
      (d) =>
        `${d.node.id}\n${d.node.name}\n${d.node.state}\nVolume: ${d.volume.toLocaleString()} transplants`
    );
}

function hideAuditNotesPanel() {
  d3.select("#audit-notes-panel").attr("hidden", true);
}

function renderDotMapVolumeFooter() {
  d3.select(".viz-source").text("Source: OPTN/UNOS Advanced Reports, 2025.");
  d3.select("#audit-notes-panel").attr("hidden", null);
  d3.select("#audit-notes-panel .audit-notes-panel__body").text(
    "Bubble area reflects total volume from summary tables; positions from geocoded node file. Sqrt-scaled within each map panel. No flow lines. All organs, 2025."
  );
}

const VOLUME_LEGEND_TIER_LABELS = ["Low", "Lower mid", "Upper mid", "High"];

function roundVolumeForLabel(value) {
  if (value >= 1000) return Math.round(value / 50) * 50;
  if (value >= 100) return Math.round(value / 10) * 10;
  return Math.round(value);
}

function formatVolumeCount(value) {
  return d3.format(",")(roundVolumeForLabel(value));
}

function volumeQuantityLabel(value, singular, plural) {
  const n = roundVolumeForLabel(value);
  return `${formatVolumeCount(n)} ${n === 1 ? singular : plural}`;
}

/** Min, two middles, and max — aligned to the panel radius scale domain */
function volumeLegendBreaks(radiusScale) {
  if (typeof radiusScale.domain !== "function") return [];
  const [lo, hi] = radiusScale.domain();
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [];
  if (lo >= hi) {
    const value = roundVolumeForLabel(lo);
    return [{ value, r: radiusScale(value), tier: "High" }];
  }

  const raw = [lo, lo + (hi - lo) / 3, lo + (2 * (hi - lo)) / 3, hi].map(roundVolumeForLabel);
  const values = [...new Set(raw)].sort((a, b) => a - b);
  while (values.length < 4 && values.length > 0) {
    const last = values[values.length - 1];
    const prev = values[values.length - 2] ?? values[0];
    values.push(roundVolumeForLabel(prev + (last - prev) / 2));
    values.sort((a, b) => a - b);
    values.splice(0, values.length, ...[...new Set(values)]);
  }

  return values.slice(0, 4).map((value, i) => ({
    value,
    r: radiusScale(value),
    tier: VOLUME_LEGEND_TIER_LABELS[i] ?? VOLUME_LEGEND_TIER_LABELS.at(-1),
  }));
}

function renderVolumeLegendNestedGroup({ radiusScale, heading, unitNoun, fillClass }) {
  const unit = typeof unitNoun === "string" ? { singular: unitNoun, plural: `${unitNoun}s` } : unitNoun;
  const breaks = volumeLegendBreaks(radiusScale);
  if (!breaks.length) {
    return `<div class="legend-volume-group"><p class="legend-volume-group__heading">${heading}</p><p class="legend-dot-note">No volume data</p></div>`;
  }

  const maxR = d3.max(breaks, (d) => d.r) ?? DOT_VOL_RADIUS_RANGE[1];
  const pad = 3;
  const svgSize = Math.ceil(maxR * 2 + pad * 2);
  const cx = svgSize / 2;
  const cy = svgSize / 2;

  const rings = [...breaks]
    .sort((a, b) => b.r - a.r)
    .map(
      (b) =>
        `<circle class="legend-volume-ring ${fillClass}" cx="${cx}" cy="${cy}" r="${b.r.toFixed(2)}" />`
    )
    .join("");

  const tiers = [...breaks]
    .sort((a, b) => b.value - a.value)
    .map(
      (b) => `
      <li class="legend-volume-tier">
        <span class="legend-volume-tier__name">${b.tier}</span>
        <span class="legend-volume-tier__eq">=</span>
        <span class="legend-volume-tier__value">${volumeQuantityLabel(b.value, unit.singular, unit.plural)}</span>
      </li>`
    )
    .join("");

  return `
    <div class="legend-volume-group">
      <p class="legend-volume-group__heading">${heading}</p>
      <div class="legend-volume-nested">
        <svg class="legend-volume-nested__svg" width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" aria-hidden="true">
          ${rings}
        </svg>
        <ol class="legend-volume-tier-list">${tiers}</ol>
      </div>
    </div>`;
}

function renderDotMapVolumeLegend({ donorRadiusScale, transplantRadiusScale }) {
  const panel = d3.select("#legend-panel");
  panel.style("display", "");
  panel.html(`
    <h2 class="legend-panel__title">Legend</h2>
    <section class="legend-section legend-section--dot-map-volume" aria-label="Map legend">
      <div class="legend-dot-row">
        <span class="legend-dot legend-dot--donor" aria-hidden="true"></span>
        <span class="legend-flow-label legend-flow-label--donor">Donor recovery organization (OPO)</span>
      </div>
      <div class="legend-dot-row">
        <span class="legend-dot legend-dot--transplant" aria-hidden="true"></span>
        <span class="legend-flow-label legend-flow-label--transplant">Transplant center</span>
      </div>
      <p class="legend-volume-heading">Bubble size = total volume</p>
      ${renderVolumeLegendNestedGroup({
        radiusScale: donorRadiusScale,
        heading: "Left panel (donor outflow)",
        unitNoun: { singular: "donation", plural: "donations" },
        fillClass: "legend-volume-ring--donor",
      })}
      ${renderVolumeLegendNestedGroup({
        radiusScale: transplantRadiusScale,
        heading: "Right panel (transplant inflow)",
        unitNoun: { singular: "transplant", plural: "transplants" },
        fillClass: "legend-volume-ring--transplant",
      })}
      <p class="legend-dot-note">Radii use sqrt scale from panel min to max; all organs, 2025.</p>
    </section>
  `);
}

/** Iteration 04 — one node type per panel, no flow arcs */
function drawDotMapNodes(geoPane, placedNodes, nodeType, radius, excludeIds = null) {
  const roleClass = nodeType === "source_dsa" ? "donor" : "transplant";
  const data = placedNodes.filter((n) => {
    if (n.type !== nodeType) return false;
    if (excludeIds?.has(String(n.id).trim())) return false;
    return true;
  });

  geoPane
    .append("g")
    .attr("class", `dot-map-nodes dot-map-nodes--${roleClass}`)
    .selectAll("circle")
    .data(data)
    .join("circle")
    .attr("class", `dot-node dot-node--${roleClass}`)
    .attr("cx", (d) => d.px)
    .attr("cy", (d) => d.py)
    .attr("r", radius)
    .append("title")
    .text((d) => `${d.id}\n${d.name}\n${d.state}`);
}

function dualRoleTooltip(site) {
  const donorLines = site.donors.map((n) => `OPO: ${n.id} — ${n.name}`);
  const txLines = site.transplants.map((n) => `Center: ${n.id} — ${n.name}`);
  return [...donorLines, ...txLines, site.state ?? ""].filter(Boolean).join("\n");
}

function drawDualRoleDotMapNodes(geoPane, dualSites, baseRadius) {
  const radius = baseRadius * 1.12;
  geoPane
    .append("g")
    .attr("class", "dot-map-nodes dot-map-nodes--dual")
    .selectAll("circle")
    .data(dualSites)
    .join("circle")
    .attr("class", "dot-node dot-node--dual")
    .attr("cx", (d) => d.px)
    .attr("cy", (d) => d.py)
    .attr("r", radius)
    .append("title")
    .text((d) => dualRoleTooltip(d));
}

function renderDotMapFooter({ geocodedCount, totalNetworkSites, flowCoveragePct }) {
  d3.select(".viz-source").text("Source: OPTN/UNOS Advanced Reports, 2025.");

  const flowPhrase =
    flowCoveragePct != null
      ? `Geocoded endpoints represent about ${Math.round(flowCoveragePct)}% of 2025 donor-to-transplant flow volume in this dataset.`
      : "";

  const notes = [
    "Notes: Donor recovery (OPO) and transplant center sites with available coordinates.",
    `${geocodedCount} geocoded sites shown of ${totalNetworkSites} in the national network.`,
    flowPhrase,
  ]
    .filter(Boolean)
    .join(" ");

  const notesEl = d3.select(".viz-notes");
  notesEl.text(notes).attr("hidden", null);
}

function renderDotMapLegend() {
  const panel = d3.select("#legend-panel");
  panel.style("display", "");
  panel.html(`
    <h2 class="legend-panel__title">Legend</h2>
    <section class="legend-section legend-section--dot-map" aria-label="Node types">
      <div class="legend-dot-row">
        <span class="legend-dot legend-dot--donor" aria-hidden="true"></span>
        <span class="legend-flow-label legend-flow-label--donor">Donor recovery organization (OPO)</span>
      </div>
      <div class="legend-dot-row">
        <span class="legend-dot legend-dot--transplant" aria-hidden="true"></span>
        <span class="legend-flow-label legend-flow-label--transplant">Transplant center</span>
      </div>
    </section>
  `);
}

/** Iteration 03 — primary endpoint emphasized; opposite endpoint subdued (no hub bubbles) */
function drawEmphasisNodes(geoPane, placedNodes, emphasis, style, flowWeights) {
  const sources = placedNodes.filter((n) => n.type === "source_dsa");
  const destinations = placedNodes.filter((n) => n.type === "transplant_center");
  const primaryNodes = emphasis === "source" ? sources : destinations;
  const secondaryNodes = emphasis === "source" ? destinations : sources;
  const primaryClass = emphasis === "source" ? "source" : "destination";
  const secondaryClass = emphasis === "source" ? "destination" : "source";
  const radiusScale = style.primaryRadiusScale ?? (() => style.primaryRadiusMin);

  const nodeG = geoPane.append("g").attr("class", `nodes nodes--geo-cmp-${emphasis}`);

  nodeG
    .selectAll(`circle.node--muted-${secondaryClass}`)
    .data(secondaryNodes)
    .join("circle")
    .attr("class", `node node--muted node--${secondaryClass}`)
    .attr("cx", (d) => d.px)
    .attr("cy", (d) => d.py)
    .attr("r", style.secondaryRadius)
    .attr("fill-opacity", style.secondaryOpacity)
    .append("title")
    .text((d) => `${d.id}\n${d.name}\n${d.state}`);

  nodeG
    .selectAll(`circle.node--primary-${primaryClass}`)
    .data(primaryNodes)
    .join("circle")
    .attr("class", `node node--primary node--${primaryClass}`)
    .attr("cx", (d) => d.px)
    .attr("cy", (d) => d.py)
    .attr("r", (d) => {
      const w = flowWeights.get(String(d.id).trim()) || 0;
      return w > 0 ? radiusScale(w) : style.primaryRadiusMin;
    })
    .attr("fill-opacity", style.primaryOpacity)
    .append("title")
    .text((d) => {
      const w = flowWeights.get(String(d.id).trim()) || 0;
      return `${d.id}\n${d.name}\n${d.state}\nVolume: ${w.toLocaleString()}`;
    });
}

function drawDestinationHubs(geoPane, placedNodes, placedLinks, options = {}) {
  const {
    radiusScale = null,
    radiusRange = HUB_RADIUS_RANGE,
    fillOpacity = 0.4,
    quiet = false,
  } = options;

  const inflowByDest = buildDestinationInflowFromLinks(placedLinks);
  const hubData = placedNodes
    .filter((n) => n.type === "transplant_center")
    .map((n) => ({
      node: n,
      id: n.id,
      name: n.name,
      state: n.state,
      px: n.px,
      py: n.py,
      inflow: inflowByDest.get(String(n.id).trim()) || 0,
    }))
    .filter((d) => d.inflow > 0);

  const inflows = hubData.map((d) => d.inflow);
  const hubRadius =
    radiusScale ?? buildStrokeScale(inflows, radiusRange);

  geoPane
    .append("g")
    .attr("class", "destination-hubs")
    .selectAll("circle")
    .data(hubData)
    .join("circle")
    .attr("class", "hub")
    .attr("cx", (d) => d.px)
    .attr("cy", (d) => d.py)
    .attr("r", (d) => hubRadius(d.inflow))
    .attr("fill-opacity", fillOpacity)
    .append("title")
    .text(
      (d) => `${d.id}\n${d.name}\n${d.state}\n${d.inflow.toLocaleString()} transplants (inflow)`
    );

  if (!quiet) {
    console.log(
      "[destination hubs] centers drawn:",
      hubData.length,
      "| inflow range:",
      inflows.length ? d3.extent(inflows) : "n/a"
    );
  }
}

/** Legend sample strokes — higher contrast than map circulation field */
const LEGEND_LINE_STYLES = {
  high: { color: "#2f5f6e", opacity: 1 },
  mid: { color: "#3d6d7d", opacity: 0.88 },
  low: { color: "#5a8494", opacity: 0.72 },
};

function renderLegendPanel({ strokeScale, style, hubInflowExtent }) {
  const legend = d3.select("#legend-panel");
  legend
    .select(".legend-section--flows")
    .style("display", style.showFlowLegend ? null : "none");

  const hubSection = legend.select(".legend-section--hubs");
  hubSection.style("display", SHOW_DESTINATION_HUBS ? null : "none");

  if (SHOW_DESTINATION_HUBS && hubInflowExtent) {
    const [lo, hi] = hubInflowExtent;
    const hubLegendRadius = buildStrokeScale([lo, hi], HUB_RADIUS_RANGE);
    d3.select(".legend-hub--low").attr("r", hubLegendRadius(lo));
    d3.select(".legend-hub--high").attr("r", hubLegendRadius(hi));
  }

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
  organConfig,
  d2tFlowCoverageMetrics,
  projectionOnlyWithheldFlow,
  coverageTotalFlow,
  geographyComparison = false,
}) {
  const notes = [];

  notes.push(
    `Iteration ${organConfig.iteration} · ORGAN_MODE=${ORGAN_MODE} · EDGE_MODE=${edgeMode}`
  );

  if (geographyComparison) {
    notes.push(
      "Layout: side-by-side donor recovery (left) vs transplant center (right); shared projection, flow scale, and edge file."
    );
    notes.push(
      "Encoding: subtle circulation field; node opacity and sqrt-scaled size emphasize the active endpoint per panel (no hub bubbles)."
    );
  }

  if (d2tFlowCoverageMetrics != null && edgeMode !== "top50") {
    const pct = d2tFlowCoverageMetrics.pctCoordinateEligible;
    const label = d2tFlowCoverageMetrics.coverageLabel ?? organConfig.coverageLabel;
    notes.push(
      `Coverage: Rendered flows represent ${pct.toFixed(1)}% of transplant volume in the ${label}.`
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
  if (!geographyComparison) {
    notes.push("Line opacity on map encodes density of flows in full-network view.");
  }

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
