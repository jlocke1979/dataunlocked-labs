export function runWaitlistVsTransplants() {
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
    .text("Waitlist vs Transplants");

  svg.append("text")
    .attr("x", TITLE_X)
    .attr("y", SUBTITLE_Y)
    .attr("font-size", 15)
    .attr("fill", "#6f6a5f")
    .text("Demand and supply are not evenly matched across organ types.");

  const waitlist = [
    { organ: "Kidney", count: 90 },
    { organ: "Liver", count: 25 },
    { organ: "Heart", count: 15 },
    { organ: "Lung", count: 10 }
  ];

  const transplants = [
    { organ: "Kidney", count: 40 },
    { organ: "Liver", count: 20 },
    { organ: "Heart", count: 10 },
    { organ: "Lung", count: 8 }
  ];

  const color = {
    Kidney: "#6c8f6b",
    Liver: "#b77b6b",
    Heart: "#b56576",
    Lung: "#7a8da3"
  };

  const nodes = [
    ...waitlist.flatMap(d =>
      d3.range(d.count).map(() => ({ ...d, side: "left", r: 4 }))
    ),
    ...transplants.flatMap(d =>
      d3.range(d.count).map(() => ({ ...d, side: "right", r: 4 }))
    )
  ];

  const simulation = d3.forceSimulation(nodes)
    .force("x", d3.forceX(d => d.side === "left" ? width * 0.3 : width * 0.7).strength(0.1))
    .force("y", d3.forceY(height * 0.56).strength(0.05))
    .force("collision", d3.forceCollide(d => d.r + 1))
    .on("tick", ticked);

  const circles = svg.selectAll("circle")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("r", d => d.r)
    .attr("fill", d => color[d.organ])
    .attr("opacity", 0.85);

  function ticked() {
    circles
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);
  }

  svg.append("line")
    .attr("x1", width / 2)
    .attr("x2", width / 2)
    .attr("y1", 120)
    .attr("y2", height - 60)
    .attr("stroke", "#d8d2c5")
    .attr("stroke-width", 1);

  svg.append("text")
    .attr("x", width * 0.3)
    .attr("y", height * 0.74)
    .attr("text-anchor", "middle")
    .attr("font-size", 18)
    .attr("font-weight", 600)
    .attr("fill", "#2f3e34")
    .text("Waitlist");

  svg.append("text")
    .attr("x", width * 0.7)
    .attr("y", height * 0.74)
    .attr("text-anchor", "middle")
    .attr("font-size", 18)
    .attr("font-weight", 600)
    .attr("fill", "#2f3e34")
    .text("Transplants");

  svg.append("text")
    .attr("x", TITLE_X)
    .attr("y", BOTTOM_LABEL_Y)
    .attr("font-size", 11)
    .attr("fill", "#8a8479")
    .text("Prototype • scaled from OPTN/UNOS proportions");
}