# Iteration 03 — Transplant-center hub emphasis

All-flow circulation map with destination transplant centers drawn as proportional volume hubs.

## Enable

In `app/main.js`:

```javascript
const SHOW_DESTINATION_HUBS = true;
const ORGAN_MODE = "all";
const EDGE_MODE = "all";
```

Restore Iteration 01: set `SHOW_DESTINATION_HUBS = false`.

## Behavior

- Inflow per center is summed from the **active** enriched edge file (same slice as drawn flows).
- Hubs render above the flow field; OPO/source nodes are hidden.
- Muted teal fill, light stroke, sqrt-scaled radius.

## Screenshot

Save to `outputs/iterations/iteration_03/hub_emphasis_v1.png` (selector: `body.destination-hubs-on`).
