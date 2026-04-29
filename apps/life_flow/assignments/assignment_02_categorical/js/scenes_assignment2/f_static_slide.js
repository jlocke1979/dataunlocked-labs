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
    .text("Multi-Organ Transplants");

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

  const listStartY = 150;
  const rowGap = 34;
  const ICON_X = 74;
  const LABEL_X = 110;
  const MATRIX_X = 430;
  const MOLECULE_DOT_R = 4.8;
  const COUNT_DOT_R = 2.6;
  const CASES_PER_DOT = 20;
  const MATRIX_COLS = 12;
  const MATRIX_DOT_GAP_X = 8;
  const MATRIX_DOT_GAP_Y = 8;

  function moleculeOffsets(count) {
    if (count === 2) {
      return [
        { x: -MOLECULE_DOT_R, y: 0 },
        { x: MOLECULE_DOT_R, y: 0 }
      ];
    }
    if (count === 3) {
      return [
        { x: 0, y: -MOLECULE_DOT_R * 1.2 },
        { x: -MOLECULE_DOT_R, y: MOLECULE_DOT_R * 0.75 },
        { x: MOLECULE_DOT_R, y: MOLECULE_DOT_R * 0.75 }
      ];
    }
    return [
      { x: -MOLECULE_DOT_R, y: -MOLECULE_DOT_R },
      { x: MOLECULE_DOT_R, y: -MOLECULE_DOT_R },
      { x: -MOLECULE_DOT_R, y: MOLECULE_DOT_R },
      { x: MOLECULE_DOT_R, y: MOLECULE_DOT_R }
    ];
  }

  const comboGroups = svg.selectAll("g.combo-row")
    .data(combinations)
    .enter()
    .append("g")
    .attr("class", "combo-row")
    .attr("transform", (d, i) => {
      return `translate(0, ${listStartY + i * rowGap})`;
    });

  comboGroups.each(function(d) {
    const g = d3.select(this);
    const offsets = moleculeOffsets(d.organs.length);
    const moleculeDots = d.organs.map((organ, i) => ({
      organ,
      x: offsets[i].x,
      y: offsets[i].y
    }));

    g.selectAll("circle.molecule-dot")
      .data(moleculeDots)
      .enter()
      .append("circle")
      .attr("class", "molecule-dot")
      .attr("cx", ICON_X)
      .attr("cy", 0)
      .attr("r", MOLECULE_DOT_R)
      .attr("transform", p => `translate(${p.x}, ${p.y})`)
      .attr("fill", p => color[p.organ])
      .attr("stroke", "#f5f1e8")
      .attr("stroke-width", 0.7)
      .attr("opacity", 0.95);

    const scaledCount = Math.max(1, Math.round(d.count2025 / CASES_PER_DOT));
    const matrixDots = d3.range(scaledCount).map(i => ({
      x: MATRIX_X + (i % MATRIX_COLS) * MATRIX_DOT_GAP_X,
      y: (Math.floor(i / MATRIX_COLS) - 1) * MATRIX_DOT_GAP_Y
    }));

    g.selectAll("circle.count-dot")
      .data(matrixDots)
      .enter()
      .append("circle")
      .attr("class", "count-dot")
      .attr("cx", p => p.x)
      .attr("cy", p => p.y)
      .attr("r", COUNT_DOT_R)
      .attr("fill", "#b8b3aa")
      .attr("opacity", 0.95);
  });

  comboGroups.append("text")
    .attr("x", LABEL_X)
    .attr("y", 4)
    .attr("text-anchor", "start")
    .attr("font-size", 12)
    .attr("fill", "#2f3e34")
    .text(d => `${d.label} · ${d.count2025}`);

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