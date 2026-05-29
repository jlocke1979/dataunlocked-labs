import { renderTitleCard } from "./_show_helpers.js";

export function runScene7() {
  const container = d3.select("#viz");
  container.selectAll("*").remove();

  renderTitleCard(container, {
    eyebrow: "Reflection",
    title: "One decision can change many outcomes.",
    lines: [
      "Behind every line and node is a person waiting,",
      "and a system deciding how long the wait will be."
    ],
    hint: "Source: OPTN National Data \u2014 Waitlist & Transplants."
  });
}
