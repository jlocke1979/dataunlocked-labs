// UNOS/OPTN "Transplant System" reference map — hotspot anchors on the bundled image.
// Coordinates are normalized (0–1) within the diagram art box (below the title band).
// Tune nx/ny after swapping in a higher-resolution export from the PDF.

/** @type {string} Path relative to final_show.html */
export const SYSTEM_MAP_IMAGE_URL = "./assets/unos-transplant-system-reference.png";

/** Art box inside the 1280×720 chart (below header); image letterboxed inside. */
const SYSTEM_MAP_SCALE = 0.85;
const SYSTEM_MAP_BASE = {
  x: 128,
  y: 228,
  width: 1024,
  height: 292
};

/** Art box for appendix system map (shrunk ~15% for breathing room). */
export const SYSTEM_MAP_ART = {
  x: SYSTEM_MAP_BASE.x + (SYSTEM_MAP_BASE.width * (1 - SYSTEM_MAP_SCALE)) / 2,
  y: SYSTEM_MAP_BASE.y + (SYSTEM_MAP_BASE.height * (1 - SYSTEM_MAP_SCALE)) / 2,
  width: SYSTEM_MAP_BASE.width * SYSTEM_MAP_SCALE,
  height: SYSTEM_MAP_BASE.height * SYSTEM_MAP_SCALE
};

/**
 * Tour stops mapped to UNOS station letters on the reference diagram.
 * @type {Array<{ stopId: string, unosLetter: string, unosLabel: string, nx: number, ny: number }>}
 */
export const SYSTEM_MAP_HOTSPOTS = [
  { stopId: "need", unosLetter: "E", unosLabel: "Listing", nx: 0.33, ny: 0.52 },
  { stopId: "wait", unosLetter: "G", unosLabel: "Survival on the waitlist", nx: 0.46, ny: 0.54 },
  { stopId: "donation", unosLetter: "R", unosLabel: "Organ recovered", nx: 0.62, ny: 0.3 },
  { stopId: "where", unosLetter: "Q", unosLabel: "Organ offered to center", nx: 0.56, ny: 0.36 },
  { stopId: "after", unosLetter: "K", unosLabel: "Early survival after transplant", nx: 0.72, ny: 0.54 },
  { stopId: "donor", unosLetter: "F", unosLabel: "Living donor transplant", nx: 0.39, ny: 0.58 },
  { stopId: "close", unosLetter: "L", unosLabel: "Long-term survival", nx: 0.86, ny: 0.54 }
];

export function hotspotStageCoords(hotspot) {
  const { x, y, width, height } = SYSTEM_MAP_ART;
  return {
    cx: x + hotspot.nx * width,
    cy: y + hotspot.ny * height
  };
}

/** @param {number} highlightThroughIndex -1 = base only; 0..6 = cumulative stops through that index */
export function getHotspotHighlightState(highlightThroughIndex) {
  return SYSTEM_MAP_HOTSPOTS.map((hotspot, index) => {
    if (highlightThroughIndex < 0) return { ...hotspot, state: "hidden" };
    if (index < highlightThroughIndex) return { ...hotspot, state: "past" };
    if (index === highlightThroughIndex) return { ...hotspot, state: "current" };
    return { ...hotspot, state: "hidden" };
  });
}

export function systemMapSubtitle(highlightThroughIndex) {
  if (highlightThroughIndex < 0) {
    return "UNOS/OPTN reference \u2014 context only, not the story script; press \u2192 for references.";
  }
  const hotspot = SYSTEM_MAP_HOTSPOTS[highlightThroughIndex];
  const letter = hotspot?.unosLetter ?? "";
  const label = hotspot?.unosLabel ?? "";
  return `Highlighting station ${letter}: ${label} (\u2193 next stop \u00b7 \u2192 continue the story).`;
}
