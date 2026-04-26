export function runConclusion() {
  const width = 1200;
  const height = 675;
  const TITLE_X = 40;
  const TITLE_Y = 60;
  const LINE_1_Y = 300;
  const LINE_2_Y = 332;
  const SOURCE_Y = height - 6;

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
    .text("From counts to lives");

  svg.append("text")
    .attr("x", TITLE_X)
    .attr("y", LINE_1_Y)
    .attr("font-size", 15)
    .attr("fill", "#6f6a5f")
    .text("This prototype begins with categories.");

  svg.append("text")
    .attr("x", TITLE_X)
    .attr("y", LINE_2_Y)
    .attr("font-size", 15)
    .attr("fill", "#6f6a5f")
    .text("The final story follows patients through time.");

  svg.append("text")
    .attr("x", TITLE_X)
    .attr("y", SOURCE_Y)
    .attr("font-size", 11)
    .attr("fill", "#8a8479")
    .text("Source: Organ Procurement and Transplantation Network (OPTN) and United Network for Organ Sharing (UNOS)");
}
