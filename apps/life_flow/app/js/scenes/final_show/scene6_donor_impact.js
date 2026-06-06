import { organColors, storyColors } from "../../constants/colors.js";
import { typography } from "../../constants/typography.js";
import { beginChartScene, applyType, STAGE } from "./show_helpers.js";

/* ---------------------------------------------------------------------------
 * Scene 6 — "A life carried forward" (Concept B).
 *   One donor's transplanted organs each continue a recipient's life forward
 *   in time. Bar length = MEDIAN years survived after transplant (sourced);
 *   the soft tail marks the uncertain future. The common organs (kidneys +
 *   liver) are emphasized to show a TYPICAL donor's reach; the full set shows
 *   the MAXIMUM (up to 8 recipients).
 *
 *   This bridges Scene 5 (survival over time) -> Scene 7 (what continues).
 *
 *   SOURCES (all real, cited on slide):
 *   - Median post-transplant patient survival, by organ:
 *       Rana et al., "Survival Benefit of Solid-Organ Transplant in the US,"
 *       JAMA Surgery 2015, and the 2023 30-year update (UNOS data).
 *       kidney 14.8y, liver 14.6y, heart 11.7y, lung 5.6y, pancreas 16.1y.
 *     Intestine has no clean published median; SRTR 2023 ADR shows ~58-62%
 *     adult survival at 5 years -> approximated at ~5y, flagged below.
 *   - "Up to 8 lives" per donor & ~2.2 organs transplanted per donor:
 *       HRSA / organdonor.gov; OPTN national data.
 *
 *   NOTE: bars are years LIVED after transplant, not solely years "gained."
 *   Waitlist survival is far lower (e.g. kidney median ~5y vs ~14.8y), so most
 *   of this time is genuinely added — but the metric shown is survival, not
 *   the difference. The combined total is a modeled sum across recipients.
 * ------------------------------------------------------------------------- */
const ORGANS = [
  { organ: "Kidney", years: 14.8, common: true },
  { organ: "Kidney", years: 14.8, common: true },
  { organ: "Liver", years: 14.6, common: true },
  { organ: "Pancreas", years: 16.1, common: false },
  { organ: "Heart", years: 11.7, common: false },
  { organ: "Lung", years: 5.6, common: false },
  { organ: "Lung", years: 5.6, common: false },
  { organ: "Intestine", years: 5.0, common: false, approx: true }
];

const MAX_YEARS = 18; // x-axis headroom (years)

/** Appendix: longest median survival (pancreas) reads clearest on the top row. */
function organsForScene(appendixMode) {
  if (!appendixMode) return ORGANS;
  const pancreas = ORGANS.filter((o) => o.organ === "Pancreas");
  const rest = ORGANS.filter((o) => o.organ !== "Pancreas");
  return [...pancreas, ...rest];
}

