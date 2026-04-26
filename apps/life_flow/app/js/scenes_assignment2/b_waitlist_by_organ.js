import { WAITLIST_CATEGORIES, WAITLIST_COLORS, getSharedWaitlistNodes } from "./shared_waitlist_nodes.js";

export function runWaitlistByOrgan() {
  console.log("Scene 2: runWaitlistByOrgan is running");

  const width = 1200;
  const height = 675;
  const TITLE_X = 40;
  const TITLE_Y = 60;
  const SUBTITLE_Y = 92;
  const LEGEND_Y = height - 80;
  const BOTTOM_LABEL_Y = height - 20;
  const SOURCE_Y = height - 6;

  d3.select("#vis").selectAll("*").remove();

  const svg = d3.select("#vis")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const categories = WAITLIST_CATEGORIES;
  const color = WAITLIST_COLORS;
  const cloudCenter = { x: 600, y: 337.5 };
  const cloudCompactFactor = 0.82;
  const nodes = getSharedWaitlistNodes().map(d => ({
    organ: d.organ,
    radius: d.radius,
    x: cloudCenter.x + (d.initialX - cloudCenter.x) * cloudCompactFactor,
    y: cloudCenter.y + (d.initialY - cloudCenter.y) * cloudCompactFactor
  }));

  // Title
  svg.append("text")
    .attr("x", TITLE_X)
    .attr("y", TITLE_Y)
    .attr("font-size", 28)
    .attr("font-weight", 700)
    .attr("fill", "#2f3e34")
    .text("Patients join the waitlist");

  // Subtitle
  svg.append("text")
    .attr("x", TITLE_X)
    .attr("y", SUBTITLE_Y)
    .attr("font-size", 15)
    .attr("fill", "#6f6a5f")
    .text("Each dot represents about 500 patients.");

  // Legend
  const legend = svg.append("g")
    .attr("transform", `translate(${TITLE_X}, ${LEGEND_Y})`);

  const legendItems = legend.selectAll("g.legend-item")
    .data(categories)
    .enter()
    .append("g")
    .attr("class", "legend-item")
    .attr("transform", (d, i) => {
      const columns = 4;
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

  // Circles
  const circles = svg.selectAll("circle.patient")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("class", "patient")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", d => {
      const normalized = Math.max(0, Math.min(1, (d.radius - 4) / 2));
      return 3.5 + normalized;
    })
    .attr("fill", "#8a9096")
    .attr("opacity", 0.62)
    .attr("stroke", "#2f3e34")
    .attr("stroke-width", 0.5)
    .style("cursor", "default");

  circles
    .transition()
    .delay(150)
    .duration(650)
    .attr("opacity", 0.7);

  circles
    .transition()
    .delay(280)
    .duration(950)
    .attr("fill", d => color[d.organ]);

  svg.append("text")
    .attr("x", TITLE_X)
    .attr("y", SOURCE_Y)
    .attr("font-size", 11)
    .attr("fill", "#8a8479")
    .text("Source: Organ Procurement and Transplantation Network (OPTN) and United Network for Organ Sharing (UNOS)");
}