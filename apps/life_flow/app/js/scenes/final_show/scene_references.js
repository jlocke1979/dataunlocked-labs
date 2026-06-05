import { storyColors } from "../../constants/colors.js";
import { typography } from "../../constants/typography.js";
import { applyType, beginChartScene, STAGE } from "./show_helpers.js";

/** Chicago author-date reference list entries used in Life Flow to date. */
const REFERENCES = [
  {
    verified: true,
    lines: [
      "Organ Procurement and Transplantation Network (OPTN). 2025. National data",
      "reports. U.S. Department of Health and Human Services, Health Resources",
      "and Services Administration. https://www.hrsa.gov/optn/data/data-reports."
    ]
  },
  {
    verified: true,
    lines: [
      "Scientific Registry for Transplant Recipients (SRTR). 2023. Transplant",
      "patient journey [diagram]. SRTR Alliance, December 14, 2023."
    ]
  },
  {
    verified: true,
    lines: [
      "United Network for Organ Sharing (UNOS). 2023. Transplant system",
      "[diagram]. OPTN, May 2023."
    ]
  },
  {
    verified: false,
    lines: [
      "Rana, Aditi, et al. 2015. [Verify full Chicago citation \u2014 post-transplant",
      "survival medians cited in Scene 6; JAMA Surgery 2015 & 2023 update (UNOS).]"
    ]
  },
  {
    verified: false,
    lines: [
      "Health Resources and Services Administration. [Verify \u2014 donor impact",
      "statistics (\u201cup to 8 lives,\u201d ~2.2 organs per donor). Organdonor.gov / OPTN.]"
    ]
  }
];

const VERIFY_COLOR = "#8B2E2E";
const BODY_LINE = typography.body.size * typography.body.lineHeight;
const HANG_INDENT = 24;

export function runReferences() {
  const container = d3.select("#viz");
  container.selectAll("*").remove();

  const { chartSvg: svg } = beginChartScene(container, {
    sceneLabel: "References",
    title: "References",
    subtitle: "Chicago author-date \u2014 known sources in Life Flow to date"
  });

  let y = STAGE.contentTop + 8;

  REFERENCES.forEach((ref, index) => {
    const fill = ref.verified ? storyColors.textSecondary : VERIFY_COLOR;

    ref.lines.forEach((line, lineIndex) => {
      applyType(
        svg
          .append("text")
          .attr("x", lineIndex === 0 ? STAGE.marginX : STAGE.marginX + HANG_INDENT)
          .attr("y", y + lineIndex * BODY_LINE)
          .attr("fill", fill)
          .text(line),
        typography.body
      );
    });

    y += ref.lines.length * BODY_LINE + (index < REFERENCES.length - 1 ? 16 : 0);
  });

  applyType(
    svg
      .append("text")
      .attr("x", STAGE.marginX)
      .attr("y", Math.min(y + 28, 600))
      .attr("fill", VERIFY_COLOR)
      .text("Red entries: verify official Chicago citation before submission."),
    typography.caption
  );

  applyType(
    svg
      .append("text")
      .attr("x", STAGE.marginX)
      .attr("y", 654)
      .attr("fill", storyColors.textMuted)
      .text("Diagram highlights in the show are editorial; they are not official SRTR/UNOS pathway maps."),
    typography.caption
  );
}
