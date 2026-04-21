import { runScene1 } from "./scenes/scene1_situation.js";
import { runScene2 } from "./scenes/scene2_system.js";
import { runScene3 } from "./scenes/scene3_tension.js";
import { runScene4 } from "./scenes/scene4_problem.js";
import { runScene5 } from "./scenes/scene5_resolution.js";
import { runScene6 } from "./scenes/scene6_outro.js";

let currentScene = 1;

const scenes = {
  1: runScene1,
  2: runScene2,
  3: runScene3,
  4: runScene4,
  5: runScene5,
  6: runScene6,
};

function loadScene(index) {
  console.log(`Loading scene ${index}`);
  currentScene = index;
  scenes[index]();
}

loadScene(1);

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") {
    const next = currentScene + 1;
    if (scenes[next]) loadScene(next);
  }

  if (e.key === "ArrowLeft") {
    const prev = currentScene - 1;
    if (scenes[prev]) loadScene(prev);
  }
});


//// For Assignement 01  Temporal /////
d3.csv("data/optn_transplants_clean.csv").then(data => {
  data.forEach(d => {
    d.year = +d.year;
    d.transplants = +d.transplants;
    d.to_date = +d.to_date;
  });

  console.log(data.slice(0, 10));
});