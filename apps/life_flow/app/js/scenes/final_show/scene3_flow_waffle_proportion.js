import { storyColors } from "../../constants/colors.js";
import { typography } from "../../constants/typography.js";
import { WAITLIST_CATEGORIES } from "../../../../assignments/assignment_02_categorical_revision/js/scenes_assignment2/shared_waitlist_nodes.js";
import {
  applyType,
  beginChartScene,
  drawSource,
  STAGE
} from "./show_helpers.js";

const TRANSPLANT_UNITS = {
  Kidney: 27574 / 500,
  Liver: 12344 / 500,
  Heart: 4587 / 500,
  Lung: 3490 / 500,
  Pancreas: 107 / 500,
  Intestine: 88 / 500,
  Other: 1
};

const TILE_SIZE = 8;
const TILE_GAP = 2;
const WAFFLE_COLS = 25;
const TOTAL_TILES = 50;
const ROW_GAP = 54;
const ROW_START_Y = STAGE.contentTop + 22;
const LABEL_X = STAGE.marginX;
const WAFFLE_X = STAGE.marginX + 223;
const LEGEND_SHIFT_LEFT_PX = 192;
const LEGEND_NUDGE_LEFT_PX = 48;
const LEGEND_NUDGE_UP_PX = 48;
const LEGEND_GROUP_X = STAGE.contentRight - 200 - LEGEND_SHIFT_LEFT_PX - LEGEND_NUDGE_LEFT_PX;
const LEGEND_ITEM_GAP = 22;
const LEGEND_NOTE_Y = 44;
const LEGEND_SWATCH_Y = -8;

export function runScene3FlowWaffleProportion() {
  const container = d3.select("#viz");
  container.selectAll("*").remove();

  const { chartSvg: svg } = beginChartScene(container, {
    sceneLabel: "Scene 3  \u00b7  detail",
    title: "Where the gap is widest",
    subtitle: "Share of waitlist demand met by completed transplants, by organ type, 2025"
  });

  const rowData = WAITLIST_CATEGORIES.map(category => {
    const transplants = TRANSPLANT_UNITS[category.organ] || 0;
    const total = category.count + transplants;
    const share = total === 0 ? 0 : transplants / total;
    const transplantTiles = transplants > 0 ? Math.max(1, Math.round(share * TOTAL_TILES)) : 0;
    return {
      organ: category.organ,
      share,
      transplantTiles
    };
  });

  const tiles = rowData.flatMap((row, index) => {
    const y = ROW_START_Y + index * ROW_GAP;
    return waffleTiles(TOTAL_TILES, WAFFLE_X, y, WAFFLE_COLS).map((point, tileIndex) => ({
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
    .attr("width", TILE_SIZE)
    .attr("height", TILE_SIZE)
    .attr("rx", 1.3)
    .attr("fill", d =>
      d.side === "waitlist" ? storyColors.softAshGray : storyColors.deepSlateHarbor);

  svg.selectAll("text.organ-label")
    .data(rowData)
    .enter()
    .append("text")
    .attr("class", "organ-label")
    .attr("x", LABEL_X)
    .attr("y", (d, i) => ROW_START_Y + i * ROW_GAP + 4)
    .attr("fill", storyColors.textPrimary)
    .text(d => d.organ)
    .call(applyType, typography.label);

  drawWaffleLegend(svg, rowData);

  drawSource(svg, "Source: OPTN/HRSA Advanced Data Reports, 2025.");
}

function otherRowLabelY(rowData) {
  const lastIndex = rowData.length - 1;
  return ROW_START_Y + lastIndex * ROW_GAP + 4;
}

function drawWaffleLegend(svg, rowData) {
  const legendY = otherRowLabelY(rowData) - LEGEND_SWATCH_Y - LEGEND_NUDGE_UP_PX;

  const legend = svg
    .append("g")
    .attr("class", "waffle-legend")
    .attr("transform", `translate(${LEGEND_GROUP_X},${legendY})`);

  const legendItems = [
    { label: "Transplanted", color: storyColors.deepSlateHarbor },
    { label: "Waiting", color: storyColors.softAshGray }
  ];

  const item = legend
    .selectAll("g.waffle-legend__item")
    .data(legendItems)
    .enter()
    .append("g")
    .attr("class", "waffle-legend__item")
    .attr("transform", (d, i) => `translate(0,${i * LEGEND_ITEM_GAP})`);

  item
    .append("rect")
    .attr("x", 0)
    .attr("y", LEGEND_SWATCH_Y)
    .attr("width", 10)
    .attr("height", 10)
    .attr("rx", 1.5)
    .attr("fill", d => d.color);

  item
    .append("text")
    .attr("x", 16)
    .attr("y", 0)
    .attr("fill", storyColors.textPrimary)
    .text(d => d.label)
    .call(applyType, typography.label);

  applyType(
    legend
      .append("text")
      .attr("x", 0)
      .attr("y", LEGEND_NOTE_Y)
      .attr("fill", storyColors.textMuted)
      .text("Each row is normalized to 50 squares."),
    typography.caption
  );
}

function waffleTiles(count, originX, centerY, cols) {
  const tileStep = TILE_SIZE + TILE_GAP;
  const rows = Math.ceil(count / cols);
  const originY = centerY - ((rows * TILE_SIZE) + ((rows - 1) * TILE_GAP)) / 2;
  return d3.range(count).map(index => ({
    x: originX + (index % cols) * tileStep,
    y: originY + Math.floor(index / cols) * tileStep
  }));
}
