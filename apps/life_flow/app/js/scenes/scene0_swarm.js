export function initDotFieldScene() {
  const container = d3.select("#viz");
  container.selectAll("*").remove();

  const width = window.innerWidth;
  const height = 650;
  const marginTop = 120;

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
    .attr("font-size", "28px")
    .attr("font-weight", "600")
    .text("Life Flow");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 82)
    .attr("text-anchor", "middle")
    .attr("fill", "#cbd5e1")
    .attr("font-size", "16px")
    .text("1 dot = 1,000 people");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 108)
    .attr("text-anchor", "middle")
    .attr("fill", "#94a3b8")
    .attr("font-size", "15px")
    .text("A first sketch of scale: waiting, transplanted, and lost while waiting");

  const dotData = [];

  // 100 waiting
  for (let i = 0; i < 100; i++) {
    dotData.push({ type: "waiting" });
  }

  // Mark first 40 as transplanted
  for (let i = 0; i < 40; i++) {
    dotData[i].type = "transplanted";
  }

  // Mark next 5 as deaths while waiting
  for (let i = 40; i < 45; i++) {
    dotData[i].type = "lost";
  }

  const columns = 10;
  const spacing = 42;
  const radius = 12;

  const startX = (width - (columns - 1) * spacing) / 2;
  const startY = marginTop + 70;

  const colorMap = {
    waiting: "#475569",
    transplanted: "#38bdf8",
    lost: "#ef4444"
  };

  dotData.forEach((d, i) => {
    d.col = i % columns;
    d.row = Math.floor(i / columns);
    d.x = startX + d.col * spacing;
    d.y = startY + d.row * spacing;
  });

  const dots = svg.selectAll(".dot")
    .data(dotData)
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", 0)
    .attr("fill", "#1e293b")
    .attr("opacity", 0.95);

  dots.transition()
    .delay((d, i) => i * 18)
    .duration(500)
    .attr("r", radius)
    .attr("fill", d => colorMap[d.type]);

  const legendY = startY + 10 * spacing + 55;

  const legendData = [
    { label: "Waiting", color: colorMap.waiting, value: "100 dots = 100,000 people" },
    { label: "Transplanted", color: colorMap.transplanted, value: "40 dots = 40,000 people" },
    { label: "Lost while waiting", color: colorMap.lost, value: "5 dots = 5,000 people" }
  ];

  const legend = svg.selectAll(".legend-item")
    .data(legendData)
    .enter()
    .append("g")
    .attr("class", "legend-item")
    .attr("transform", (d, i) => `translate(${width / 2 - 180}, ${legendY + i * 34})`);

  legend.append("circle")
    .attr("r", 8)
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("fill", d => d.color);

  legend.append("text")
    .attr("x", 18)
    .attr("y", 5)
    .attr("fill", "white")
    .attr("font-size", "15px")
    .text(d => `${d.label}: ${d.value}`);

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", legendY + 125)
    .attr("text-anchor", "middle")
    .attr("fill", "#cbd5e1")
    .attr("font-size", "16px")
    .text("Even at this scale, the imbalance is visible.");

  console.log("Dot field scene initialized");
}