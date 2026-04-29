export function runAssignment02Scene(container) {
  // This is a placeholder scene for testing and experimentation. You can modify this function to create your own custom visualization for Assignment 2.
  export function runScene5(container) {
  container.html("");

  const width = window.innerWidth;
  const height = window.innerHeight;

  const svg = container
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "#0f1412");

  const organColors = {
    Kidney: "#78a6c8",
    Liver: "#c99789",
    Heart: "#d96b6b",
    Lung: "#9bbf9f",
    Pancreas: "#d7b46a"
  };

  const organs = Object.keys(organColors);

  const patients = d3.range(220).map((i) => {
    const transplanted = Math.random() < 0.16;
    const organ = organs[Math.floor(Math.random() * organs.length)];

    return {
      id: i,
      x: width * 0.12 + Math.random() * width * 0.25,
      y: height * 0.28 + Math.random() * height * 0.45,
      r: 3 + Math.random() * 2,
      transplanted,
      organ,
      delay: 500 + Math.random() * 2500
    };
  });

  svg.append("text")
    .attr("x", width * 0.08)
    .attr("y", height * 0.16)
    .attr("fill", "#f5f1e8")
    .attr("font-size", 34)
    .attr("font-weight", 600)
    .text("A transplant changes time.");

  svg.append("text")
    .attr("x", width * 0.08)
    .attr("y", height * 0.22)
    .attr("fill", "#b8c7ba")
    .attr("font-size", 18)
    .text("Some lives move forward with a new pulse — illuminated by the gift of an organ.");

  const dotGroup = svg.append("g");

  const dots = dotGroup.selectAll("circle.patient")
    .data(patients)
    .join("circle")
    .attr("class", "patient")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", d => d.r)
    .attr("fill", "#8f9189")
    .attr("opacity", 0.45);

  // expanding glow rings
  dotGroup.selectAll("circle.glow")
    .data(patients.filter(d => d.transplanted))
    .join("circle")
    .attr("class", "glow")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", d => d.r)
    .attr("fill", "none")
    .attr("stroke", d => organColors[d.organ])
    .attr("stroke-width", 1.5)
    .attr("opacity", 0)
    .transition()
    .delay(d => d.delay)
    .duration(1400)
    .attr("r", d => d.r * 7)
    .attr("opacity", 0.65)
    .transition()
    .duration(1200)
    .attr("r", d => d.r * 14)
    .attr("opacity", 0);

  // gray dots awaken into organ color
  dots.filter(d => d.transplanted)
    .transition()
    .delay(d => d.delay)
    .duration(900)
    .attr("fill", d => organColors[d.organ])
    .attr("opacity", 1)
    .attr("r", d => d.r * 1.8)
    .transition()
    .duration(2200)
    .attr("cx", d => d.x + width * 0.42)
    .attr("cy", d => d.y - 30 + Math.random() * 60)
    .attr("r", d => d.r * 1.3);

  // non-transplanted dots continue waiting, dimmer
  dots.filter(d => !d.transplanted)
    .transition()
    .delay(800)
    .duration(3500)
    .attr("cx", d => d.x + width * 0.12)
    .attr("opacity", 0.28);

  // organ color legend
  const legend = svg.append("g")
    .attr("transform", `translate(${width * 0.08}, ${height * 0.78})`);

  organs.forEach((organ, i) => {
    const row = legend.append("g")
      .attr("transform", `translate(${i * 120}, 0)`);

    row.append("circle")
      .attr("r", 6)
      .attr("fill", organColors[organ]);

    row.append("text")
      .attr("x", 12)
      .attr("y", 5)
      .attr("fill", "#d8d1bd")
      .attr("font-size", 13)
      .text(organ);
  });
}
