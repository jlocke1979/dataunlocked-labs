/**
 * Assignment 02 scene 7/7 — presentation conclusion (g_conclusion.js).
 */
import { storyColors } from "../../constants/colors.js";
import { typography } from "../../constants/typography.js";
import { applyType, beginChartScene, STAGE } from "./show_helpers.js";

const ONE_IN = 96;
const QUARTER_IN = 24;
const HALF_IN = 48;
const REGISTER_DROP = (QUARTER_IN + HALF_IN) / 2;

export function runConclusion() {
  const container = d3.select("#viz");
  container.selectAll("*").remove();

  const { chartSvg: svg } = beginChartScene(container, {
    sceneLabel: "Conclusion",
    title: "",
    subtitle: ""
  });

  const centerX = STAGE.width / 2;
  const midY = (STAGE.contentTop + STAGE.contentBottom) / 2 - ONE_IN;
  const headlineLineH = typography.mainTitle.size * 1.45;
  const bodyLineH = typography.sceneTitle.size * 1.45;

  applyType(
    svg
      .append("text")
      .attr("x", centerX)
      .attr("y", midY - headlineLineH)
      .attr("text-anchor", "middle")
      .attr("fill", storyColors.textPrimary)
      .text("How can you help?"),
    typography.mainTitle
  );

  applyType(
    svg
      .append("text")
      .attr("x", centerX)
      .attr("y", midY + 20)
      .attr("text-anchor", "middle")
      .attr("fill", storyColors.textSecondary)
      .text(
        "It only takes five minutes to register as a donor and potentially give someone years of life."
      ),
    typography.sceneTitle
  );

  applyType(
    svg
      .append("text")
      .attr("x", centerX - 4)
      .attr("y", midY + 20 + bodyLineH + REGISTER_DROP)
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
      .attr("y", midY + 20 + bodyLineH + REGISTER_DROP)
      .attr("text-anchor", "start")
      .attr("fill", storyColors.deepSlateHarbor)
      .style("text-decoration", "underline")
      .style("cursor", "pointer")
      .text("organdonor.gov"),
    typography.sceneTitle
  );
}
