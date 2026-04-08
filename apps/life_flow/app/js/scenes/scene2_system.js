function initScene2System() {
  const container = d3.select("#viz");
  container.selectAll("*").remove();

  const width = window.innerWidth;
  const height = 500;

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
    .attr("y", 50)
    .attr("text-anchor", "middle")
    .attr("fill", "#2f3e34")
    .attr("font-size", "24px")
    .attr("font-weight", "600")
    .text("A System in Motion");

  const zones = [
    { name: "Donors", x: 120, y: 250 },
    { name: "Recovered Organs", x: 340, y: 250 },
    { name: "Waitlist", x: 620, y: 250 },
    { name: "Transplants", x: 900, y: 250 }
  ];

  const links = [
    { source: zones[0], target: zones[1] },
    { source: zones[1], target: zones[2] },
    { source: zones[2], target: zones[3] }
  ];

  svg.selectAll(".link")
    .data(links)
    .enter()
    .append("line")
    .attr("x1", d => d.source.x)
    .attr("y1", d => d.source.y)
    .attr("x2", d => d.target.x)
    .attr("y2", d => d.target.y)
    .attr("stroke", "#b8c3b6")
    .attr("stroke-width", 3)
    .attr("opacity", 0.9);

  zones.forEach(zone => {
    svg.append("circle")
      .attr("cx", zone.x)
      .attr("cy", zone.y)
      .attr("r", 34)
      .attr("fill", "#94a39a");

    svg.append("text")
      .attr("x", zone.x)
      .attr("y", zone.y + 60)
      .attr("text-anchor", "middle")
      .attr("fill", "#2f3e34")
      .attr("font-size", "14px")
      .text(zone.name);
  });

  function animateParticle(startX, startY, endX, endY, delay = 0) {
    const particle = svg.append("circle")
      .attr("cx", startX)
      .attr("cy", startY)
      .attr("r", 5)
      .attr("fill", "#7c9c8b")
      .attr("opacity", 0.9);

    particle
      .transition()
      .delay(delay)
      .duration(2200)
      .ease(d3.easeLinear)
      .attr("cx", endX)
      .attr("cy", endY)
      .attr("opacity", 0.6)
      .remove();
  }

  function launchFlow() {
    for (let i = 0; i < 12; i++) {
      animateParticle(120, 250, 340, 250, i * 250);
      animateParticle(340, 250, 620, 250, 500 + i * 250);
      animateParticle(620, 250, 900, 250, 1000 + i * 250);
    }
  }

  launchFlow();
  d3.interval(launchFlow, 3500);

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 110)
    .attr("text-anchor", "middle")
    .attr("fill", "#6b7568")
    .attr("font-size", "16px")
    .text("A national system coordinates donors, organs, waiting recipients, and transplants.");

  console.log("Scene 2 system initialized");
}

export function runScene2() {
  initScene2System();
}
