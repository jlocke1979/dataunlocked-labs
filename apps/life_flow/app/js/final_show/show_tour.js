// Narrative breadcrumb — professor-reviewed story beats (SRTR cited in copy only).

export const SHOW_TOUR_STOPS = [
  {
    id: "need",
    label: "Need",
    mapHint: "Growing need for transplant",
    headlineId: "needOverTime"
  },
  {
    id: "wait",
    label: "Wait",
    mapHint: "Waitlist and time to transplant",
    headlineId: "waitHeatmap"
  },
  {
    id: "flow",
    label: "Gap",
    mapHint: "Supply vs demand \u2014 why people wait",
    headlineId: "flow"
  },
  {
    id: "where",
    label: "Where",
    mapHint: "Centers and geography",
    headlineId: "map"
  },
  {
    id: "network",
    label: "Network",
    mapHint: "Donor-to-transplant flows",
    headlineId: "organNetwork"
  },
  {
    id: "after",
    label: "After",
    mapHint: "Outcomes after transplant",
    headlineId: "afterTransplant"
  },
  {
    id: "close",
    label: "Close",
    mapHint: "Conclusion",
    headlineId: "conclusion"
  }
];

const BREADCRUMB_HEADLINE_IDS = new Set(SHOW_TOUR_STOPS.map(s => s.headlineId));

const BREADCRUMB_HIDDEN_HEADLINE_IDS = new Set([
  "landing",
  "appendixIntro",
  "systemMap",
  "appendixPatientJourney",
  "references",
  "choppingBlockIntro"
]);

let breadcrumbEl = null;

export function mountShowBreadcrumb() {
  if (breadcrumbEl) return breadcrumbEl;

  breadcrumbEl = document.createElement("nav");
  breadcrumbEl.id = "show-breadcrumb";
  breadcrumbEl.setAttribute("aria-label", "Story progress");
  document.body.appendChild(breadcrumbEl);
  return breadcrumbEl;
}

export function hideShowBreadcrumb() {
  if (!breadcrumbEl) return;
  breadcrumbEl.hidden = true;
}

function renderBreadcrumbPills({ activeIndex = -1, detailDepth = 0, detailCount = 0, preview = false }) {
  const pills = SHOW_TOUR_STOPS.map((stop, index) => {
    let state = "upcoming";
    if (!preview && activeIndex >= 0 && index < activeIndex) state = "past";
    else if (!preview && index === activeIndex) state = "current";

    const detailSuffix =
      state === "current" && detailDepth > 0 && detailCount > 0
        ? ` \u00b7 ${detailDepth}/${detailCount}`
        : "";

    const pillTitle = stop.mapHint ? `${stop.label} \u2014 ${stop.mapHint}` : stop.label;
    return `<span class="show-breadcrumb__pill show-breadcrumb__pill--${state}" title="${pillTitle}">${stop.label}${detailSuffix}</span>`;
  }).join("");

  breadcrumbEl.innerHTML = `<div class="show-breadcrumb__track">${pills}</div>`;
}

function setTopChromeIntroMode(isLanding) {
  const chrome = document.getElementById("show-top-chrome");
  if (!chrome) return;
  chrome.classList.toggle("show-top-chrome--intro", isLanding);
}

/** @param {{ headlineId: string, detailDepth?: number, detailCount?: number }} state */
export function updateShowBreadcrumb({ headlineId, detailDepth = 0, detailCount = 0 }) {
  mountShowBreadcrumb();

  if (headlineId === "landing") {
    hideShowBreadcrumb();
    setTopChromeIntroMode(false);
    return;
  }

  breadcrumbEl.classList.remove("show-breadcrumb--preview");
  setTopChromeIntroMode(false);

  if (BREADCRUMB_HIDDEN_HEADLINE_IDS.has(headlineId) || !BREADCRUMB_HEADLINE_IDS.has(headlineId)) {
    hideShowBreadcrumb();
    return;
  }

  breadcrumbEl.hidden = false;

  const activeIndex = SHOW_TOUR_STOPS.findIndex(s => s.headlineId === headlineId);
  renderBreadcrumbPills({ activeIndex, detailDepth, detailCount });
}
