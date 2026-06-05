import { renderTitleCard } from "./show_helpers.js";

export function runChoppingBlockIntro() {
  const container = d3.select("#viz");
  container.selectAll("*").remove();

  renderTitleCard(container, {
    title: "Chopping Block",
    hint: "Press \u2193 for archived experiments."
  });
}
