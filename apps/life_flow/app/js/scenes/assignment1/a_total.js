export function runATotal(data) {
  const width = 1100;
  const height = 600;
  const margin = { top: 70, right: 80, bottom: 70, left: 100 };

  const filtered = data
    .filter(d =>
      d.donor_type === "All Donor Types" &&
      d.organ === "All Organs" &&
      d.year <= 2025
    )
    .sort((a, b) => a.year - b.year);

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

  // Title
  svg.append("text")
    .attr("x", margin.left)
    .attr("y", 32)
    .attr("font-size", "26px")
    .attr("font-weight", "700")
    .text("U.S. Organ Transplants Have Increased Sharply Since 1988");

  // Subtitle
  svg.append("text")
    .attr("x", margin.left)
    .attr("y", 56)
    .attr("font-size", "15px")
    .attr("fill", "#555")
    .text("All donor types, all organs, 1988–2025");

  // Axes
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

  // Line
  svg.append("path")
    .datum(filtered)
    .attr("fill", "none")
    .attr("stroke", "#1f4e79")
    .attr("stroke-width", 3)
    .attr("d", line);

  // Axis labels
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
    .attr("font-size", "14px")
    .text("Number of Transplants");
}
