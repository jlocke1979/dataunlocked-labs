import { storyColors } from "../../constants/colors.js";
import { typography } from "../../constants/typography.js";
import { applyType, renderTitleCard, STAGE } from "./show_helpers.js";

function drawLandingBreadcrumbCallout(svg, { bodyY, bodyLineHeight, bodyLineGap }) {
  const centerX = STAGE.width / 2;
  const bodyTop = bodyY - bodyLineHeight;
  const textY = bodyTop - bodyLineGap;

  applyType(
    svg
      .append("text")
      .attr("class", "landing-breadcrumb-callout")
      .attr("x", centerX)
      .attr("y", textY)
      .attr("text-anchor", "middle")
      .attr("fill", storyColors.textPrimary)
      .text("Headlines are at the top"),
    typography.sceneTitle
  );
}

/** Slide 0a — title and framing only. */
export function runScene0() {
  const container = d3.select("#viz");
  container.selectAll("*").remove();
  d3.selectAll(".landing-breadcrumb-callout").remove();

const lines = [
  "Landscape mode recommended.",
  "Use arrows to navigate."
];

  const bodyLineHeight = typography.sceneTitle.size * (typography.sceneTitle.lineHeight || 1.5);
  const bodyLineGap = 12;
  const bodyBlockHeight =
    lines.length * bodyLineHeight + Math.max(0, lines.length - 1) * bodyLineGap;
  const bodyYOffset = 12;
  const bodyY =
    (STAGE.contentTop + STAGE.contentBottom) / 2 -
    bodyBlockHeight / 2 +
    bodyLineHeight / 2 +
    bodyYOffset;

  const svg = renderTitleCard(container, {
    title: "LifeFlow",
    subtitle: "A visual exploration of the United States organ transplant network.",
    lines,
    bodyCentered: true,
    bodyLarge: true,
    bodyLineGap,
    bodyYOffset
  });

  drawLandingBreadcrumbCallout(svg, { bodyY, bodyLineHeight, bodyLineGap });
}
