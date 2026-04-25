export function runStaticSlide() {
  const width = 1200;
  const height = 675;
  const TITLE_X = 40;
  const TITLE_Y = 60;
  const SUBTITLE_Y = 92;
  const LEGEND_Y = height - 80;
  const BOTTOM_LABEL_Y = height - 20;

  const svg = d3.select("#vis")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  svg.append("text")
    .attr("x", TITLE_X)
    .attr("y", TITLE_Y)
    .attr("font-size", 28)
    .attr("font-weight", 700)
    .attr("fill", "#2f3e34")
    .text("From categories to flow");

  svg.append("text")
    .attr("x", TITLE_X)
    .attr("y", SUBTITLE_Y)
    .attr("font-size", 15)
    .attr("fill", "#6f6a5f")
    .text("This prototype starts with organ categories, then moves toward the larger question: how people move through the transplant system over time.");

  svg.append("text")
    .attr("x", TITLE_X)
    .attr("y", 130)
    .attr("font-size", 15)
    .attr("fill", "#6f6a5f")
    .text("The final project will expand this into waiting, matching, transplant, and survival.");

  svg.append("text")
    .attr("x", TITLE_X)
    .attr("y", BOTTOM_LABEL_Y)
    .attr("font-size", 11)
    .attr("fill", "#8a8479")
    .text("Prototype • relative scale");
}