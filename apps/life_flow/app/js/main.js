// Headline scenes form the horizontal story spine. Each can optionally own a
// vertical detail stack reached with DOWN/UP. Scene 1 (need_over_time) supplies
// its detail stack dynamically (its in-scene zoom tiers) via __setDetailStack;
// other headlines list separate detail scenes in their `details` array.
//
// Every existing final_show scene is imported and placed on the horizontal path
// so nothing is hidden. The scenes share export names (runScene1..runScene7), so
// each import is aliased. scene5_resolution takes a container, so it's wrapped.
import { runScene0 as runLanding } from "./scenes/final_show/scene0_landing.js";
import { runSystemMap } from "./scenes/final_show/scene_system_map.js";
import { mountShowBreadcrumb, updateShowBreadcrumb } from "./final_show/show_tour.js";
import { runScene1 as runNeed } from "./scenes/final_show/scene1_need_over_time.js";
import { runScene3TreemapDetail } from "./scenes/final_show/scene_appendix_assignment_03.js";
import { runScene3MultiOrganDetail } from "./scenes/final_show/scene_appendix_multi_organ.js";
import { runAppendixPatientJourney } from "./scenes/final_show/scene_appendix_patient_journey.js";
import { runConclusion } from "./scenes/final_show/scene_conclusion.js";
import { runThankYou } from "./scenes/final_show/scene_thankyou.js";
import { runReferences } from "./scenes/final_show/scene_references.js";
import { runScene2WaitHeatmap } from "./scenes/final_show/scene2_wait_heatmap.js";
import { runScene3FlowWaffleAbsolute } from "./scenes/final_show/scene3_flow_waffle_absolute.js";
import { runScene3FlowWaffleProportion } from "./scenes/final_show/scene3_flow_waffle_proportion.js";
import { runScene4 as runMap, mapOrganDetails, setScene4Depth } from "./scenes/final_show/scene4_map.js";
import { runScene5 as runAfter } from "./scenes/final_show/scene5_after_transplant.js";
import { runOrganNetwork, organNetworkDetails } from "./scenes/final_show/scene_organ_network.js";

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

// ---------------------------------------------------------------------------
// Story graph — professor-reviewed narrative order (SRTR = reference only).
// A–L station scenes remain on disk but are not on this spine.
// ---------------------------------------------------------------------------
const headlineScenes = [
  { id: "landing", run: runLanding, details: [] },
  { id: "needOverTime", run: runNeed, details: [], expectedDepth: 4 },
  { id: "waitHeatmap", run: runScene2WaitHeatmap, details: [] },
  {
    id: "flow",
    run: runScene3FlowWaffleAbsolute,
    details: [
      runScene3FlowWaffleProportion,
      runScene3MultiOrganDetail,
      runScene3TreemapDetail
    ]
  },
  { id: "map", run: runMap, details: mapOrganDetails },
  { id: "organNetwork", run: runOrganNetwork, details: organNetworkDetails },
  { id: "afterTransplant", run: runAfter, details: [] },
  { id: "conclusion", run: runConclusion, details: [] },
  { id: "thankYou", run: runThankYou, details: [] },
  { id: "references", run: runReferences, details: [] },
  { id: "appendixPatientJourney", run: runAppendixPatientJourney, details: [] },
  {
    id: "systemMap",
    run: () => runSystemMap({ highlightThroughIndex: -1 }),
    details: []
  }
];

let currentHeadlineIndex = 0;
let currentDetailDepth = 0;

// Bumped on every headline load and mirrored to window.__navToken so a scene's
// late async callback (e.g. Scene 1's CSV) can detect it's stale and bail.
let navToken = 0;

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
  const headline = currentHeadline();
  const extras = headline.details?.length || 0;
  if (detailController) return detailController.depth + extras;
  if (extras && headline.expectedDepth != null) return headline.expectedDepth;
  if (extras) return extras;
  return headline.expectedDepth || 0;
}

// ---------------------------------------------------------------------------
// Navigation buttons (mounted outside #viz so scenes never wipe them)
// ---------------------------------------------------------------------------
const NAV_BUTTONS = [
  { dir: "left",  glyph: "\u2190", aria: "Previous" },
  { dir: "up",    glyph: "\u2191", aria: "Up" },
  { dir: "down",  glyph: "\u2193", aria: "Detail" },
  { dir: "right", glyph: "\u2192", aria: "Next" }
];

function createNav() {
  const nav = document.createElement("div");
  nav.id = "nav";

  const buttons = {};
  NAV_BUTTONS.forEach(({ dir, glyph, aria }) => {
    const button = document.createElement("button");
    button.className = "nav-btn nav-btn--" + dir; // dir class drives compass placement
    button.type = "button";
    button.textContent = glyph;
    button.setAttribute("aria-label", aria);
    button.title = aria;
    button.addEventListener("click", () => navigate(dir));
    nav.appendChild(button);
    buttons[dir] = button;
  });

  return { nav, buttons };
}

