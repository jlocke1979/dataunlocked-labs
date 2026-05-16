# MSDS 455 – Assignment 04 (Relational Data)

## Overview

This project examines **relationships between organ category and transplant waiting-time distributions** using OPTN waitlist data. Exploratory visual analysis tested several relational encodings before converging on a single comparative view.

The **final visualization** is a heatmap that shows how each organ’s waitlist candidates are distributed across OPTN waiting-time buckets—making cross-organ differences in wait burden easy to compare at a glance.

---

## Key Insight

- **Kidney** candidates face substantially **longer** waiting periods, with meaningful mass in multi-year buckets.
- **Lung** candidates are concentrated in **shorter** waiting windows; most fall within roughly six months in this snapshot.
- **Patient wait experience differs sharply by organ**—system pressure is organ-specific, not well represented by one average wait time.

---

## Final Visualization

**Chart:** *Distribution of wait times by organ* (burden-sorted heatmap)

**Public view (GitHub Pages):**  
https://jlocke1979.github.io/dataunlocked-labs/apps/life_flow/assignments/index_assignment_04.html

| Artifact | Location |
|----------|----------|
| Final image | `final/final_heatmap.png` (source: `exploratory/iteration_17_final_heatmap.png`) |
| Final slide | `final/final_slide.pdf` |
| EDA & code | `exploratory/eda.ipynb` (search `ITERATION 17 CODE START`) |
| Color backup | `exploratory/iteration_16f_charcoal_forrest.png` |

Palette: Charcoal Forrest sequential scale on Museum White, with Life Flow typography and OPTN source citation.

---

## Project Structure

```
assignment_04_relational/
├── exploratory/
│   ├── eda.ipynb                      # EDA, iterations, final figure code
│   ├── eda_archive1.ipynb             # frozen notebook backup
│   └── iteration_*.png                # saved chart iterations
├── data/
│   ├── raw/                           # OPTN Advanced Report CSV exports
│   ├── notes/                         # report dictionary / field notes
│   └── processed/                     # derived tables (if used)
├── scripts/
│   ├── preprocess.py                  # optional preprocessing stubs
│   └── visualization.js               # optional web helpers
├── final/
│   ├── final_heatmap.png              # submission heatmap
│   └── final_slide.pdf                # printable slide
├── sources.txt                        # source log
└── README.md
```

---

## Data Source

**Citation:** Organ Procurement and Transplantation Network (OPTN). 2025. OPTN Advanced Reports.

**Primary report (final chart):** `data/raw/Rpt2.1_Waitlist___Organ_by_Waiting_Time.csv`

**References:**

- OPTN / HRSA: https://www.hrsa.gov/optn  
- Data & reports: https://www.hrsa.gov/optn/data/data-reports  
- Advanced report builder: https://hrsa.unos.org/data/view-data-reports/build-advanced/

Report definitions and recreation notes: `data/notes/`

---

## Exploratory Data Analysis

Documented in `exploratory/eda.ipynb`. Summary of the iteration path:

| Phase | Focus |
|-------|--------|
| **1–2** | Early wait-time heatmaps; row-wise % within organ |
| **3–8** *(11a–11g)* | Scatter, bubble, and small-multiple relational views |
| **9–11** | System-flow prototype; donor/transplant/multi heatmaps; organ-level scatters |
| **12–15** | Refined `Rpt2.1` heatmap candidates |
| **16–17** | Color experiments (16a–16f), typography, final Charcoal Forrest polish |

**Methods used in the final heatmap:**

- **Normalization:** each cell = % of that organ’s waitlist snapshot in a waiting-time bucket (rows sum to 100%).
- **Filtering:** organs below 100 candidates excluded from unstable percentage splits.
- **Sorting:** rows ordered by **weighted wait burden** (bucket shares × weights 1 shortest → 8 longest).

---

## Notes / Limitations

- Waitlist counts reflect **registrations**, not necessarily unique patients.
- The chart emphasizes **relative distributions within each organ**, not individual patient trajectories or outcomes.
- Survival, rejection, and related outcome threads were explored conceptually in early directions but **were not incorporated** into the final visualization.

---

## AI Disclosure

AI tools were used for coding assistance, debugging, and iterative visualization refinement. Analytical decisions, data interpretation, source selection, and final design choices were reviewed and directed by the author.
