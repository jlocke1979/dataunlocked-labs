# Iteration 05 — Proportional volume bubbles (evolution of Iteration 04)

Two-panel layout encoding geographic concentration through restrained bubble area.

## Enable

In `app/main.js`:

```javascript
const LAYOUT_MODE = "dot_map_volume";
```

Iteration 04 remains available:

```javascript
const LAYOUT_MODE = "dot_map";
```

## Panels

| Side | Title | Volume source |
|------|-------|----------------|
| Left | Donor Recovery Organizations | `d2t_source_summary.csv` (`total_outflow`) |
| Right | Transplant Centers | `d2t_destination_summary.csv` (`total_inflow`) |

Positions: `all_nodes_with_coordinates.csv` · All organs · No flow arcs.

## Encoding

- Sqrt-scaled radius per panel (range ~2.6–10.8 px)
- Fill opacity 82%, no outlines
- Donor `#8FA9B8` · Transplant `#3F6275`
- Background `#F7F7F4` · outlines `#D6D4CE`

## Screenshot

`outputs/iterations/iteration_05/volume_bubbles_v1.png`
