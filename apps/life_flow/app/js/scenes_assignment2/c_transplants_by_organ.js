export function runTransplantsByOrgan() {
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

  const categories = [
    { organ: "Kidney", count: 40 },
    { organ: "Liver", count: 20 },
    { organ: "Heart", count: 10 },
    { organ: "Lung", count: 8 },
    { organ: "Pancreas", count: 3 },
    { organ: "Intestine", count: 2 }
  ];

  const color = {
    Kidney: "#6c8f6b",
    Liver: "#b77b6b",
    Heart: "#b56576",
    Lung: "#7a8da3",
    Pancreas: "#b59a5e",
    Intestine: "#6f6a5f"
  };

  const nodes = categories.flatMap(cat =>
    d3.range(cat.count).map(() => ({
      organ: cat.organ,
      radius: 4 + Math.random() * 2
    }))
  );

  svg.append("text")
    .attr("x", TITLE_X)
    .attr("y", TITLE_Y)
    .attr("font-size", 28)
    .attr("font-weight", 700)
    .attr("fill", "#2f3e34")
    .text("Transplants by Organ");

  svg.append("text")
    .attr("x", TITLE_X)
    .attr("y", SUBTITLE_Y)
    .attr("font-size", 15)
    .attr("fill", "#6f6a5f")
    .text("The system does not serve every organ category at the same scale.");

  const legend = svg.append("g")
    .attr("transform", `translate(${TITLE_X}, ${LEGEND_Y})`);

  const legendItems = legend.selectAll("g.legend-item")
    .data(categories)
    .enter()
    .append("g")
    .attr("class", "legend-item")
    .attr("transform", (d, i) => {
      const columns = 3;
      const col = i % columns;
      const row = Math.floor(i / columns);
      return `translate(${col * 170}, ${row * 24})`;
    });

  legendItems.append("circle")
    .attr("r", 6)
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("fill", d => color[d.organ])
    .attr("opacity", 0.9);

  legendItems.append("text")
    .attr("x", 12)
    .attr("y", 5)
    .attr("font-size", 13)
    .attr("fill", "#2f3e34")
    .text(d => d.organ);

  const circles = svg.selectAll("circle.transplant")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("class", "transplant")
    .attr("r", d => d.radius)
    .attr("fill", d => color[d.organ])
    .attr("opacity", 0.65);

  const simulation = d3.forceSimulation(nodes)
    .force("x", d3.forceX(width / 2).strength(0.05))
    .force("y", d3.forceY(height / 2 + 30).strength(0.05))
    .force("collision", d3.forceCollide(d => d.radius + 1))
    .alpha(1)
    .on("tick", ticked);

  function ticked() {
    circles
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);
  }

  svg.append("text")
    .attr("x", TITLE_X)
    .attr("y", BOTTOM_LABEL_Y)
    .attr("font-size", 11)
    .attr("fill", "#8a8479")
    .text("Prototype • relative counts");
}