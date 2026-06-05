import { storyColors } from "../../constants/colors.js";
import {
  createStage,
  drawHeader,
  HEADER_BAND_HEIGHT,
  HEADER_TOP_VH,
  initSceneLayout,
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
const APP_SRC = "../assignments/assignment_05_spatial/app/index.html";
const NODES_CSV = "../assignments/assignment_05_spatial/data/processed/all_nodes_with_coordinates.csv";

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

export function runScene4() {
  const container = d3.select("#viz");
  container.selectAll("*").remove();
  initSceneLayout(container);

  // Confirm the spatial data path resolves (and satisfy logging requirement).
  d3.csv(NODES_CSV)
    .then(rows => {
      console.log("[Scene 4] map node data loaded:", NODES_CSV);
      console.log("[Scene 4] row count:", rows.length);
      console.log("[Scene 4] first row:", rows[0]);
    })
    .catch(err => {
      console.warn("[Scene 4] node data could not be loaded for logging:", err);
    });

  const svg = createStage(container);
  drawHeader(svg, {
    sceneLabel: "Scene 4",
    title: "Where does transplantation happen?",
    subtitle: "Transplant centers and OPO service areas by geography"
  });

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

  const iframe = mapHost
    .append("iframe")
    .attr("src", APP_SRC)
    .attr("title", "Transplant geography prototype")
    .attr("scrolling", "yes")
    .style("position", "absolute")
    .style("top", "0")
    .style("left", "0")
    .style("width", "100%")
    .style("height", "100%")
    .style("border", "none")
    .style("border-radius", "0")
    .style("background", storyColors.museumWhite);

  iframe.on("load", function () {
    console.log("[Scene 4] map prototype iframe loaded:", APP_SRC);
    // Final-show owns the scene title above the iframe; hide the embedded app's
    // duplicate header and card chrome so only one title block remains.
    try {
      const doc = this.contentDocument;
      if (!doc) return;
      const embedStyle = doc.createElement("style");
      embedStyle.textContent = `
        .header { display: none !important; }
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
        .chart-map {
          zoom: 0.88;
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
        body[class*="layout-dot-map-volume"] .legend-panel__title {
          margin: 0 0 0.5rem !important;
          padding-top: 0 !important;
          line-height: 1.3 !important;
          font-size: 17px !important;
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
    } catch (err) {
      console.warn("[Scene 4] could not trim iframe chrome:", err);
    }
  });

  iframe.on("error", () => {
    console.error("[Scene 4] map iframe failed to load:", APP_SRC);
    container.selectAll("*").remove();
    renderPlaceholder(container, {
      sceneLabel: "Scene 4",
      title: "Where does transplantation happen?",
      subtitle: "Transplant geography prototype.",
      note: "Scene in progress: transplant geography prototype"
    });
  });
}

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
