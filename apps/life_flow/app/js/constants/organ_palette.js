/**
 * Canonical organ color palette — single source for final_show, maps, and charts.
 * Editorial hues aligned with Scene 4 / Assignment 05. Update colors here only.
 */
export const ORGAN_PALETTE_BY_SLUG = {
  all: "#202623",
  heart: "#9A4C54",
  liver: "#B07A3B",
  lung: "#6E92A8",
  kidney: "#4F8A83",
  pancreas: "#7A668F",
  kidney_pancreas: "#3E6B73",
  multi_liver_kidney: "#8B6B3F",
  intestine: "#7C8561",
  heart_lung: "#75687A",
  multi_organ_other: "#5B6675",
  vca: "#6E858F",
  vca_abdominal_wall: "#9A7B6A",
  vca_external_male_genitalia: "#A49370",
  vca_head_and_neck: "#8A6A6A",
  vca_other_genitourinary: "#8B7A8F",
  vca_upper_limb: "#6E7A8A",
  vca_uterus: "#9A6A7A"
};

/** OPTN / SRTR display labels and common aliases → palette slug */
export const ORGAN_NAME_TO_SLUG = {
  Kidney: "kidney",
  Liver: "liver",
  Heart: "heart",
  Lung: "lung",
  Pancreas: "pancreas",
  "Kidney / Pancreas": "kidney_pancreas",
  "Kidney–Pancreas": "kidney_pancreas",
  "Heart / Lung": "heart_lung",
  "Heart/Lung": "heart_lung",
  Intestine: "intestine",
  "Liver–Kidney": "multi_liver_kidney",
  "Liver-Kidney": "multi_liver_kidney",
  VCA: "vca",
  "VCA - abdominal wall": "vca_abdominal_wall",
  "VCA - external male genitalia": "vca_external_male_genitalia",
  "VCA - head and neck": "vca_head_and_neck",
  "VCA - other genitourinary organ": "vca_other_genitourinary",
  "VCA - upper limb": "vca_upper_limb",
  "VCA - uterus": "vca_uterus"
};

const DEFAULT_ORGAN_COLOR = "#5B6675";

export function organColorBySlug(slug, fallback = DEFAULT_ORGAN_COLOR) {
  if (!slug) return fallback;
  return ORGAN_PALETTE_BY_SLUG[String(slug).trim()] ?? fallback;
}

export function organColorByName(name, fallback = DEFAULT_ORGAN_COLOR) {
  if (!name) return fallback;
  const slug = ORGAN_NAME_TO_SLUG[name];
  return slug ? organColorBySlug(slug) : fallback;
}

/** Display-name map for charts keyed by OPTN organ strings (Scene 1, appendix, etc.) */
export function buildOrganColorsByName() {
  const colors = {};
  for (const [name, slug] of Object.entries(ORGAN_NAME_TO_SLUG)) {
    colors[name] = organColorBySlug(slug);
  }
  return colors;
}

export const organColors = buildOrganColorsByName();

/** Assignment 05 / Scene 4 volume-picker entries (slug + label + color) */
export const ORGAN_VOLUME_OPTIONS = [
  { slug: "all", label: "All organs", color: organColorBySlug("all") },
  { slug: "heart", label: "Heart", color: organColorBySlug("heart") },
  { slug: "kidney", label: "Kidney", color: organColorBySlug("kidney") },
  { slug: "kidney_pancreas", label: "Kidney–Pancreas", color: organColorBySlug("kidney_pancreas") },
  { slug: "liver", label: "Liver", color: organColorBySlug("liver") },
  { slug: "multi_liver_kidney", label: "Liver–Kidney", color: organColorBySlug("multi_liver_kidney") },
  { slug: "lung", label: "Lung", color: organColorBySlug("lung") },
  { slug: "pancreas", label: "Pancreas", color: organColorBySlug("pancreas") }
];
