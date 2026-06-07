import {
  beginChartScene,
  drawSource,
  STAGE
} from "./show_helpers.js";
import { SRTR_PATIENT_JOURNEY_SOURCE } from "./scene_references.js";

const PATIENT_MAP_URL = "./assets/srtr-patient-journey-cropped.png";

/** Diagram art box — inset so cropped SRTR journey reads larger without stretch. */
const PATIENT_ART = {
  x: 112,
  y: 224,
  width: 1056,
  height: 368
};

/** Setup intro — patient diagram only; not station A. */
export function runJourneyIntro() {
  const container = d3.select("#viz");
  container.selectAll("*").remove();

  const { chartSvg: svg } = beginChartScene(container, {
    sceneLabel: "Journey intro",
    title: "We focus primarily on the patient journey for this presentation",
    subtitle: "Stations A\u2013L on the SRTR path \u2014 system context was on the prior slide"
  });

  svg
    .append("image")
    .attr("href", PATIENT_MAP_URL)
    .attr("x", PATIENT_ART.x)
    .attr("y", PATIENT_ART.y)
    .attr("width", PATIENT_ART.width)
    .attr("height", PATIENT_ART.height)
    .attr("preserveAspectRatio", "xMidYMid meet");

  drawSource(svg, SRTR_PATIENT_JOURNEY_SOURCE);
}
