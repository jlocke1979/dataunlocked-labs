import { organColorBySlug, storyColors } from "../../constants/colors.js";
import { typography } from "../../constants/typography.js";
import {
  ALL_ORGANS_LABEL,
  applyType,
  createStage,
  HEADER_BAND_HEIGHT,
  HEADER_GRID,
  HEADER_TOP_VH,
  initSceneLayout,
  mountSceneGuidePanel,
  renderHighlightedOrganTitle,
  renderPlaceholder,
  STAGE
} from "./show_helpers.js";

// Must match SCENE4_NAV_MESSAGE_SOURCE in js/main.js (not imported — avoids circular deps).
const SCENE4_NAV_MESSAGE_SOURCE = "life-flow-scene4";

const SCENE4_ARROW_TO_DIRECTION = {
  ArrowRight: "right",
  ArrowLeft: "left",
  ArrowDown: "down",
  ArrowUp: "up"
};

// Reuse the existing Assignment 05 spatial app verbatim via an iframe so the
// final show populates without porting its ~3,400-line renderer.
const APP_BASE = "../assignments/assignment_05_spatial/app/index.html";
const NODES_CSV = new URL(
  "../assignments/assignment_05_spatial/data/processed/all_nodes_with_coordinates.csv",
  window.location.href
).href;

/** Vertical organ stack — parent show owns navigation; map uses organ color per slug. */
const MAP_ORGAN_DETAILS = [
  { slug: "kidney", label: "Kidney" },
  { slug: "liver", label: "Liver" },
  { slug: "heart", label: "Heart" },
  { slug: "lung", label: "Lung" },
  { slug: "pancreas", label: "Pancreas" }
];

const MAP_GUIDE = {
  all: {
    step: "1 / 6",
    body: "Centers cluster in major metros; dot size = volume on a shared scale."
  },
  kidney: {
    step: "2 / 6",
    body: "Kidney centers spread widely; highest volumes in large cities."
  },
  liver: {
    step: "3 / 6",
    body: "Liver programs cluster on the coasts and in Texas."
  },
  heart: {
    step: "4 / 6",
    body: "Fewer heart centers; more regionally concentrated."
  },
  lung: {
    step: "5 / 6",
    body: "Lung programs are sparse outside academic hubs."
  },
  pancreas: {
    step: "6 / 6",
    body: "Pancreas centers are limited to specialized programs."
  }
};

/** Stable embed URL — organ swaps use postMessage, not iframe reload. */
function geographyMapSrc() {
  const params = new URLSearchParams({
    layout: "dot_map_volume_unified",
    organ: "all",
    site: "transplant",
    embed: "show"
  });
  return new URL(`${APP_BASE}?${params}`, window.location.href).href;
}

function organDetailLabel(slug) {
  return MAP_ORGAN_DETAILS.find((d) => d.slug === slug)?.label ?? null;
}

function mapOrganLabel(organ) {
  return organ === "all" ? ALL_ORGANS_LABEL : organDetailLabel(organ);
}

function mapSubtitle(organ) {
  const label = mapOrganLabel(organ);
  return `Transplant center volume represented, ${label} 2025.`;
}

function mapTitleParts(organ) {
  const label = mapOrganLabel(organ);
  return {
    classPrefix: "scene4",
    prefix: "Where",
    prefixGap: 6,
    label,
    suffix: " transplants take place",
    organColor:
      organ === "all" ? storyColors.charcoalForest : organColorBySlug(organ),
    boxStroke: organ === "all" ? storyColors.charcoalForest : null
  };
}

function renderScene4HeaderLine(svg, className, y, parts, typeStyle, x) {
  svg.select(`.${className}`).remove();
  const line = applyType(
    svg
      .append("text")
      .attr("class", className)
      .attr("x", x)
      .attr("y", y),
    typeStyle
  );
  parts.forEach((part, index) => {
    line
      .append("tspan")
      .attr("x", index === 0 ? x : null)
      .attr("fill", part.fill)
      .text(part.text);
  });
}

function applyScene4OrganHeader(svg, { sceneLabel, subtitle, organ = "all" }) {
  const subtitleText = subtitle ?? mapSubtitle(organ);

  svg.select(".scene4-organ-swatch").remove();
  svg.select(".scene4-header-title-group").remove();
  svg.select(".scene4-header-title-prefix").remove();
  svg.select(".scene4-header-title-suffix").remove();
  svg.select(".scene4-header-title").remove();
  svg.select(".scene4-header-subtitle").remove();
  svg.select(".scene4-header-eyebrow").remove();

  renderHighlightedOrganTitle(svg, mapTitleParts(organ));

  renderScene4HeaderLine(
    svg,
    "scene4-header-subtitle",
    HEADER_GRID.subtitleY,
    [{ text: subtitleText, fill: storyColors.textSecondary }],
    typography.sceneTitle,
    STAGE.marginX
  );
}

