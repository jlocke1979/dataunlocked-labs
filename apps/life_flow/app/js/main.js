// Headline scenes form the horizontal story spine. Each can optionally own a
// vertical detail stack reached with DOWN/UP. Scene 1 (need_over_time) supplies
// its detail stack dynamically (its in-scene zoom tiers) via __setDetailStack;
// other headlines list separate detail scenes in their `details` array.
//
// Every existing final_show scene is imported and placed on the horizontal path
// so nothing is hidden. The scenes share export names (runScene1..runScene7), so
// each import is aliased. scene5_resolution takes a container, so it's wrapped.
import { runScene0 as runLanding } from "./scenes/final_show/scene0_landing.js";
import { runScene1 as runSituation } from "./scenes/final_show/scene1_situation.js";
import { runScene1 as runNeed } from "./scenes/final_show/scene1_need_over_time.js";
import { runScene2 as runSystem } from "./scenes/final_show/scene2_system.js";
import { runScene2 as runHeatmap } from "./scenes/final_show/scene2_wait_heatmap.js";
import { runScene3 as runTension } from "./scenes/final_show/scene3_tension.js";
import { runScene3 as runFlow } from "./scenes/final_show/scene3_flow.js";
import { runScene4 as runProblem } from "./scenes/final_show/scene4_problem.js";
import { runScene4 as runMap } from "./scenes/final_show/scene4_map.js";
import { runScene5 as runResolutionRaw } from "./scenes/final_show/scene5_resolution.js";
import { runScene5 as runAfter } from "./scenes/final_show/scene5_after_transplant.js";
import { runScene6 as runOutro6 } from "./scenes/final_show/scene6_outro.js";
import { runScene6 as runDonor } from "./scenes/final_show/scene6_donor_impact.js";
import { runScene7 as runOutro7 } from "./scenes/final_show/scene7_outro.js";
import { runDedicationScene as runDedication } from "./scenes/final_show/sceneX_dedication.js";

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

// Museum white background on every slide.
d3.select("body").style("background", storyColors.museumWhite);
d3.select("#viz").style("background", storyColors.museumWhite);

// scene5_resolution renders into a container passed in, unlike the others which
// select #viz themselves. Wrap it so every headline has the same zero-arg run().
function runResolution() {
  runResolutionRaw(d3.select("#viz"));
}

// ---------------------------------------------------------------------------
// Story graph
//
//   headlineScenes : horizontal spine, navigated with LEFT / RIGHT
//   details        : per-headline vertical stack of detail scenes (DOWN / UP)
//
// A headline whose scene has *in-scene* sub-levels (Scene 1's zoom tiers)
// registers a controller at runtime via window.__setDetailStack instead of
// listing static `details`, so chart internals are never duplicated here.
// ---------------------------------------------------------------------------
const headlineScenes = [
  { id: "landing",        run: runLanding,    details: [] },
  { id: "situation",      run: runSituation,  details: [] },
  { id: "needOverTime",   run: runNeed,       details: [] }, // detail stack via __setDetailStack
  { id: "system",         run: runSystem,     details: [] },
  { id: "waitHeatmap",    run: runHeatmap,    details: [] },
  { id: "tension",        run: runTension,    details: [] },
  { id: "flow",           run: runFlow,       details: [] },
  { id: "problem",        run: runProblem,    details: [] },
  { id: "map",            run: runMap,        details: [] },
  { id: "resolution",     run: runResolution, details: [] },
  { id: "afterTransplant", run: runAfter,     details: [] },
  { id: "outro",          run: runOutro6,     details: [] },
  { id: "donorImpact",    run: runDonor,      details: [] },
  { id: "outroDetail",    run: runOutro7,     details: [] },
  { id: "dedication",     run: runDedication, details: [] }
];

let currentHeadlineIndex = 0;
let currentDetailDepth = 0;

// Detail controller registered by the current headline's scene, if it manages
// its own in-scene depth (e.g. Scene 1). Reset on every headline load.
//   { depth: <number of DOWN levels below the headline>, goToDepth(d) }
let detailController = null;
window.__setDetailStack = (controller) => {
  detailController = controller;
  updateNavState();
};

function currentHeadline() {
  return headlineScenes[currentHeadlineIndex];
}

// Number of DOWN levels available below the current headline.
function maxDepth() {
  if (detailController) return detailController.depth;
  return currentHeadline().details.length;
}

// ---------------------------------------------------------------------------
// Navigation buttons (mounted outside #viz so scenes never wipe them)
// ---------------------------------------------------------------------------
const NAV_BUTTONS = [
  { dir: "left",  label: "\u2190 Previous" },
  { dir: "up",    label: "\u2191 Back to headline" },
  { dir: "down",  label: "\u2193 Explore detail" },
  { dir: "right", label: "\u2192 Next" }
];

function createNav() {
  const nav = document.createElement("div");
  nav.id = "nav";

  const buttons = {};
  NAV_BUTTONS.forEach(({ dir, label }) => {
    const button = document.createElement("button");
    button.className = "nav-btn nav-btn--" + dir; // dir class drives compass placement
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
  switch (direction) {
    case "right": return currentHeadlineIndex < headlineScenes.length - 1;
    case "left":  return currentHeadlineIndex > 0;
    case "down":  return currentDetailDepth < maxDepth();
    case "up":    return currentDetailDepth > 0;
    default:      return false;
  }
}

function updateNavState() {
  Object.keys(navButtons).forEach((dir) => {
    const enabled = canNavigate(dir);
    const button = navButtons[dir];
    button.classList.toggle("is-disabled", !enabled);
    button.disabled = !enabled;
    button.setAttribute("aria-disabled", String(!enabled));
  });
}

function renderInViz(run, label) {
  d3.select("#viz").selectAll("*").remove();
  try {
    run();
  } catch (err) {
    showError(label + " failed to render:", err);
  }
}

function loadHeadline(index) {
  if (index < 0 || index >= headlineScenes.length) return;

  currentHeadlineIndex = index;
  currentDetailDepth = 0;
  detailController = null; // headline scene may re-register its own stack

  const headline = currentHeadline();
  console.log("headline:", headline.id);
  renderInViz(headline.run, "Headline '" + headline.id + "'");
  updateNavState();
}

function setDepth(depth) {
  currentDetailDepth = depth;
  const headline = currentHeadline();

  if (detailController) {
    // In-scene depth (e.g. Scene 1 zoom): the scene stays mounted and restyles.
    detailController.goToDepth(depth);
  } else if (depth === 0) {
    renderInViz(headline.run, "Headline '" + headline.id + "'");
  } else {
    const detail = headline.details[depth - 1];
    renderInViz(detail, "Detail " + depth + " of '" + headline.id + "'");
  }

  console.log("depth:", currentDetailDepth, "of", maxDepth(), "for", headline.id);
  updateNavState();
}

function navigate(direction) {
  if (!canNavigate(direction)) return;

  switch (direction) {
    case "right": loadHeadline(currentHeadlineIndex + 1); break;
    case "left":  loadHeadline(currentHeadlineIndex - 1); break;
    case "down":  setDepth(currentDetailDepth + 1); break;
    case "up":    setDepth(currentDetailDepth - 1); break;
  }
}

const KEY_TO_DIRECTION = {
  ArrowRight: "right",
  ArrowLeft: "left",
  ArrowDown: "down",
  ArrowUp: "up"
};

window.addEventListener("keydown", (e) => {
  const direction = KEY_TO_DIRECTION[e.key];
  if (!direction) return;
  e.preventDefault();
  navigate(direction);
});

loadHeadline(0);
