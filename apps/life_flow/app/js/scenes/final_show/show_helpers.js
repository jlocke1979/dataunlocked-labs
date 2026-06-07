import { storyColors } from "../../constants/colors.js";
import { typography } from "../../constants/typography.js";

// Stage + vertical rhythm mirror js/style_test.js so final_show scenes
// stay on the same typographic grid as the style guide.
const STAGE_WIDTH = 1280;
const STAGE_HEIGHT = 720;
const MARGIN_X = 156;

const EYEBROW_Y = 78;
const TITLE_Y = 104;
const SUBTITLE_Y = 139;
const DIVIDER_Y = 178;
const BODY_Y = 232;
const CAPTION_Y = 654;

// Scene 4 header band: divider + 2px (matches map scene; used on all chart scenes).
export const HEADER_BAND_HEIGHT = DIVIDER_Y + 2;
export const HEADER_TOP_VH = (HEADER_BAND_HEIGHT / STAGE_HEIGHT) * 100;

// Typographic grid for dynamic titles (e.g. Scene 1 zoom steps).
export const HEADER_GRID = {
  eyebrowY: EYEBROW_Y,
  titleY: TITLE_Y,
  subtitleY: SUBTITLE_Y,
  dividerY: DIVIDER_Y
};

// Content region available to a chart, below the header divider.
export const STAGE = {
  width: STAGE_WIDTH,
  height: STAGE_HEIGHT,
  marginX: MARGIN_X,
  captionY: CAPTION_Y,
  headerBandHeight: HEADER_BAND_HEIGHT,
  contentTop: 210,
  contentBottom: 636,
  get contentLeft() { return MARGIN_X; },
  get contentRight() { return STAGE_WIDTH - MARGIN_X; }
};

export function createStage(container) {
  const svg = container
    .append("svg")
    .attr("viewBox", `0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`)
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("width", "100%")
    .attr("height", "100vh")
    .attr("role", "img")
    .style("display", "block");

  svg.append("rect")
    .attr("width", STAGE_WIDTH)
    .attr("height", STAGE_HEIGHT)
    .attr("fill", storyColors.museumWhite);

  return svg;
}

// Flex column shell shared by chart scenes (Scene 4 template).
export function initSceneLayout(container) {
  return container
    .style("position", "relative")
    .style("display", "flex")
    .style("flex-direction", "column")
    .style("min-height", "100vh")
    .style("height", "100vh");
}

// Cropped header SVG: same left edge, rule width, and vertical rhythm as Scene 4.
export function mountHeaderBand(container, headerOptions = {}) {
  const svg = createStage(container);
  drawHeader(svg, headerOptions);
  svg
    .attr("viewBox", `0 0 ${STAGE_WIDTH} ${HEADER_BAND_HEIGHT}`)
    .attr("preserveAspectRatio", "xMinYMin meet")
    .style("flex", "0 0 auto")
    .style("width", "100%")
    .style("height", `${HEADER_TOP_VH}vh`)
    .style("pointer-events", "none");
  svg.select("rect").attr("height", HEADER_BAND_HEIGHT);
  return svg;
}

// Chart SVG uses the same 1280×720 coordinates; viewBox starts below the header band.
export function mountChartSvg(container) {
  const chartHeight = STAGE_HEIGHT - HEADER_BAND_HEIGHT;
  const svg = container
    .append("svg")
    .attr("viewBox", `0 ${HEADER_BAND_HEIGHT} ${STAGE_WIDTH} ${chartHeight}`)
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("width", "100%")
    .attr("role", "img")
    .style("flex", "1 1 auto")
    .style("min-height", "0")
    .style("width", "100%")
    .style("display", "block");

  svg
    .append("rect")
    .attr("x", 0)
    .attr("y", HEADER_BAND_HEIGHT)
    .attr("width", STAGE_WIDTH)
    .attr("height", chartHeight)
    .attr("fill", storyColors.museumWhite);

  return svg;
}

export function beginChartScene(container, headerOptions = {}) {
  initSceneLayout(container);
  const headerSvg = mountHeaderBand(container, headerOptions);
  const chartSvg = mountChartSvg(container);
  return { headerSvg, chartSvg };
}

// Apply a typography token from the style guide verbatim (family/size/weight/style).
export function applyType(selection, style) {
  return selection
    .attr("font-family", style.family)
    .attr("font-size", style.size)
    .attr("font-weight", style.weight)
    .attr("font-style", style.style);
}

export const ALL_ORGANS_LABEL = "All Organs";

