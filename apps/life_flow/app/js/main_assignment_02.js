console.log("Assignment 02 main loaded");

import { runIntroMass } from "./scenes_assignment2/a_intro_mass.js";
import { runWaitlistByOrgan } from "./scenes_assignment2/b_waitlist_by_organ.js";
import { runTransplantsByOrgan } from "./scenes_assignment2/c_transplants_by_organ.js";
import { runWaitlistVsTransplants } from "./scenes_assignment2/d_waitlist_vs_transplants.js";
import { runSingleVsMulti } from "./scenes_assignment2/e_single_vs_multi.js";
import { runStaticSlide } from "./scenes_assignment2/f_static_slide.js";

const scenes = [
  runIntroMass,
  runWaitlistByOrgan,
  runTransplantsByOrgan,
  runWaitlistVsTransplants,
  runSingleVsMulti,
  runStaticSlide
];

let currentScene = 0;


function renderScene() {
  d3.select("#vis").selectAll("*").remove();

  scenes[currentScene]();

  //  Optional: visual scene indicator
  d3.select("#vis")
    .append("div")
    .style("position", "absolute")
    .style("top", "10px")
    .style("right", "20px")
    .style("font-size", "14px")
    .style("color", "#2f3e34")
    .text(`Scene ${currentScene + 1} / ${scenes.length}`);
}

document.addEventListener("keydown", (event) => {

  // Right arrow → next
  if (event.key === "ArrowRight" && currentScene < scenes.length - 1) {
    currentScene += 1;
    renderScene();
  }

  // Left arrow → back
  if (event.key === "ArrowLeft" && currentScene > 0) {
    currentScene -= 1;
    renderScene();
  }

  // Number keys (1–6) → jump to scene
  if (!isNaN(event.key)) {
    const num = parseInt(event.key);
    if (num >= 1 && num <= scenes.length) {
      currentScene = num - 1;
      renderScene();
    }
  }
});

document.addEventListener("click", () => {
  if (currentScene < scenes.length - 1) {
    currentScene += 1;
    renderScene();
  }
});



renderScene();