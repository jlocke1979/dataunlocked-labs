import {
  beginChartScene,
  drawSource,
  STAGE
} from "./show_helpers.js";
import { SRTR_PATIENT_JOURNEY_SOURCE } from "./scene_references.js";

const PATIENT_MAP_URL = "./assets/srtr-patient-journey-cropped.png";
const IMAGE_ASPECT = 251 / 1024;
const IMAGE_SCALE = 0.8;

/** SRTR patient journey — reference only (appendix, before system map). */
export function runAppendixPatientJourney() {
  const container = d3.select("#viz");
  container.selectAll("*").remove();

  const { chartSvg: svg } = beginChartScene(container, {
    sceneLabel: "Appendix",
    title: "Appendix: The transplant patient journey in 14 steps",
    subtitle:
      "The Scientific Registry of Transplant Recipients (SRTR) provides this illustration journey map."
  });

  const g = svg.append("g").attr("class", "appendix-patient-journey");

  const contentWidth = STAGE.contentRight - STAGE.marginX;
  const mapWidth = contentWidth * IMAGE_SCALE;
  const mapHeight = mapWidth * IMAGE_ASPECT;
  const mapX = STAGE.marginX + (contentWidth - mapWidth) / 2;
  const mapY = STAGE.contentTop + 56;

  g.append("image")
    .attr("href", PATIENT_MAP_URL)
    .attr("x", mapX)
    .attr("y", mapY)
    .attr("width", mapWidth)
    .attr("height", mapHeight)
    .attr("preserveAspectRatio", "xMidYMid meet");

  drawSource(svg, SRTR_PATIENT_JOURNEY_SOURCE);
}
