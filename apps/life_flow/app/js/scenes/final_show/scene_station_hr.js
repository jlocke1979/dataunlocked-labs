import { organColors, storyColors } from "../../constants/colors.js";
import { typography } from "../../constants/typography.js";
import {
  applyType,
  beginChartScene,
  drawSource,
  STAGE
} from "./show_helpers.js";

const ARCH_ORGANS = ["Kidney", "Liver", "Heart", "Lung"];

/** H + R — recovery timing, matching, OPO \u2192 transplant center critical window. */
export function runStationHR() {
  const container = d3.select("#viz");
  container.selectAll("*").remove();

  const { chartSvg: svg } = beginChartScene(container, {
    sceneLabel: "Stations H + R",
    title: "From organ recovery to matching recipients",
    subtitle:
      "The critical window: OPO recovery (R), transport, and offer to the transplant center (H)"
  });

  const g = svg.append("g").attr("class", "station-hr");

  const calloutY = STAGE.contentTop + 20;
  applyType(
    g.append("text")
      .attr("x", STAGE.marginX)
      .attr("y", calloutY)
      .attr("fill", storyColors.textPrimary)
      .text("Arch idea: each organ traces its own path from recovery to recipient."),
    typography.body
  );
  applyType(
    g.append("text")
      .attr("x", STAGE.marginX)
      .attr("y", calloutY + typography.body.size * typography.body.lineHeight + 4)
      .attr("fill", storyColors.textSecondary)
      .text("Press \u2193 for by-organ arches (Kidney \u2192 Liver \u2192 Heart \u2192 Lung)."),
    typography.label
  );

  drawConceptArch(g, "All organs", STAGE.contentTop + 120, storyColors.weatheredBrass, 0.35);

  drawSource(
    svg,
    "Stations H (organ offered to patient) and R (organ recovered). Timing/matching visualization in development."
  );
}

export const stationHRArchDetails = ARCH_ORGANS.map(organ => () => runStationHROrganArch(organ));

function runStationHROrganArch(organ) {
  const container = d3.select("#viz");
  container.selectAll("*").remove();

  const color = organColors[organ] || storyColors.weatheredBrass;

  const { chartSvg: svg } = beginChartScene(container, {
    sceneLabel: `Stations H + R \u00b7 ${organ}`,
    title: `${organ}: recovery to center to recipient`,
    subtitle: "By-organ arch \u2014 OPO \u2192 transplant center \u2192 match (timing data TBD)"
  });

  drawConceptArch(svg.append("g"), organ, STAGE.contentTop + 100, color, 1);

  drawSource(svg, `${organ} path: prototype arch only. Replace with organ-specific recovery and transport timing.`);
}

function drawConceptArch(svg, label, midY, color, opacity) {
  const left = STAGE.contentLeft + 80;
  const mid = (STAGE.contentLeft + STAGE.contentRight) / 2;
  const right = STAGE.contentRight - 80;
  const g = svg.append("g").attr("opacity", opacity);

  const path = d3.path();
  path.moveTo(left, midY + 40);
  path.quadraticCurveTo(mid, midY - 70, right, midY + 40);

  g.append("path")
    .attr("d", path.toString())
    .attr("fill", "none")
    .attr("stroke", color)
    .attr("stroke-width", 3)
    .attr("stroke-linecap", "round");

  const nodes = [
    { x: left, text: "OPO\n(R recovered)" },
    { x: mid, text: "Transplant\ncenter" },
    { x: right, text: "Recipient\n(H offer)" }
  ];
  nodes.forEach(node => {
    g.append("circle")
      .attr("cx", node.x)
      .attr("cy", midY + 40)
      .attr("r", 6)
      .attr("fill", storyColors.museumWhite)
      .attr("stroke", color)
      .attr("stroke-width", 2);
    const lines = node.text.split("\n");
    lines.forEach((line, i) => {
      applyType(
        g.append("text")
          .attr("x", node.x)
          .attr("y", midY + 68 + i * 14)
          .attr("text-anchor", "middle")
          .attr("fill", storyColors.textSecondary)
          .text(line),
        typography.label
      );
    });
  });

  applyType(
    g.append("text")
      .attr("x", mid)
      .attr("y", midY - 82)
      .attr("text-anchor", "middle")
      .attr("fill", storyColors.textPrimary)
      .text(label),
    typography.sceneTitle
  );
}
