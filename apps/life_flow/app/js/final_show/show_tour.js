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

const SUPPLEMENTAL_HEADLINE_IDS = new Set([
  "thankYou",
  "references",
  "auditNotes",
  "generativeAi",
  "appendixMultiOrganTrueScale",
  "appendixPatientJourney",
  "systemMap"
]);

const SUPPLEMENTAL_STOP = {
  label: "Supplemental",
  mapHint: "Thank you, references, and appendix"
};

const OPENING_STOP = {
  label: "Opening",
  mapHint: "Start here"
};

const BREADCRUMB_HIDDEN_HEADLINE_IDS = new Set([
  "landing",
  "appendixIntro",
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

function supplementalPillHtml(state) {
  const supplementalTitle = `${SUPPLEMENTAL_STOP.label} \u2014 ${SUPPLEMENTAL_STOP.mapHint}`;
  return `<span class="show-breadcrumb__pill show-breadcrumb__pill--${state}" title="${supplementalTitle}">${SUPPLEMENTAL_STOP.label}</span>`;
}

function openingPillHtml(state) {
  const openingTitle = `${OPENING_STOP.label} \u2014 ${OPENING_STOP.mapHint}`;
  return `<span class="show-breadcrumb__pill show-breadcrumb__pill--${state}" title="${openingTitle}">${OPENING_STOP.label}</span>`;
}

function renderOpeningBreadcrumb() {
  const previewPills = SHOW_TOUR_STOPS.map((stop) => {
    const pillTitle = stop.mapHint ? `${stop.label} \u2014 ${stop.mapHint}` : stop.label;
    return `<span class="show-breadcrumb__pill show-breadcrumb__pill--upcoming" title="${pillTitle}">${stop.label}</span>`;
  }).join("");

  breadcrumbEl.innerHTML =
    `<div class="show-breadcrumb__track">${openingPillHtml("current")}${previewPills}${supplementalPillHtml("upcoming")}</div>`;
  breadcrumbEl.classList.add("show-breadcrumb--preview");
  breadcrumbEl.hidden = false;
}

function renderBreadcrumbPills({
  activeIndex = -1,
  detailDepth = 0,
  detailCount = 0,
  preview = false,
  openingState = "past",
  supplementalState = "upcoming"
}) {
  const pills = SHOW_TOUR_STOPS.map((stop, index) => {
    let state = "upcoming";
    if (!preview && activeIndex >= 0 && index < activeIndex) state = "past";
    else if (!preview && index === activeIndex) state = "current";

    const pillTitle = stop.mapHint ? `${stop.label} \u2014 ${stop.mapHint}` : stop.label;
    const showDetailSuffix = state === "current" && detailCount > 0 && detailDepth > 0;

    if (showDetailSuffix) {
      return `<span class="show-breadcrumb__pill show-breadcrumb__pill--${state}" title="${pillTitle}">${stop.label} ${detailDepth}/${detailCount}</span>`;
    }

    return `<span class="show-breadcrumb__pill show-breadcrumb__pill--${state}" title="${pillTitle}">${stop.label}</span>`;
  }).join("");

  breadcrumbEl.innerHTML =
    `<div class="show-breadcrumb__track">${openingPillHtml(openingState)}${pills}${supplementalPillHtml(supplementalState)}</div>`;
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
    setTopChromeIntroMode(true);
    renderOpeningBreadcrumb();
    return;
  }

  breadcrumbEl.classList.remove("show-breadcrumb--preview");
  setTopChromeIntroMode(false);

  if (BREADCRUMB_HIDDEN_HEADLINE_IDS.has(headlineId)) {
    hideShowBreadcrumb();
    return;
  }

  if (SUPPLEMENTAL_HEADLINE_IDS.has(headlineId)) {
    breadcrumbEl.hidden = false;
    renderBreadcrumbPills({
      activeIndex: SHOW_TOUR_STOPS.length,
      openingState: "past",
      supplementalState: "current"
    });
    return;
  }

  if (!BREADCRUMB_HEADLINE_IDS.has(headlineId)) {
    hideShowBreadcrumb();
    return;
  }

  breadcrumbEl.hidden = false;

  const activeIndex = SHOW_TOUR_STOPS.findIndex(s => s.headlineId === headlineId);
  renderBreadcrumbPills({
    activeIndex,
    detailDepth,
    detailCount,
    openingState: "past",
    supplementalState: "upcoming"
  });
}
