# Assignment 05 — Iteration Notes

Snapshot folder for D3 flow-map prototypes (`app/main.js`). Coordinates are partial (top-50 node table); data pipeline unchanged.

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

## Current observation

The all-flows version creates a more complete regional circulation texture; the top-50 map feels too sparse and anecdotal for describing system-level patterns. Coordinate coverage remains a limiting factor (~37% of total flow has both endpoints in the partial node file).

## How to preview

From `assignment_05_spatial/`:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080/app/` and set `EDGE_MODE` in `app/main.js`.
