import { renderTitleCard } from "./show_helpers.js";

/** Slide 0b — arrow keys and story stops (top right). */
export function runScene0LandingNav() {
  const container = d3.select("#viz");
  container.selectAll("*").remove();

  renderTitleCard(container, {
    eyebrow: "A Data Story",
    title: "Presentation Controls",
    subtitle: "Designed for desktop, not mobile",
    lines: [
      "\u2190  back        \u2192  forward",
      "\u2193  for detail        \u2191  to return"
    ],
    bodyCentered: true,
    bodyLarge: true,
    bodyLineGap: 10
  });
}
