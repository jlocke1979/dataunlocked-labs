import { renderTitleCard } from "./show_helpers.js";

function runStationPlaceholder({ letter, title, lines, hint }) {
  const container = d3.select("#viz");
  container.selectAll("*").remove();
  renderTitleCard(container, {
    eyebrow: `Station ${letter}`,
    title,
    lines,
    hint
  });
}

/** C — Referral */
export function runStationC() {
  runStationPlaceholder({
    letter: "C",
    title: "Referral",
    lines: [
      "A referring physician sends the patient to a transplant center.",
      "Data scene planned — counts or flow into evaluation."
    ],
    hint: "SRTR station C \u00b7 Press \u2192 for evaluation (D)."
  });
}

/** D — Evaluation */
export function runStationD() {
  runStationPlaceholder({
    letter: "D",
    title: "Evaluation",
    lines: [
      "The center decides whether the patient is a transplant candidate.",
      "Data scene planned — workup, acceptance, and time-to-listing."
    ],
    hint: "SRTR station D \u00b7 Press \u2192 for listing (E)."
  });
}

/** G — Survival on the waitlist (separate from E listing heatmap) */
export function runStationG() {
  runStationPlaceholder({
    letter: "G",
    title: "Survival on the waitlist",
    lines: [
      "After listing, patients wait — some receive offers, some do not.",
      "Planned: waitlist survival rates over time (approximate OPTN/SRTR)."
    ],
    hint: "SRTR station G \u00b7 Press \u2192 for stations H + R (recovery \u2192 matching)."
  });
}

/** N — Graft loss (detail under station K, not a headline) */
export function runStationN() {
  runStationPlaceholder({
    letter: "N",
    title: "Graft loss",
    lines: [
      "Exit path after early survival — data not in this show yet.",
      "Grouped with stations K and L for long-term outcomes when available."
    ],
    hint: "Detail of station K \u00b7 Press \u2191 to return to early survival."
  });
}
