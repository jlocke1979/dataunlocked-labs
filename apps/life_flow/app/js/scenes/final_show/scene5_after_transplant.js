import { organColors, storyColors } from "../../constants/colors.js";
import { typography } from "../../constants/typography.js";
import { beginChartScene, drawSource, applyType, STAGE } from "./show_helpers.js";

// PROTOTYPE DATA ONLY. Approximate, illustrative patient-survival curves so we
// can evaluate the visual form. Replace with real OPTN/SRTR survival data
// before locking this scene.
const SURVIVAL = [
  { organ: "Kidney", points: [[0, 100], [1, 97], [3, 93], [5, 86], [10, 66]] },
  { organ: "Liver", points: [[0, 100], [1, 92], [3, 84], [5, 75], [10, 60]] },
  { organ: "Heart", points: [[0, 100], [1, 90], [3, 84], [5, 75], [10, 56]] },
  { organ: "Lung", points: [[0, 100], [1, 85], [3, 68], [5, 55], [10, 34]] }
];

export function runScene5() {
  const container = d3.select("#viz");
  container.selectAll("*").remove();

  const { chartSvg: svg } = beginChartScene(container, {
    sceneLabel: "Scene 6",
    title: "What happens after transplant?",
    subtitle: "Illustrative patient survival by organ, years since transplant"
  });

  const plot = {
    left: STAGE.contentLeft + 56,
    right: STAGE.contentRight - 96,
    top: STAGE.contentTop + 24,
    bottom: STAGE.contentBottom - 28
  };

  const x = d3.scaleLinear().domain([0, 10]).range([plot.left, plot.right]);
  const y = d3.scaleLinear().domain([0, 100]).range([plot.bottom, plot.top]);

  const xAxis = svg.append("g")
    .attr("transform", `translate(0,${plot.bottom})`)
    .call(d3.axisBottom(x).ticks(6).tickFormat(d => `${d}y`));
  const yAxis = svg.append("g")
    .attr("transform", `translate(${plot.left},0)`)
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}%`));

  [xAxis, yAxis].forEach(g => {
    g.selectAll("text").call(applyType, typography.label).attr("fill", storyColors.textSecondary);
    g.selectAll("line, path").attr("stroke", storyColors.divider);
  });

  // Light horizontal gridlines.
  svg.append("g")
    .selectAll("line")
    .data(y.ticks(5))
    .join("line")
    .attr("x1", plot.left)
    .attr("x2", plot.right)
    .attr("y1", d => y(d))
    .attr("y2", d => y(d))
    .attr("stroke", storyColors.divider)
    .attr("stroke-opacity", 0.35);

  const line = d3.line()
    .x(d => x(d[0]))
    .y(d => y(d[1]))
    .curve(d3.curveMonotoneX);

  SURVIVAL.forEach(series => {
    const color = organColors[series.organ] || storyColors.deepSlateHarbor;
    const last = series.points[series.points.length - 1];

    svg.append("path")
      .datum(series.points)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 2.5)
      .attr("d", line);

    applyType(
      svg.append("text")
        .attr("x", x(last[0]) + 10)
        .attr("y", y(last[1]))
        .attr("dy", "0.35em")
        .attr("fill", color)
        .text(`${series.organ}  ${last[1]}%`),
      typography.label
    );
  });

  // Axis titles.
  applyType(
    svg.append("text")
      .attr("x", (plot.left + plot.right) / 2)
      .attr("y", plot.bottom + 40)
      .attr("text-anchor", "middle")
      .attr("fill", storyColors.textSecondary)
      .text("Years since transplant"),
    typography.label
  );
  applyType(
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(plot.top + plot.bottom) / 2)
      .attr("y", plot.left - 40)
      .attr("text-anchor", "middle")
      .attr("fill", storyColors.textSecondary)
      .text("Patients surviving"),
    typography.label
  );

  // Default caption line + 0.5in (48px) so source clears the x-axis label.
  drawSource(
    svg,
    "Source: Illustrative prototype values \u2014 replace with OPTN/SRTR patient-survival data before locking.",
    STAGE.captionY + 48
  );
}
