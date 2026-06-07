import { storyColors } from "../../constants/colors.js";
import { typography } from "../../constants/typography.js";
import { applyType, beginChartScene, STAGE } from "./show_helpers.js";

const HRSA = "Health Resources and Services Administration";

/** Chicago author-date chart captions — shared across Life Flow slides. */
export const OPTN_NATIONAL_DATA_SOURCE =
  `Source: Organ Procurement and Transplantation Network (OPTN). 2025. National data reports, 1988\u20132025. ${HRSA}.`;

export const OPTN_WAIT_TIME_SOURCE =
  `Source: Organ Procurement and Transplantation Network (OPTN). 2025. National data reports, waiting-time distribution by organ. ${HRSA}.`;

export const OPTN_ADVANCED_DATA_SOURCE =
  `Source: Organ Procurement and Transplantation Network (OPTN). 2025. Advanced data reports. ${HRSA}.`;

export const OPTN_DIAGNOSIS_SOURCE =
  `Source: Organ Procurement and Transplantation Network (OPTN). 2025. National data reports, recipient diagnosis by organ. ${HRSA}.`;

export const OPTN_MULTI_ORGAN_SOURCE =
  `Source: Organ Procurement and Transplantation Network (OPTN). 2025. National data reports, multiple-organ transplants. ${HRSA}.`;

export const OPTN_MULTI_ORGAN_SINGLE_ORGAN_SOURCE =
  `Source: Organ Procurement and Transplantation Network (OPTN). 2025. National data reports, single-organ transplants (entries marked *). ${HRSA}.`;

export const OPTN_WAITLIST_TRANSPLANT_SOURCE =
  `Source: Organ Procurement and Transplantation Network (OPTN). 2025. National data reports, waitlist and transplants. ${HRSA}.`;

export const AFTER_PROTOTYPE_SOURCE =
  "Source: Life Flow (prototype). 2025. Illustrative patient survival by organ. Pending OPTN/SRTR data.";

export const SRTR_PATIENT_JOURNEY_SOURCE =
  "Source: Scientific Registry for Transplant Recipients (SRTR). 2023. Transplant patient journey [diagram]. SRTR Alliance, December 14, 2023.";

export const UNOS_TRANSPLANT_SYSTEM_SOURCE =
  "Source: United Network for Organ Sharing (UNOS). 2023. Transplant system [diagram]. Organ Procurement and Transplantation Network, May 2023.";

export const SRTR_SYSTEM_MAP_SOURCE =
  "Source: Scientific Registry for Transplant Recipients (SRTR). 2023. Transplant system reference [diagram]. SRTR Alliance.";

export const OPTN_FLOW_SOURCE =
  `Source: Organ Procurement and Transplantation Network (OPTN). 2025. National data reports, donors, organs recovered, transplants, discarded, and active waitlist. ${HRSA}.`;

export const OPTN_TRANSPLANT_COMBO_SOURCE =
  `Source: Organ Procurement and Transplantation Network (OPTN). 2025. National data reports, transplants and multiple-organ combinations. ${HRSA}.`;

export const SRTR_UNOS_JOURNEY_CONTEXT_SOURCE =
  "Source: Scientific Registry for Transplant Recipients (SRTR). 2023. Transplant patient journey [diagram]. SRTR Alliance, December 14, 2023; United Network for Organ Sharing (UNOS). 2023. Transplant system [diagram]. Organ Procurement and Transplantation Network, May 2023.";

/** Selected sources — Chicago author-date bibliography for Life Flow. */
const REFERENCES = [
  [
    "Organ Procurement and Transplantation Network (OPTN). 2025. National",
    "Data Reports."
  ],
  [
    "Scientific Registry for Transplant Recipients (SRTR). 2025. Annual",
    "Data Report."
  ],
  [
    "United Network for Organ Sharing (UNOS). 2025. Public Data Resources."
  ],
  [
    "Organ Donation Alliance. 2025. \u201cPeople-Driven Transplant System Map",
    "(SRTR Task 5).\u201d"
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
    subtitle: ""
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
