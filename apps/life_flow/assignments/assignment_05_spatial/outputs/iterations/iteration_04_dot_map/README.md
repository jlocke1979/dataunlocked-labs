# Iteration 04 — Simplified dot-map prototype

Single-map layout: donor recovery organizations and transplant centers together. No flow arcs.

## Enable

In `app/main.js`:

```javascript
const LAYOUT_MODE = "dot_map";
```

Other layouts remain available (`single`, `small_multiples`, `geography_comparison`).

## Data

- `data/processed/all_nodes_with_coordinates.csv`
- Gray dots: `type === source_dsa` (OPO / donor recovery)
- Slate dots: `type === transplant_center`

## Design (Life Flow system)

- Albers USA (same footprint as Iteration 01 single map)
- Dots: donor = museum white `#F7F7F4` + charcoal outline `#202623`; transplant = solid charcoal `#202623`
- Geography: Museum White `#F7F7F4` landmass · `#D6D4CE` outlines · warm neutral frame `#EEEDE9`
- Text: Charcoal Forest `#202623` · captions: Deep Ash Stone `#666660`
- Type: Book Antiqua (title) · Georgia (subtitle) · Calisto MT (legend, source, notes)
- Minimal legend on the right; audit panel hidden

## Screenshot

`outputs/iterations/iteration_04/dot_map_v1.png`
