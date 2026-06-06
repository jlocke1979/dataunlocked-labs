import { storyColors } from "../../constants/colors.js";
import { typography } from "../../constants/typography.js";
import { applyType, beginChartScene, STAGE } from "./show_helpers.js";

/** Chicago author-date entries for sources cited on the show spine. */
const REFERENCES = [
  [
    "Organ Procurement and Transplantation Network (OPTN). 2025. National data",
    "reports. U.S. Department of Health and Human Services, Health Resources",
    "and Services Administration. https://www.hrsa.gov/optn/data/data-reports."
  ],
  [
    "Scientific Registry for Transplant Recipients (SRTR). 2023. Transplant",
    "patient journey [diagram]. SRTR Alliance, December 14, 2023."
  ],
  [
    "United Network for Organ Sharing (UNOS). 2023. Transplant system",
    "[diagram]. OPTN, May 2023."
  ]
];

const BODY_LINE = typography.body.size * typography.body.lineHeight;
const HANG_INDENT = 24;
const REF_GAP = 12;

export function runReferences() {
  const container = d3.select("#viz");
  container.selectAll("*").remove();

  const { chartSvg: svg } = beginChartScene(container, {
    sceneLabel: "References",
    title: "References",
    subtitle: "Chicago author-date — sources cited in Life Flow."
  });

  let y = STAGE.contentTop + 4;

  REFERENCES.forEach((lines, index) => {
    lines.forEach((line, lineIndex) => {
      applyType(
        svg
          .append("text")
          .attr("x", lineIndex === 0 ? STAGE.marginX : STAGE.marginX + HANG_INDENT)
          .attr("y", y + lineIndex * BODY_LINE)
          .attr("fill", storyColors.textSecondary)
          .text(line),
        typography.body
      );
    });

    y += lines.length * BODY_LINE + (index < REFERENCES.length - 1 ? REF_GAP : 0);
  });
}
