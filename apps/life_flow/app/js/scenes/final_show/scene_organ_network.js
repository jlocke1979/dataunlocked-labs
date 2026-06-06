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
  renderHighlightedOrganTitle,
  renderPlaceholder,
  STAGE
} from "./show_helpers.js";

// Must match ORGAN_NETWORK_NAV_MESSAGE_SOURCE in js/main.js.
export const ORGAN_NETWORK_NAV_MESSAGE_SOURCE = "life-flow-organ-network";

const NETWORK_ARROW_TO_DIRECTION = {
  ArrowRight: "right",
  ArrowLeft: "left",
  ArrowDown: "down",
  ArrowUp: "up"
};

const APP_BASE = "../assignments/assignment_05_spatial/app/index.html";

/** Same vertical order as Scene 4 (Where). */
const NETWORK_ORGAN_DETAILS = [
  { slug: "kidney", label: "Kidney" },
  { slug: "liver", label: "Liver" },
  { slug: "heart", label: "Heart" },
  { slug: "lung", label: "Lung" },
  { slug: "pancreas", label: "Pancreas" }
];

function flowMapSrc({ organ = "all", flowGradient = null } = {}) {
  const params = new URLSearchParams({
    layout: "single",
    organ,
    edge: "all",
    flowStyle: "web",
    embed: "show",
    t: `${organ}-${Date.now()}`
  });
  if (flowGradient) params.set("flowGradient", flowGradient);
  return new URL(`${APP_BASE}?${params}`, window.location.href).href;
}

const HEADER_VIEW_HEIGHT = HEADER_BAND_HEIGHT;
const CHART_MAP_LIFT = "-0.35in";
const LEGEND_FIXED_TOP = "0.5rem";
const LEGEND_FIXED_RIGHT = "1.5%";
const LEGEND_ZOOM = 1.1;
const LEGEND_COLUMN_WIDTH = "188px";
const LEGEND_RESERVED_WIDTH = "210px";
const AUDIT_CLEAR_NAV_RIGHT = "2in";
const STAGE_MARGIN_PCT = (STAGE.marginX / STAGE.width) * 100;

function organDetailLabel(slug) {
  return NETWORK_ORGAN_DETAILS.find((d) => d.slug === slug)?.label ?? null;
}

function networkOrganLabel(organ) {
  return organ === "all" ? ALL_ORGANS_LABEL : organDetailLabel(organ);
}

function networkSubtitle(organ) {
  const label = networkOrganLabel(organ);
  return `Movement of organs represented, ${label} 2025.`;
}

function networkTitleParts(organ) {
  const label = networkOrganLabel(organ);
  return {
    classPrefix: "network",
    prefix: "How",
    prefixGap: 12,
    label,
    suffix: organ === "all" ? " move across the country" : " moves across the country",
    organColor:
      organ === "all" ? storyColors.charcoalForest : organColorBySlug(organ),
    boxStroke: organ === "all" ? storyColors.charcoalForest : null
  };
}

function applyNetworkHeader(svg, { sceneLabel, organ = "all", subtitle }) {
  const subtitleText = subtitle ?? networkSubtitle(organ);

  renderHighlightedOrganTitle(svg, networkTitleParts(organ));

  applyType(
    svg
      .append("text")
      .attr("class", "network-header-subtitle")
      .attr("x", STAGE.marginX)
      .attr("y", HEADER_GRID.subtitleY)
      .attr("fill", storyColors.textSecondary)
      .text(subtitleText),
    typography.sceneTitle
  );

  svg
    .append("line")
    .attr("class", "network-header-divider")
    .attr("x1", STAGE.marginX)
    .attr("x2", STAGE.width - STAGE.marginX)
    .attr("y1", HEADER_GRID.dividerY)
    .attr("y2", HEADER_GRID.dividerY)
    .attr("stroke", storyColors.weatheredBrass)
    .attr("stroke-width", 1);
}

