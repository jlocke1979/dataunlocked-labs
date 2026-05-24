# Iteration 02 Final — Small-multiples organ comparison (2×4)

Eight-panel comparative layout (2 columns × 4 rows). Not Iteration 03 — see `outputs/iterations/iteration_03/` for single-map hub emphasis.

## Enable

In `app/main.js`:

```javascript
const LAYOUT_MODE = "small_multiples";
const EDGE_MODE = "all";
```

Restore Iteration 01 single map:

```javascript
const LAYOUT_MODE = "single";
const ORGAN_MODE = "all";
const SHOW_DESTINATION_HUBS = false;
```

## Design notes

- 2×4 grid (8 organs); taller SVG (`SM_SVG_HEIGHT = 1120`) for panel legibility
- Same Albers USA projection and panel dimensions across all maps
- Shared scale across panels (lines or bubbles — not per-panel auto-scaling)
- Alaska & Hawaii inset frames: shared bottom edge + horizontal gap (pad scales with panel size)

### Visibility toggle (`SM_VIS_MODE`)

```javascript
const SM_VIS_MODE = "bubbles";  // default — transplant center circles (recommended for 2×4)
// const SM_VIS_MODE = "flows";  // boosted line weight + opacity (~2× prior)
```

- **bubbles:** destination inflow as circles (shared radius scale)
- **flows:** circulation lines with higher opacity/width for small panels

### Palette (`SM_COLOR_THEME`)

```javascript
const SM_COLOR_THEME = "charcoal_forest";  // Tufte monochrome (Iteration 02b)
// const SM_COLOR_THEME = "default";       // slate/teal approved palette
```

## Screenshot

`outputs/iterations/iteration_02_small_multiples/organ_comparison_sm_final.png`

## Freeze checklist

- [ ] Hard refresh `app/` in browser
- [ ] Confirm AK/HI boxes do not overlap on all 8 panels
- [ ] Save PNG to path above
- [ ] Keep `LAYOUT_MODE = "small_multiples"` for this deliverable; use `single` + `SHOW_DESTINATION_HUBS` for Iteration 03 hub map
