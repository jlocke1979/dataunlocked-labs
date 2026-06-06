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

// Header chrome shared by every chart scene: eyebrow label, title, subtitle, divider.
export function drawHeader(svg, { sceneLabel, title, subtitle } = {}) {
  if (sceneLabel) {
    applyType(
      svg.append("text")
        .attr("x", MARGIN_X)
        .attr("y", EYEBROW_Y)
        .attr("fill", storyColors.textMuted)
        .text(sceneLabel.toUpperCase()),
      typography.label
    );
  }

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
