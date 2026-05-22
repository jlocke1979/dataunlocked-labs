# Iteration 03 — Donor vs transplant geography comparison

Two-panel layout separating donor recovery infrastructure from transplant-center concentration.

## Enable

In `app/main.js`:

```javascript
const LAYOUT_MODE = "geography_comparison";
const ORGAN_MODE = "all";
const EDGE_MODE = "all";
```

Restore other iterations:

```javascript
const LAYOUT_MODE = "single";           // Iteration 01
const LAYOUT_MODE = "small_multiples";  // Iteration 02 Final
```

## Panels

| Side | Title | Subtitle |
|------|-------|----------|
| Left | Donor Recovery Geography | Where organs enter the transplant system |
| Right | Transplant Center Geography | Where transplant expertise concentrates |

## Encoding

- Same Albers USA projection, geographic scale, and shared flow stroke scale on both panels
- Subtle atmospheric flows (charcoal forest / Tufte monochrome — no teal hub bubbles)
- Node emphasis via opacity and sqrt-scaled endpoint volume (outflow left, inflow right)
- Opposite endpoint nodes subdued in each panel
- Single shared source line and audit footer (legend hidden)

## Palette

Iteration 03 uses `palette-charcoal-forest` on the page body. Approved slate/teal tokens remain available via `palette-default` on Iteration 02.

## Screenshot

`outputs/iterations/iteration_03/donor_transplant_geography_v1.png`

## Related

- **Iteration 02 charcoal variant:** `SM_COLOR_THEME = "charcoal_forest"` with `LAYOUT_MODE = "small_multiples"`
- **Hub experiment (not this layout):** `SHOW_DESTINATION_HUBS = true` on single map — see `outputs/iterations/iteration_03_hub_emphasis/README.md`
