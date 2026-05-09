console.log("RUNNING B1 TO B2 TRANSITION");

import { organColors } from "../../constants/colors.js";

export function runB1ToB2Transition(data) {
  const width = 1200;
  const height = 700;
  const margin = { top: 100, right: 240, bottom: 70, left: 100 };
  const duration = 1000;
  const showDevButtons = false;

  const years = [1988, 2025];
  const majorOrgans = ["Kidney", "Liver", "Heart", "Lung"];
  const minorOrgans = [
    "Pancreas",
    "Kidney / Pancreas",
    "Heart / Lung",
    "Intestine",
    "VCA - abdominal wall",
    "VCA - external male genitalia",
    "VCA - head and neck",
    "VCA - other genitourinary organ",
    "VCA - upper limb",
    "VCA - uterus"
  ];

  const majorData = data
    .filter(d =>
      d.donor_type === "All Donor Types" &&
      majorOrgans.includes(d.organ) &&
      d.year <= 2025
    )
    .sort((a, b) => a.year - b.year)
    .map(d => ({
      series: d.organ,
      year: d.year,
      value: d.transplants
    }));

  const minorData = data
    .filter(d =>
      d.donor_type === "All Donor Types" &&
      minorOrgans.includes(d.organ) &&
      d.year <= 2025
    )
    .sort((a, b) => a.year - b.year)
    .map(d => ({
      series: d.organ,
      year: d.year,
      value: d.transplants
    }));

  const groupedMajor = d3.groups(majorData, d => d.series);
  const groupedMinor = d3.groups(minorData, d => d.series);

  const x = d3.scaleLinear()
    .domain(years)
    .range([margin.left, width - margin.right]);

  const yMajor = d3.scaleLinear()
    .domain([0, d3.max(majorData, d => d.value)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const yMinor = d3.scaleLinear()
    .domain([0, d3.max(minorData, d => d.value)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  let currentState = "B1";
  let currentY = yMajor.copy();
  let autoplayTimers = [];

  // Track internal state progression
  const stateSequence = ["B1", "B1B2_overlay", "B2"];
  let stateIndex = 0;

  d3.select("#viz").html("");

  const container = d3.select("#viz")
    .style("position", "relative");

  const breadcrumb = container
    .append("div")
    .attr("class", "breadcrumb-container")
    .style("position", "absolute")
    .style("bottom", "-78px")
    .style("left", "0")
    .style("width", "100%")
    .style("display", "flex")
    .style("justify-content", "center")
    .style("gap", "8px");

  // Create dots array for easy updating
  const dots = [];

  // Scene 1: a_to_b1 (dots 1-3) - all gray
  for (let i = 0; i < 3; i++) {
    dots.push(breadcrumb.append("div")
      .style("width", "6px")
      .style("height", "6px")
      .style("border-radius", "50%")
      .style("background-color", "#ccc"));
  }

  // Scene 2: b1_to_b2 (dots 4-6)
  for (let i = 0; i < 3; i++) {
    dots.push(breadcrumb.append("div")
      .style("width", "6px")
      .style("height", "6px")
      .style("border-radius", "50%")
      .style("background-color", i === stateIndex ? "#333" : "#ccc"));
  }

  // Scene 3: b2_to_b3 (dots 7-9) - all gray
  for (let i = 0; i < 3; i++) {
    dots.push(breadcrumb.append("div")
      .style("width", "6px")
      .style("height", "6px")
      .style("border-radius", "50%")
      .style("background-color", "#ccc"));
  }

  // Scene 4: b3_micro (dots 10-12) - all gray
  for (let i = 0; i < 3; i++) {
    dots.push(breadcrumb.append("div")
      .style("width", "6px")
      .style("height", "6px")
      .style("border-radius", "50%")
      .style("background-color", "#ccc"));
  }

  function updateBreadcrumb() {
    // Scene 2 (dots 3-5): Highlight dot at stateIndex
    container.select(".breadcrumb-container").selectAll("div").each(function(d, i) {
      if (i >= 3 && i < 6) {
        d3.select(this).style("background-color", (i - 3) === stateIndex ? "#333" : "#ccc");
      }
    });
  }

  // Temporary controls
  if (showDevButtons) {
    const controls = container
      .append("div")
      .style("margin", "0 0 10px 100px");

    controls.append("button")
      .text("B1")
      .style("font-size", "12px")
      .style("padding", "4px 8px")
      .style("border", "1px solid #ccc")
      .style("background", "#f7f7f7")
      .style("cursor", "pointer")
      .on("click", () => renderState("B1"));

    controls.append("button")
      .text("B1 → B2 overlay")
      .style("margin-left", "8px")
      .style("font-size", "12px")
      .style("padding", "4px 8px")
      .style("border", "1px solid #ccc")
      .style("background", "#f7f7f7")
      .style("cursor", "pointer")
      .on("click", () => renderState("B1B2_overlay"));

    controls.append("button")
      .text("B2")
      .style("margin-left", "8px")
      .style("font-size", "12px")
      .style("padding", "4px 8px")
      .style("border", "1px solid #ccc")
      .style("background", "#f7f7f7")
      .style("cursor", "pointer")
      .on("click", () => renderState("B2"));
  }

  const svg = container
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const title = svg.append("text")
    .attr("x", margin.left)
    .attr("y", 32)
    .attr("font-size", "26px")
    .attr("font-weight", "700");

  const subtitle = svg.append("text")
    .attr("x", margin.left)
    .attr("y", 56)
    .attr("font-size", "15px")
    .attr("fill", "#555");

  const xAxisG = svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`);

  const yAxisG = svg.append("g")
    .attr("transform", `translate(${margin.left},0)`);

  const majorLayer = svg.append("g");
  const minorLayer = svg.append("g");
  const labelLayer = svg.append("g");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height - 20)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .text("Year");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", 24)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .text("Number of Transplants");

  xAxisG.call(
    d3.axisBottom(x)
      .tickFormat(d3.format("d"))
      .ticks(10)
  );

  function setStory(titleText, subtitleText) {
    title.text(titleText);
    subtitle.text(subtitleText);
  }

  function makeLine(yScale) {
    return d3.line()
      .x(d => x(d.year))
      .y(d => yScale(d.value));
  }

  function renderMajors(yScale, opacity = 1) {
    const strokeWidth = opacity >= 0.8 ? 2.75 : 1.75;

    const join = majorLayer.selectAll(".major-line")
      .data(groupedMajor, d => d[0]);

    join.join(
      enter => enter.append("path")
        .attr("class", "major-line")
        .attr("fill", "none")
        .attr("stroke", d => organColors[d[0]] || "#888")
        .attr("stroke-width", strokeWidth)
        .attr("stroke-dasharray", null)
        .style("stroke-dasharray", null)
        .attr("opacity", opacity)
        .attr("d", d => makeLine(yScale)(d[1])),
      update => update
        .transition()
        .duration(duration)
        .attr("stroke-width", strokeWidth)
        .attr("stroke-dasharray", null)
        .style("stroke-dasharray", null)
        .attr("opacity", opacity)
        .attr("d", d => makeLine(yScale)(d[1])),
      exit => exit.transition().duration(duration).attr("opacity", 0).remove()
    );
  }

  function renderMinors(yScale, opacity = 1) {
    const strokeWidth = opacity >= 0.8 ? 2.25 : 1.5;

    const join = minorLayer.selectAll(".minor-line")
      .data(groupedMinor, d => d[0]);

    join.join(
      enter => enter.append("path")
        .attr("class", "minor-line")
        .attr("fill", "none")
        .attr("stroke", d => organColors[d[0]] || "#999")
        .attr("stroke-width", strokeWidth)
        .attr("stroke-dasharray", null)
        .style("stroke-dasharray", null)
        .attr("opacity", opacity)
        .attr("d", d => makeLine(yScale)(d[1])),
      update => update
        .transition()
        .duration(duration)
        .attr("stroke-width", strokeWidth)
        .attr("stroke-dasharray", null)
        .style("stroke-dasharray", null)
        .attr("opacity", opacity)
        .attr("d", d => makeLine(yScale)(d[1])),
      exit => exit.transition().duration(duration).attr("opacity", 0).remove()
    );
  }

  function renderLabels(seriesGroups, yScale, className, opacity = 1, fontSize = 12) {
    const join = labelLayer.selectAll(`.${className}`)
      .data(opacity > 0 ? seriesGroups : [], d => d[0]);

    join.join(
      enter => enter.append("text")
        .attr("class", className)
        .attr("font-size", fontSize)
        .attr("fill", d => organColors[d[0]] || "#888")
        .attr("alignment-baseline", "middle")
        .attr("opacity", opacity)
        .attr("x", d => x(d[1][d[1].length - 1].year) + 8)
        .attr("y", d => yScale(d[1][d[1].length - 1].value))
        .text(d => d[0]),
      update => update
        .transition()
        .duration(duration)
        .attr("opacity", opacity)
        .attr("x", d => x(d[1][d[1].length - 1].year) + 8)
        .attr("y", d => yScale(d[1][d[1].length - 1].value)),
      exit => exit
        .transition()
        .duration(duration)
        .attr("opacity", 0)
        .remove()
    );
  }

  function renderTotal(yScale, opacity = 1) {
    const strokeWidth = opacity >= 0.8 ? 2.75 : 1.75;

    const totalJoin = lineLayer.selectAll(".total-line")
      .data([totalData]);

    totalJoin.join(
      enter => enter.append("path")
        .attr("class", "total-line")
        .attr("fill", "none")
        .attr("stroke", "#555")
        .attr("stroke-width", strokeWidth)
        .attr("stroke-dasharray", null)
        .style("stroke-dasharray", null)
        .attr("opacity", opacity)
        .attr("d", makeLine(yScale)),
      update => update
        .transition()
        .duration(duration)
        .attr("stroke-width", strokeWidth)
        .attr("stroke-dasharray", null)
        .style("stroke-dasharray", null)
        .attr("opacity", opacity)
        .attr("d", makeLine(yScale)),
      exit => exit
        .transition()
        .duration(duration)
        .attr("opacity", 0)
        .remove()
    );

    const totalLabel = labelLayer.selectAll(".total-label")
      .data(opacity > 0 ? [totalData[totalData.length - 1]] : []);

    totalLabel.join(
      enter => enter.append("text")
        .attr("class", "total-label")
        .attr("font-size", "13px")
        .attr("fill", "#666")
        .attr("alignment-baseline", "middle")
        .attr("opacity", opacity)
        .attr("x", d => x(d.year) + 8)
        .attr("y", d => yScale(d.value))
        .text("All Organs"),
      update => update
        .transition()
        .duration(duration)
        .attr("opacity", opacity)
        .attr("x", d => x(d.year) + 8)
        .attr("y", d => yScale(d.value)),
      exit => exit
        .transition()
        .duration(duration)
        .attr("opacity", 0)
        .remove()
    );
  }

  function renderState(nextState) {
    currentState = nextState;

    if (nextState === "B1") {
      currentY = yMajor.copy();

      yAxisG.transition().duration(duration)
        .call(d3.axisLeft(currentY));
      yAxisG.selectAll("*").style("opacity", 1);

      setStory("A Few Organs Drive Most Transplants", "The vast majority of transplants involve kidney, liver, heart, or lung");

      renderMajors(currentY, 1);
      renderMinors(currentY, 0);
      renderLabels(groupedMajor, currentY, "major-label", 1, 13);
      renderLabels(groupedMinor, currentY, "minor-label", 0, 11);

    } else if (nextState === "B1B2_overlay") {
      currentY = yMajor.copy();

      yAxisG.transition().duration(duration)
        .call(d3.axisLeft(currentY));
      yAxisG.selectAll("*").style("opacity", 1);

      setStory("Smaller Categories Appear After Zooming In", "Lower-volume transplants include pancreas, intestine, and organ combinations");

      renderMajors(currentY, 0.28);
      renderMinors(currentY, 1);
      renderLabels(groupedMajor, currentY, "major-label", 0, 13);
      renderLabels(groupedMinor, currentY, "minor-label", 1, 11);

    } else if (nextState === "B2") {
      currentY = yMinor.copy();

      yAxisG.transition().duration(duration)
        .call(d3.axisLeft(currentY));
      yAxisG.selectAll("*").style("opacity", 1);

      renderMajors(currentY, 0);
      renderMinors(currentY, 1);
      renderLabels(groupedMajor, currentY, "major-label", 0, 13);
      renderLabels(groupedMinor, currentY, "minor-label", 1, 11);
    }
  }

  function startAutoplay() {
    // Render ONLY the first state - no autoplay of final state
    renderState("B1");
  }

  startAutoplay();

  // Handle internal state progression with arrow keys
  const sceneKeyHandler = (e) => {
    if (e.key === "ArrowRight") {
      if (stateIndex < stateSequence.length - 1) {
        // Advance to next substate
        stateIndex++;
        updateBreadcrumb();
        renderState(stateSequence[stateIndex]);
        e.stopImmediatePropagation();
      }
      // If at final state, allow main handler to move to next scene
    } else if (e.key === "ArrowLeft") {
      if (stateIndex > 0) {
        // Go back to previous substate
        stateIndex--;
        updateBreadcrumb();
        renderState(stateSequence[stateIndex]);
        e.stopImmediatePropagation();
      }
      // If at first state, allow main handler to move to previous scene
    }
  };

  // Clean up any previous scene's listener
  if (window.__currentSceneHandler) {
    window.removeEventListener("keydown", window.__currentSceneHandler, true);
  }

  // Store reference and add listener at capture phase to take priority
  window.__currentSceneHandler = sceneKeyHandler;
  window.addEventListener("keydown", sceneKeyHandler, true);
}
