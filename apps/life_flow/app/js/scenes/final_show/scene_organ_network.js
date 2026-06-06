import { organColorBySlug, storyColors } from "../../constants/colors.js";
import { typography } from "../../constants/typography.js";
import {
  applyType,
  createStage,
  drawHeader,
  HEADER_BAND_HEIGHT,
  HEADER_GRID,
  HEADER_TOP_VH,
  initSceneLayout,
  renderPlaceholder,
  STAGE
} from "./show_helpers.js";

const ORGAN_HIGHLIGHT_PAD_X = 5;
const ORGAN_HIGHLIGHT_PAD_Y = 2;
const ORGAN_HIGHLIGHT_OPACITY = 0.22;
const ORGAN_TITLE_SUFFIX_GAP = 6;

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
const CHART_MAP_LIFT = "-0.6in";
const LEGEND_FIXED_TOP = "0.5rem";
const LEGEND_FIXED_RIGHT = "1.5%";
const LEGEND_ZOOM = 1.1;
const LEGEND_COLUMN_WIDTH = "188px";
const LEGEND_RESERVED_WIDTH = "210px";
const AUDIT_CLEAR_NAV_RIGHT = "2in";
const STAGE_MARGIN_PCT = (STAGE.marginX / STAGE.width) * 100;

function tagNetworkHeader(svg) {
  const texts = svg.selectAll("text");
  texts.filter((_, i) => i === 0).attr("class", "network-header-eyebrow");
  texts.filter((_, i) => i === 1).attr("class", "network-header-title");
  texts.filter((_, i) => i === 2).attr("class", "network-header-subtitle");
}

function organDetailLabel(slug) {
  return NETWORK_ORGAN_DETAILS.find((d) => d.slug === slug)?.label ?? null;
}

function renderNetworkOrganTitle(svg, label, suffix, organColor) {
  svg.select(".network-header-title-group").remove();
  const group = svg.append("g").attr("class", "network-header-title-group");
  const organWrap = group.append("g").attr("class", "network-organ-wrap");

  const organText = applyType(
    organWrap
      .append("text")
      .attr("class", "network-header-title")
      .attr("x", STAGE.marginX)
      .attr("y", HEADER_GRID.titleY)
      .attr("fill", organColor)
      .text(label),
    typography.mainTitle
  );

  const bbox = organText.node().getBBox();
  organWrap
    .insert("rect", "text")
    .attr("class", "network-organ-highlight")
    .attr("x", bbox.x - ORGAN_HIGHLIGHT_PAD_X)
    .attr("y", bbox.y - ORGAN_HIGHLIGHT_PAD_Y)
    .attr("width", bbox.width + ORGAN_HIGHLIGHT_PAD_X * 2)
    .attr("height", bbox.height + ORGAN_HIGHLIGHT_PAD_Y * 2)
    .attr("rx", 4)
    .attr("fill", organColor)
    .attr("fill-opacity", ORGAN_HIGHLIGHT_OPACITY);

  if (suffix) {
    applyType(
      group
        .append("text")
        .attr("class", "network-header-title-suffix")
        .attr("x", STAGE.marginX + bbox.width + ORGAN_TITLE_SUFFIX_GAP)
        .attr("y", HEADER_GRID.titleY)
        .attr("fill", storyColors.textPrimary)
        .text(suffix),
      typography.mainTitle
    );
  }
}

function mountOrganNetworkMap(container, { sceneLabel, title, subtitle, organ = "all", flowGradient = null }) {
  const mapSrc = flowMapSrc({ organ, flowGradient });
  container.selectAll("*").remove();
  initSceneLayout(container);

  const svg = createStage(container);
  const organLabel = organ !== "all" ? organDetailLabel(organ) : null;
  const organColor = organLabel ? organColorBySlug(organ) : null;

  drawHeader(svg, { sceneLabel, subtitle });
  if (organLabel && organColor) {
    renderNetworkOrganTitle(svg, organLabel, " flows across the country", organColor);
  } else if (title) {
    applyType(
      svg
        .append("text")
        .attr("class", "network-header-title")
        .attr("x", STAGE.marginX)
        .attr("y", HEADER_GRID.titleY)
        .attr("fill", storyColors.textPrimary)
        .text(title),
      typography.mainTitle
    );
  }
  tagNetworkHeader(svg);

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
        }
        body.layout-single .legend-flow-label {
          font-size: 10px !important;
        }
        body.layout-single .legend-flow-direction {
          font-size: 9.5px !important;
          line-height: 1.35 !important;
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
    renderPlaceholder(container, {
      sceneLabel,
      title,
      subtitle,
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
    title: options.title ?? "How organs move across the country",
    subtitle:
      options.subtitle ??
      "Donor recovery to transplant center flows \u2014 all organs, 2025",
    organ: "all",
    flowGradient: "charcoal"
  });
}

function runOrganNetworkOrganDetail({ slug, label }) {
  mountOrganNetworkMap(d3.select("#viz"), {
    sceneLabel: `Scene 5  \u00b7  ${label}`,
    subtitle: "Donor recovery to transplant center \u2014 shared national flow scale",
    organ: slug,
    flowGradient: "organ"
  });
}

export const organNetworkDetails = NETWORK_ORGAN_DETAILS.map(({ slug, label }) => () =>
  runOrganNetworkOrganDetail({ slug, label })
);
