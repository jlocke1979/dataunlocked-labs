import { runAToB1Transition } from "./a_to_b1_transition.js";
import { runB1ToB2Transition } from "./b1_to_b2_transition.js";
import { runB2ToB3Transition } from "./b2_to_b3_transition.js";
import { runB3MicroOrgans } from "./b3_micro_organs.js";
import { runB3ToCTransition } from "./b3_to_c_transition.js";
import { runCMultipleOrgans } from "./c_multiple_organs.js";


let currentScene = 0;
let appData = [];

const scenes = [
  runAToB1Transition,
  runB1ToB2Transition,
  runB2ToB3Transition,
  runB3MicroOrgans,
  runB3ToCTransition,
  runCMultipleOrgans
];



function loadScene(index) {
  if (index < 0 || index >= scenes.length) return;

  currentScene = index;
  console.log("Loading scene:", index);

  d3.select("#viz").html("");

  scenes[index](appData);
}

d3.csv("assignment_01_temporal/data/optn_transplants_clean.csv")
  .then(data => {
    data.forEach(d => {
      d.year = +d.year;
      d.transplants = +d.transplants;
      d.to_date = +d.to_date;
      d.donor_type = d.donor_type ? d.donor_type.trim() : "";
      d.organ = d.organ ? d.organ.trim() : "";
    });

    appData = data;
    console.log("Loaded data rows:", data.length);

    loadScene(0);
  })
  .catch(err => {
    console.error("CSV load error:", err);
    d3.select("#viz").html(
      "<p style='color:red; padding:40px; font-family:sans-serif;'>CSV failed to load.</p>"
    );
  });

window.addEventListener("keydown", e => {
  console.log("Key pressed:", e.key);

  if (e.key === "ArrowRight") {
    loadScene(currentScene + 1);
  }

  if (e.key === "ArrowLeft") {
    loadScene(currentScene - 1);
  }
});
