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

// Content region available to a chart, below the header divider.
export const STAGE = {
  width: STAGE_WIDTH,
  height: STAGE_HEIGHT,
  marginX: MARGIN_X,
  contentTop: 210,
  contentBottom: 636,
  get contentLeft() { return MARGIN_X; },
  get contentRight() { return STAGE_WIDTH - MARGIN_X; }
};

export function createStage(container) {
  const svg = container
    .append("svg")
    .attr("viewBox", `0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`)
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
export function drawSource(svg, text) {
  applyType(
    svg.append("text")
      .attr("x", MARGIN_X)
      .attr("y", CAPTION_Y)
      .attr("fill", storyColors.textSecondary)
      .text(text),
    typography.caption
  );
}

function addDivider(svg) {
  svg.append("line")
    .attr("x1", MARGIN_X)
    .attr("x2", STAGE_WIDTH - MARGIN_X)
    .attr("y1", DIVIDER_Y)
    .attr("y2", DIVIDER_Y)
    .attr("stroke", storyColors.weatheredBrass)
    .attr("stroke-width", 1);
}

// A calm editorial title card used for the landing and outro scenes.
export function renderTitleCard(container, { eyebrow, title, lines = [], hint }) {
  const svg = createStage(container);

  if (eyebrow) {
    applyType(
      svg.append("text")
        .attr("x", MARGIN_X)
        .attr("y", EYEBROW_Y)
        .attr("fill", storyColors.textMuted)
        .text(eyebrow.toUpperCase()),
      typography.label
    );
  }

  applyType(
    svg.append("text")
      .attr("x", MARGIN_X)
      .attr("y", TITLE_Y)
      .attr("fill", storyColors.textPrimary)
      .text(title),
    typography.mainTitle
  );

  addDivider(svg);

  const body = applyType(
    svg.append("text")
      .attr("x", MARGIN_X)
      .attr("y", BODY_Y)
      .attr("fill", storyColors.textPrimary),
    typography.body
  );

  body.selectAll("tspan")
    .data(lines)
    .enter()
    .append("tspan")
    .attr("x", MARGIN_X)
    .attr("dy", (d, i) => (i === 0 ? 0 : typography.body.size * typography.body.lineHeight))
    .text(d => d);

  if (hint) {
    applyType(
      svg.append("text")
        .attr("x", MARGIN_X)
        .attr("y", CAPTION_Y)
        .attr("fill", storyColors.textSecondary)
        .text(hint),
      typography.caption
    );
  }

  return svg;
}

// A clearly-marked placeholder for scenes whose real asset is not wired in yet.
export function renderPlaceholder(container, { sceneLabel, title, subtitle, note }) {
  const svg = createStage(container);

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

  applyType(
    svg.append("text")
      .attr("x", MARGIN_X)
      .attr("y", TITLE_Y)
      .attr("fill", storyColors.textPrimary)
      .text(title),
    typography.mainTitle
  );

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

  addDivider(svg);

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
