export function runTransplantsByOrgan() {
  const width = 1200;
  const height = 675;

  const svg = d3.select("#vis")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // Smaller counts (representing transplants)
  const categories = [
    { organ: "Kidney", count: 40 },
    { organ: "Liver", count: 20 },
    { organ: "Heart", count: 10 },
    { organ: "Lung", count: 8 },
    { organ: "Pancreas", count: 3 },
    { organ: "Intestine", count: 2 }
  ];

  const nodes = categories.flatMap(cat =>
    d3.range(cat.count).map(() => ({
      organ: cat.organ,
      radius: 4 + Math.random() * 2
    }))
  );

  const color = {
    Kidney: "#6c8f6b",
    Liver: "#b77b6b",
    Heart: "#b56576",
    Lung: "#7a8da3",
    Pancreas: "#b59a5e",
    Intestine: "#6f6a5f"
  };

  const simulation = d3.forceSimulation(nodes)
    .force("x", d3.forceX(width / 2).strength(0.05))
    .force("y", d3.forceY(height / 2).strength(0.05))
    .force("collision", d3.forceCollide(d => d.radius + 1))
    .on("tick", ticked);

  const circles = svg.selectAll("circle")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("r", d => d.radius)
    .attr("fill", d => color[d.organ])
    .attr("opacity", 0.85);

  function ticked() {
    circles
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);
  }

  svg.append("text")
    .attr("x", 40)
    .attr("y", 60)
    .attr("font-size", 28)
    .attr("fill", "#2f3e34")
    .text("Transplants by Organ");
}