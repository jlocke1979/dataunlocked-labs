import { renderTitleCard } from "./show_helpers.js";

/** Station A — considering transplant (evaluation D folded here until data exists). */
export function runStationA() {
  const container = d3.select("#viz");
  container.selectAll("*").remove();

  renderTitleCard(container, {
    eyebrow: "Station A",
    title: "Who considers transplant\u2014and who never enters the path?",
    lines: [
      "How many people face organ failure and think about transplantation?",
      "How many choose not to opt in\u2014or never reach a center?",
      "Narration placeholder: data on considering vs. not pursuing transplant is TBD.",
      "(Station D \u2014 evaluation \u2014 will live here or below until we have workup data.)"
    ],
    hint: "Press \u2192 for station B \u2014 seeking a center (map; referral C folded there)."
  });
}
