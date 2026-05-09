export function runSingleVsMulti() {
  const width = 1200;
  const height = 675;
  const TITLE_X = 40;
  const TITLE_Y = 60;
  const SUBTITLE_Y = 92;
  const LEGEND_Y = height - 80;
  const BOTTOM_LABEL_Y = height - 20;
  const SOURCE_Y = height - 6;
  let nodeSeed = 0;

  function seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

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
    .text("Multi-organ transplants");

  svg.append("text")
    .attr("x", TITLE_X)
    .attr("y", SUBTITLE_Y)
    .attr("font-size", 15)
    .attr("fill", "#6f6a5f")
    .text("Most transplants involve one organ; a small share require multiple organs.");

  svg.append("text")
    .attr("x", TITLE_X)
    .attr("y", SUBTITLE_Y + 20)
    .attr("font-size", 12)
    .attr("fill", "#8a8479")
    .text("Each dot represents about 500 patients.");

  function organicTargets(count, centerX, centerY, maxRadius, minDistance, seedBase) {
    const points = [];
    if (count <= 0) return points;

    const minDistSq = minDistance * minDistance;
    for (let i = 0; i < count; i += 1) {
      let placed = false;
      for (let attempt = 0; attempt < 500; attempt += 1) {
        const rSeed = seedBase + i * 1000 + attempt * 2 + 1;
        const tSeed = seedBase + i * 1000 + attempt * 2 + 2;
        const radius = Math.sqrt(seededRandom(rSeed)) * maxRadius;
        const theta = seededRandom(tSeed) * Math.PI * 2;
        const candidate = {
          x: centerX + Math.cos(theta) * radius,
          y: centerY + Math.sin(theta) * radius
        };

        let overlaps = false;
        for (let j = 0; j < points.length; j += 1) {
          const dx = candidate.x - points[j].x;
          const dy = candidate.y - points[j].y;
          if ((dx * dx) + (dy * dy) < minDistSq) {
            overlaps = true;
            break;
          }
        }
        if (!overlaps) {
          points.push(candidate);
          placed = true;
          break;
        }
      }

      if (!placed) {
        const fallbackTheta = seededRandom(seedBase + i * 7 + 3) * Math.PI * 2;
        const fallbackRadius = Math.sqrt(seededRandom(seedBase + i * 7 + 4)) * maxRadius;
        points.push({
          x: centerX + Math.cos(fallbackTheta) * fallbackRadius,
          y: centerY + Math.sin(fallbackTheta) * fallbackRadius
        });
      }
    }

    return points;
  }

  const singleTargets = organicTargets(194, width * 0.3, height * 0.56, 88, 10.4, 4000);
  const multiTargets = organicTargets(6, width * 0.7, height * 0.56, 24, 10.6, 9000);

  const nodes = [
    ...singleTargets.map(p => ({
      type: "single",
      r: 5,
      startX: width / 2 + (seededRandom(++nodeSeed) - 0.5) * 170,
      startY: height * 0.56 + (seededRandom(++nodeSeed) - 0.5) * 120,
      targetX: p.x,
      targetY: p.y
    })),
    ...multiTargets.map(p => ({
      type: "multi",
      r: 5,
      startX: width / 2 + (seededRandom(++nodeSeed) - 0.5) * 170,
      startY: height * 0.56 + (seededRandom(++nodeSeed) - 0.5) * 120,
      targetX: p.x,
      targetY: p.y
    }))
  ];

  const circles = svg.selectAll("circle")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("cx", d => d.startX)
    .attr("cy", d => d.startY)
    .attr("r", d => d.r)
    .attr("fill", "#8a9096")
    .attr("stroke", "#4f545b")
    .attr("stroke-width", 0.6)
    .attr("opacity", 0.02);

  circles
    .transition()
    .duration(1200)
    .attr("cx", d => d.targetX)
    .attr("cy", d => d.targetY)
    .attr("opacity", 0.85);

  const singleLabel = svg.append("text")
    .attr("x", width * 0.3)
    .attr("y", height * 0.74)
    .attr("text-anchor", "middle")
    .attr("font-size", 18)
    .attr("font-weight", 600)
    .attr("fill", "#2f3e34")
    .attr("opacity", 0)
    .text("Single Organ");

  const multiLabel = svg.append("text")
    .attr("x", width * 0.7)
    .attr("y", height * 0.74)
    .attr("text-anchor", "middle")
    .attr("font-size", 18)
    .attr("font-weight", 600)
    .attr("fill", "#2f3e34")
    .attr("opacity", 0)
    .text("Multi-Organ");

  singleLabel
    .transition()
    .delay(250)
    .duration(500)
    .attr("opacity", 1);

  multiLabel
    .transition()
    .delay(250)
    .duration(500)
    .attr("opacity", 1);

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height - 26)
    .attr("text-anchor", "middle")
    .attr("font-size", 11)
    .attr("fill", "#8a8479")
    .text("← back     next →");

  svg.append("text")
    .attr("x", TITLE_X)
    .attr("y", SOURCE_Y)
    .attr("font-size", 11)
    .attr("fill", "#8a8479")
    .text("Source: Organ Procurement and Transplantation Network (OPTN) and United Network for Organ Sharing (UNOS), 2025");
}