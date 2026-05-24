# Manual geocoding workbook

Organized workflow to put **real lat/lon on every DSA and transplant center** in the full OPTN edge list.

## Files

| File | Role |
|------|------|
| `all_nodes_geocoded.csv` | **Your working copy** — fill `lat`, `lon`, `notes` here |
| `geocoding_review_priority.csv` | **Spreadsheet-first review list** — generated; see § below |
| `../../processed/all_nodes_for_geocoding.csv` | Regenerated queue (priority-sorted); reference only |
| `../../processed/all_sources_for_geocoding.csv` | OPOs only (55) — optional batch |
| `../../processed/all_destinations_for_geocoding.csv` | Transplant centers only (246) — optional batch |
| `../../processed/all_nodes_with_coordinates.csv` | **Output** after you apply manual edits |

## Fastest path (~200 nodes in a few minutes)

**Do not** paste lat/lon one-by-one. Use batch geocoding, then review failures only.

```bash
# 1. Build queue (once)
python3 scripts/build_all_nodes_for_geocoding.py

# 2. Test 5 rows
python3 scripts/batch_geocode_nominatim.py --dry-run --limit 5
python3 scripts/batch_geocode_nominatim.py --limit 5

# 3. Run urgent rows first (priority 1–2, ~2–3 min)
python3 scripts/batch_geocode_nominatim.py --max-priority 2

# 4. Remaining missing/centroid rows (~3–4 min for ~200)
python3 scripts/batch_geocode_nominatim.py

# 5. Spot-check, fix bad hits in the CSV, then publish
python3 scripts/apply_manual_geocoding.py
```

Uses free [Nominatim](https://nominatim.org/) (OpenStreetMap): 1 request/sec, US-only bias. Tags rows `nominatim_batch;review` — change to `manual_map;high` after you verify on a map.

**Manual map work** should only be: failed lookups, ambiguous names, and ~10–20 spot checks — not all 301 rows.

### Alternatives (if batch quality is poor)

| Tool | Speed | Notes |
|------|-------|-------|
| **Google Sheets** + [Geocode add-on](https://workspace.google.com/marketplace) | Fast | Paste `geocode_query` column; needs Google account |
| **OpenRefine** + geocoding extension | Medium | Good for cleaning names first |
| **QGIS** geocoder plugin | Medium | Batch CSV in/out |

---

## Workflow

### 1. Build the queue

From `assignment_05_spatial/`:

```bash
python3 scripts/build_all_nodes_for_geocoding.py
```

- Creates/updates processed CSVs (~301 nodes: 55 sources + 246 destinations).
- Seeds coords from `top50_all_nodes_partial_real_coordinates.csv` where available.
- Sorts by `geocode_priority` (1 = urgent) and `total_flow`.

On first run, copies the queue into **`data/reference/manual_geocoding/all_nodes_geocoded.csv`**. That file is **never overwritten** — your edits are safe.

### 2. Geocode in batches (recommended order)

Work in **`all_nodes_geocoded.csv`** (Excel, Google Sheets, or a GIS tool).

1. Filter `geocode_priority` = **1** then **2** (high-flow nodes still on state centroids or missing).
2. Use column **`geocode_query`** as the map search string (hospital / OPO name + state).
3. Paste **`lat`** and **`lon`** (decimal degrees, 4+ decimals).
4. Set **`notes`** when done, e.g. `manual_map;high` or `manual_map;medium` (building name uncertain).

Optional: geocode OPOs from `all_sources_for_geocoding.csv` first (smaller set), then transplant centers.

### 3. Apply to production file

```bash
python3 scripts/apply_manual_geocoding.py
```

Writes `data/processed/all_nodes_with_coordinates.csv` for the D3 app (wire when ready).

### 4. Check coverage

```bash
python3 scripts/check_coordinate_coverage.py
python3 scripts/check_node_coordinate_quality.py
```

### 5. (Optional) Assignment 5 — prioritized review CSV for Sheets/Excel

For the spatial map workload, regenerate a compact queue ranked by **`total_flow`**, constrained to rows that either lack coordinates or still need verification (same rules as batch `needs_spot_check` — `nominatim_batch;review` until you add **`manual_map`** to `notes` in **`all_nodes_geocoded.csv`**).

```bash
python3 scripts/build_geocoding_review_priority.py
```

- **Reads** `data/processed/missing_destination_nodes_by_flow.csv`, `missing_source_nodes_by_flow.csv`, and **`all_nodes_geocoded.csv`**.
- **Writes** `data/reference/manual_geocoding/geocoding_review_priority.csv` with columns **`suggested_search`**, placeholders **`manual_city` / `manual_state` / `manual_lat` / `manual_lon` / `review_notes`**, plus **current lat/lon** from the workbook.
- **Preserves** filled manual/review columns when you re-run the script (merged by `id`).
- **Omits** nodes already **`manual`**, **`manual_verified`**, or with **`manual_map`** in `notes`.

Copy edits back into **`all_nodes_geocoded.csv`** (or paste into **`apply_manual_geocoding`** flow when you extend that script).

## Column guide (`all_nodes_geocoded.csv`)

| Column | Edit? | Meaning |
|--------|-------|---------|
| `id` | No | OPTN node ID |
| `type` | No | `source_dsa` or `transplant_center` |
| `name`, `state`, `region` | No | Labels from OPTN |
| `total_flow` | No | In+out volume — use to prioritize |
| `lat`, `lon` | **Yes** | WGS84 decimal degrees |
| `coordinate_status` | No | Auto: `missing`, `state_centroid`, `city_approx`, … |
| `geocode_priority` | No | 1 = do first |
| `geocode_query` | No | Suggested map search |
| `notes` | **Yes** | `manual_map;high` after verifying on map |

## Coordinate status meanings

- **missing** — no lat/lon yet
- **state_centroid** — placeholder at state center (nodes stack on map)
- **city_approx** — hardcoded city from earlier prototype
- **facility_or_city** — coords differ from centroid but not verified
- **manual_verified** — you set coords and `manual_map` in notes

## Tips

- Prefer the **hospital campus** for transplant centers, **OPO office** for sources when known.
- Re-run `build_all_nodes_for_geocoding.py` anytime edges change; manual file is preserved.
- Do not delete rows from the manual workbook — one row per node ID.
