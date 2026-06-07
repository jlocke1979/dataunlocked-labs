# Life Flow — MSDS 455 Final Show

Interactive narrative visualization of the U.S. organ transplant system, built with D3.js as the culminating project for MSDS 455.

## Primary entry point

`apps/life_flow/app/final_show.html`

## How to run

From the extracted package root:

```bash
python3 -m http.server 8000
```

Then open:

`http://localhost:8000/apps/life_flow/app/final_show.html`

No special installation is required for the static show. A local HTTP server is needed so the browser can load data files and embedded assignment assets.

## Project layout

| Path | Role |
|------|------|
| `app/final_show.html` | Final show entry point |
| `app/js/` | Scene controllers and final-show narrative code |
| `app/data/` | Cleaned summary datasets used by multiple slides |
| `assignments/` | Prior course assignments (data, notebooks, standalone viz) |

Assignment folders are intentionally retained. The final show reuses prior assignment assets, data transformations, and code (for example, spatial network maps, diagnosis treemaps, and cleaned OPTN extracts).

## Documentation

- `DATA_DICTIONARY.txt` — major dataset categories, fields, and file locations
- `SOURCES_AND_LIMITATIONS.txt` — data sources, audit notes, and AI disclosure

Assignment-level README files under `assignments/` describe individual coursework iterations; they are supporting materials, not the main submission README.

## Navigation

Use arrow keys or on-screen controls to move through story beats. Supplemental slides (thank you, references, audit notes, appendix visualizations) follow the main narrative.
