# MSDS 455 Assignment 05 — Spatial Data

**Source:** OPTN/UNOS Advanced Reports, 2025 (donor-to-transplant center flows and site volumes).

## Project Summary

This assignment maps the U.S. organ transplant system in geographic space. Starting from donor-to-transplant (D2T) flow tables, we geocoded donor recovery organizations and transplant centers, then iterated on layout and encoding in D3. The **submission build** is a single-map **proportional bubble explorer**: bubble area reflects 2025 transplant or donation volume at each site, with toggles for site type (transplant center vs donor recovery) and organ. Earlier prototypes tested dense flow networks, per-organ comparisons, geography splits, and dot maps before settling on volume-scaled bubbles and a unified global scale.

## Key Iterations

Detailed notes and screenshots live in `outputs/iterations/` (see `iteration_notes.md`).

| # | Focus | Layout mode (`app/main.js`) | Output folder (examples) |
|---|--------|----------------------------|---------------------------|
| **01** | Dense all-organ flow network | `single` | `iteration_01_network_map_all_organs/` |
| **02** | Per-organ flow maps & 2×4 small multiples | `single`, `small_multiples` | `iterations02_network_map_by_organ/`, `iteration_02b_small_multiples/` |
| **03** | Donor vs transplant geography; bubble/arc variants | `geography_comparison` | `iteration_03a_Bubble_and_Arcs/`, `iteration_03b_Bubbles_and_Less_Arcs/` |
| **04** | Simple dot map (sites only, no flows) | `dot_map` | `iteration_04_dot_map/` |
| **05** | Proportional volume bubbles (dual panel) | `dot_map_volume` | `iteration_05_bubble_map/` |
| **06** | Stacked full-width volume singles | `dot_map_volume_singles` | (documented in `iteration_notes.md`) |
| **07** | **Unified explorer (submission)** — one map, organ filter, global sqrt scale | `dot_map_volume_unified` | `app/` (see `iteration_notes.md`; extends `iteration_05_bubble_map/`) |

Iteration 07 extends Iteration 05: comparable bubble sizes across organs, sidebar legend, collapsible audit notes, and interactive tooltips on the unified map.

## How to Launch

From the assignment root (`assignment_05_spatial/`):

```bash
python3 -m http.server 8080
```

Then open either:

- **`http://localhost:8080/app/`** — interactive map (recommended), or  
- **`click_here_to_start.html`** at the assignment root (redirects to `app/`).

The submission layout is the default in code:

```js
const LAYOUT_MODE = "dot_map_volume_unified";
```

To preview an earlier iteration, change `LAYOUT_MODE` in `app/main.js`, save, and hard-refresh. If styles or script look stale, bump the cache query on `app/index.html` (e.g. `?v=20260523-26` on `styles.css` and `main.js`).

**Static deliverables:** `outputs/final/final_slide.pdf` and `outputs/final/click_here_to_start.html` (same app entry; serve from assignment root so relative paths resolve).

## Repository Structure

```
assignment_05_spatial/
├── app/                          # D3 visualization (main.js, styles.css, index.html)
├── click_here_to_start.html      # Shortcut to app/
├── data/
│   ├── processed/                # Nodes, D2T edges, organ summaries (CSV)
│   ├── raw/                      # OPTN source extracts
│   └── reference/
│       └── manual_geocoding/     # Hand-verified coordinates workbook
├── notebook/                     # EDA and design notes (Jupyter)
├── notes/                        # Geocoding workflow documentation
├── outputs/
│   ├── final/                    # final_slide.pdf, launch HTML
│   ├── iterations/               # Screenshots + iteration_notes.md
│   └── Appendix A: Final_Bubble_by_Organ/   # Per-organ bubble appendix exports
├── scripts/                      # Build edges, geocode, coverage checks
└── README.md
```

## Other References

| Resource | Location |
|----------|----------|
| Iteration history | `outputs/iterations/iteration_notes.md` |
| EDA | `notebook/eda_assignment05_spatial.ipynb` |
| Geocoding pipeline | `notes/geocoding_workflow.md`, `scripts/apply_manual_geocoding.py` |
| Processed nodes (map) | `data/processed/all_nodes_with_coordinates.csv` |
