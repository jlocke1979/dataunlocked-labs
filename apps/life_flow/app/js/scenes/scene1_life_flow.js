export function initScene1() {
  const container = d3.select("#viz");

  const width = window.innerWidth;
  const height = 500;

  const svg = container
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "#0f172a");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 50)
    .attr("text-anchor", "middle")
    .attr("fill", "white")
    .attr("font-size", "24px")
    .text("Life Flow — Scene 1");

  const zones = [
    { name: "Donors", x: 100 },
    { name: "Recovered Organs", x: 300 },
    { name: "Waitlist", x: 550 },
    { name: "Transplants", x: 800 }
  ];

  zones.forEach(zone => {
    svg.append("circle")
      .attr("cx", zone.x)
      .attr("cy", height / 2)
      .attr("r", 30)
      .attr("fill", "#334155");

    svg.append("text")
      .attr("x", zone.x)
      .attr("y", height / 2 + 60)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .text(zone.name);
  });

  console.log("Scene 1 initialized");
}