/** Prefix + highlighted organ label + suffix (Scenes 4 & 5 map/network headlines). */
export function renderHighlightedOrganTitle(
  svg,
  {
    classPrefix,
    prefix = "",
    label,
    suffix = "",
    organColor,
    boxStroke = null,
    y = TITLE_Y,
    padX = 5,
    padY = 2,
    fillOpacity = 0.22,
    prefixGap = 0,
    suffixGap = 6
  }
) {
  svg.select(`.${classPrefix}-header-title-group`).remove();
  const group = svg.append("g").attr("class", `${classPrefix}-header-title-group`);
  let cursorX = MARGIN_X;

  if (prefix) {
    const prefixSel = applyType(
      group
        .append("text")
        .attr("class", `${classPrefix}-header-title-prefix`)
        .attr("x", cursorX)
        .attr("y", y)
        .attr("fill", storyColors.textPrimary)
        .text(prefix),
      typography.mainTitle
    );
    cursorX += prefixSel.node().getComputedTextLength() + prefixGap;
  }

  const organWrap = group.append("g").attr("class", `${classPrefix}-organ-wrap`);
  const organText = applyType(
    organWrap
      .append("text")
      .attr("class", `${classPrefix}-header-title`)
      .attr("x", cursorX)
      .attr("y", y)
      .attr("fill", organColor)
      .text(label),
    typography.mainTitle
  );

  const bbox = organText.node().getBBox();
  const highlight = organWrap
    .insert("rect", "text")
    .attr("class", `${classPrefix}-organ-highlight`)
    .attr("x", bbox.x - padX)
    .attr("y", bbox.y - padY)
    .attr("width", bbox.width + padX * 2)
    .attr("height", bbox.height + padY * 2)
    .attr("rx", 4)
    .attr("fill", organColor)
    .attr("fill-opacity", fillOpacity);

  if (boxStroke) {
    highlight.attr("stroke", boxStroke).attr("stroke-width", 1.25);
  }

  if (suffix) {
    applyType(
      group
        .append("text")
        .attr("class", `${classPrefix}-header-title-suffix`)
        .attr("x", cursorX + bbox.width + suffixGap)
        .attr("y", y)
        .attr("fill", storyColors.textPrimary)
        .text(suffix),
      typography.mainTitle
    );
  }
}

// Header chrome shared by every chart scene: title, subtitle, divider.
export function drawHeader(svg, { title, subtitle } = {}) {
  if (title) {
    applyType(
      svg.append("text")
        .attr("x", MARGIN_X)
        .attr("y", TITLE_Y)
        .attr("fill", storyColors.textPrimary)
        .text(title),
      typography.mainTitle
    );
  }

  if (subtitle) {
    applyType(
      svg.append("text")
        .attr("x", MARGIN_X)
        .attr("y", SUBTITLE_Y)
        .attr("fill", storyColors.textSecondary)
        .text(subtitle),
      typography.sceneTitle
    );
  }

  svg.append("line")
    .attr("x1", MARGIN_X)
    .attr("x2", STAGE_WIDTH - MARGIN_X)
    .attr("y1", DIVIDER_Y)
    .attr("y2", DIVIDER_Y)
    .attr("stroke", storyColors.weatheredBrass)
    .attr("stroke-width", 1);
}

// Italic caption pinned to the lower-left, matching the style-test source line.
export function drawSource(svg, text, y = CAPTION_Y) {
  applyType(
    svg.append("text")
      .attr("x", MARGIN_X)
      .attr("y", y)
      .attr("fill", storyColors.textSecondary)
      .text(text),
    typography.caption
  );
}

// A calm editorial title card used for the landing and outro scenes.
export function renderTitleCard(container, {
  eyebrow,
  title,
  subtitle,
  lines = [],
  hint,
  hints = [],
  hintY = CAPTION_Y,
  hintCentered = false,
  hintLarge = false,
  bodyCentered = false,
  bodyLarge = false,
  bodyLineGap = 0,
  bodyYOffset = 0
}) {
  initSceneLayout(container);
  mountHeaderBand(container, {
    sceneLabel: eyebrow,
    title,
    subtitle
  });
  const svg = mountChartSvg(container);

  const bodyType = bodyLarge ? typography.sceneTitle : typography.body;
  const bodyLineHeight = bodyType.size * (bodyType.lineHeight || 1.5);
  const bodyBlockHeight =
    lines.length * bodyLineHeight + Math.max(0, lines.length - 1) * bodyLineGap;
  const bodyY =
    (bodyCentered
      ? (STAGE.contentTop + STAGE.contentBottom) / 2 - bodyBlockHeight / 2 + bodyLineHeight / 2
      : BODY_Y) + bodyYOffset;
  const bodyX = bodyCentered ? STAGE_WIDTH / 2 : MARGIN_X;

  const body = applyType(
    svg.append("text")
      .attr("x", bodyX)
      .attr("y", bodyY)
      .attr("text-anchor", bodyCentered ? "middle" : "start")
      .attr("fill", storyColors.textPrimary),
    bodyType
  );

  body.selectAll("tspan")
    .data(lines)
    .enter()
    .append("tspan")
    .attr("x", bodyX)
    .attr("text-anchor", bodyCentered ? "middle" : "start")
    .attr("dy", (d, i) => (i === 0 ? 0 : bodyLineHeight + bodyLineGap))
    .text(d => d);

  const hintLines = hint ? [hint, ...hints] : hints;
  if (hintLines.length) {
    const hintX = hintCentered ? STAGE_WIDTH / 2 : MARGIN_X;
    const hintType = hintLarge ? typography.sceneTitle : typography.caption;
    const hintText = applyType(
      svg.append("text")
        .attr("x", hintX)
        .attr("y", hintY)
        .attr("text-anchor", hintCentered ? "middle" : "start")
        .attr("fill", hintLarge ? storyColors.textPrimary : storyColors.textSecondary),
      hintType
    );

    const captionLine =
      typography.caption.size * (typography.caption.lineHeight || 1.55) + 6;

    hintLines.forEach((line, index) => {
      hintText
        .append("tspan")
        .attr("x", hintX)
        .attr("text-anchor", hintCentered ? "middle" : "start")
        .attr("dy", index === 0 ? 0 : captionLine)
        .text(line);
    });
  }

  return svg;
}

