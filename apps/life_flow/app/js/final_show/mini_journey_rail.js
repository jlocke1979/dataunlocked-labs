import { storyColors } from "../constants/colors.js";
import { typography } from "../constants/typography.js";
import { applyType, STAGE } from "../scenes/final_show/show_helpers.js";

/** Compact A\u2013L rail for journey-intro (upper-right of chart band). */
export const PATIENT_JOURNEY_LETTERS = "ABCDEFGHIJKL".split("");

export function drawMiniJourneyRail(svg, { title = "Patient A\u2013L" } = {}) {
  const letterW = 15;
  const gap = 3;
  const trackW = PATIENT_JOURNEY_LETTERS.length * letterW + (PATIENT_JOURNEY_LETTERS.length - 1) * gap;
  const x0 = STAGE.contentRight - trackW - 8;
  const y0 = STAGE.contentTop + 28;

  const g = svg.append("g").attr("class", "mini-journey-rail").attr("transform", `translate(${x0},${y0})`);

  applyType(
    g.append("text")
      .attr("x", trackW)
      .attr("y", -4)
      .attr("text-anchor", "end")
      .attr("fill", storyColors.textMuted)
      .text(title),
    typography.label
  );
  g.attr("font-size", "9px");

  PATIENT_JOURNEY_LETTERS.forEach((letter, i) => {
    const gx = i * (letterW + gap);
    g.append("rect")
      .attr("x", gx)
      .attr("y", 6)
      .attr("width", letterW)
      .attr("height", 14)
      .attr("rx", 2)
      .attr("fill", storyColors.museumWhite)
      .attr("stroke", storyColors.divider)
      .attr("stroke-width", 0.75);
    applyType(
      g.append("text")
        .attr("x", gx + letterW / 2)
        .attr("y", 17)
        .attr("text-anchor", "middle")
        .attr("fill", storyColors.textSecondary)
        .text(letter),
      typography.label
    );
  });
}
