export function runScene0() {
  const container = d3.select("#viz");
  container.selectAll("*").remove();

  container
    .append("div")
    .attr("class", "scene scene-title")
    .html(`
      <h1>Life Flow</h1>
      <p>Organ transplantation, waiting, and the hidden systems that create time.</p>
      <p class="hint">Use ← and → to move through the show.</p>
    `);
}