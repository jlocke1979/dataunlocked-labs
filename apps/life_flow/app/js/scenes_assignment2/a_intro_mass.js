export function runIntroMass() {
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

  // Subtle background mass to match the force-dot style
  const nodes = d3.range(150).map(() => ({
    radius: 4 + Math.random() * 3
  }));

  const simulation = d3.forceSimulation(nodes)
    .force("x", d3.forceX(width / 2).strength(0.05))
    .force("y", d3.forceY(height / 2).strength(0.05))
    .force("collision", d3.forceCollide(d => d.radius + 1))
    .alpha(1)
    .on("tick", ticked);

  const circles = svg.selectAll("circle")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("r", d => d.radius)
    .attr("fill", "#6c8f6b")
    .attr("opacity", 0.28);

  function ticked() {
    circles
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);
  }

  // Intro text
  svg.append("text")
    .attr("x", TITLE_X)
    .attr("y", TITLE_Y)
    .attr("font-size", 28)
    .attr("font-weight", 700)
    .attr("fill", "#2f3e34")
    .text("Life Flow: Waiting by Organ");

  svg.append("text")
    .attr("x", TITLE_X)
    .attr("y", SUBTITLE_Y)
    .attr("font-size", 15)
    .attr("fill", "#6f6a5f")
    .text("This prototype explores categorical differences in organ waitlist demand.");

  svg.append("text")
    .attr("x", TITLE_X)
    .attr("y", 126)
    .attr("font-size", 15)
    .attr("fill", "#6f6a5f")
    .text("Use the arrow keys to move through scenes.");

  svg.append("text")
    .attr("x", TITLE_X)
    .attr("y", BOTTOM_LABEL_Y)
    .attr("font-size", 11)
    .attr("fill", "#8a8479")
    .text("Prototype • scaled from OPTN/UNOS proportions");
}