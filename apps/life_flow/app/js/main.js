import { runScene0 } from "./scenes/final_show/scene0_landing.js";
import { runScene1 } from "./scenes/final_show/scene1_need_over_time.js";
import { runScene2 } from "./scenes/final_show/scene2_wait_heatmap.js";
import { runScene3 } from "./scenes/final_show/scene3_flow.js";
import { runScene4 } from "./scenes/final_show/scene4_map.js";
import { runScene5 } from "./scenes/final_show/scene5_after_transplant.js";
import { runScene6 } from "./scenes/final_show/scene6_donor_impact.js";
import { runScene7 } from "./scenes/final_show/scene7_outro.js";
import { storyColors } from "./constants/colors.js";

// Museum white background on every slide, including the real Assignment 1
// chart slide, which renders an SVG without its own background rect.
d3.select("body").style("background", storyColors.museumWhite);
d3.select("#viz").style("background", storyColors.museumWhite);

const scenes = [
  runScene0,
  runScene1,
  runScene2,
  runScene3,
  runScene4,
  runScene5,
  runScene6,
  runScene7
];

let currentScene = 0;

function loadScene(index) {
  if (index < 0 || index >= scenes.length) return;

  currentScene = index;
  console.log(`Loading scene ${index}`);

  d3.select("#viz").selectAll("*").remove();
  scenes[currentScene]();
}

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") loadScene(currentScene + 1);
  if (e.key === "ArrowLeft") loadScene(currentScene - 1);
});

loadScene(0);
