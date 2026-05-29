import { runBAllOrgans } from "../assignment1/b_all_organs.js";
import { renderPlaceholder } from "./show_helpers.js";

const DATA_PATH = "data/optn_transplants_clean.csv";

export function runScene1() {
  const container = d3.select("#viz");
  container.selectAll("*").remove();

  d3.csv(DATA_PATH)
    .then(rows => {
      rows.forEach(d => {
        d.year = +d.year;
        d.transplants = +d.transplants;
        d.to_date = +d.to_date;
        d.donor_type = d.donor_type ? d.donor_type.trim() : "";
        d.organ = d.organ ? d.organ.trim() : "";
      });

      // Reusable Assignment 1 temporal line chart (organ-level need over time).
      runBAllOrgans(rows);
    })
    .catch(err => {
      console.error("Scene 1 CSV load error:", err);
      renderPlaceholder(container, {
        sceneLabel: "Scene 1",
        title: "Need Over Time",
        subtitle: "Transplants by organ, 1988\u20132025.",
        note: "Placeholder: connect existing assignment1 b_all_organs chart here."
      });
    });
}
