export function runCMultipleOrgans(_data) {
  const width = 1200;
  const height = 700;
  const margin = { top: 100, right: 260, bottom: 70, left: 100 };

  d3.select("#viz").html("");

  d3.csv("assignment_01_temporal/data/optn_multiple_organs_clean.csv").then(data => {
    data.forEach(d => {
      d.year = +d.year;
      d.transplants = +d.transplants;
      d.to_date = +d.to_date;
    });

    const multi = data.filter(d =>
      d.organ && d.organ.includes("-")
    );

    console.log("multi rows:", multi.length);
    console.log("unique combos:", new Set(multi.map(d => d.organ)).size);
    console.log(Array.from(new Set(multi.map(d => d.organ))).sort());

    const topOrgans = Array.from(
      d3.rollups(
        multi,
        v => d3.max(v, d => d.to_date),
        d => d.organ
      )
    )
      .sort((a, b) => d3.descending(a[1], b[1]))
      .slice(0, 10)
      .map(d => d[0]);

    const filtered = multi.filter(d => topOrgans.includes(d.organ));
    const grouped = d3.groups(filtered, d => d.organ);
    grouped.forEach(g => g[1].sort((a, b) => a.year - b.year));

    const container = d3.select("#viz")
      .style("position", "relative");

    const svg = container.append("svg")
      .attr("width", width)
      .attr("height", height);

    const x = d3.scaleLinear()
      .domain(d3.extent(filtered, d => d.year))
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(filtered, d => d.transplants)])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const color = d3.scaleOrdinal(d3.schemeTableau10)
      .domain(topOrgans);

    const line = d3.line()
      .defined(d => Number.isFinite(d.transplants) && Number.isFinite(d.year))
      .x(d => x(d.year))
      .y(d => y(d.transplants));

    svg.append("text")
      .attr("x", margin.left)
      .attr("y", 32)
      .attr("font-size", "26px")
      .attr("font-weight", "700")
      .text("Multiple-Organ Transplants");

    svg.append("text")
      .attr("x", margin.left)
      .attr("y", 56)
      .attr("font-size", "15px")
      .attr("fill", "#555")
      .text("Examples include liver + lung, liver + intestine, and other rare combinations");

    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")).ticks(10));

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));

    grouped.forEach(([organ, values]) => {
      svg.append("path")
        .datum(values)
        .attr("fill", "none")
        .attr("stroke", color(organ))
        .attr("stroke-width", 2)
        .attr("d", line);

      const lastPoint = values[values.length - 1];
      if (!lastPoint) return;

      svg.append("text")
        .attr("x", x(lastPoint.year) + 8)
        .attr("y", y(lastPoint.transplants))
        .attr("font-size", "11px")
        .attr("fill", color(organ))
        .attr("alignment-baseline", "middle")
        .text(organ.replaceAll("-", " + "));
    });

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height - 40)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .attr("font-style", "italic")
      .attr("fill", "#555")
      .text("Multiple-organ cases reveal complexity that disappears in simpler summaries");

    const breadcrumb = container.append("div")
      .style("position", "absolute")
      .style("bottom", "18px")
      .style("left", "0")
      .style("width", "100%")
      .style("display", "flex")
      .style("justify-content", "center")
      .style("gap", "10px");

    [false, false, false, false, true].forEach(active => {
      breadcrumb.append("div")
        .style("width", "8px")
        .style("height", "8px")
        .style("border-radius", "50%")
        .style("background-color", active ? "#333" : "#ccc");
    });
  }).catch(err => {
    console.error("Multiple-organ CSV load error:", err);

    d3.select("#viz").html(`
      <div style="padding:40px; font-family:sans-serif; color:#333;">
        <h2>Could not load multiple-organ data</h2>
        <p>Check that <code>app/data/optn_multiple_organs_clean.csv</code> exists.</p>
      </div>
    `);
  });
}
