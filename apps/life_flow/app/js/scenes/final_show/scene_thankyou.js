import { storyColors } from "../../constants/colors.js";
import { typography } from "../../constants/typography.js";
import { applyType, beginChartScene, STAGE } from "./show_helpers.js";

export function runThankYou() {
  const container = d3.select("#viz");
  container.selectAll("*").remove();

  const { chartSvg: svg } = beginChartScene(container, {
    sceneLabel: "THANK YOU",
    title: "",
    subtitle: ""
  });

  const centerX = STAGE.width / 2;
  const contentHeight = STAGE.contentBottom - STAGE.contentTop;
  const bodyLineH = typography.sceneTitle.size * 1.45;
  const thanksLines = [
    "Thankyou to the",
    "Lung and Liver Transplant Team at",
    "Northwestern Memorial Hospital."
  ];
  const thanksBlockHeight = (thanksLines.length - 1) * bodyLineH;
  const thanksCenterY = STAGE.contentTop + contentHeight / 3;
  const thanksStartY = thanksCenterY - thanksBlockHeight / 2;

  const thanks = svg
    .append("text")
    .attr("x", centerX)
    .attr("y", thanksStartY)
    .attr("text-anchor", "middle")
    .attr("fill", storyColors.textSecondary);

  applyType(thanks, typography.sceneTitle);

  thanksLines.forEach((line, index) => {
    thanks
      .append("tspan")
      .attr("x", centerX)
      .attr("dy", index === 0 ? 0 : bodyLineH)
      .text(line);
  });

  const dedicationType = {
    ...typography.sceneTitle,
    size: 15,
    weight: 400
  };
  const dedicationY = STAGE.contentTop + (contentHeight * 2) / 3;

  applyType(
    svg
      .append("text")
      .attr("x", centerX)
      .attr("y", dedicationY)
      .attr("text-anchor", "middle")
      .attr("fill", storyColors.charcoalForest)
      .text("Dedicated to SueEllen Mobley Stephenson"),
    dedicationType
  );
}
