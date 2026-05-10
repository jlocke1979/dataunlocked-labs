import { WAITLIST_CATEGORIES } from "./shared_waitlist_nodes.js";

const colors = {
  background: "#f7f7f4",
  text: "#202623",
  transplant: "#4F6675",
  accent: "#A49370",
  ash: "#B8B8B3"
};

const type = {
  title: "\"Book Antiqua\", Palatino, Georgia, serif",
  scene: "Georgia, serif",
  label: "\"Calisto MT\", Georgia, serif"
};

export function runWaitlistVsTransplantsProportionStyleTest() {
  const width = 1200;
  const height = 675;
  const marginX = 72;
  const rowStartY = 232;
  const rowGap = 54;
  const labelX = 126;
  const waffleX = 295;
  const percentX = 780;
  const tileSize = 8;
  const tileGap = 2;
  const waffleCols = 25;
  const totalTiles = 50;

  const svg = d3.select("#vis")
    .html("")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", "100%")
    .attr("height", "100vh")
    .attr("role", "img")
    .attr("aria-label", "Life Flow proportional waitlist versus transplant waffle example");

  svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", colors.background);

  svg.append("text")
    .attr("x", marginX)
    .attr("y", 66)
    .attr("font-family", type.title)
    .attr("font-size", 24)
    .attr("font-weight", 700)
    .attr("fill", colors.text)
    .text("Where the Gap Is Widest");

  svg.append("text")
    .attr("x", marginX)
    .attr("y", 96)
    .attr("font-family", type.scene)
    .attr("font-size", 15)
    .attr("font-style", "italic")
    .attr("fill", colors.text)
    .text("Share of waitlist demand met by completed transplants, by organ type, 2025");

  svg.append("line")
    .attr("x1", marginX)
    .attr("x2", width - marginX)
    .attr("y1", 128)
    .attr("y2", 128)
    .attr("stroke", colors.accent)
    .attr("stroke-width", 1);

  svg.append("text")
    .attr("x", marginX)
    .attr("y", 158)
    .attr("font-family", type.scene)
    .attr("font-size", 13)
    .attr("fill", colors.text)
    .text("Each row is normalized to 50 squares.");

  const transplantUnits = {
    Kidney: 27574 / 500,
    Liver: 12344 / 500,
    Heart: 4587 / 500,
    Lung: 3490 / 500,
    Pancreas: 107 / 500,
    Intestine: 88 / 500,
    Other: 1
  };

  const rowData = WAITLIST_CATEGORIES.map(category => {
    const transplants = transplantUnits[category.organ] || 0;
    const total = category.count + transplants;
    const share = total === 0 ? 0 : transplants / total;
    const transplantTiles = transplants > 0
      ? Math.max(1, Math.round(share * totalTiles))
      : 0;

    return {
      organ: category.organ,
      waitlist: category.count,
      transplants,
      share,
      transplantTiles,
      waitingTiles: totalTiles - transplantTiles
    };
  });

  function waffleTiles(count, originX, centerY, cols) {
    const tileStep = tileSize + tileGap;
    const rows = Math.ceil(count / cols);
    const originY = centerY - ((rows * tileSize) + ((rows - 1) * tileGap)) / 2;
    return d3.range(count).map(index => ({
      x: originX + (index % cols) * tileStep,
      y: originY + Math.floor(index / cols) * tileStep
    }));
  }

  const tiles = rowData.flatMap((row, index) => {
    const y = rowStartY + index * rowGap;
    return waffleTiles(totalTiles, waffleX, y, waffleCols).map((point, tileIndex) => ({
      ...point,
      side: tileIndex < row.transplantTiles ? "transplant" : "waitlist"
    }));
  });

  svg.selectAll("rect.person-tile")
    .data(tiles)
    .enter()
    .append("rect")
    .attr("class", "person-tile")
    .attr("x", d => d.x)
    .attr("y", d => d.y)
    .attr("width", tileSize)
    .attr("height", tileSize)
    .attr("rx", 1.3)
    .attr("fill", d => d.side === "waitlist" ? colors.ash : colors.transplant);

  svg.selectAll("text.organ-label")
    .data(rowData)
    .enter()
    .append("text")
    .attr("class", "organ-label")
    .attr("x", labelX)
    .attr("y", (d, i) => rowStartY + i * rowGap + 4)
    .attr("font-family", type.label)
    .attr("font-size", 11)
    .attr("fill", colors.text)
    .text(d => d.organ);

  svg.selectAll("text.percent-label")
    .data(rowData)
    .enter()
    .append("text")
    .attr("class", "percent-label")
    .attr("x", percentX)
    .attr("y", (d, i) => rowStartY + i * rowGap + 4)
    .attr("font-family", type.label)
    .attr("font-size", 11)
    .attr("fill", colors.text)
    .text(d => `${d3.format(".0%")(d.share)} met`);

  const legend = svg.append("g")
    .attr("transform", `translate(360, 598)`);

  const legendItems = [
    { label: "Transplanted", color: colors.transplant },
    { label: "Waiting", color: colors.ash }
  ];

  legend.selectAll("rect")
    .data(legendItems)
    .enter()
    .append("rect")
    .attr("x", (d, i) => i * 134)
    .attr("y", -5)
    .attr("width", 10)
    .attr("height", 10)
    .attr("rx", 1.5)
    .attr("fill", d => d.color);

  legend.selectAll("text")
    .data(legendItems)
    .enter()
    .append("text")
    .attr("x", (d, i) => i * 134 + 14)
    .attr("y", 4)
    .attr("font-family", type.label)
    .attr("font-size", 10)
    .attr("fill", colors.text)
    .text(d => d.label);

  svg.append("text")
    .attr("x", marginX)
    .attr("y", 642)
    .attr("font-family", type.label)
    .attr("font-size", 10)
    .attr("font-style", "italic")
    .attr("fill", colors.text)
    .text("Source: OPTN/HRSA Advanced Data Reports.");
}