/** @param {{ sceneLabel?: string, title?: string, subtitle?: string, appendixMode?: boolean }} [options] */
function runDonorImpactScene(options = {}) {
  const appendixMode = options.appendixMode ?? false;
  const container = d3.select("#viz");
  container.selectAll("*").remove();

  const { chartSvg: svg } = beginChartScene(container, {
    sceneLabel: options.sceneLabel ?? "Scene 6",
    title: options.title ?? "How much life can one donor create?",
    subtitle:
      options.subtitle ??
      "Median years lived after transplant \u2014 a typical donor's reach, and the most one donor can give"
  });

  // Soft tail gradient: fades each lifeline into the background to read as
  // "the future continues, but is uncertain."
  const defs = svg.append("defs");
  const grad = defs.append("linearGradient")
    .attr("id", "s6-tail").attr("x1", "0").attr("y1", "0").attr("x2", "1").attr("y2", "0");
  grad.append("stop").attr("offset", "0%").attr("stop-color", storyColors.museumWhite).attr("stop-opacity", 0);
  grad.append("stop").attr("offset", "100%").attr("stop-color", storyColors.museumWhite).attr("stop-opacity", 1);

  const organs = organsForScene(appendixMode);

  const left = STAGE.contentLeft + 156;   // donation line / year 0
  const right = STAGE.contentRight - 150;  // room for end labels
  const top = STAGE.contentTop + 36;
  const bottom = STAGE.contentBottom - 60;

  const x = d3.scaleLinear().domain([0, MAX_YEARS]).range([left, right]);
  const rowH = (bottom - top) / organs.length;
  const barH = Math.min(18, rowH * 0.46);

  const commonCount = organs.filter(o => o.common).length;

  // --- Typical-reach band (spine only; omitted in appendix reference view) ---
  if (!appendixMode) {
    svg.append("rect")
      .attr("x", STAGE.contentLeft)
      .attr("y", top - rowH * 0.15)
      .attr("width", right - STAGE.contentLeft + 130)
      .attr("height", commonCount * rowH)
      .attr("fill", storyColors.softAshGray)
      .attr("fill-opacity", 0.14)
      .attr("rx", 6);

    applyType(
      svg.append("text").attr("x", STAGE.contentLeft + 4).attr("y", top + commonCount * rowH / 2 - 8)
        .attr("fill", storyColors.textSecondary).text("TYPICAL DONOR"),
      typography.label
    );
    applyType(
      svg.append("text").attr("x", STAGE.contentLeft + 4).attr("y", top + commonCount * rowH / 2 + 10)
        .attr("fill", storyColors.textMuted).text("~3 recipients"),
      typography.caption
    );
  }

  // --- Year gridlines + axis ------------------------------------------------
  const ticks = [0, 5, 10, 15];
  svg.append("g").selectAll("line")
    .data(ticks).join("line")
    .attr("x1", d => x(d)).attr("x2", d => x(d))
    .attr("y1", top - rowH * 0.2).attr("y2", bottom)
    .attr("stroke", storyColors.divider)
    .attr("stroke-opacity", d => (d === 0 ? 0 : 0.4));

  svg.append("g").selectAll("text")
    .data(ticks).join("text")
    .attr("x", d => x(d)).attr("y", bottom + 22).attr("text-anchor", "middle")
    .attr("fill", storyColors.textMuted)
    .call(applyType, typography.caption)
    .text(d => `${d}y`);

  applyType(
    svg.append("text").attr("x", (left + right) / 2).attr("y", bottom + 44).attr("text-anchor", "middle")
      .attr("fill", storyColors.textSecondary).text("Median years survived after transplant"),
    typography.label
  );

  // --- Donation line (the moment all lives turn forward) --------------------
  svg.append("line")
    .attr("x1", left).attr("x2", left)
    .attr("y1", top - rowH * 0.2).attr("y2", bottom)
    .attr("stroke", storyColors.charcoalForest).attr("stroke-width", 2);
  svg.append("circle").attr("cx", left).attr("cy", top - rowH * 0.2).attr("r", 5).attr("fill", storyColors.charcoalForest);
  applyType(
    svg.append("text").attr("x", left).attr("y", top - rowH * 0.2 - 12).attr("text-anchor", "middle")
      .attr("fill", storyColors.textPrimary).text("One donor"),
    typography.label
  );

  // --- Lifelines ------------------------------------------------------------
  organs.forEach((d, i) => {
    const cy = top + (i + 0.5) * rowH;
    const color = organColors[d.organ] || storyColors.deepSlateHarbor;
    const x0 = x(0);
    const x1 = x(d.years);
    const len = x1 - x0;

    svg.append("rect")
      .attr("x", x0).attr("y", cy - barH / 2)
      .attr("width", len).attr("height", barH)
      .attr("fill", color)
      .attr("fill-opacity", d.common ? 0.9 : 0.6)
      .attr("rx", barH / 2);

    // Fade the last stretch into the background.
    const tailW = Math.min(52, len * 0.4);
    svg.append("rect")
      .attr("x", x1 - tailW).attr("y", cy - barH / 2)
      .attr("width", tailW).attr("height", barH)
      .attr("fill", "url(#s6-tail)");

    // Recipient marker at the donation line.
    svg.append("circle").attr("cx", x0).attr("cy", cy).attr("r", 4.5).attr("fill", color);

    // End label: organ + median years.
    const yearText = d.approx ? `~${d.years}y *` : `${d.years}y`;
    applyType(
      svg.append("text").attr("x", x1 + 12).attr("y", cy).attr("dy", "0.35em")
        .attr("fill", storyColors.textPrimary)
        .text(`${d.organ}  \u00b7  ${yearText}`),
      typography.label
    );
  });

  // --- Footer (appendix: one quiet source line; spine: full totals) ----------
  if (appendixMode) {
    applyType(
      svg.append("text").attr("x", STAGE.contentLeft).attr("y", 684)
        .attr("fill", storyColors.textMuted)
        .text("Source: median post-transplant survival \u2014 Rana et al., JAMA Surgery 2015 & 2023 update (UNOS). * Intestine approximated from SRTR 2023."),
      typography.caption
    );
    return;
  }

  const typicalYears = Math.round(d3.sum(ORGANS.filter(o => o.common), o => o.years));
  const totalYears = Math.round(d3.sum(ORGANS, o => o.years));

  applyType(
    svg.append("text").attr("x", STAGE.contentLeft).attr("y", 644)
      .attr("fill", storyColors.textPrimary)
      .text(`Up to ${ORGANS.length} recipients \u2014 a combined median of ~${totalYears} years of life lived after transplant.`),
    typography.dataValue
  );
  applyType(
    svg.append("text").attr("x", STAGE.contentLeft).attr("y", 664)
      .attr("fill", storyColors.textSecondary)
      .text(`A typical donor (~2.2 organs) reaches ~3 recipients \u2014 kidneys + liver, about ${typicalYears} years.`),
    typography.caption
  );
  applyType(
    svg.append("text").attr("x", STAGE.contentLeft).attr("y", 684)
      .attr("fill", storyColors.textMuted)
      .text("Source: median post-transplant survival \u2014 Rana et al., JAMA Surgery 2015 & 2023 update (UNOS). \u201cUp to 8 lives\u201d & ~2.2 organs/donor \u2014 HRSA organdonor.gov / OPTN."),
    typography.caption
  );
  applyType(
    svg.append("text").attr("x", STAGE.contentLeft).attr("y", 700)
      .attr("fill", storyColors.textMuted)
      .text("Bars are years lived after transplant (waitlist survival is far lower, so most is genuinely gained). * Intestine median not reliably published; approximated from SRTR 2023."),
    typography.caption
  );
}

export function runScene6() {
  runDonorImpactScene();
}

/** Chopping Block — preserved lifeline chart, simplified copy. */
export function runAppendixDonorImpact() {
  runDonorImpactScene({
    sceneLabel: "Chopping Block",
    title: "One donor, multiple recipients",
    subtitle: "Median years lived after transplant (reference)",
    appendixMode: true
  });
}
