function initScene5Resolution() {
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
    .attr("x", 20)
    .attr("y", 24)
    .attr("fill", "#8a9385")
    .attr("font-size", "12px")
    .text("Scene 5 — Resolution");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 90)
    .attr("text-anchor", "middle")
    .attr("fill", "#2f3e34")
    .attr("font-size", "28px")
    .attr("font-weight", "600")
    .text("Resolution");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 140)
    .attr("text-anchor", "middle")
    .attr("fill", "#6b7568")
    .attr("font-size", "18px")
    .text("With more donors, more connections become possible.");

  console.log("Scene 5 resolution initialized");
}

export function runScene5() {
  initScene5Resolution();
}

