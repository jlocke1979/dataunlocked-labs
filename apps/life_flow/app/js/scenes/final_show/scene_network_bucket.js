import { renderTitleCard } from "./show_helpers.js";

/** Arc-only network scene — off spine until redesign (iteration 01 reference). */
export function runNetworkBucket() {
  const container = d3.select("#viz");
  container.selectAll("*").remove();

  renderTitleCard(container, {
    eyebrow: "Network (bucket)",
    title: "Donor-to-transplant arcs",
    lines: [
      "Redesign in progress — arcs only, no bubbles.",
      "Reference: Assignment 05 iteration 01 (all-flow web) + per-organ verticals.",
      "Not on the narrative spine until the arc encoding is right."
    ],
    hint: "Return to the story with \u2190."
  });
}
