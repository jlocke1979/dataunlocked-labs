import { organColors, storyColors } from "../../constants/colors.js";
import { typography } from "../../constants/typography.js";
import { createStage, drawHeader, drawSource, applyType, STAGE } from "./show_helpers.js";

// PROTOTYPE structure. A single deceased donor can donate up to 8 lifesaving
// organs. Life-year values are illustrative placeholders for evaluating the
// propagation layout; replace with real life-years-gained estimates later.
const ORGANS = [
  { label: "Heart", organ: "Heart", lifeYears: 13 },
  { label: "Lung (L)", organ: "Lung", lifeYears: 6 },
  { label: "Lung (R)", organ: "Lung", lifeYears: 6 },
  { label: "Liver", organ: "Liver", lifeYears: 11 },
  { label: "Kidney (L)", organ: "Kidney", lifeYears: 12 },
  { label: "Kidney (R)", organ: "Kidney", lifeYears: 12 },
  { label: "Pancreas", organ: "Pancreas", lifeYears: 8 },
  { label: "Intestine", organ: "Intestine", lifeYears: 5 }
];

export function runScene6() {
  const container = d3.select("#viz");
  container.selectAll("*").remove();

  const svg = createStage(container);
  drawHeader(svg, {
    sceneLabel: "Scene 6  \u00b7  prototype",
    title: "How much life can one donor create?",
    subtitle: "One donor radiating to as many as eight recipients"
  });

  const cx = (STAGE.contentLeft + STAGE.contentRight) / 2;
  const cy = (STAGE.contentTop + STAGE.contentBottom) / 2 + 6;
  const ringRadius = 188;
  const donorRadius = 38;

  const r = d3.scaleSqrt()
    .domain([0, d3.max(ORGANS, d => d.lifeYears)])
    .range([0, 26]);

  const nodes = ORGANS.map((d, i) => {
    const angle = (i / ORGANS.length) * 2 * Math.PI - Math.PI / 2;
    return {
      ...d,
      x: cx + ringRadius * Math.cos(angle),
      y: cy + ringRadius * Math.sin(angle),
      color: organColors[d.organ] || storyColors.deepSlateHarbor
    };
  });

  // Links from donor to each organ, width scaled by life-years.
  svg.append("g")
    .selectAll("line")
    .data(nodes)
    .join("line")
    .attr("x1", cx)
    .attr("y1", cy)
    .attr("x2", d => d.x)
    .attr("y2", d => d.y)
    .attr("stroke", d => d.color)
    .attr("stroke-opacity", 0.4)
    .attr("stroke-width", d => Math.max(2, d.lifeYears / 2));

  // Organ / recipient nodes.
  const node = svg.append("g")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .attr("transform", d => `translate(${d.x},${d.y})`);

  node.append("circle")
    .attr("r", d => Math.max(10, r(d.lifeYears)))
    .attr("fill", d => d.color)
    .attr("fill-opacity", 0.85);

  node.append("text")
    .attr("text-anchor", d => (Math.abs(d.x - cx) < 2 ? "middle" : d.x < cx ? "end" : "start"))
    .attr("x", d => (Math.abs(d.x - cx) < 2 ? 0 : d.x < cx ? -(r(d.lifeYears) + 8) : r(d.lifeYears) + 8))
    .attr("y", d => (d.y < cy ? -(r(d.lifeYears) + 8) : r(d.lifeYears) + 16))
    .attr("fill", storyColors.textPrimary)
    .call(applyType, typography.label)
    .text(d => `${d.label} \u00b7 ${d.lifeYears}y`);

  // Central donor node.
  svg.append("circle")
    .attr("cx", cx)
    .attr("cy", cy)
    .attr("r", donorRadius)
    .attr("fill", storyColors.charcoalForest);

  svg.append("text")
    .attr("x", cx)
    .attr("y", cy)
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .attr("fill", storyColors.museumWhite)
    .call(applyType, typography.dataValue)
    .text("1 donor");

  const totalLifeYears = d3.sum(ORGANS, d => d.lifeYears);
  applyType(
    svg.append("text")
      .attr("x", STAGE.contentLeft)
      .attr("y", STAGE.contentBottom + 6)
      .attr("fill", storyColors.textSecondary)
      .text(`Up to ${ORGANS.length} organs \u00b7 ~${totalLifeYears} life-years gained (illustrative)`),
    typography.dataValue
  );

  drawSource(svg, "Illustrative prototype \u2014 connect real life-years-gained estimates before locking.");
}
