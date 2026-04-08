import { US_POP, UNIT, TOTAL_DOTS, RENDER_DOTS } from "../constants.js";


function initScene1Situation() {
  const container = d3.select("#viz");
  container.selectAll("*").remove();

  const width = window.innerWidth;
  const height = 700;
  const topPad = 130;

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
    .attr("text-anchor", "start")
    .attr("fill", "#8a9385")
    .attr("font-size", "12px")
    .text("Scene 1 — Situation");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 52)
    .attr("text-anchor", "middle")
    .attr("fill", "#2f3e34")
    .attr("font-size", "28px")
    .attr("font-weight", "600")
    .text("The United States");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 106)
    .attr("text-anchor", "middle")
    .attr("fill", "#6b7568")
    .attr("font-size", "14px")
    .text("Each dot represents 1,000 people");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height - 24)
    .attr("text-anchor", "middle")
    .attr("fill", "#8a9385")
    .attr("font-size", "13px")
    .text(`Rendering ${RENDER_DOTS.toLocaleString()} dots as a visual stand-in`);

  const cloudWidth = Math.min(width * 0.78, 1100);
  const cloudHeight = 430;
  const centerX = width / 2;
  const centerY = topPad + cloudHeight / 2 + 40;

  const dots = [];

  while (dots.length < RENDER_DOTS) {
    const x = (Math.random() * 2 - 1) * (cloudWidth / 2);
    const y = (Math.random() * 2 - 1) * (cloudHeight / 2);

    const ellipseCheck =
      (x * x) / Math.pow(cloudWidth / 2, 2) +
      (y * y) / Math.pow(cloudHeight / 2, 2);

    if (ellipseCheck <= 1) {
      dots.push({
        x: centerX + x,
        y: centerY + y,
        r: 1.2 + Math.random() * 0.3
      });
    }
  }

  d3.shuffle(dots);

  const WAITLIST_RENDER_COUNT = Math.round(RENDER_DOTS * (103000 / 340000000));

  dots.forEach((d, i) => {
    d.isWaitlist = i < WAITLIST_RENDER_COUNT;
  });

  const circles = svg.selectAll(".person-dot")
    .data(dots)
    .enter()
    .append("circle")
    .attr("class", "person-dot")
    .attr("cx", centerX)
    .attr("cy", centerY)
    .attr("r", 0)
    .attr("fill", "#526b5c")
    .attr("opacity", 0.55);

  circles.transition()
    .delay((d, i) => i * 0.15)
    .duration(900)
    .ease(d3.easeCubicOut)
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", d => d.r);

  setTimeout(() => {
    svg.selectAll(".person-dot")
      .transition()
      .duration(1200)
      .attr("opacity", d => d.isWaitlist ? 1 : 0.08)
      .attr("fill", d => d.isWaitlist ? "#b85c5c" : "#526b5c");
  }, 1800);

  setTimeout(() => {
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", centerY + cloudHeight / 2 + 60)
      .attr("text-anchor", "middle")
      .attr("fill", "#2f3e34")
      .attr("font-size", "18px")
      .text("About 100,000 people are waiting for a transplant");
  }, 2200);

  console.log("Scene 1 situation initialized");
}

export function runScene1() {
  initScene1Situation();
}