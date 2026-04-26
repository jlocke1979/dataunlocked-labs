import { WAITLIST_CATEGORIES, WAITLIST_COLORS, getSharedWaitlistNodes } from "./shared_waitlist_nodes.js";

export function runTransplantsByOrgan() {
  const width = 1200;
  const height = 675;
  const TITLE_X = 40;
  const TITLE_Y = 60;
  const SUBTITLE_Y = 92;
  const LEGEND_Y = height - 80;
  const BOTTOM_LABEL_Y = height - 20;
  const SOURCE_Y = height - 6;

  const svg = d3.select("#vis")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const categories = WAITLIST_CATEGORIES;
  const color = WAITLIST_COLORS;
  const sharedNodes = getSharedWaitlistNodes();
  const cloudCenter = { x: 600, y: 337.5 };
  const cloudCompactFactor = 0.82;
  const rowYOffset = 34;
  const kidneyYOffset = 36;
  const secondRowXOffset = 100;
  const secondRowOrgans = new Set(["Pancreas", "Intestine", "Other"]);
  const goldenAngle = (137.5 * Math.PI) / 180;
  const spiralSpacing = 8.5;
  const spiralJitter = 2.2;
  const seededNoise = seed => {
    const x = Math.sin(seed * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };
  const organCenters = {};
  categories.forEach(cat => {
    const groupNodes = sharedNodes.filter(n => n.organ === cat.organ);
    const cx = d3.mean(groupNodes, n => n.targetX);
    const cy = d3.mean(groupNodes, n => n.targetY);
    organCenters[cat.organ] = { x: cx, y: cy };
  });

  const nodes = [];
  categories.forEach(cat => {
    const center = organCenters[cat.organ];
    const rowXOffset = secondRowOrgans.has(cat.organ) ? secondRowXOffset : 0;
    const groupNodes = sharedNodes.filter(n => n.organ === cat.organ);
    const placed = [];
    groupNodes.forEach((d, i) => {
      const angle = i * goldenAngle;
      let radialDistance = spiralSpacing * Math.sqrt(i);
      const jitterAngle = seededNoise((cat.organ.length * 1000) + i + 1) * Math.PI * 2;
      const jitterRadius = (seededNoise((cat.organ.length * 2000) + i + 1) - 0.5) * 2 * spiralJitter;
      const baseOffsetY = rowYOffset + (cat.organ === "Kidney" ? kidneyYOffset : 0);
      let targetX = center.x + rowXOffset + Math.cos(angle) * radialDistance + Math.cos(jitterAngle) * jitterRadius;
      let targetY = center.y + Math.sin(angle) * radialDistance + Math.sin(jitterAngle) * jitterRadius + baseOffsetY;

      for (let attempt = 0; attempt < 80; attempt += 1) {
        let hasOverlap = false;
        for (let j = 0; j < placed.length; j += 1) {
          const p = placed[j];
          const dx = targetX - p.x;
          const dy = targetY - p.y;
          const minDist = d.radius + p.radius + 0.25;
          if ((dx * dx) + (dy * dy) < (minDist * minDist)) {
            hasOverlap = true;
            break;
          }
        }
        if (!hasOverlap) break;
        radialDistance += 1.4;
        targetX = center.x + rowXOffset + Math.cos(angle) * radialDistance + Math.cos(jitterAngle) * jitterRadius;
        targetY = center.y + Math.sin(angle) * radialDistance + Math.sin(jitterAngle) * jitterRadius + baseOffsetY;
      }

      placed.push({ x: targetX, y: targetY, radius: d.radius });
      nodes.push({
        organ: d.organ,
        radius: d.radius,
        x: cloudCenter.x + (d.initialX - cloudCenter.x) * cloudCompactFactor,
        y: cloudCenter.y + (d.initialY - cloudCenter.y) * cloudCompactFactor,
        targetX,
        targetY
      });
    });
  });

  svg.append("text")
    .attr("x", TITLE_X)
    .attr("y", TITLE_Y)
    .attr("font-size", 28)
    .attr("font-weight", 700)
    .attr("fill", "#2f3e34")
    .text("Organ Transplants Waitlist by Organ");

  svg.append("text")
    .attr("x", TITLE_X)
    .attr("y", SUBTITLE_Y)
    .attr("font-size", 15)
    .attr("fill", "#6f6a5f")
    .text("Each dot represents about 500 patients.");

  const circles = svg.selectAll("circle.transplant")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("class", "transplant")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", d => {
      const normalized = Math.max(0, Math.min(1, (d.radius - 4) / 2));
      return 3.5 + normalized;
    })
    .attr("fill", d => color[d.organ])
    .attr("stroke", "#2f3e34")
    .attr("stroke-width", 0.5)
    .attr("opacity", 0.7);

  const groupLabels = svg.selectAll("text.organ-group-label")
    .data(categories)
    .enter()
    .append("text")
    .attr("class", "organ-group-label")
    .attr("x", d => nodes.find(n => n.organ === d.organ).targetX)
    .attr("y", d => {
      const isTopRow = ["Kidney", "Liver", "Heart", "Lung"].includes(d.organ);
      const targetY = nodes.find(n => n.organ === d.organ).targetY;
      const baseY = isTopRow ? targetY - 120 : targetY - 24;
      return d.organ === "Kidney" ? baseY - 14 : baseY;
    })
    .attr("text-anchor", "middle")
    .attr("font-size", 12)
    .attr("fill", "#2f3e34")
    .attr("opacity", 0)
    .text(d => d.organ);

  setTimeout(() => {
    circles
      .transition()
      .duration(1200)
      .attr("cx", d => d.targetX)
      .attr("cy", d => d.targetY);

    groupLabels
      .transition()
      .delay(150)
      .duration(700)
      .attr("opacity", 1);
  }, 1000);

  svg.append("text")
    .attr("x", TITLE_X)
    .attr("y", SOURCE_Y)
    .attr("font-size", 11)
    .attr("fill", "#8a8479")
    .text("Source: Organ Procurement and Transplantation Network (OPTN) and United Network for Organ Sharing (UNOS)");
}