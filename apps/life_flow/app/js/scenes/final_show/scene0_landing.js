import { renderTitleCard } from "./_show_helpers.js";

export function runScene0() {
  const container = d3.select("#viz");
  container.selectAll("*").remove();

  renderTitleCard(container, {
    eyebrow: "A data story",
    title: "Life Flow",
    lines: [
      "Organ transplantation, waiting, and the hidden",
      "systems that turn need into time."
    ],
    hint: "Use \u2190 and \u2192 to move through the show."
  });
}
