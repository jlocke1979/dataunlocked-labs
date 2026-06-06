import { storyColors } from "../../constants/colors.js";
import { typography } from "../../constants/typography.js";
import { applyType, beginChartScene, STAGE } from "./show_helpers.js";

const ONE_IN = 96;
const QUARTER_IN = 24;
const HALF_IN = 48;
const THANKS_DROP = (QUARTER_IN + HALF_IN) / 2;

export function runThankYou() {
  const container = d3.select("#viz");
  container.selectAll("*").remove();

  const { chartSvg: svg } = beginChartScene(container, {
    sceneLabel: "THANK YOU",
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
      .text("Dedicated to SueEllen Stephenson"),
    typography.mainTitle
  );

  const thanks = svg
    .append("text")
    .attr("x", centerX)
      .attr("y", midY + 20 + THANKS_DROP)
      .attr("text-anchor", "middle")
      .attr("fill", storyColors.textSecondary);

  applyType(thanks, typography.sceneTitle);

  [
    "Thankyou to the",
    "Lung and Liver Transplant Team at",
    "Northwestern Memorial Hospital."
  ].forEach((line, index) => {
    thanks
      .append("tspan")
      .attr("x", centerX)
      .attr("dy", index === 0 ? 0 : bodyLineH)
      .text(line);
  });
}
