import { organColors } from "../constants/colors.js";

export function runB3MicroOrgans(data) {
  const width = 1200;
  const height = 700;
  const margin = { top: 100, right: 240, bottom: 70, left: 100 };

  const vcaOrgans = [
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
      vcaOrgans.includes(d.organ) &&
      d.year <= 2025
    )
    .sort((a, b) => a.year - b.year);

  const grouped = d3.groups(filtered, d => d.organ);

  d3.select("#viz").html("");

  const container = d3.select("#viz")
    .style("position", "relative");

  const breadcrumb = container
    .append("div")
    .style("position", "absolute")
    .style("bottom", "-78px")
    .style("left", "0")
    .style("width", "100%")
    .style("display", "flex")
    .style("justify-content", "center")
    .style("gap", "8px");

  // Scene 1: a_to_b1 (dots 1-3) - all gray
  for (let i = 0; i < 3; i++) {
    breadcrumb.append("div")
      .style("width", "6px")
      .style("height", "6px")
      .style("border-radius", "50%")
      .style("background-color", "#ccc");
  }

  // Scene 2: b1_to_b2 (dots 4-6) - all gray
  for (let i = 0; i < 3; i++) {
    breadcrumb.append("div")
      .style("width", "6px")
      .style("height", "6px")
      .style("border-radius", "50%")
      .style("background-color", "#ccc");
  }

  // Scene 3: b2_to_b3 (dots 7-9) - all gray
  for (let i = 0; i < 3; i++) {
    breadcrumb.append("div")
      .style("width", "6px")
      .style("height", "6px")
      .style("border-radius", "50%")
      .style("background-color", "#ccc");
  }

  // Scene 4: b3_micro (dots 10-12) - final state fully active
  breadcrumb.append("div")
    .style("width", "6px")
    .style("height", "6px")
    .style("border-radius", "50%")
    .style("background-color", "#ccc");
  breadcrumb.append("div")
    .style("width", "6px")
    .style("height", "6px")
    .style("border-radius", "50%")
    .style("background-color", "#ccc");
  breadcrumb.append("div")
    .style("width", "6px")
    .style("height", "6px")
    .style("border-radius", "50%")
    .style("background-color", "#333");

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

  function shortLabel(organ) {
    return organ
      .replace("VCA - ", "")
      .replace("external male genitalia", "male genitalia")
      .replace("other genitourinary organ", "GU organ");
  }

  function computeRepelledLabels(groups) {
    const labels = groups.map(([organ, values]) => {
      const lastPoint = values[values.length - 1];
      return {
        organ,
        values,
        x1: x(lastPoint.year),
        y1: y(lastPoint.transplants),
        x2: width - margin.right + 10,
        y2: y(lastPoint.transplants),
        text: shortLabel(organ)
      };
    }).sort((a, b) => a.y2 - b.y2);

    const minGap = 14;
    const topBound = margin.top + 6;
    const bottomBound = height - margin.bottom - 6;

    for (let i = 0; i < labels.length; i++) {
      if (i === 0) {
        labels[i].y2 = Math.max(labels[i].y2, topBound);
      } else {
        labels[i].y2 = Math.max(labels[i].y2, labels[i - 1].y2 + minGap);
      }
    }

    for (let i = labels.length - 2; i >= 0; i--) {
      if (labels[i + 1].y2 > bottomBound) {
        labels[i + 1].y2 = bottomBound;
      }
      if (labels[i + 1].y2 - labels[i].y2 < minGap) {
        labels[i].y2 = labels[i + 1].y2 - minGap;
      }
    }

    labels.forEach(d => {
      d.y2 = Math.max(topBound, Math.min(bottomBound, d.y2));
    });

    return labels;
  }

  svg.append("text")
    .attr("x", margin.left)
    .attr("y", 32)
    .attr("font-size", "26px")
    .attr("font-weight", "700")
    .text("Rare Transplant Categories Need a Micro View");

  svg.append("text")
    .attr("x", margin.left)
    .attr("y", 56)
    .attr("font-size", "15px")
    .attr("fill", "#555")
    .text("The rarest transplant types remain uncommon, though some have appeared more often in recent years");

  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")).ticks(10));

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  // draw lines first
  grouped.forEach(([organ, values]) => {
    const color = organColors[organ] || "#888";

    svg.append("path")
      .datum(values)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 2.5)
      .attr("d", line);
  });

  // compute repelled label positions
  const labels = computeRepelledLabels(grouped);

  // leader lines
  svg.selectAll(".label-leader")
    .data(labels)
    .enter()
    .append("line")
    .attr("class", "label-leader")
    .attr("x1", d => d.x1)
    .attr("y1", d => d.y1)
    .attr("x2", d => d.x2 - 4)
    .attr("y2", d => d.y2)
    .attr("stroke", "#bbb")
    .attr("stroke-width", 1);

    
  // text labels
  svg.selectAll(".series-label")
    .data(labels)
    .enter()
    .append("text")
    .attr("class", "series-label")
    .attr("x", d => d.x2)
    .attr("y", d => d.y2)
    .attr("font-size", "11px")
    .attr("fill", d => organColors[d.organ] || "#888")
    .attr("alignment-baseline", "middle")
    .text(d => d.text);

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