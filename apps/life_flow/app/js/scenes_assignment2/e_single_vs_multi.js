export function runSingleVsMulti() {
  const width = 1200;
  const height = 675;

  const svg = d3.select("#vis")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const nodes = [
    ...d3.range(120).map(() => ({ type: "single", r: 4 })),
    ...d3.range(30).map(() => ({ type: "multi", r: 4 }))
  ];

  const simulation = d3.forceSimulation(nodes)
    .force("x", d3.forceX(d => d.type === "single" ? width * 0.3 : width * 0.7).strength(0.1))
    .force("y", d3.forceY(height / 2).strength(0.05))
    .force("collision", d3.forceCollide(d => d.r + 1))
    .on("tick", ticked);

  const circles = svg.selectAll("circle")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("r", d => d.r)
    .attr("fill", d => d.type === "single" ? "#6c8f6b" : "#b56576")
    .attr("opacity", 0.85);

  function ticked() {
    circles
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);
  }

  svg.append("text")
    .attr("x", width * 0.25)
    .attr("y", 60)
    .text("Single Organ");

  svg.append("text")
    .attr("x", width * 0.65)
    .attr("y", 60)
    .text("Multi Organ");
}