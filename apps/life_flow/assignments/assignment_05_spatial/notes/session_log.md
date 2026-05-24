# Assignment 05 Spatial — Session Log

## 2026-05-23 Morning

### Iteration 01

- Built all-organ flow field map
- Achieved 90.1% flow coverage
- Added Puerto Rico inset
- Simplified legend
- Moved audit notes below figure

Key insight:
The complexity itself became legible and atmospheric.

### Iteration 02

- Organ-specific small multiples
- Kidney visually similar to all-organ map
- Rare organs revealed sparsity/specialization

### Iteration 03

- Attempted hub overlays
- Too visually overloaded
- Decided to separate donor vs transplant geography

### Iteration 04

- Simplified donor/transplant dot maps
- Introduced formal visual design system

### Iteration 05

- Evolved Iteration 04: 2-panel proportional bubbles (donor left, transplant right)
- Volume from `d2t_source_summary` / `d2t_destination_summary`; sqrt scale 2.6–10.8 px
- `LAYOUT_MODE = "dot_map_volume"` (Iteration 04 preserved via `dot_map`)

Iteration 05 evolved into an interactive spatial comparison interface allowing switching between organ types and site categories while preserving a shared national bubble scale. Simpler node-based spatial views proved more analytically interpretable than the denser flow-field maps for understanding infrastructure concentration.





