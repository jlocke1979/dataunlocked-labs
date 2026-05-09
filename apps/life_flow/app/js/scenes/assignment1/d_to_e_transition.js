export function runDToETransition(data) {
  d3.select("#viz").html(`
    <div style="padding:40px; font-family:sans-serif;">
      <h1>D → E Transition</h1>
      <p>Placeholder for donor-split to gap transition.</p>
      <p>Rows available: ${data.length}</p>
    </div>
  `);
}