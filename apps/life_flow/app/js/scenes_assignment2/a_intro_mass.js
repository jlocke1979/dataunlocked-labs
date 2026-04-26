export function runIntroMass() {
  const width = 1200;
  const height = 675;
  const TITLE_X = 40;
  const TITLE_Y = 60;
  const SUBTITLE_Y = 92;

  const svg = d3.select("#vis")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const nodes = [
    { radius: 7, focus: true, x: -20, y: height / 2 + 20, vx: 0, vy: 0 }
  ];

  const simulation = d3.forceSimulation(nodes)
    .force("x", d3.forceX(width / 2).strength(0.05))
    .force("y", d3.forceY(height / 2).strength(0.05))
    .force("collision", d3.forceCollide(d => d.radius + 1))
    .alpha(1)
    .on("tick", ticked);

  const circles = svg.selectAll("circle")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("r", d => d.radius)
    .attr("fill", "#8a9096")
    .attr("opacity", 0.95);

  circles
    .transition()
    .delay(0)
    .duration(500)
    .attr("opacity", 0.95);

  function ticked() {
    circles
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);
  }

  // Intro text
  svg.append("text")
    .attr("x", TITLE_X)
    .attr("y", TITLE_Y)
    .attr("font-size", 28)
    .attr("font-weight", 700)
    .attr("fill", "#2f3e34")
    .text("One patient");

  svg.append("text")
    .attr("x", width / 2 - 30)
    .attr("y", height / 2 + 48)
    .attr("text-anchor", "middle")
    .attr("font-size", 15)
    .attr("fill", "#6f6a5f")
    .text("A single life enters the organ transplant system");

  svg.append("line")
    .attr("x1", width / 2 - 30)
    .attr("y1", height / 2 + 36)
    .attr("x2", width / 2 - 30)
    .attr("y2", height / 2 + 14)
    .attr("stroke", "#d9d9d9")
    .attr("stroke-width", 1)
    .attr("opacity", 0.9);

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height - 24)
    .attr("text-anchor", "middle")
    .attr("font-size", 11)
    .attr("fill", "#8a8479")
    .text("← back     next →");
}