function updateScene4Header(container, { sceneLabel, subtitle, organ }) {
  const svg = container.select("svg");
  if (svg.empty()) return;
  applyScene4OrganHeader(svg, { sceneLabel, subtitle, organ });
  const mapHost = container.select(".scene4-map-host");
  if (!mapHost.empty()) {
    mountSceneGuidePanel(mapHost, {
      panelClass: "map-guide-panel",
      guide: MAP_GUIDE[organ] ?? MAP_GUIDE.all
    });
  }
}

function postOrganToIframe(iframeNode, organ) {
  if (!iframeNode?.contentWindow) return;
  iframeNode.contentWindow.postMessage(
    { source: SCENE4_NAV_MESSAGE_SOURCE, type: "setOrgan", organ },
    window.location.origin
  );
}

function requestScene4Organ(container, organ) {
  const iframe = container.select(".scene4-map-host iframe").node();
  if (!iframe) return;
  iframe.dataset.organ = organ;
  if (iframe.contentDocument?.readyState === "complete" && iframe.contentWindow) {
    postOrganToIframe(iframe, organ);
    return;
  }
  iframe.addEventListener(
    "load",
    () => postOrganToIframe(iframe, organ),
    { once: true }
  );
}

/** Swap organ data in-place when paging ↓/↑ between detail steps (avoids iframe reload). */
function updateScene4Map(container, { sceneLabel, subtitle, organ = "all" }) {
  if (container.select(".scene4-map-host").empty()) {
    mountScene4Map(container, { sceneLabel, subtitle, organ });
    return;
  }
  updateScene4Header(container, { sceneLabel, subtitle, organ });
  requestScene4Organ(container, organ);
}

// Header band ends just below the divider (shared with all chart scenes via show_helpers).
const HEADER_VIEW_HEIGHT = HEADER_BAND_HEIGHT;
const MAP_HOST_LIFT = "0";
// Between -0.65in (gap) and -1.85in (Michigan overshoot); -0.6in shows WA/upper-left.
const CHART_MAP_LIFT = "-0.6in";
// Pin legend to iframe viewport so scroll + header z-index cannot clip it.
const LEGEND_FIXED_TOP = "0.5rem";
const LEGEND_FIXED_RIGHT = "1.5%";
// Map uses zoom 0.88; bump legend so type/controls feel proportional.
const LEGEND_ZOOM = 1.12;
const LEGEND_COLUMN_WIDTH = "172px";
const LEGEND_RESERVED_WIDTH = "200px";
// Keep audit box clear of final-show compass nav (fixed bottom-right).
const AUDIT_CLEAR_NAV_RIGHT = "2in";
// Match drawHeader / drawSource x = STAGE.marginX on the 1280px stage grid.
const STAGE_MARGIN_PCT = (STAGE.marginX / STAGE.width) * 100;

