import { storyColors } from "../../constants/colors.js";
import { typography } from "../../constants/typography.js";
import {
  applyType,
  beginChartScene,
  drawSource,
  STAGE
} from "./show_helpers.js";
import {
  SYSTEM_MAP_ART,
  SYSTEM_MAP_IMAGE_URL,
  systemMapSubtitle
} from "../../final_show/system_map_tour.js";

/**
 * @param {{ highlightThroughIndex?: number }} [options]
 *   -1 = reference only (default)
 */
export function runSystemMap(options = {}) {
  const highlightThroughIndex =
    typeof options.highlightThroughIndex === "number" ? options.highlightThroughIndex : -1;

  const container = d3.select("#viz");
  container.selectAll("*").remove();

  const { chartSvg: svg } = beginChartScene(container, {
    sceneLabel: "Appendix",
    title: "The transplant system",
    subtitle: systemMapSubtitle(highlightThroughIndex)
  });

  const g = svg.append("g").attr("class", "system-map");

  drawReferenceImage(g);

  applyType(
    g.append("text")
      .attr("x", STAGE.marginX)
      .attr("y", STAGE.contentBottom - 44)
      .attr("fill", storyColors.textMuted)
      .text("Reference diagram \u2014 orientation only; the story order follows the narrative breadcrumb above."),
    typography.label
  );

  drawSource(
    svg,
    "Diagram: SRTR Transplant System reference. Orientation only; not the story order."
  );
}

function drawReferenceImage(g) {
  const { x, y, width, height } = SYSTEM_MAP_ART;

  g.append("image")
    .attr("href", SYSTEM_MAP_IMAGE_URL)
    .attr("x", x)
    .attr("y", y)
    .attr("width", width)
    .attr("height", height)
    .attr("preserveAspectRatio", "xMidYMid meet");
}
