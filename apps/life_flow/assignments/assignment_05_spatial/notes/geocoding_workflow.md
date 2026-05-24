# Geocoding workflow (Assignment 05)

Goal: **lat/lon on all DSAs and transplant centers** in `d2t_edges_all_organs_enriched.csv`, using manual map work in a controlled order.

## Quick start (batch — recommended)

```bash
cd apps/life_flow/assignments/assignment_05_spatial

python3 scripts/build_all_nodes_for_geocoding.py
python3 scripts/batch_geocode_nominatim.py --max-priority 2   # urgent ~2 min
python3 scripts/batch_geocode_nominatim.py                    # rest ~3–4 min
# Spot-check failures + a few hospitals; fix lat/lon in manual CSV if needed

python3 scripts/apply_manual_geocoding.py
python3 scripts/check_coordinate_coverage.py
```

Manual one-by-one map paste is only for rows Nominatim misses or gets wrong.

## Pipeline diagram

```
d2t_edges_all_organs_enriched.csv
        │
        ▼
build_all_nodes_for_geocoding.py  ◄── seed: top50_all_nodes_partial_real_coordinates.csv
        │
        ├── data/processed/all_nodes_for_geocoding.csv   (reference queue)
        ├── data/processed/all_sources_for_geocoding.csv
        ├── data/processed/all_destinations_for_geocoding.csv
        │
        └── data/reference/manual_geocoding/all_nodes_geocoded.csv      (YOU EDIT — created once)
                    │
                    ▼
        apply_manual_geocoding.py
                    │
                    ▼
        data/processed/all_nodes_with_coordinates.csv    (for D3 / maps)
```

## Scope (~301 nodes)

| Type | Count | Notes |
|------|------:|-------|
| Donor recovery / OPO (`source_dsa`) | 55 | Smaller batch — good first pass |
| Transplant center | 246 | Larger batch — use `geocode_priority` |

Previous prototype only had **74** top-flow nodes; ~**80%** of those were still **state centroids**.

## Prioritization

`geocode_priority` in the workbook:

| Priority | Typical status | Action |
|----------|----------------|--------|
| 1 | missing or state_centroid, flow ≥ 200 | Map first |
| 2 | missing/centroid, flow 50–199 | Second wave |
| 3–4 | lower flow or city_approx | Later |
| 9 | manual_verified | Done |

High-impact missing nodes (from coverage script) include `NYRT-OP1`, `OHOU-TX1`, `NYUC-TX1` — see `missing_*_nodes_by_flow.csv`.

## After geocoding

1. Point `app/main.js` `DATA.nodes` at `all_nodes_with_coordinates.csv` when ready.
2. Re-run `check_coordinate_coverage.py` — target **much higher** than 37% flow retained.
3. Update `outputs/iterations/iteration_notes.md` with a new iteration entry.

See also: `data/reference/manual_geocoding/README.md`