function mountOrganNetworkMap(container, { sceneLabel, subtitle, organ = "all", flowGradient = null }) {
  const mapSrc = flowMapSrc({ organ, flowGradient });
  container.selectAll("*").remove();
  initSceneLayout(container);

  const svg = createStage(container);
  applyNetworkHeader(svg, { sceneLabel, organ, subtitle });

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
    .attr("class", "scene-network-map-host")
    .style("position", "relative")
    .style("flex", "1 1 auto")
    .style("min-height", "0")
    .style("width", "100%")
    .style("overflow", "hidden");

  const iframe = mapHost
    .append("iframe")
    .attr("src", mapSrc)
    .attr("title", "Donor-to-transplant flow map")
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
    console.log("[Network] flow map iframe loaded:", mapSrc);
    try {
      const doc = this.contentDocument;
      if (!doc) return;
      const embedStyle = doc.createElement("style");
      embedStyle.textContent = `
        .header { display: none !important; }
        #audit-panel { display: none !important; }
        html,
        body,
        body.layout-single {
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
        .viz-card {
          zoom: 1;
          transform: none !important;
          margin-top: 0 !important;
          border: none !important;
          box-shadow: none !important;
          background: transparent !important;
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
          zoom: 0.92 !important;
          overflow: visible !important;
          position: relative;
          z-index: 1;
          min-width: 0 !important;
          flex: 1 1 auto !important;
          margin-top: ${CHART_MAP_LIFT} !important;
          padding-top: 0 !important;
        }
        .chart-map svg,
        .chart-map svg.map-svg {
          background: transparent !important;
        }
        .chart-map svg > rect.map-bg {
          fill: transparent !important;
        }
        body.embed-flow-show.layout-single .state,
        body.embed-flow-show.layout-single .state--pr-inset {
          fill: ${storyColors.museumWhite} !important;
          stroke: #d6d4ce !important;
          stroke-width: 0.65px !important;
        }
        body.embed-flow-show.layout-single .inset-frame {
          stroke: #d6d4ce !important;
        }
        body.embed-flow-show.layout-single .inset-label {
          fill: ${storyColors.textSecondary} !important;
        }
        .viz-source {
          background: transparent !important;
          border: none !important;
          padding-left: 0 !important;
          margin-left: 0 !important;
          text-align: left !important;
          color: ${storyColors.textSecondary} !important;
          font-style: italic !important;
        }
        .legend-panel,
        body.layout-single .legend-panel {
          position: fixed !important;
          top: ${LEGEND_FIXED_TOP} !important;
          right: ${LEGEND_FIXED_RIGHT} !important;
          left: auto !important;
          margin: 0 !important;
          zoom: ${LEGEND_ZOOM} !important;
          width: ${LEGEND_COLUMN_WIDTH} !important;
          min-width: ${LEGEND_COLUMN_WIDTH} !important;
          max-width: 230px !important;
          z-index: 100 !important;
          overflow: visible !important;
          flex: none !important;
          padding-top: 0.5rem !important;
          padding-bottom: 0.5rem !important;
          background: ${storyColors.museumWhite} !important;
          border: none !important;
          box-shadow: none !important;
        }
        body.layout-single .legend-panel__title,
        body.layout-single .legend-section--hubs {
          display: none !important;
        }
        body.layout-single .legend-section__heading {
          font-size: 10.5px !important;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          text-align: center !important;
          box-sizing: border-box !important;
        }
        body.layout-single .legend-flow-label {
          font-size: 10px !important;
        }
        body.layout-single .legend-flow-direction {
          display: none !important;
        }
        #audit-notes-panel:not([hidden]),
        body.layout-single .audit-notes-panel {
          display: block !important;
          visibility: visible !important;
          margin-bottom: 0.5in !important;
          margin-right: ${AUDIT_CLEAR_NAV_RIGHT} !important;
          max-width: calc(100% - ${AUDIT_CLEAR_NAV_RIGHT}) !important;
          box-sizing: border-box !important;
        }
        body.layout-single .audit-notes-panel__details {
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
          background: ${storyColors.museumWhite} !important;
          border: 1px solid ${storyColors.softAshGray} !important;
          box-shadow: none !important;
        }
        .audit-notes-panel__summary,
        .audit-notes-panel__summary::before,
        .audit-notes-panel__body {
          color: ${storyColors.textSecondary} !important;
          font-family: "Calisto MT", Georgia, serif !important;
          font-size: 10px !important;
          font-style: italic !important;
          line-height: 1.45 !important;
        }
        .inset-frames {
          pointer-events: none;
        }
        body.embed-flow-show circle.source {
          fill: #ffffff !important;
          stroke: #202623 !important;
          stroke-width: 1.1px !important;
        }
        body.embed-flow-show circle.destination {
          fill: #202623 !important;
          stroke: none !important;
        }
        body.embed-flow-show.embed-flow-organ circle.source {
          fill: #ffffff !important;
          stroke: #202623 !important;
          stroke-width: 1.55px !important;
        }
        body.embed-flow-show.embed-flow-organ circle.destination {
          fill: ${organColor ?? "#4F8A83"} !important;
          stroke: none !important;
        }
      `;
      doc.head.appendChild(embedStyle);
      wireNetworkKeyboardBridge(doc);
    } catch (err) {
      console.warn("[Network] could not trim iframe chrome:", err);
    }
  });

  iframe.on("error", () => {
    console.error("[Network] flow map iframe failed to load:", mapSrc);
    container.selectAll("*").remove();
    const titleParts = networkTitleParts(organ);
    renderPlaceholder(container, {
      sceneLabel,
      title: `${titleParts.prefix}${titleParts.label}${titleParts.suffix}`,
      subtitle: subtitle ?? networkSubtitle(organ),
      note: "Network flow map could not load — serve from apps/life_flow via HTTP."
    });
  });
}

function wireNetworkKeyboardBridge(doc) {
  doc.addEventListener(
    "keydown",
    (e) => {
      const direction = NETWORK_ARROW_TO_DIRECTION[e.key];
      if (!direction) return;
      e.preventDefault();
      window.parent.postMessage(
        { source: ORGAN_NETWORK_NAV_MESSAGE_SOURCE, type: "nav", direction },
        window.location.origin
      );
    },
    true
  );
}

/** Network scene — all-organ charcoal arc web; per-organ views on \u2193 (placeholders). */
export function runOrganNetwork(options = {}) {
  mountOrganNetworkMap(d3.select("#viz"), {
    sceneLabel: options.sceneLabel ?? "Scene 5",
    organ: options.organ ?? "all",
    flowGradient: "charcoal"
  });
}

function runOrganNetworkOrganDetail({ slug, label }) {
  mountOrganNetworkMap(d3.select("#viz"), {
    sceneLabel: `Scene 5  \u00b7  ${label}`,
    organ: slug,
    flowGradient: "organ"
  });
}

export const organNetworkDetails = NETWORK_ORGAN_DETAILS.map(({ slug, label }) => () =>
  runOrganNetworkOrganDetail({ slug, label })
);