// A clearly-marked placeholder for scenes whose real asset is not wired in yet.
export function renderPlaceholder(container, { sceneLabel, title, subtitle, note }) {
  initSceneLayout(container);
  mountHeaderBand(container, { sceneLabel, title, subtitle });
  const svg = mountChartSvg(container);

  // Dashed placeholder frame to signal "not final".
  svg.append("rect")
    .attr("x", MARGIN_X)
    .attr("y", 260)
    .attr("width", STAGE_WIDTH - MARGIN_X * 2)
    .attr("height", 320)
    .attr("fill", storyColors.museumWhite)
    .attr("stroke", storyColors.softAshGray)
    .attr("stroke-width", 1.5)
    .attr("stroke-dasharray", "8 8")
    .attr("rx", 6);

  applyType(
    svg.append("text")
      .attr("x", STAGE_WIDTH / 2)
      .attr("y", 428)
      .attr("text-anchor", "middle")
      .attr("fill", storyColors.textSecondary)
      .text(note),
    typography.dataValue
  );

  return svg;
}

/** Upper-center map overlay — below header divider, above map geography (e.g. upper Midwest). */
const GUIDE_PANEL_TOP = "6px";
const GUIDE_PANEL_MAX_WIDTH = "228px";

/**
 * @param {import("d3-selection").Selection} mapHost
 * @param {{
 *   panelClass: string,
 *   walkthroughLabel?: string,
 *   guide: { step?: string, body: string | string[], next?: string },
 *   top?: string,
 *   maxWidth?: string,
 *   padding?: string,
 *   centerNudgeLeft?: number
 * }} opts
 */
export function mountSceneGuidePanel(
  mapHost,
  { panelClass, walkthroughLabel, guide, top, maxWidth, padding, centerNudgeLeft }
) {
  if (!guide || mapHost.empty()) return;
  mapHost.selectAll(`.${panelClass}`).remove();

  const panelPadding = padding ?? (walkthroughLabel ? "9px 12px 8px" : "6px 10px 6px");

  const panel = mapHost
    .append("div")
    .attr("class", panelClass)
    .style("position", "absolute")
    .style("top", top ?? GUIDE_PANEL_TOP)
    .style("left", centerNudgeLeft ? `calc(50% - ${centerNudgeLeft}px)` : "50%")
    .style("transform", "translateX(-50%)")
    .style("max-width", maxWidth ?? GUIDE_PANEL_MAX_WIDTH)
    .style("padding", panelPadding)
    .style("background", storyColors.museumWhite)
    .style("border", `1px solid ${storyColors.weatheredBrass}`)
    .style("border-radius", "4px")
    .style("box-shadow", "0 1px 3px rgba(32, 38, 35, 0.06)")
    .style("z-index", "6")
    .style("pointer-events", "none")
    .style("font-family", typography.label.family)
    .style("line-height", "1.35")
    .style("text-align", "center");

  if (walkthroughLabel) {
    panel
      .append("div")
      .attr("class", `${panelClass}__step`)
      .style("font-size", "9px")
      .style("letter-spacing", "0.06em")
      .style("text-transform", "uppercase")
      .style("color", storyColors.textMuted)
      .style("margin-bottom", "4px")
      .text(guide.step ? `${walkthroughLabel} · ${guide.step}` : walkthroughLabel);
  }

  const bodyLines = Array.isArray(guide.body) ? guide.body : [guide.body];
  const bodyEl = panel
    .append("div")
    .attr("class", `${panelClass}__body`)
    .style("font-size", `${typography.label.size}px`)
    .style("color", storyColors.textPrimary);

  bodyLines.forEach((line, index) => {
    bodyEl
      .append("div")
      .attr("class", `${panelClass}__body-line`)
      .style("white-space", "nowrap")
      .style("margin-top", index === 0 ? "0" : "4px")
      .text(line);
  });

  if (guide.next) {
    panel
      .append("div")
      .attr("class", `${panelClass}__next`)
      .style("font-size", `${typography.caption.size}px`)
      .style("font-style", "italic")
      .style("color", storyColors.textSecondary)
      .style("margin-top", "6px")
      .text(guide.next);
  }
}
