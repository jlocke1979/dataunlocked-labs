# Assignment 05 — Iteration Notes

Snapshot folder for D3 flow-map prototypes (`app/main.js`). Coordinates are partial (top-50 node table); data pipeline unchanged.

| Iteration | Layout | What it shows |
|-----------|--------|----------------|
| **01 / v1 Final** | `single` | Presentation all-flow map + legend |
| **02 Final** | `small_multiples` | 2×4 organ comparison (frozen) |
| **02b** | `small_multiples` + `SM_COLOR_THEME = "charcoal_forest"` | Tufte monochrome small multiples |
| **03** | `geography_comparison` | Donor recovery vs transplant center (2 panels, subtle flows) |
| **04** | `dot_map` | Single-map donor + transplant dots — no arcs (`iteration_04/`) |
| **05** | `dot_map_volume` | 2-panel proportional bubbles by volume (`iteration_05/`) |
| **06** | `dot_map_volume_singles` | Stacked full-width volume singles (`iteration_06/`) |
| **Hub experiment** | `single` + `SHOW_DESTINATION_HUBS` | Hub circles on one map (see `iteration_03_hub_emphasis/`) |

## Iteration 1: Top 50 flow map

- **Data:** `top_50_edges_all_organs.csv` + `top50_all_nodes_partial_real_coordinates.csv`
- **View:** Route-style map — proportional line widths, visible source/destination nodes, tooltips on flows
- **EDGE_MODE:** `top50`
- **Intent:** Proof-of-concept for major DSA → transplant center corridors

## Iteration 2: All-flows low-opacity network map

- **Data:** `d2t_edges_all_organs_enriched.csv` (edges filtered to endpoints with coordinates)
- **View:** Circulation field — very thin strokes, low opacity, subtle width variation by `flow_count`, nearly invisible nodes
- **EDGE_MODE:** `all` (plus threshold variants `ge_200`, `ge_100`, `ge_50`, `ge_25` for comparison)
- **Intent:** Test whether the full retained network reads as regional texture vs. clutter

## Iteration 03: Donor vs transplant geography comparison

- **Switch:** `LAYOUT_MODE = "geography_comparison"` in `app/main.js`
- **Panels:** Donor recovery (left) · Transplant centers (right); shared projection and flow scale
- **Encoding:** Charcoal forest monochrome; subtle flows; endpoint-weighted nodes (no hub bubbles)
- **Folder:** `outputs/iterations/iteration_03/`

## Iteration 06: Stacked volume singles

- **Switch:** `LAYOUT_MODE = "dot_map_volume_singles"`
- **Layout:** Full-width donor map, then full-width transplant map (stacked)
- **Folder:** `outputs/iterations/iteration_06/`

## Iteration 05: Proportional volume bubbles

- **Switch:** `LAYOUT_MODE = "dot_map_volume"`
- **Data:** `d2t_source_summary.csv`, `d2t_destination_summary.csv`, `all_nodes_with_coordinates.csv`
- **Panels:** Donor recovery (left) · Transplant centers (right)
- **Folder:** `outputs/iterations/iteration_05/`

## Iteration 04: Dot-map prototype

- **Switch:** `LAYOUT_MODE = "dot_map"`
- **Data:** `all_nodes_with_coordinates.csv` only (no edge files)
- **Map:** Donor recovery (gray) and transplant centers (slate) on one Albers USA map
- **Folder:** `outputs/iterations/iteration_04/`

## Hub emphasis (single-map experiment)

- **Switch:** `SHOW_DESTINATION_HUBS = true` with `LAYOUT_MODE = "single"`
- **Folder:** `outputs/iterations/iteration_03_hub_emphasis/`

## Iteration 02 Final: Small-multiples organ comparison (2×4)

- **Switch:** `LAYOUT_MODE = "small_multiples"`, `SM_VIS_MODE = "bubbles"` (or `"flows"`)
- **Panels:** 8 organs — all, kidney, liver, heart, lung, pancreas, kidney_pancreas, multi_liver_kidney
- **Scale:** Shared bubble radius or shared line-weight domain across panels; `EDGE_MODE = "all"`
- **Insets:** Alaska & Hawaii frames share a bottom baseline with interior gap (no overlap); pad scales on smaller panels
- **Folder:** `outputs/iterations/iteration_02_small_multiples/`
- **Status:** Frozen for assignment submission (comparative layout)

## Iteration 02b: Per-organ single maps (ORGAN_MODE switch)

- **Switch:** `LAYOUT_MODE = "single"` + `ORGAN_MODE` slug
- **Modes:** kidney, liver, heart, lung, pancreas, kidney_pancreas, multi_liver_kidney

- **Switch:** `ORGAN_MODE` in `app/main.js` (keep `EDGE_MODE = "all"` for circulation field)
- **Modes:** `all`, `kidney`, `liver`, `heart`, `lung`, `pancreas`, `kidney_pancreas`, `multi_liver_kidney`
- **Build:** `python3 scripts/build_organ_d2t_edges.py --all` then `python3 scripts/enrich_d2t_edges.py`
- **Nodes:** shared `all_nodes_with_coordinates.csv`
- **Console:** `[organ summary]` logs organ mode, total flow, rendered flow %, edge count
- **Visuals:** same projection, legend, and layout as Iteration 01 / v1 Final
- **Screenshot target:** `outputs/iterations/iteration_02/`

## Version 1 Final (presentation layout)

- **Title:** Regional Yet Connected; public source line on viz card only
- **Legend:** Flow volume (transplants) — three contrast line samples
- **Map:** Albers USA + labeled PR inset; methodology in **Audit (internal)** below graphic
- **EDGE_MODE:** `all` (circulation field default)

## Current observation

The all-flows version creates a more complete regional circulation texture; the top-50 map feels too sparse and anecdotal for describing system-level patterns. Coordinate coverage remains a limiting factor (~37% of total flow has both endpoints in the partial node file).

## How to preview

From `assignment_05_spatial/`:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080/app/` and set `EDGE_MODE` in `app/main.js`.
