# Iteration 02 — Per-organ flow maps

Comparable organ-specific D2T maps using the same coordinate table and presentation shell as Iteration 01.

## Data

| File | Role |
|------|------|
| Organ mode | Raw OPTN CSV | Processed edges |
|------------|--------------|-----------------|
| `kidney` | `Transplants/T_SD.1.kidney_...` | `d2t_edges_kidney_enriched.csv` |
| `liver` | `Transplants/T_SD.2.liver_...` | `d2t_edges_liver_enriched.csv` |
| `heart` | `Transplants/T_SD.5.heart_...` | `d2t_edges_heart_enriched.csv` |
| `lung` | `Transplants/T_SD.6.lung_...` | `d2t_edges_lung_enriched.csv` |
| `pancreas` | `Transplants/T_SD.3.pancrease_...` | `d2t_edges_pancreas_enriched.csv` |
| `kidney_pancreas` | `Transplants/T_SD.4.kidney_and_pancrease_...` | `d2t_edges_kidney_pancreas_enriched.csv` |
| `multi_liver_kidney` | `MultiTransplants/MT_SD.01.Liver-Kidney_...` | `d2t_edges_multi_liver_kidney_enriched.csv` |

Shared nodes: `data/processed/all_nodes_with_coordinates.csv`

Rebuild all organ edges:

```bash
python3 scripts/build_organ_d2t_edges.py --all
python3 scripts/enrich_d2t_edges.py
python3 scripts/build_organ_d2t_edges.py --list
```

## Preview

In `app/main.js`:

```javascript
// const ORGAN_MODE = "kidney";
// const ORGAN_MODE = "liver";
// const ORGAN_MODE = "heart";
// const ORGAN_MODE = "lung";
// const ORGAN_MODE = "pancreas";
// const ORGAN_MODE = "kidney_pancreas";
// const ORGAN_MODE = "multi_liver_kidney";
const ORGAN_MODE = "kidney";
const EDGE_MODE = "all";
```

Check browser console for `[organ summary]` (total flow, rendered %, edge count).

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080/app/`

## Screenshot export

Save presentation captures here:

- `outputs/iterations/iteration_02/kidney_flow_map_v1.png` (full page or viz-card crop)
- Optional: `kidney_flow_map_v1.pdf`

Target selector: `.viz-card[data-iteration="02"]` or `body.organ-mode-kidney`
