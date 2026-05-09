export function runDDonorSplit(data) {
  d3.select("#viz").html(`
    <div style="padding:40px; font-family:sans-serif;">
      <h1>D. Donor Split</h1>
      <p>Placeholder scene is working.</p>
      <p>Rows available: ${data.length}</p>
    </div>
  `);
}