function mountShowTopChrome(navEl) {
  let chrome = document.getElementById("show-top-chrome");
  if (!chrome) {
    chrome = document.createElement("div");
    chrome.id = "show-top-chrome";
    document.body.appendChild(chrome);
  }
  const breadcrumb = mountShowBreadcrumb();
  if (breadcrumb.parentElement !== chrome) chrome.appendChild(breadcrumb);
  if (navEl.parentElement !== chrome) chrome.appendChild(navEl);
}

const { nav: navEl, buttons: navButtons } = createNav();
mountShowTopChrome(navEl);

function syncBreadcrumb() {
  const headline = currentHeadline();
  const extras = headline.details?.length || 0;
  const detailCount = detailController
    ? detailController.depth + extras
    : (headline.expectedDepth ?? extras);

  updateShowBreadcrumb({
    headlineId: headline.id,
    detailDepth: currentDetailDepth,
    detailCount
  });
}

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
  delete window.__scene1PendingDepth;
  navToken += 1;
  window.__navToken = navToken; // late async callbacks compare against this

  const headline = currentHeadline();
  console.log("headline:", headline.id);
  renderInViz(headline.run, "Headline '" + headline.id + "'");
  syncBreadcrumb();
  updateNavState();
}

function zoomDepthFor(headline) {
  const extras = headline.details?.length || 0;
  if (detailController) return detailController.depth;
  if (headline.expectedDepth != null) return headline.expectedDepth - extras;
  return 0;
}

function setDepth(depth) {
  const headline = currentHeadline();
  const extras = headline.details || [];
  const ctrlDepth = detailController ? detailController.depth : null;
  const hybrid = ctrlDepth != null && extras.length > 0;
  const zoomDepth = zoomDepthFor(headline);
  const prevDepth = currentDetailDepth;

  // Async zoom stack not registered yet — ignore in-zoom DOWN until ready.
  if (depth > 0 && ctrlDepth == null && depth <= zoomDepth) return;

  // Where (Scene 4): one iframe; swap organ via postMessage — never wipe #viz on ↓/↑.
  if (headline.id === "map") {
    currentDetailDepth = depth;
    const container = d3.select("#viz");
    if (container.select(".scene4-map-host").empty()) {
      renderInViz(headline.run, "Headline '" + headline.id + "'");
    }
    setScene4Depth(depth);
    console.log("depth:", currentDetailDepth, "of", maxDepth(), "for", headline.id);
    syncBreadcrumb();
    updateNavState();
    return;
  }

  currentDetailDepth = depth;

  if (hybrid && depth > ctrlDepth) {
    const detail = extras[depth - ctrlDepth - 1];
    renderInViz(detail, "Detail " + depth + " of '" + headline.id + "'");
  } else if (hybrid && prevDepth > ctrlDepth && depth <= ctrlDepth) {
    // Returning from an extra detail (e.g. multi-organ) — remount zoom scene.
    window.__scene1PendingDepth = depth;
    renderInViz(headline.run, "Headline '" + headline.id + "' (resume zoom)");
  } else if (ctrlDepth != null) {
    detailController.goToDepth(depth);
  } else if (depth === 0) {
    renderInViz(headline.run, "Headline '" + headline.id + "'");
  } else if (extras.length > 0) {
    if (depth <= zoomDepth) {
      window.__scene1PendingDepth = depth;
      renderInViz(headline.run, "Headline '" + headline.id + "' (resume zoom)");
    } else {
      const detail = extras[depth - zoomDepth - 1];
      renderInViz(detail, "Detail " + depth + " of '" + headline.id + "'");
    }
  } else {
    const detail = extras[depth - 1];
    renderInViz(detail, "Detail " + depth + " of '" + headline.id + "'");
  }

  console.log("depth:", currentDetailDepth, "of", maxDepth(), "for", headline.id);
  syncBreadcrumb();
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

// Scenes 4 and Network embed Assignment 05 in same-origin iframes; arrow keys do
// not reach this window while focus is on the iframe. Child scenes post messages here.
const SCENE4_NAV_MESSAGE_SOURCE = "life-flow-scene4";
const ORGAN_NETWORK_NAV_MESSAGE_SOURCE = "life-flow-organ-network";
const IFRAME_NAV_MESSAGE_SOURCES = new Set([
  SCENE4_NAV_MESSAGE_SOURCE,
  ORGAN_NETWORK_NAV_MESSAGE_SOURCE
]);

window.addEventListener("message", (event) => {
  if (event.origin !== window.location.origin) return;
  if (!IFRAME_NAV_MESSAGE_SOURCES.has(event.data?.source) || event.data?.type !== "nav") {
    return;
  }
  const direction = event.data.direction;
  if (direction) navigate(direction);
});

window.addEventListener("keydown", (e) => {
  const direction = KEY_TO_DIRECTION[e.key];
  if (!direction) return;
  e.preventDefault();
  navigate(direction);
});

loadHeadline(0);
