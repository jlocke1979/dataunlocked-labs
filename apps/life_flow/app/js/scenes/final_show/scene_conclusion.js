/**
 * Assignment 02 scene 7/7 — presentation conclusion (g_conclusion.js).
 */
import { storyColors } from "../../constants/colors.js";
import { typography } from "../../constants/typography.js";
import { applyType, beginChartScene, STAGE } from "./show_helpers.js";

export function runConclusion() {
  const container = d3.select("#viz");
  container.selectAll("*").remove();

  const { chartSvg: svg } = beginChartScene(container, {
    sceneLabel: "Conclusion",
    title: "How can you help?",
    subtitle: "Register as an organ donor"
  });

  const centerX = STAGE.width / 2;
  const midY = (STAGE.contentTop + STAGE.contentBottom) / 2;

  applyType(
    svg
      .append("text")
      .attr("x", centerX - 4)
      .attr("y", midY)
      .attr("text-anchor", "end")
      .attr("fill", storyColors.textPrimary)
      .text("Register at"),
    typography.sceneTitle
  );

  applyType(
    svg
      .append("text")
      .attr("x", centerX + 4)
      .attr("y", midY)
      .attr("text-anchor", "start")
      .attr("fill", storyColors.deepSlateHarbor)
      .style("text-decoration", "underline")
      .text("organdonor.gov"),
    typography.sceneTitle
  );
}
