# MSDS 455 Assignment 05 — Spatial Visualization Development Summary

## Project Overview

This assignment explored spatial visualization approaches for understanding the geography of organ transplant activity in the United States using OPTN/UNOS data. The project evolved from dense national flow-field maps toward clearer geographically comparative visualizations focused on transplant centers and donor recovery organizations.

The final work emphasized iterative exploratory visualization, accessibility-aware design, and management-friendly interpretability.

---

# Core Questions Explored

- Where are transplant activities geographically concentrated?
- How do donor recovery organizations and transplant centers differ spatially?
- How does infrastructure vary by organ type?
- What spatial encodings best communicate national transplant-system geography?

---

# Major Technical Work Completed

## Data Preparation
- Processed OPTN/UNOS donor-to-transplant edge lists.
- Built node/edge datasets for spatial rendering.
- Created geocoding workflows for transplant centers and donor recovery organizations.
- Developed scripts for:
  - coordinate coverage validation,
  - missing-node prioritization,
  - batch geocoding,
  - manual coordinate refinement,
  - enrichment pipelines.

## Geocoding / Coordinate Validation
- Improved coordinate coverage substantially through manual and semi-automated geocoding review.
- Final retained flow coverage reached approximately:
  - ~84% edge retention,
  - ~90% transplant-volume retention.

## Spatial Rendering
Implemented:
- all-organ network maps,
- organ-specific network maps,
- donor vs transplant comparisons,
- proportional bubble maps,
- small multiple experiments,
- iterative legend and annotation refinements.

---

# Visual Iteration History

## Iteration 01 — National Flow Field
Dense national network visualization showing donor recovery organization → transplant center flows.

Key findings:
- Visually atmospheric and system-oriented.
- Strong emotional/infrastructural feel.
- Became cognitively dense at national scale.

---

## Iteration 02 — Organ-Specific Spatial Maps
Separated flows by organ type:
- kidney,
- liver,
- heart,
- lung,
- pancreas,
- kidney-pancreas,
- liver-kidney.

Key findings:
- Kidney visually resembled all-organ geography because of dominance in volume.
- Specialty organs revealed sparse and regionally concentrated infrastructure.

---

## Iteration 03 — Bubble + Arc Hybrids
Combined proportional bubbles with flow arcs.

Key findings:
- Bubble + flow overlays introduced excessive visual competition.
- Simplification improved interpretability.

---

## Iteration 04 — Dot Maps
Separated:
- donor recovery organizations,
- transplant centers.

Key findings:
- Clarified the existence of two related but distinct spatial systems.
- Reduced cognitive overload substantially.

---

## Iteration 05 — Interactive Bubble Explorer (Final Candidate)
Created an interactive spatial comparison interface with:
- organ switching,
- site-type switching,
- proportional bubble scaling,
- shared national scale.

Key findings:
- Clearest management-friendly representation.
- Bubble scaling effectively communicated national concentration patterns.
- Simpler spatial encodings proved more analytically useful than dense flow-field maps.

---

# Design and Accessibility Considerations

The project explored restrained editorial design rather than highly saturated dashboard aesthetics.

Considerations included:
- colorblind accessibility,
- muted categorical palettes,
- supplementary rather than primary color encoding,
- typography consistency,
- low-clutter composition,
- visual hierarchy.

---

# Major Lessons Learned

## Simplification Improves Interpretation
The project initially pursued maximal network complexity but gradually demonstrated that simpler geographically comparative views often communicated the system more clearly.

## Spatial Scale Matters
The national scale introduced challenges involving:
- overlap,
- density,
- projection handling,
- regional compression,
- and multi-layer visual hierarchy.

## Iteration Was Essential
The strongest visual solutions emerged only after extensive experimentation across:
- encodings,
- layouts,
- projections,
- interaction approaches,
- and annotation strategies.

---

# Final Reflection

The final visualization system became more than a single chart. The assignment evolved into a reusable exploratory framework for investigating transplant-system geography and infrastructure concentration.

The process emphasized:
- iterative visual reasoning,
- exploratory spatial analysis,
- accessibility-aware design,
- and balancing atmospheric complexity with analytical clarity.
