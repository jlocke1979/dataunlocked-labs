import { organColors } from "../../constants/colors.js";

export function runB2MinorOrgans(data) {
  const width = 1200;
  const height = 700;
  const margin = { top: 100, right: 240, bottom: 70, left: 100 };
  const duration = 1000;

  const minorOrgans = [
    "Pancreas",
    "Kidney / Pancreas",
    "Heart / Lung",
    "Intestine",
    "VCA - abdominal wall",
    "VCA - external male genitalia",
    "VCA - head and neck",
    "VCA - other genitourinary organ",
    "VCA - upper limb",
    "VCA - uterus"
  ];

  const filtered = data
    .filter(d =>
      d.donor_type === "All Donor Types" &&
      minorOrgans.includes(d.organ) &&
      d.year <= 2025
    )
    .sort((a, b) => a.year - b.year);

  const grouped = d3.groups(filtered, d => d.organ);

  d3.select("#viz").html("");

  const container = d3.select("#viz");

  container.append("div")
    .style("margin", "0 0 8px 100px")
    .style("font-family", "sans-serif")
    .style("font-size", "13px")
    .html(`
      <span style="color:#888;">Total</span> <span style="color:#ddd;">·</span>
      <span style="color:#888;">Major</span> <span style="color:#ddd;">·</span>
      <span style="font-weight:700;color:#222;">Minor</span> <span style="color:#ddd;">·</span>
      <span style="color:#888;">Rare</span>
    `);

  const svg = container.append("svg")
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
    .text("Minor Organ Categories");

  svg.append("text")
    .attr("x", margin.left)
    .attr("y", 56)
    .attr("font-size", "15px")
    .attr("fill", "#555")
    .text("All minor organs on shared scale, 1988–2025");

  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")).ticks(10));

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

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

  const lineLayer = svg.append("g");
  const labelLayer = svg.append("g");
  const leaderLayer = svg.append("g");

  // Draw all lines
  grouped.forEach(([organ, values]) => {
    const color = organColors[organ] || "#888";

    lineLayer.append("path")
      .datum(values)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 2.5)
      .attr("d", line);
  });

  // Collect all label positions for vertical repelling
  const labelData = grouped.map(([organ, values]) => {
    const lastPoint = values[values.length - 1];
    return {
      organ,
      x: x(lastPoint.year),
      y: y(lastPoint.transplants),
      color: organColors[organ] || "#888",
      values
    };
  });

  // Apply vertical repelling algorithm
  function repelLabels(labels, targetSpacing = 20) {
    const sorted = [...labels].sort((a, b) => a.y - b.y);
    const adjusted = sorted.map(d => ({ ...d, adjustedY: d.y }));

    // Simple repelling: move overlapping labels apart
    for (let i = 0; i < adjusted.length - 1; i++) {
      const current = adjusted[i];
      const next = adjusted[i + 1];
      const spacing = next.adjustedY - current.adjustedY;

      if (spacing < targetSpacing) {
        const gap = targetSpacing - spacing;
        current.adjustedY -= gap / 2;
        next.adjustedY += gap / 2;
      }
    }

    return adjusted;
  }

  const adjustedLabels = repelLabels(labelData);

  // Draw leader lines and labels
  adjustedLabels.forEach((d) => {
    const labelY = d.adjustedY;

    // Draw light gray leader line from label position to line endpoint
    leaderLayer.append("line")
      .attr("x1", d.x)
      .attr("y1", d.y)
      .attr("x2", d.x + 8)
      .attr("y2", labelY)
      .attr("stroke", "#ccc")
      .attr("stroke-width", 1)
      .attr("opacity", 0.7);

    // Draw label background for readability
    const labelText = d.organ.replace("VCA - ", "");

    labelLayer.append("rect")
      .attr("x", d.x + 10)
      .attr("y", labelY - 7)
      .attr("width", labelText.length * 5.5 + 4)
      .attr("height", 14)
      .attr("fill", "white")
      .attr("opacity", 0.85);

    // Draw label text
    labelLayer.append("text")
      .attr("x", d.x + 12)
      .attr("y", labelY)
      .attr("font-size", "11px")
      .attr("fill", d.color)
      .attr("font-weight", "500")
      .attr("alignment-baseline", "middle")
      .text(labelText);
  });

  // Clean up any previous scene's listener
  if (window.__currentSceneHandler) {
    window.removeEventListener("keydown", window.__currentSceneHandler, true);
  }
}
