export function runWaitlistByOrgan() {
  console.log("Scene 2: runWaitlistByOrgan is running");

  const width = 1200;
  const height = 675;

  d3.select("#vis").selectAll("*").remove();

  const svg = d3.select("#vis")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const categories = [
    { organ: "Kidney", count: 90 },
    { organ: "Liver", count: 25 },
    { organ: "Heart", count: 15 },
    { organ: "Lung", count: 10 },
    { organ: "Pancreas", count: 5 },
    { organ: "Intestine", count: 5 }
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

  // Title
  svg.append("text")
    .attr("x", 40)
    .attr("y", 60)
    .attr("font-size", 28)
    .attr("font-weight", 700)
    .attr("fill", "#2f3e34")
    .text("Waitlist by Organ");

  // Subtitle
  svg.append("text")
    .attr("x", 40)
    .attr("y", 92)
    .attr("font-size", 15)
    .attr("fill", "#6f6a5f")
    .text("Each circle represents a patient waiting for a specific organ. Hover to inspect; click to focus.");

  // Tooltip / status line
  const tooltip = svg.append("text")
    .attr("x", 40)
    .attr("y", height - 45)
    .attr("font-size", 18)
    .attr("font-weight", 600)
    .attr("fill", "#2f3e34")
    .text("");

  // Circles
  const circles = svg.selectAll("circle.patient")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("class", "patient")
    .attr("r", d => d.radius)
    .attr("fill", d => color[d.organ])
    .attr("opacity", 0.55)
    .attr("stroke", "none")
    .style("cursor", "pointer")
    .on("mouseover", function(event, d) {
      d3.select(this)
        .raise()
        .transition()
        .duration(150)
        .attr("r", d.radius * 2)
        .attr("opacity", 1)
        .attr("stroke", "#f5f1e8")
        .attr("stroke-width", 1.5);

      tooltip.text(`${d.organ} need`);
    })
    .on("mouseout", function(event, d) {
      d3.select(this)
        .transition()
        .duration(150)
        .attr("r", d.radius)
        .attr("opacity", 0.55)
        .attr("stroke", "none");

      tooltip.text("");
    })
    .on("click", function(event, d) {
      event.stopPropagation();

      circles
        .transition()
        .duration(300)
        .attr("opacity", n => n.organ === d.organ ? 1 : 0.12);

      tooltip.text(`${d.organ} selected — relative waitlist demand`);
    });

  // Click background to reset
  svg.on("click", function(event) {
    if (event.target.tagName === "svg") {
      circles
        .transition()
        .duration(300)
        .attr("opacity", 0.55)
        .attr("stroke", "none");

      tooltip.text("");
    }
  });

  // Force simulation
  const simulation = d3.forceSimulation(nodes)
    .force("x", d3.forceX(width / 2).strength(0.05))
    .force("y", d3.forceY(height / 2).strength(0.05))
    .force("collision", d3.forceCollide(d => d.radius + 1))
    .alpha(1)
    .on("tick", ticked);

  function ticked() {
    circles
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);
  }
}