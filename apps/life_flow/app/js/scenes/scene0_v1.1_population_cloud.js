import { TOTAL_DOTS, WAITLIST_DOTS } from "../constants.js";

export function initPopulationCloudScene() {
  console.log("Population cloud scene started");
  console.log("TOTAL_DOTS:", TOTAL_DOTS);
  console.log("WAITLIST_DOTS:", WAITLIST_DOTS);

  const container = d3.select("#viz");
  container.selectAll("*").remove();

  const width = window.innerWidth;
  const height = 650;

  const svg = container
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "#f5f1e8");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 100)
    .attr("text-anchor", "middle")
    .attr("fill", "black")
    .attr("font-size", "28px")
    .text("Population cloud test");

  svg.append("circle")
    .attr("cx", width / 2)
    .attr("cy", 200)
    .attr("r", 30)
    .attr("fill", "red");
}