import { storyColors } from "../../constants/colors.js";
import { createStage, drawHeader, renderPlaceholder, STAGE } from "./show_helpers.js";

// Reuse the existing Assignment 05 spatial app verbatim via an iframe so the
// final show populates without porting its ~3,400-line renderer.
const APP_SRC = "../assignments/assignment_05_spatial/app/index.html";
const NODES_CSV = "../assignments/assignment_05_spatial/data/processed/all_nodes_with_coordinates.csv";

// Header band height as a share of the 720px stage (matches STAGE.contentTop).
const HEADER_TOP_VH = (STAGE.contentTop / STAGE.height) * 100;

export function runScene4() {
  const container = d3.select("#viz");
  container.selectAll("*").remove();
  container
    .style("position", "relative")
    .style("display", "flex")
    .style("flex-direction", "column")
    .style("min-height", "100vh")
    .style("height", "100vh");

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
    sceneLabel: "Scene 4  \u00b7  prototype",
    title: "Where does transplantation happen?",
    subtitle: "Transplant system sites and flow volume by geography"
  });

  // Header band only: absolute + height 100% collapsed #viz (no in-flow child) and
  // default meet centering clipped the top of the full 720 viewBox in a short box.
  svg
    .attr("viewBox", `0 0 ${STAGE.width} ${STAGE.contentTop}`)
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("height", `${HEADER_TOP_VH}vh`)
    .style("flex", "0 0 auto")
    .style("width", "100%")
    .style("height", `${HEADER_TOP_VH}vh`)
    .style("pointer-events", "none");
  svg.select("rect").attr("height", STAGE.contentTop);

  const mapHost = container
    .append("div")
    .attr("class", "scene4-map-host")
    .style("position", "relative")
    .style("flex", "1 1 auto")
    .style("min-height", "0")
    .style("width", "100%");

  const iframe = mapHost
    .append("iframe")
    .attr("src", APP_SRC)
    .attr("title", "Transplant geography prototype")
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
        }
        .page,
        .viz-card,
        .viz-layout,
        .chart-map,
        #chart {
          background: transparent !important;
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
        }
        .legend-panel,
        body.layout-dot-map-volume.palette-dot-map-volume .legend-panel,
        body.layout-dot-map-volume-singles.palette-dot-map-volume .legend-panel,
        body.layout-dot-map-volume-unified.palette-dot-map-volume .legend-panel,
        body[class*="layout-dot-map-volume"] .legend-panel {
          background: ${storyColors.museumWhite} !important;
          border: none !important;
          border-left: none !important;
          border-top: none !important;
          box-shadow: none !important;
        }
        .page { padding: 0 !important; max-width: none !important; margin: 0 !important; }
        .dot-map-volume-panel-title {
          display: none !important;
        }
      `;
      doc.head.appendChild(embedStyle);
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
