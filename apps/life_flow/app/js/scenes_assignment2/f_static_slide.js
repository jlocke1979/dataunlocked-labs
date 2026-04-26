export function runStaticSlide() {
  const width = 1200;
  const height = 675;
  const TITLE_X = 40;
  const TITLE_Y = 60;
  const SUBTITLE_Y = 92;
  const LEGEND_Y = height - 80;
  const BOTTOM_LABEL_Y = height - 20;
  const SOURCE_Y = height - 6;
  const color = {
    Kidney: "#4E79A7",
    Liver: "#A05A2C",
    Heart: "#C44E52",
    Lung: "#59A14F",
    Pancreas: "#B07AA1",
    Intestine: "#9C755F",
    VCA: "#8A8A8A",
    Other: "#8A8A8A"
  };

  const svg = d3.select("#vis")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  svg.append("text")
    .attr("x", TITLE_X)
    .attr("y", TITLE_Y)
    .attr("font-size", 28)
    .attr("font-weight", 700)
    .attr("fill", "#2f3e34")
    .text("Rare, but complex");

  svg.append("text")
    .attr("x", TITLE_X)
    .attr("y", SUBTITLE_Y)
    .attr("font-size", 15)
    .attr("fill", "#6f6a5f")
    .text("Some patients need coordinated multi-organ transplants.");

  const combinations = [
    { organs: ["Intestine", "Pancreas"], label: "Intestine + Pancreas", count2025: 6 },
    { organs: ["Kidney", "Heart"], label: "Kidney + Heart", count2025: 361 },
    { organs: ["Kidney", "Heart", "Lung"], label: "Kidney + Heart + Lung", count2025: 1 },
    { organs: ["Kidney", "Intestine"], label: "Kidney + Intestine", count2025: 3 },
    { organs: ["Kidney", "Lung"], label: "Kidney + Lung", count2025: 16 },
    { organs: ["Liver", "Heart"], label: "Liver + Heart", count2025: 92 },
    { organs: ["Liver", "Intestine"], label: "Liver + Intestine", count2025: 1 },
    { organs: ["Liver", "Intestine", "Pancreas"], label: "Liver + Intestine + Pancreas", count2025: 37 },
    { organs: ["Liver", "Kidney"], label: "Liver + Kidney", count2025: 864 },
    { organs: ["Liver", "Kidney", "Heart"], label: "Liver + Kidney + Heart", count2025: 9 },
    { organs: ["Liver", "Kidney", "Intestine", "Pancreas"], label: "Liver + Kidney + Intestine + Pancreas", count2025: 5 },
    { organs: ["Liver", "Lung"], label: "Liver + Lung", count2025: 39 },
    { organs: ["Liver", "Pancreas"], label: "Liver + Pancreas", count2025: 1 },
    { organs: ["VCA", "Kidney"], label: "VCA + Kidney", count2025: 1 }
  ];
  combinations.sort((a, b) => b.count2025 - a.count2025);

  const gridStartX = 110;
  const gridStartY = 180;
  const colGap = 210;
  const rowGap = 145;
  const cols = 5;

  const maxCount = d3.max(combinations, d => d.count2025) || 1;
  const maxRadius = 70;
  const minRadius = 6;
  const bubbleRadius = d => Math.max(minRadius, Math.sqrt(d.count2025 / maxCount) * maxRadius);

  const comboGroups = svg.selectAll("g.combo-bubble")
    .data(combinations)
    .enter()
    .append("g")
    .attr("class", "combo-bubble")
    .attr("transform", (d, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      return `translate(${gridStartX + col * colGap}, ${gridStartY + row * rowGap})`;
    });

  const pie = d3.pie().value(1).sort(null);

  comboGroups.each(function(d) {
    const g = d3.select(this);
    const radius = bubbleRadius(d);
    const innerBubbleRadius = Math.max(2, radius - 1);
    const arc = d3.arc().innerRadius(0).outerRadius(innerBubbleRadius);

    g.selectAll("path.combo-slice")
      .data(pie(d.organs))
      .enter()
      .append("path")
      .attr("class", "combo-slice")
      .attr("d", arc)
      .attr("fill", p => color[p.data]);

    g.append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", radius)
      .attr("fill", "none")
      .attr("stroke", "#c7c1b4")
      .attr("stroke-width", 1);
  });

  comboGroups.append("text")
    .attr("x", 0)
    .attr("y", d => bubbleRadius(d) + 18)
    .attr("text-anchor", "middle")
    .attr("font-size", 11)
    .attr("fill", "#2f3e34")
    .text(d => d.label);

  comboGroups.append("text")
    .attr("x", 0)
    .attr("y", d => bubbleRadius(d) + 32)
    .attr("text-anchor", "middle")
    .attr("font-size", 10)
    .attr("fill", "#8a8479")
    .text(d => `n=${d.count2025}`);

  svg.append("text")
    .attr("x", TITLE_X)
    .attr("y", height - 44)
    .attr("font-size", 10)
    .attr("fill", "#8a8479")
    .text("Bubble area represents count; minimum size used for visibility.");

  svg.append("text")
    .attr("x", TITLE_X)
    .attr("y", SOURCE_Y)
    .attr("font-size", 11)
    .attr("fill", "#8a8479")
    .text("Source: Organ Procurement and Transplantation Network (OPTN) and United Network for Organ Sharing (UNOS)");
}