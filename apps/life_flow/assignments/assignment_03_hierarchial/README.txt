# MSDS 455 – Assignment 03 (Hierarchical / Part-to-Whole Data)

## Overview
This assignment compares current OPTN waitlist registrations with 2025 transplants by organ and diagnosis.

Aggregate rows and columns such as “All Diagnosis” and “All Organs” were removed to avoid double-counting. The data was reshaped from wide to long format to support hierarchical visualization.

The final visualization uses side-by-side treemaps to highlight the relationship between demand (waitlist) and realized outcomes (transplants).

---

## Key Insight
Kidney demand dominates the transplant system, driven largely by chronic conditions such as diabetes and hypertension.

While transplant activity follows similar patterns, it occurs at a significantly smaller scale, indicating a system constrained by supply.

---

## Final Visualization
- Static slide (PDF) included in submission
- Interactive version (optional):
  
https://jlocke1979.github.io/dataunlocked-labs/apps/life_flow/assignments/assingment_03_hierarchial/



## Project Structure

assignment_03_hierarchial/
├── analysis.ipynb                # EDA + transformation + visualization
├── data/
│   ├── raw/                      # OPTN exports
│   └── processed/                # cleaned datasets
├── outputs/
│   ├── final_visualization.svg
│   ├── final_visualization.html
│   └── archive_iterations/       # prior versions
└── final_slide.pdf               # submission artifact



---

## Data Source

OPTN / HRSA National Data (2025)

- Main site: https://www.hrsa.gov/optn  
- Data portal: https://www.hrsa.gov/optn/data/data-reports  
- Advanced reports: https://hrsa.unos.org/data/view-data-reports/build-advanced/

---

## Exploratory Data Analysis

EDA is documented in `analysis.ipynb` and includes:

- inspection of raw OPTN tabular exports
- identification of structural issues (wide format, formatted numeric strings)
- removal of aggregate rows (e.g., “All Diagnosis”, “All Organs”)
- transformation into long format for hierarchical analysis
- validation checks on totals and distributions

---

## Notes

- Waitlist counts represent **registrations**, not unique patients
- Transplants represent realized matches between supply (donors) and demand (waitlist)
- The visualization emphasizes relative structure and scale rather than exact matching flows






