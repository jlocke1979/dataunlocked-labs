// The show's scenes, in the order the previous (committed) main.js ran them:
// landing -> need-over-time -> wait-heatmap -> flow -> map -> after-transplant
// -> donor-impact -> outro. (The scene1_situation/scene2_system/... narrative
// files are older drafts and are intentionally not wired in.)
import { runScene0 as runLanding } from "./scenes/final_show/scene0_landing.js";
import { runScene1 as runNeed } from "./scenes/final_show/scene1_need_over_time.js";
import { runScene2 as runHeatmap } from "./scenes/final_show/scene2_wait_heatmap.js";
import { runScene3 as runFlow } from "./scenes/final_show/scene3_flow.js";
import { runScene4 as runMap } from "./scenes/final_show/scene4_map.js";
import { runScene5 as runAfter } from "./scenes/final_show/scene5_after_transplant.js";
import { runScene6 as runDonor } from "./scenes/final_show/scene6_donor_impact.js";
import { runScene7 as runOutro } from "./scenes/final_show/scene7_outro.js";

import { storyColors } from "./constants/colors.js";

console.log("final_show.html JS loaded");

function showError(label, err) {
  console.error(label, err);
  const viz = document.querySelector("#viz");
  if (viz) {
    viz.innerHTML =
      "<pre style='font-family:Menlo,monospace;padding:32px;color:#6F4949;" +
      "white-space:pre-wrap'>" + label + "\n" + (err && err.stack ? err.stack : err) + "</pre>";
  }
}

if (typeof d3 === "undefined") {
  showError("d3 failed to load (check the CDN <script> tags).", new Error("d3 is undefined"));
}

// Museum white background on every slide, including the real Assignment 1
// chart slide, which renders an SVG without its own background rect.
d3.select("body").style("background", storyColors.museumWhite);
d3.select("#viz").style("background", storyColors.museumWhite);

// ---------------------------------------------------------------------------
// Story graph
//
// Each node declares its run() function plus the neighbour node id reachable
// in each direction. Navigation is purely data-driven: re-wiring the show only
// means editing this map. A missing direction means that button is disabled.
//
//   RIGHT -> next scene            LEFT -> previous scene
//   DOWN  -> supporting detail     UP   -> back to parent scene
//
// The show is currently the flat left/right sequence that was running before.
// No detail scenes are assigned yet, so DOWN/UP stay disabled until a scene
// declares a `down` target (with the detail node declaring a matching `up`).
// ---------------------------------------------------------------------------
const storyGraph = {
  landing: { run: runLanding, right: "need" },
  need:    { run: runNeed,    left: "landing", right: "heatmap" },
  heatmap: { run: runHeatmap, left: "need",    right: "flow" },
  flow:    { run: runFlow,    left: "heatmap", right: "map" },
  map:     { run: runMap,     left: "flow",    right: "after" },
  after:   { run: runAfter,   left: "map",     right: "donor" },
  donor:   { run: runDonor,   left: "after",   right: "outro" },
  outro:   { run: runOutro,   left: "donor" }
};

let currentId = "landing";

// Optional per-scene navigation hook. A scene that has internal sub-steps
// (e.g. Scene 1's zoom tiers) can register one so the GLOBAL left/right nav
// steps through those sub-steps first, then advances to the adjacent scene at
// the boundaries. Reset on every scene load; scenes opt in via window.__setSceneNav.
let sceneNavHook = null;
window.__setSceneNav = (hook) => {
  sceneNavHook = hook;
  updateNavState();
};

// ---------------------------------------------------------------------------
// Navigation buttons (mounted outside #viz so scenes never wipe them)
// ---------------------------------------------------------------------------
// Only left/right for now; the story is a flat spine. Add up/down entries here
// (and `up`/`down` targets in storyGraph) when you nest detail scenes later.
const NAV_BUTTONS = [
  { dir: "left",  label: "\u2190 Previous" },
  { dir: "right", label: "\u2192 Next" }
];

function createNav() {
  const nav = document.createElement("div");
  nav.id = "nav";

  const buttons = {};
  NAV_BUTTONS.forEach(({ dir, label }) => {
    const button = document.createElement("button");
    button.className = "nav-btn";
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", () => navigate(dir));
    nav.appendChild(button);
    buttons[dir] = button;
  });

  document.body.appendChild(nav);
  return buttons;
}

const navButtons = createNav();

function canNavigate(direction) {
  if (sceneNavHook && sceneNavHook.canHandle(direction)) return true;
  const node = storyGraph[currentId];
  return Boolean(node && node[direction]);
}

function updateNavState() {
  Object.keys(navButtons).forEach((dir) => {
    const enabled = canNavigate(dir);
    navButtons[dir].classList.toggle("is-disabled", !enabled);
    navButtons[dir].disabled = !enabled;
  });
}

function loadScene(nodeId) {
  const node = storyGraph[nodeId];
  if (!node) return;

  currentId = nodeId;
  sceneNavHook = null; // drop the previous scene's hook before rendering
  console.log("starting scene", currentId);

  d3.select("#viz").selectAll("*").remove();

  try {
    node.run();
  } catch (err) {
    showError("Scene " + currentId + " failed to render:", err);
  }

  updateNavState();
}

function navigate(direction) {
  // Let the current scene consume an in-scene sub-step first, if it has one.
  if (sceneNavHook && sceneNavHook.canHandle(direction)) {
    sceneNavHook.handle(direction);
    updateNavState();
    return;
  }

  const node = storyGraph[currentId];
  if (!node) return;
  const target = node[direction];
  if (target) loadScene(target);
}

const KEY_TO_DIRECTION = {
  ArrowRight: "right",
  ArrowLeft: "left"
};

window.addEventListener("keydown", (e) => {
  const direction = KEY_TO_DIRECTION[e.key];
  if (!direction) return;
  e.preventDefault();
  navigate(direction);
});

loadScene("landing");
