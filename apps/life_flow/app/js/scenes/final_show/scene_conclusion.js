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
    subtitle:
      "It only takes 5 minutes of your time to sign up and potentially give someone else years of newfound life"
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

  const donorLink = svg
    .append("a")
    .attr("href", "https://www.organdonor.gov/sign-up")
    .attr("target", "_blank")
    .attr("rel", "noopener noreferrer");

  applyType(
    donorLink
      .append("text")
      .attr("x", centerX + 4)
      .attr("y", midY)
      .attr("text-anchor", "start")
      .attr("fill", storyColors.deepSlateHarbor)
      .style("text-decoration", "underline")
      .style("cursor", "pointer")
      .text("organdonor.gov"),
    typography.sceneTitle
  );
}
