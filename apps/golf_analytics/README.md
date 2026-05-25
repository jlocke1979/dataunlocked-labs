# Golf Analytics

Static gallery of score-trend and heatmap visuals from personal Golf Pad round data. No live ETL in this folder yet—charts are exported PNGs served as a simple HTML catalog.

## Live paths

| Entry | URL (GitHub Pages, repo root) |
|-------|-------------------------------|
| Portfolio card | `/` → Golf Analytics card |
| Gallery | `/apps/golf_analytics/` → `index.html` |
| Images | `/apps/golf_analytics/visuals/*.png` |

Run locally from repo root: `python3 -m http.server 8080` → `http://localhost:8080/apps/golf_analytics/`

## Related work (unchanged)

| App | Role |
|-----|------|
| `apps/pass_decision/` | Separate decision-support prototype |
| `apps/life_flow/` | Life Flow / MSDS coursework (unrelated data) |
| `labs/golf/` | Lab exercises if present elsewhere in repo |

## Data contract (planned)

Golf Pad CSV exports are **not** committed yet. Intended layout:

```
apps/golf_analytics/
├── data/raw/           # Golf Pad exports (gitignored when added)
├── data/processed/     # Cleaned round/hole tables
├── scripts/            # Regenerate charts from processed data
└── visuals/            # Published PNG outputs (current)
```

Add `.gitignore` rules for raw exports when data lands; keep `visuals/` as the published artifact set.

## Visual catalog (`visuals/`)

| File | Subject |
|------|---------|
| `raw_score_by_round_labeled_holes.png` | Raw score by round with hole labels |
| `score_distribution_by_course.png` | Score distribution by course |
| `score_vs_par_heatmap_green_purple.png` | Score vs par heatmap (green / purple) |
| `score_vs_par_heatmap_green_purple_grouped_v3.png` | Grouped heatmap variant (v3) |
| `score_vs_par_heatmap_double_bogey_target.png` | Double-bogey target emphasis |
| `blowup_heatmap_red.png` | Blow-up hole heatmap |

## GitHub Pages

Site publishes from repository root (`index.html`). Relative image paths must stay under `apps/golf_analytics/visuals/`—do not reference `visuals/final_outputs/` (that folder does not exist).
