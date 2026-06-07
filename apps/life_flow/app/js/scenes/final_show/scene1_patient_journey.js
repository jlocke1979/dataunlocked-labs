import { storyColors } from "../../constants/colors.js";
import { typography } from "../../constants/typography.js";
import {
  applyType,
  beginChartScene,
  drawSource,
  STAGE
} from "./show_helpers.js";
import { SRTR_UNOS_JOURNEY_CONTEXT_SOURCE } from "./scene_references.js";

const PATIENT_MAP_URL = "./assets/srtr-patient-journey-reference.png";
const SYSTEM_MAP_URL = "./assets/unos-transplant-system-reference.png";

const MAP_ART = {
  patient: { x: 72, y: 218, width: 1136, height: 200 },
  system: { x: 72, y: 432, width: 1136, height: 168 }
};

/**
 * Scene 1 headline placeholder — patient-journey spine (content TBD).
 * Detail stack will add journey beats + data scenes per SRTR stations.
 */
export function runPatientJourney() {
  const container = d3.select("#viz");
  container.selectAll("*").remove();

  const { chartSvg: svg } = beginChartScene(container, {
    sceneLabel: "Station A",
    title: "Considering transplant",
    subtitle: "SRTR patient journey begins here \u2014 full path A\u2013L; we visit stations in alphabetical order"
  });

  const g = svg.append("g").attr("class", "patient-journey-placeholder");

  drawMapImage(g, PATIENT_MAP_URL, MAP_ART.patient, 1);
  drawMapImage(g, SYSTEM_MAP_URL, MAP_ART.system, 0.42);

  applyType(
    g.append("text")
      .attr("x", STAGE.marginX)
      .attr("y", MAP_ART.system.y + MAP_ART.system.height + 28)
      .attr("fill", storyColors.textSecondary)
      .text("Upper: patient stations we will highlight. Lower: full system map (context only)."),
    typography.label
  );

  drawSource(svg, SRTR_UNOS_JOURNEY_CONTEXT_SOURCE);
}

function drawMapImage(g, href, box, opacity) {
  g.append("image")
    .attr("href", href)
    .attr("x", box.x)
    .attr("y", box.y)
    .attr("width", box.width)
    .attr("height", box.height)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("opacity", opacity);

  g.append("rect")
    .attr("x", box.x)
    .attr("y", box.y)
    .attr("width", box.width)
    .attr("height", box.height)
    .attr("fill", "none")
    .attr("stroke", storyColors.divider)
    .attr("stroke-width", 1)
    .attr("rx", 4);
}
