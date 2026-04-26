import { WAITLIST_CATEGORIES, WAITLIST_COLORS } from "./shared_waitlist_nodes.js";

export function runWaitlistVsTransplants() {
  const width = 1200;
  const height = 675;
  const TITLE_X = 40;
  const TITLE_Y = 60;
  const SUBTITLE_Y = 92;
  const BOTTOM_LABEL_Y = height - 20;
  const SOURCE_Y = height - 6;

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
    .text("Waitlist vs Transplants");

  svg.append("text")
    .attr("x", TITLE_X)
    .attr("y", SUBTITLE_Y)
    .attr("font-size", 15)
    .attr("fill", "#6f6a5f")
    .text("Within each organ category, need exceeds completed transplants.");

  svg.append("text")
    .attr("x", TITLE_X)
    .attr("y", SUBTITLE_Y + 20)
    .attr("font-size", 12)
    .attr("fill", "#8a8479")
    .text("Each dot represents about 500 patients.");

  const categories = WAITLIST_CATEGORIES;
  const color = WAITLIST_COLORS;
  const transplantCounts = {
    Kidney: 45,
    Liver: 6,
    Heart: 2,
    Lung: 1,
    Pancreas: 1,
    Intestine: 0,
    Other: 1
  };
  const labelX = 120;
  const waitlistX = 500;
  const transplantX = 830;
  const rowStartY = 170;
  const rowGap = 62;
  const DOT_R = 4;
  const DOT_STEP = 10;
  let nodeSeed = 0;

  function seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  function gridPoints(count, centerX, centerY, cols) {
    const rows = Math.max(1, Math.ceil(count / cols));
    const startX = centerX - ((Math.min(cols, count) - 1) * DOT_STEP) / 2;
    const startY = centerY - ((rows - 1) * DOT_STEP) / 2;
    return d3.range(count).map(i => ({
      x: startX + (i % cols) * DOT_STEP,
      y: startY + Math.floor(i / cols) * DOT_STEP
    }));
  }

  const nodes = categories.flatMap((cat, rowIdx) => {
    const y = rowStartY + rowIdx * rowGap;
    const tCount = transplantCounts[cat.organ] || 0;
    const wCount = Math.max(0, cat.count - tCount);

    const waitlistNodes = gridPoints(wCount, waitlistX, y, 18).map(p => ({
      ...(() => {
        const r1 = seededRandom(++nodeSeed);
        const r2 = seededRandom(++nodeSeed);
        return {
          startX: width / 2 + (r1 - 0.5) * 180,
          startY: height * 0.52 + (r2 - 0.5) * 120
        };
      })(),
      organ: cat.organ,
      side: "waitlist",
      x: p.x,
      y: p.y
    }));

    const transplantNodes = gridPoints(tCount, transplantX, y, 10).map(p => ({
      ...(() => {
        const r1 = seededRandom(++nodeSeed);
        const r2 = seededRandom(++nodeSeed);
        return {
          startX: width / 2 + (r1 - 0.5) * 180,
          startY: height * 0.52 + (r2 - 0.5) * 120
        };
      })(),
      organ: cat.organ,
      side: "transplants",
      x: p.x,
      y: p.y
    }));

    return [...waitlistNodes, ...transplantNodes];
  });

  const circles = svg.selectAll("circle")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("cx", d => d.startX)
    .attr("cy", d => d.startY)
    .attr("r", DOT_R)
    .attr("fill", d => color[d.organ])
    .attr("stroke", d => d.side === "transplants" ? "#f5f1e8" : "#2f3e34")
    .attr("stroke-width", d => d.side === "transplants" ? 0.9 : 0.5)
    .attr("opacity", 0.02);

  circles
    .transition()
    .duration(1200)
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("opacity", d => d.side === "transplants" ? 0.78 : 0.7);

  svg.append("line")
    .attr("x1", (waitlistX + transplantX) / 2)
    .attr("x2", (waitlistX + transplantX) / 2)
    .attr("y1", rowStartY - 42)
    .attr("y2", rowStartY + (categories.length - 1) * rowGap + 22)
    .attr("stroke", "#b7b3ab")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "3,5")
    .attr("opacity", 0.8);

  svg.selectAll("text.organ-label")
    .data(categories)
    .enter()
    .append("text")
    .attr("class", "organ-label")
    .attr("x", labelX)
    .attr("y", (d, i) => rowStartY + i * rowGap + 4)
    .attr("font-size", 12)
    .attr("fill", "#2f3e34")
    .attr("opacity", 0)
    .text(d => d.organ);

  const waitlistLabel = svg.append("text")
    .attr("x", waitlistX)
    .attr("y", rowStartY - 56)
    .attr("text-anchor", "middle")
    .attr("font-size", 12)
    .attr("fill", "#6f6a5f")
    .attr("opacity", 0)
    .text("Waitlist");

  const transplantsLabel = svg.append("text")
    .attr("x", transplantX)
    .attr("y", rowStartY - 56)
    .attr("text-anchor", "middle")
    .attr("font-size", 12)
    .attr("fill", "#6f6a5f")
    .attr("opacity", 0)
    .text("Transplants");

  svg.selectAll("text.organ-label")
    .transition()
    .delay(250)
    .duration(500)
    .attr("opacity", 1);

  waitlistLabel
    .transition()
    .delay(250)
    .duration(500)
    .attr("opacity", 1);

  transplantsLabel
    .transition()
    .delay(250)
    .duration(500)
    .attr("opacity", 1);

  svg.append("text")
    .attr("x", TITLE_X)
    .attr("y", SOURCE_Y)
    .attr("font-size", 11)
    .attr("fill", "#8a8479")
    .text("Source: Organ Procurement and Transplantation Network (OPTN) and United Network for Organ Sharing (UNOS)");
}