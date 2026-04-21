import { organColors } from "../constants/colors.js";

export function runB2ToB3Transition(data) {
  const width = 1200;
  const height = 700;
  const margin = { top: 100, right: 240, bottom: 70, left: 100 };
  const duration = 1000;
  const showDevButtons = false;

  const vcaOrgans = [
    "VCA - abdominal wall",
    "VCA - external male genitalia",
    "VCA - head and neck",
    "VCA - other genitourinary organ",
    "VCA - upper limb",
    "VCA - uterus"
  ];

  const minorOrgans = [
    "Pancreas",
    "Kidney / Pancreas",
    "Heart / Lung",
    "Intestine",
    ...vcaOrgans
  ];

  const b2Data = data
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

  const b3Data = data
    .filter(d =>
      d.donor_type === "All Donor Types" &&
      vcaOrgans.includes(d.organ) &&
      d.year <= 2025
    )
    .sort((a, b) => a.year - b.year)
    .map(d => ({
      series: d.organ,
      year: d.year,
      value: d.transplants
    }));

  const groupedB2 = d3.groups(b2Data, d => d.series);
  const groupedB3 = d3.groups(b3Data, d => d.series);

  const x = d3.scaleLinear()
    .domain([1988, 2025])
    .range([margin.left, width - margin.right]);

  const yB2 = d3.scaleLinear()
    .domain([0, d3.max(b2Data, d => d.value)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const yB3 = d3.scaleLinear()
    .domain([0, d3.max(b3Data, d => d.value)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  let currentState = "B2";
  let currentY = yB2.copy();
  let autoplayTimers = [];

  // Track internal state progression
  const stateSequence = ["B2", "B2B3_overlay", "B3"];
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

  // Scene 2: b1_to_b2 (dots 4-6) - all gray
  for (let i = 0; i < 3; i++) {
    dots.push(breadcrumb.append("div")
      .style("width", "6px")
      .style("height", "6px")
      .style("border-radius", "50%")
      .style("background-color", "#ccc"));
  }

  // Scene 3: b2_to_b3 (dots 7-9)
  for (let i = 0; i < 3; i++) {
    dots.push(breadcrumb.append("div")
      .style("width", "6px")
      .style("height", "6px")
      .style("border-radius", "50%")
      .style("background-color", i === stateIndex ? "#333" : "#ccc"));
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
    // Scene 3 (dots 6-8): Highlight dot at stateIndex
    container.select(".breadcrumb-container").selectAll("div").each(function(d, i) {
      if (i >= 6 && i < 9) {
        d3.select(this).style("background-color", (i - 6) === stateIndex ? "#333" : "#ccc");
      }
    });
  }

  if (showDevButtons) {
    const controls = container
      .append("div")
      .style("margin", "0 0 10px 100px");

    controls.append("button")
      .text("B2")
      .style("font-size", "12px")
      .style("padding", "4px 8px")
      .style("border", "1px solid #ccc")
      .style("background", "#f7f7f7")
      .style("cursor", "pointer")
      .on("click", () => renderState("B2"));

    controls.append("button")
      .text("B2 → B3 overlay")
      .style("margin-left", "8px")
      .style("font-size", "12px")
      .style("padding", "4px 8px")
      .style("border", "1px solid #ccc")
      .style("background", "#f7f7f7")
      .style("cursor", "pointer")
      .on("click", () => renderState("B2B3_overlay"));

    controls.append("button")
      .text("B3")
      .style("margin-left", "8px")
      .style("font-size", "12px")
      .style("padding", "4px 8px")
      .style("border", "1px solid #ccc")
      .style("background", "#f7f7f7")
      .style("cursor", "pointer")
      .on("click", () => renderState("B3"));
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

  const note = svg.append("text")
    .attr("x", width - margin.right - 20)
    .attr("y", margin.top + 20)
    .attr("text-anchor", "end")
    .attr("font-size", "13px")
    .attr("fill", "#444");

  const xAxisG = svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`);

  const yAxisG = svg.append("g")
    .attr("transform", `translate(${margin.left},0)`);

  const lineLayer = svg.append("g");
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

  function renderLines(groups, yScale, className, opacityFn, widthFn) {
    const join = lineLayer.selectAll(`.${className}`)
      .data(groups, d => d[0]);

    join.join(
      enter => enter.append("path")
        .attr("class", className)
        .attr("fill", "none")
        .attr("stroke", d => organColors[d[0]] || "#888")
        .attr("stroke-width", d => widthFn(d[0]))
        .attr("stroke-dasharray", null)
        .style("stroke-dasharray", null)
        .attr("opacity", d => opacityFn(d[0]))
        .attr("d", d => makeLine(yScale)(d[1])),
      update => update
        .transition()
        .duration(duration)
        .attr("stroke-width", d => widthFn(d[0]))
        .attr("stroke-dasharray", null)
        .style("stroke-dasharray", null)
        .attr("opacity", d => opacityFn(d[0]))
        .attr("d", d => makeLine(yScale)(d[1])),
      exit => exit.transition().duration(duration).attr("opacity", 0).remove()
    );
  }

  function renderLabels(groups, yScale, className, visibleSet) {
    const filteredGroups = groups.filter(d => visibleSet.has(d[0]));

    const join = labelLayer.selectAll(`.${className}`)
      .data(filteredGroups, d => d[0]);

    join.join(
      enter => enter.append("text")
        .attr("class", className)
        .attr("font-size", "11px")
        .attr("fill", d => organColors[d[0]] || "#888")
        .attr("alignment-baseline", "middle")
        .attr("opacity", 1)
        .attr("x", d => x(d[1][d[1].length - 1].year) + 8)
        .attr("y", d => yScale(d[1][d[1].length - 1].value))
        .text(d => d[0].replace("VCA - ", "")),
      update => update
        .transition()
        .duration(duration)
        .attr("x", d => x(d[1][d[1].length - 1].year) + 8)
        .attr("y", d => yScale(d[1][d[1].length - 1].value))
        .attr("opacity", 1),
      exit => exit
        .transition()
        .duration(duration)
        .attr("opacity", 0)
        .remove()
    );
  }

  function renderState(nextState) {
    currentState = nextState;

    if (nextState === "B2") {
      currentY = yB2.copy();

      yAxisG.transition().duration(duration)
        .call(d3.axisLeft(currentY));
      yAxisG.selectAll("*").style("opacity", 1);

      setStory("Lower-Volume Transplants Only Appear After Zooming In","Pancreas, intestine, and combination transplants are hidden on the larger scale");
      
      renderLines(
        groupedB2,
        currentY,
        "minor-line",
        () => 0.95,
        organ => 2
      );

      renderLabels(
        groupedB2,
        currentY,
        "minor-label",
        new Set(["Pancreas", "Kidney / Pancreas", "Heart / Lung", "Intestine"])
      );

    } else if (nextState === "B2B3_overlay") {
      currentY = yB2.copy();

      yAxisG.transition().duration(duration)
        .call(d3.axisLeft(currentY));
      yAxisG.selectAll("*").style("opacity", 1);

      setStory("Rare Transplant Types Need a Micro View","VCA procedures—such as uterus and limb transplants—only become visible after another zoom");
      
      renderLines(
        groupedB2,
        currentY,
        "minor-line",
        organ => vcaOrgans.includes(organ) ? 1 : 0.28,
        organ => vcaOrgans.includes(organ) ? 2.5 : 1.5
      );

      renderLabels(
        groupedB2,
        currentY,
        "minor-label",
        new Set(vcaOrgans)
      );

    } else if (nextState === "B3") {
      currentY = yB3.copy();

      yAxisG.transition().duration(duration)
        .call(d3.axisLeft(currentY));
      yAxisG.selectAll("*").style("opacity", 1);

      setStory("Rare Transplant Types Need a Micro View","VCA procedures—such as uterus and limb transplants—only become visible after another zoom");
      
      renderLines(
        groupedB3,
        currentY,
        "minor-line",
        () => 1,
        () => 2.5
      );

      renderLabels(
        groupedB3,
        currentY,
        "minor-label",
        new Set(vcaOrgans)
      );
    }
  }

  function startAutoplay() {
    // Render ONLY the first state - no autoplay of final state
    renderState("B2");
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