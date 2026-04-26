export function runConclusion() {
  const width = 1200;
  const height = 675;
  const CENTER_X = width / 2;
  const TITLE_Y = 90;
  const FOOTER_Y = 360;

  const svg = d3.select("#vis")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  svg.append("text")
    .attr("x", CENTER_X)
    .attr("y", TITLE_Y)
    .attr("text-anchor", "middle")
    .attr("font-size", 28)
    .attr("font-weight", 700)
    .attr("fill", "#2f3e34")
    .text("How can you help?");

  svg.append("text")
    .attr("x", CENTER_X - 4)
    .attr("y", FOOTER_Y)
    .attr("text-anchor", "end")
    .attr("font-size", 16)
    .attr("fill", "#2f3e34")
    .attr("font-weight", 600)
    .text("Register at");

  svg.append("text")
    .attr("x", CENTER_X + 4)
    .attr("y", FOOTER_Y)
    .attr("text-anchor", "start")
    .attr("font-size", 16)
    .attr("fill", "#1f5fbf")
    .attr("font-weight", 600)
    .style("text-decoration", "underline")
    .text("organdonor.gov");

  svg.append("text")
    .attr("x", CENTER_X)
    .attr("y", height - 26)
    .attr("text-anchor", "middle")
    .attr("font-size", 11)
    .attr("fill", "#8a8479")
    .text("← back     next →");
}
