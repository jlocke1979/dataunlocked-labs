import { runScene1 } from "./scenes/scene1_situation.js";
import { runScene2 } from "./scenes/scene2_system.js";

let currentScene = 1;

const scenes = {
  1: runScene1,
  2: runScene2,
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