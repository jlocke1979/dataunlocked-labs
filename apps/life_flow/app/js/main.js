import { runScene0 } from "./scenes/final_show/scene0_landing.js";
import { runScene1 } from "./scenes/final_show/scene1_situation.js";
import { runScene2 } from "./scenes/final_show/scene2_system.js";
import { runScene3 } from "./scenes/final_show/scene3_tension.js";
import { runScene4 } from "./scenes/final_show/scene4_problem.js";
import { runScene5 } from "./scenes/final_show/scene5_resolution.js";
import { runScene6 } from "./scenes/final_show/scene6_outro.js";

const scenes = [
  runScene0,
  runScene1,
  runScene2,
  runScene3,
  runScene4,
  runScene5,
  runScene6
];

let currentScene = 0;

function loadScene(index) {
  if (index < 0 || index >= scenes.length) return;

  console.log(`Loading scene ${index}`);
  currentScene = index;

  d3.select("#viz").selectAll("*").remove();
  scenes[currentScene]();
}

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") loadScene(currentScene + 1);
  if (e.key === "ArrowLeft") loadScene(currentScene - 1);
});

loadScene(0);