function mountScene4Map(container, { sceneLabel, subtitle, organ = "all" }) {
  container.selectAll("*").remove();
  initSceneLayout(container);

  if (organ === "all") {
    d3.csv(NODES_CSV)
      .then(rows => {
        console.log("[Scene 4] map node data loaded:", NODES_CSV);
        console.log("[Scene 4] row count:", rows.length);
        console.log("[Scene 4] first row:", rows[0]);
      })
      .catch(err => {
        console.warn("[Scene 4] node data could not be loaded for logging:", err);
      });
  }

  const svg = createStage(container);
  applyScene4OrganHeader(svg, { sceneLabel, subtitle, organ });
  svg
    .append("line")
    .attr("class", "scene4-header-divider")
    .attr("x1", STAGE.marginX)
    .attr("x2", STAGE.width - STAGE.marginX)
    .attr("y1", HEADER_GRID.dividerY)
    .attr("y2", HEADER_GRID.dividerY)
    .attr("stroke", storyColors.weatheredBrass)
    .attr("stroke-width", 1);
  // Header band only: absolute + height 100% collapsed #viz (no in-flow child) and
  // default meet centering clipped the top of the full 720 viewBox in a short box.
  svg
    .attr("viewBox", `0 0 ${STAGE.width} ${HEADER_VIEW_HEIGHT}`)
    .attr("preserveAspectRatio", "xMinYMin meet")
    .style("flex", "0 0 auto")
    .style("width", "100%")
    .style("height", `${HEADER_TOP_VH}vh`)
    .style("pointer-events", "none");
  svg.select("rect").attr("height", HEADER_VIEW_HEIGHT);

  const mapHost = container
    .append("div")
    .attr("class", "scene4-map-host")
    .style("position", "relative")
    .style("flex", "1 1 auto")
    .style("min-height", "0")
    .style("width", "100%")
    .style("margin-top", MAP_HOST_LIFT)
    .style("overflow", "hidden");

  mountSceneGuidePanel(mapHost, {
    panelClass: "map-guide-panel",
    guide: MAP_GUIDE[organ] ?? MAP_GUIDE.all
  });

  const iframe = mapHost
    .append("iframe")
    .attr("src", geographyMapSrc())
    .attr("data-organ", organ)
    .attr("title", "Transplant geography prototype")
    .attr("scrolling", "yes")
    .style("position", "absolute")
    .style("top", "0")
    .style("left", "0")
    .style("width", "100%")
    .style("height", "100%")
    .style("border", "none")
    .style("border-radius", "0")
    .style("background", storyColors.museumWhite)
    .style("opacity", "0")
    .style("visibility", "hidden");

  iframe.on("load", function () {
    const iframeOrgan = this.dataset.organ ?? organ;
    console.log("[Scene 4] map prototype iframe loaded:", geographyMapSrc());
    // Final-show owns the scene title above the iframe; hide the embedded app's
    // duplicate header and card chrome so only one title block remains.
    try {
      const doc = this.contentDocument;
      if (!doc) return;
      const embedStyle = doc.createElement("style");
      embedStyle.textContent = `
        .header { display: none !important; }
        .site-type-picker,
        .organ-volume-picker { display: none !important; }
        html,
        body,
        body.layout-dot-map-volume,
        body.layout-dot-map-volume-singles,
        body.layout-dot-map-volume-unified {
          background: ${storyColors.museumWhite} !important;
          overflow-y: auto !important;
          height: auto !important;
          min-height: 100%;
        }
        .page,
        .viz-card {
          padding-top: 0 !important;
          margin-top: 0 !important;
        }
        .page {
          padding: 0 !important;
          padding-left: ${STAGE_MARGIN_PCT}% !important;
          padding-right: 1.5% !important;
          padding-bottom: 0.75in !important;
          max-width: none !important;
          margin: 0 !important;
          box-sizing: border-box !important;
        }
        /* Zoom on map only — zoom on .viz-card breaks position:sticky/fixed for legend. */
        .viz-card {
          zoom: 1;
          transform: none !important;
          margin-top: 0 !important;
        }
        .dot-map-volume-panel-subtitle-wrap,
        .dot-map-volume-panel-subtitle {
          display: none !important;
        }
        .page,
        .viz-card,
        .viz-layout,
        .chart-map,
        #chart {
          background: transparent !important;
        }
        .viz-card,
        .viz-layout {
          overflow: visible !important;
        }
        .viz-layout {
          align-items: flex-start !important;
          padding-right: calc(${LEGEND_RESERVED_WIDTH} + 0.75rem) !important;
          box-sizing: border-box !important;
        }
        body[data-embed-organ] .chart-map {
          zoom: 0.88 !important;
        }
        .chart-map {
          overflow: visible !important;
          position: relative;
          z-index: 1;
          min-width: 0 !important;
          flex: 1 1 auto !important;
          margin-top: ${CHART_MAP_LIFT} !important;
          padding-top: 0 !important;
        }
        body.layout-dot-map-volume.palette-dot-map-volume .viz-card,
        body.layout-dot-map-volume-singles.palette-dot-map-volume .viz-card,
        body.layout-dot-map-volume-unified.palette-dot-map-volume .viz-card {
          border: none !important;
          box-shadow: none !important;
          background: transparent !important;
        }
        body.layout-dot-map-volume.palette-dot-map-volume .chart-map,
        body.layout-dot-map-volume-singles.palette-dot-map-volume .chart-map,
        body.layout-dot-map-volume-unified.palette-dot-map-volume .chart-map,
        body[class*="layout-dot-map-volume"] .chart-map {
          background: transparent !important;
        }
        .chart-map svg,
        .chart-map svg.map-svg {
          background: transparent !important;
        }
        .chart-map svg > rect.map-bg {
          fill: transparent !important;
        }
        .viz-source,
        body.layout-dot-map-volume.palette-dot-map-volume .viz-source,
        body.layout-dot-map-volume-singles.palette-dot-map-volume .viz-source,
        body.layout-dot-map-volume-unified.palette-dot-map-volume .viz-source {
          background: transparent !important;
          border: none !important;
          border-top: none !important;
          padding-left: 0 !important;
          padding-right: 0 !important;
          margin-left: 0 !important;
          text-align: left !important;
        }
        .legend-panel,
        body.layout-dot-map-volume.palette-dot-map-volume .legend-panel,
        body.layout-dot-map-volume-singles.palette-dot-map-volume .legend-panel,
        body.layout-dot-map-volume-unified.palette-dot-map-volume .legend-panel,
        body[class*="layout-dot-map-volume"] .legend-panel {
          position: fixed !important;
          top: ${LEGEND_FIXED_TOP} !important;
          right: ${LEGEND_FIXED_RIGHT} !important;
          left: auto !important;
          margin: 0 !important;
          zoom: ${LEGEND_ZOOM} !important;
          width: ${LEGEND_COLUMN_WIDTH} !important;
          min-width: ${LEGEND_COLUMN_WIDTH} !important;
          max-width: 220px !important;
          z-index: 100 !important;
          overflow: visible !important;
          flex: none !important;
          padding-top: 0.5rem !important;
          padding-bottom: 0.5rem !important;
          background: ${storyColors.museumWhite} !important;
          border: none !important;
          border-left: none !important;
          border-top: none !important;
          box-shadow: none !important;
        }
        body[class*="layout-dot-map-volume"] .legend-panel__title,
        body[class*="layout-dot-map-volume"] .legend-section--flows,
        body[class*="layout-dot-map-volume"] .legend-section--hubs,
        body[class*="layout-dot-map-volume"] .legend-dot-row,
        body[class*="layout-dot-map-volume"] .legend-flow-label {
          display: none !important;
        }
        body[class*="layout-dot-map-volume"] .legend-volume-scale {
          margin-top: 0 !important;
        }
        body[class*="layout-dot-map-volume"] .legend-volume-scale__heading {
          text-align: center !important;
          box-sizing: border-box !important;
        }
        body[class*="layout-dot-map-volume"] .legend-volume-scale__count {
          text-anchor: middle !important;
        }
        body[class*="layout-dot-map-volume"] .legend-section__heading,
        body[class*="layout-dot-map-volume"] .organ-volume-picker__heading,
        body[class*="layout-dot-map-volume"] .legend-flow-label,
        body[class*="layout-dot-map-volume"] .organ-volume-chip,
        body[class*="layout-dot-map-volume"] .site-type-picker button,
        body[class*="layout-dot-map-volume"] .legend-section--dot-map-volume .legend-dot-note {
          font-size: 10.5px !important;
        }
        body[class*="layout-dot-map-volume"] .organ-volume-chip__swatch {
          width: 10px !important;
          height: 10px !important;
        }
        .legend-section--dot-map-volume {
          margin-top: 0 !important;
          padding-top: 0 !important;
          overflow: visible !important;
        }
        .legend-section--dot-map-volume .legend-dot-row {
          margin-top: 0 !important;
          padding-top: 0 !important;
        }
        .legend-flow-label {
          line-height: 1.35 !important;
        }
        #audit-notes-panel:not([hidden]),
        body.layout-dot-map-volume .audit-notes-panel,
        body.layout-dot-map-volume-singles .audit-notes-panel,
        body.layout-dot-map-volume-unified .audit-notes-panel {
          display: block !important;
          visibility: visible !important;
          margin-bottom: 0.5in !important;
          margin-right: ${AUDIT_CLEAR_NAV_RIGHT} !important;
          max-width: calc(100% - ${AUDIT_CLEAR_NAV_RIGHT}) !important;
          box-sizing: border-box !important;
        }
        body.layout-dot-map-volume.palette-dot-map-volume .audit-notes-panel__details,
        body.layout-dot-map-volume-singles.palette-dot-map-volume .audit-notes-panel__details,
        body.layout-dot-map-volume-unified.palette-dot-map-volume .audit-notes-panel__details {
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
          background: ${storyColors.museumWhite} !important;
          border: 1px solid ${storyColors.softAshGray} !important;
          box-shadow: none !important;
        }
        .audit-notes-panel__summary,
        .audit-notes-panel__summary::before {
          color: ${storyColors.textSecondary} !important;
          font-family: "Calisto MT", Georgia, serif !important;
          font-size: 10px !important;
          font-weight: 400 !important;
          font-style: italic !important;
        }
        .audit-notes-panel__body {
          color: ${storyColors.textSecondary} !important;
          font-family: "Calisto MT", Georgia, serif !important;
          font-size: 10px !important;
          font-weight: 400 !important;
          font-style: italic !important;
          line-height: 1.45 !important;
        }
        body.layout-dot-map-volume.palette-dot-map-volume .viz-source,
        body.layout-dot-map-volume-singles.palette-dot-map-volume .viz-source,
        body.layout-dot-map-volume-unified.palette-dot-map-volume .viz-source {
          color: ${storyColors.textSecondary} !important;
          font-style: italic !important;
        }
        .dot-map-volume-panel-title {
          display: none !important;
        }
        body.layout-dot-map-volume-unified.palette-dot-map-volume .chart-map,
        body.layout-dot-map-volume.palette-dot-map-volume .chart-map,
        body.layout-dot-map-volume-singles.palette-dot-map-volume .chart-map {
          margin-top: ${CHART_MAP_LIFT} !important;
          padding-top: 0 !important;
        }
        .map-svg--dot-map-volume .dot-map-volume-panel,
        .map-svg--dot-map-volume-singles .dot-map-volume-panel,
        .map-svg--dot-map-volume-unified .dot-map-volume-panel,
        .inset-frames {
          pointer-events: none;
        }
      `;
      doc.head.appendChild(embedStyle);
      wireScene4KeyboardBridge(doc);
      postOrganToIframe(this, iframeOrgan);
    } catch (err) {
      console.warn("[Scene 4] could not trim iframe chrome:", err);
    }
    d3.select(this).style("opacity", "1").style("visibility", "visible");
  });

  iframe.on("error", () => {
    console.error("[Scene 4] map iframe failed to load:", geographyMapSrc());
    container.selectAll("*").remove();
    const titleParts = mapTitleParts(organ);
    renderPlaceholder(container, {
      sceneLabel,
      title: `${titleParts.prefix}${titleParts.label}${titleParts.suffix}`,
      subtitle: subtitle ?? mapSubtitle(organ),
      note: "Scene in progress: transplant geography prototype"
    });
  });
}

