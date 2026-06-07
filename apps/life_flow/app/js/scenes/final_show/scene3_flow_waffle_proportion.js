import { organColorByName, storyColors } from "../../constants/colors.js";
import { typography } from "../../constants/typography.js";
import { WAITLIST_CATEGORIES } from "../../../../assignments/assignment_02_categorical_revision/js/scenes_assignment2/shared_waitlist_nodes.js";
import {
  applyType,
  beginChartScene,
  drawSource,
  STAGE
} from "./show_helpers.js";
import { OPTN_ADVANCED_DATA_SOURCE } from "./scene_references.js";

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
    title: "On a relative basis, other insights emerge",
    subtitle: "Each square represents about 2% of the waiting list."
  });

  const rowData = WAITLIST_CATEGORIES.map(category => {
    const transplants = TRANSPLANT_UNITS[category.organ] || 0;
    const total = category.count + transplants;
    const share = total === 0 ? 0 : transplants / total;
    const transplantTiles = Math.min(
      TOTAL_TILES,
      Math.max(0, Math.round(share * TOTAL_TILES))
    );
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
      organ: row.organ,
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
      d.side === "waitlist" ? storyColors.softAshGray : organColorByName(d.organ));

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

  const pancreasIndex = rowData.findIndex(d => d.organ === "Pancreas");
  const intestineIndex = rowData.findIndex(d => d.organ === "Intestine");
  const proportionCallouts = [];
  const tileStep = TILE_SIZE + TILE_GAP;
  const threeQuarterIn = 72;
  const oneIn = 96;
  const halfIn = 48;
  const legendY = otherRowLabelY(rowData) - LEGEND_SWATCH_Y - LEGEND_NUDGE_UP_PX;
  const calloutBoxLeft = LEGEND_GROUP_X - 12 + oneIn;
  const calloutBoxH = typography.caption.size * 1.4 + 16;
  const intestineBoxY = legendY - 40 + 10 - threeQuarterIn;
  const pancreasBoxY = intestineBoxY - halfIn - calloutBoxH;

  function proportionOrganCallout(organIndex, text, textW, boxY) {
    const rowY = ROW_START_Y + organIndex * ROW_GAP;
    return {
      anchorX: WAFFLE_X + Math.floor(WAFFLE_COLS * 0.78) * tileStep,
      anchorY: rowY + 4,
      text,
      placement: "lower-right",
      textW,
      boxX: calloutBoxLeft,
      boxY,
      leaderEnd: "left"
    };
  }

  if (pancreasIndex >= 0) {
    proportionCallouts.push(
      proportionOrganCallout(
        pancreasIndex,
        "Pancreas: most still waiting",
        138,
        pancreasBoxY
      )
    );
  }
  if (intestineIndex >= 0) {
    proportionCallouts.push(
      proportionOrganCallout(
        intestineIndex,
        "Intestine: high wait ratio",
        138,
        intestineBoxY
      )
    );
  }
  if (proportionCallouts.length) drawWaffleCallouts(svg, proportionCallouts);

  drawSource(svg, OPTN_ADVANCED_DATA_SOURCE);
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

  const ORGAN_SWATCH = 8;
  const ORGAN_SWATCH_GAP = 2;
  const transplantSwatchesW =
    rowData.length * ORGAN_SWATCH + Math.max(0, rowData.length - 1) * ORGAN_SWATCH_GAP;

  const transplantRow = legend
    .append("g")
    .attr("class", "waffle-legend__item waffle-legend__item--transplant");

  transplantRow
    .selectAll("rect.waffle-legend__organ-swatch")
    .data(rowData)
    .enter()
    .append("rect")
    .attr("class", "waffle-legend__organ-swatch")
    .attr("x", (_, i) => i * (ORGAN_SWATCH + ORGAN_SWATCH_GAP))
    .attr("y", LEGEND_SWATCH_Y)
    .attr("width", ORGAN_SWATCH)
    .attr("height", ORGAN_SWATCH)
    .attr("rx", 1.3)
    .attr("fill", d => organColorByName(d.organ));

  transplantRow
    .append("text")
    .attr("x", transplantSwatchesW + 8)
    .attr("y", 0)
    .attr("fill", storyColors.textPrimary)
    .text("Transplanted")
    .call(applyType, typography.label);

  const waitingRow = legend
    .append("g")
    .attr("class", "waffle-legend__item waffle-legend__item--waiting")
    .attr("transform", `translate(0,${LEGEND_ITEM_GAP})`);

  waitingRow
    .append("rect")
    .attr("x", 0)
    .attr("y", LEGEND_SWATCH_Y)
    .attr("width", 10)
    .attr("height", 10)
    .attr("rx", 1.5)
    .attr("fill", storyColors.softAshGray);

  waitingRow
    .append("text")
    .attr("x", 16)
    .attr("y", 0)
    .attr("fill", storyColors.textPrimary)
    .text("Waiting")
    .call(applyType, typography.label);

  applyType(
    legend
      .append("text")
      .attr("x", 0)
      .attr("y", LEGEND_NOTE_Y)
      .attr("fill", storyColors.textMuted)
      .text("50 squares per row \u00b7 2% each"),
    typography.caption
  );
}

function drawWaffleCallouts(svg, callouts) {
  const layer = svg.append("g").attr("class", "waffle-callouts");
  const padX = 10;
  const padY = 8;
  const lineH = typography.caption.size * 1.4;

  callouts.forEach(d => {
    const textW = d.textW ?? Math.max(132, d.text.length * 6.6);
    const boxW = textW + padX * 2;
    const boxH = lineH + padY * 2;
    const lowerRight = d.placement === "lower-right";
    const boxOffsetX = d.boxOffsetX ?? 48;
    const boxX =
      d.boxX ?? (lowerRight ? d.anchorX + boxOffsetX : d.anchorX - boxW / 2);
    const boxY =
      d.boxY ?? (lowerRight ? d.anchorY + 10 : d.anchorY - boxH - 14);
    const boxCx = boxX + boxW / 2;
    const boxCy = boxY + boxH / 2;
    let leaderX2;
    let leaderY2;
    if (d.leaderEnd === "top-center") {
      leaderX2 = boxCx;
      leaderY2 = boxY;
    } else if (d.leaderEnd === "left") {
      leaderX2 = boxX;
      leaderY2 = boxCy;
    } else if (d.leaderEnd === "lower-left") {
      leaderX2 = boxX;
      leaderY2 = boxY + boxH;
    } else if (d.leaderX2 != null && d.leaderY2 != null) {
      leaderX2 = d.leaderX2;
      leaderY2 = d.leaderY2;
    } else {
      leaderX2 = lowerRight ? boxX : boxCx;
      leaderY2 = boxCy;
    }
    const g = layer.append("g").attr("class", "waffle-callout");

    g.append("line")
      .attr("stroke", storyColors.weatheredBrass)
      .attr("stroke-width", 1)
      .attr("x1", d.anchorX)
      .attr("y1", d.anchorY)
      .attr("x2", leaderX2)
      .attr("y2", leaderY2);
    g.append("rect")
      .attr("x", boxX)
      .attr("y", boxY)
      .attr("width", boxW)
      .attr("height", boxH)
      .attr("rx", 3)
      .attr("fill", storyColors.museumWhite)
      .attr("stroke", storyColors.weatheredBrass)
      .attr("stroke-width", 1);
    applyType(
      g.append("text")
        .attr("x", boxCx)
        .attr("y", boxCy)
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("fill", storyColors.textPrimary)
        .text(d.text),
      typography.caption
    );
  });
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
