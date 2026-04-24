export function runStaticSlide() {
  const svg = d3.select("#vis")
    .append("svg")
    .attr("width", 1200)
    .attr("height", 675);

  svg.append("text")
    .attr("x", 50)
    .attr("y", 80)
    .attr("font-size", 36)
    .attr("fill", "#2f3e34")
    .text("Supply Does Not Match Demand");

  svg.append("text")
    .attr("x", 50)
    .attr("y", 140)
    .attr("font-size", 18)
    .text("• Kidney dominates both waitlist and transplants");

  svg.append("text")
    .attr("x", 50)
    .attr("y", 180)
    .attr("font-size", 18)
    .text("• Fewer transplants than people waiting");

  svg.append("text")
    .attr("x", 50)
    .attr("y", 220)
    .attr("font-size", 18)
    .text("• Multi-organ cases add complexity");
}