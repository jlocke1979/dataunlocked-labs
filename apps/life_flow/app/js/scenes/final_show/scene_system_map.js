import {
  beginChartScene,
  drawSource
} from "./show_helpers.js";
import { SRTR_SYSTEM_MAP_SOURCE } from "./scene_references.js";
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
    title: "Appendix: The transplant system",
    subtitle: systemMapSubtitle(highlightThroughIndex)
  });

  const g = svg.append("g").attr("class", "system-map");

  drawReferenceImage(g);

  drawSource(svg, SRTR_SYSTEM_MAP_SOURCE);
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
