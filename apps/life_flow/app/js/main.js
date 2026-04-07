import { initPopulationCloudScene } from "./scenes/scene0_v1.1_population_cloud.js";

function init() {
  console.log("App starting...");
  const viz = document.querySelector("#viz");
  console.log("viz exists?", !!viz);
  initPopulationCloudScene();
}

init();