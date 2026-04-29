import { organColors } from "../constants/colors.js";

export function runBAllOrgans(data) {
  const width = 1200;
  const height = 700;
  const margin = { top: 80, right: 220, bottom: 70, left: 100 };

  const filtered = data
    .filter(d =>
      d.donor_type === "All Donor Types" &&
      d.organ !== "All Organs" &&
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
    .text("B. Organ-Level View Shows Why Simplification Is Needed");

  svg.append("text")
    .attr("x", margin.left)
    .attr("y", 56)
    .attr("font-size", "15px")
    .attr("fill", "#555")
    .text("All donor types, 1988–2025; label overlap reflects visual clutter");

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
    const lastPoint = values[values.length - 1];

    svg.append("path")
      .datum(values)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 2)
      .attr("opacity", 0.9)
      .attr("d", line);

    svg.append("text")
      .attr("x", x(lastPoint.year) + 8)
      .attr("y", y(lastPoint.transplants))
      .attr("font-size", "11px")
      .attr("fill", color)
      .attr("alignment-baseline", "middle")
      .text(organ);
  });

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height - 20)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .text("Year");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", 24)
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .text("Number of Transplants");
}