/** Headline — all organs (neutral charcoal), transplant centers only. */
export function runScene4(options = {}) {
  updateScene4Map(d3.select("#viz"), {
    sceneLabel: options.sceneLabel ?? "Scene 4",
    organ: options.organ ?? "all"
  });
}

/** In-place organ swap for ↓/↑ — keeps one iframe; avoids remount flash. */
export function setScene4Depth(depth) {
  const detail = depth > 0 ? MAP_ORGAN_DETAILS[depth - 1] : null;
  updateScene4Map(d3.select("#viz"), {
    sceneLabel: detail ? `Scene 4 \u00b7 ${detail.label}` : "Scene 4",
    organ: detail?.slug ?? "all"
  });
}

/** Depth count for main.js navigation — runners are not used (setScene4Depth owns swaps). */
export const mapOrganDetails = MAP_ORGAN_DETAILS.map(({ slug, label }) => () => {
  setScene4Depth(MAP_ORGAN_DETAILS.findIndex((d) => d.slug === slug) + 1);
});

// Forward show navigation arrows from the iframe when focus is on map controls,
// and release focus after chip clicks so the parent window can receive keys again.
function wireScene4KeyboardBridge(doc) {
  const controlSelector = ".organ-volume-chip, .site-type-picker button";

  function releaseControlFocus() {
    const el = doc.activeElement;
    if (el && el !== doc.body && typeof el.blur === "function") el.blur();
  }

  doc.addEventListener(
    "keydown",
    (e) => {
      const direction = SCENE4_ARROW_TO_DIRECTION[e.key];
      if (!direction) return;
      // Let native <select> use arrow keys for option highlighting.
      if (e.target?.tagName === "SELECT") return;
      e.preventDefault();
      window.parent.postMessage(
        { source: SCENE4_NAV_MESSAGE_SOURCE, type: "nav", direction },
        window.location.origin
      );
    },
    true
  );

  doc.addEventListener(
    "click",
    (e) => {
      if (!e.target.closest?.(controlSelector)) return;
      queueMicrotask(releaseControlFocus);
    },
    true
  );

  doc.addEventListener(
    "change",
    (e) => {
      if (e.target?.tagName === "SELECT") releaseControlFocus();
    },
    true
  );
}
