import { storyColors } from "../../constants/colors.js";
import { typography } from "../../constants/typography.js";
import { applyType, beginChartScene, STAGE } from "./show_helpers.js";

const HANG_INDENT = 24;
const TEXT_MAX_WIDTH = STAGE.contentRight - STAGE.marginX;
const PARA_GAP = 12;

const LIFE_FLOW_REPO =
  "https://github.com/jlocke1979/dataunlocked-labs/tree/main/apps/life_flow";

const AUDIT_NOTES_PARAGRAPHS = [
  "Data for this project was sourced primarily from OPTN, SRTR, UNOS, and related public transplant datasets. Visualizations were created for educational and analytical purposes.",
  "Several visualizations use aggregated, normalized, or transformed data to improve readability and support storytelling. Geographic visualizations are based on publicly available transplant center and DSA information; some node coordinates were approximated where exact locations were unavailable or inconsistent.",
  "Network arc visualizations are intended to illustrate relationships and movement patterns within the transplant system and should not be interpreted as exact transportation routes. Multi-organ transplant visualizations were simplified and normalized to improve comparison across categories.",
  "All analyses and visualizations were manually reviewed; however, additional validation would be recommended before operational or policy use."
];

const GENERATIVE_AI_PARAGRAPHS = [
  "Generative AI tools, including ChatGPT and Cursor AI, were used to assist with brainstorming, code review, debugging, editing, navigation design, and presentation refinement.",
  "All analytical decisions, data sourcing, interpretation, visual design choices, and final content were reviewed, validated, and approved by the author."
];

function wrapParagraph(svg, text, maxWidth, typeStyle) {
  const measure = svg.append("text").attr("visibility", "hidden");
  applyType(measure, typeStyle);

  const words = text.split(/\s+/);
  const lines = [];
  let line = "";

  words.forEach(word => {
    const next = line ? `${line} ${word}` : word;
    measure.text(next);
    if (measure.node().getComputedTextLength() > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });
  if (line) lines.push(line);
  measure.remove();
  return lines;
}

function drawParagraphs(svg, paragraphs, startY, typeStyle) {
  const bodyLine = typeStyle.size * (typeStyle.lineHeight || 1.5);
  let y = startY;

  paragraphs.forEach((paragraph, paraIndex) => {
    const lines = wrapParagraph(svg, paragraph, TEXT_MAX_WIDTH, typeStyle);
    lines.forEach((line, lineIndex) => {
      applyType(
        svg
          .append("text")
          .attr("x", lineIndex === 0 ? STAGE.marginX : STAGE.marginX + HANG_INDENT)
          .attr("y", y + lineIndex * bodyLine)
          .attr("fill", storyColors.textSecondary)
          .text(line),
        typeStyle
      );
    });
    y += lines.length * bodyLine + (paraIndex < paragraphs.length - 1 ? PARA_GAP : 0);
  });

  return y;
}

/** Supplemental — audit notes and limitations (full text). */
export function runAuditNotesDisclosure() {
  const container = d3.select("#viz");
  container.selectAll("*").remove();

  const { chartSvg: svg } = beginChartScene(container, {
    sceneLabel: "Supplemental",
    title: "Audit Notes and Limitations",
    subtitle: ""
  });

  drawParagraphs(svg, AUDIT_NOTES_PARAGRAPHS, STAGE.contentTop + 4, typography.body);
}

/** Supplemental — generative AI disclosure + project materials link. */
export function runGenerativeAiDisclosure() {
  const container = d3.select("#viz");
  container.selectAll("*").remove();

  const { chartSvg: svg } = beginChartScene(container, {
    sceneLabel: "Supplemental",
    title: "Use of Generative AI",
    subtitle: ""
  });

  let y = drawParagraphs(svg, GENERATIVE_AI_PARAGRAPHS, STAGE.contentTop + 4, typography.body);
  const bodyLine = typography.body.size * typography.body.lineHeight;
  y += 20;

  applyType(
    svg
      .append("text")
      .attr("x", STAGE.marginX)
      .attr("y", y)
      .attr("fill", storyColors.textPrimary)
      .text("Project materials"),
    typography.label
  );
  y += bodyLine + 8;
  drawParagraphs(
    svg,
    [`Life Flow source code and supplementary project files are available at ${LIFE_FLOW_REPO}.`],
    y,
    typography.body
  );
}

/** @deprecated Use runAuditNotesDisclosure — kept for any stale imports. */
export function runDisclosures() {
  return runAuditNotesDisclosure();
}
