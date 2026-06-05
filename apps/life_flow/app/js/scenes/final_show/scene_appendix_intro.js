import { renderTitleCard } from "./show_helpers.js";

export function runAppendixIntro() {
  const container = d3.select("#viz");
  container.selectAll("*").remove();

  renderTitleCard(container, {
    eyebrow: "Appendix",
    title: "Explore more",
    lines: [
      "Diagnosis treemaps and multi-organ charts appear in Scene 3 (Gap) details.",
      "Reference diagrams: SRTR patient journey and UNOS transplant system.",
      "Not the narrative order \u2014 citations in References."
    ],
    hint: "Press \u2192 for the SRTR patient journey."
  });
}
