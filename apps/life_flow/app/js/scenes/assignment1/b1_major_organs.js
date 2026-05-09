console.log("RUNNING b1_major_organs.js");

import { organColors } from "../../constants/colors.js";

export function runB1MajorOrgans(data) {
  const width = 1200;
  const height = 700;
  const margin = { top: 80, right: 180, bottom: 70, left: 100 };

  const majorOrgans = ["Kidney", "Liver", "Heart", "Lung"];

  const filtered = data
    .filter(d =>
      d.donor_type === "All Donor Types" &&
      majorOrgans.includes(d.organ) &&
      d.year <= 2025
    )
    .sort((a, b) => a.year - b.year);

  const grouped = d3.groups(filtered, d => d.organ);

  d3.select("#viz").html("");

  const svg = d3.select("#viz")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const x = d3.scaleLinear()
    .domain(d3.extent(filtered, d => d.year))
    .range([margin.left, width - margin.right]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(filtered, d => d.transplants)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const line = d3.line()
    .x(d => x(d.year))
    .y(d => y(d.transplants));

  svg.append("text")
    .attr("x", margin.left)
    .attr("y", 32)
    .attr("font-size", "26px")
    .attr("font-weight", "700")
    .text("B. Major Organ Categories Drive Most Transplant Volume");

  svg.append("text")
    .attr("x", margin.left)
    .attr("y", 56)
    .attr("font-size", "15px")
    .attr("fill", "#555")
    .text("All donor types, 1988–2025 full years");

  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(
      d3.axisBottom(x)
        .tickFormat(d3.format("d"))
        .ticks(10)
    );

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  grouped.forEach(([organ, values]) => {
    const color = organColors[organ] || "#888";

    svg.append("path")
      .datum(values)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 3)
      .attr("d", line);

    const lastPoint = values[values.length - 1];

    svg.append("circle")
      .attr("cx", x(lastPoint.year))
      .attr("cy", y(lastPoint.transplants))
      .attr("r", 4)
      .attr("fill", color);

    svg.append("text")
      .attr("x", x(lastPoint.year) + 8)
      .attr("y", y(lastPoint.transplants))
      .attr("font-size", "13px")
      .attr("fill", color)
      .attr("alignment-baseline", "middle")
      .text(organ);
  });

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height - 20)
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .text("Year");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", 24)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .text("Number of Transplants");
  
  const note = svg.append("text")
  .attr("x", width - margin.right - 20)
  .attr("y", margin.top + 20)
  .attr("text-anchor", "end")
  .attr("font-size", "13px")
  .attr("fill", "#444");

}
