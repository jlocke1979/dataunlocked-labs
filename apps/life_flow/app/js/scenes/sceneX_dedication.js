export function runDedicationScene() {
  d3.select("#viz").html(`
    <div style="padding:40px; font-family:sans-serif; color:#222; text-align:center;">
      <h2 style="margin-bottom:20px;">Dedication</h2>

      <p style="font-size:16px; line-height:1.6;">
        In recognition of Sue Ellen,
        <br/>
        and the staff at Northwestern Memorial Hospital,
        <br/>
        and the broader transplant community.
      </p>
    </div>
  `);
}
