import { initPopulationCloudScene } from "./scenes/scene0_population_cloud.js";
// import { initDotFieldScene } from "./scenes/scene1_dotfield.js";

function init() {
  console.log("App starting...");
  initPopulationCloudScene();
  // initDotFieldScene();
}

init();