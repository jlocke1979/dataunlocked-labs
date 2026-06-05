import { drawSource, renderTitleCard } from "./show_helpers.js";

/** Slide 0a — title and framing only. */
export function runScene0() {
  const container = d3.select("#viz");
  container.selectAll("*").remove();

  const svg = renderTitleCard(container, {
    eyebrow: "A Data Story",
    title: "Organ transplant network visualized",
    subtitle: "An exploration of the United States organ transplantation system.",
    lines: ["Press \u2192 arrow to begin"],
    bodyCentered: true,
    bodyLarge: true
  });

  drawSource(svg, "Source: OPTN, UNOS, and SRTR national data.");
}
