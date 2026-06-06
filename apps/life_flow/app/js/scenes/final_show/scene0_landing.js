import { drawSource, renderTitleCard } from "./show_helpers.js";

/** Slide 0a — title and framing only. */
export function runScene0() {
  const container = d3.select("#viz");
  container.selectAll("*").remove();

  const svg = renderTitleCard(container, {
    title: "LifeFlow",
    subtitle: "A visual exploration of the United States organ transplant network.",
    lines: [
      "Press \u2192 arrow to begin",
      "\u2193  for detail        \u2191  to return"
    ],
    bodyCentered: true,
    bodyLarge: true,
    bodyLineGap: 12,
    bodyYOffset: -28
  });

  drawSource(svg, "Source: OPTN, UNOS, and SRTR national data.");
}
