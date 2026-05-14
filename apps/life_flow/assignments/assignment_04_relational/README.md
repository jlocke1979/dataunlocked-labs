

                                    
                                    WARNING!!!!
                < MAY NEED TO RE-REVIEW,...THIS WAS FROM ASSIGNMENT >



######################################################################################
######################################################################################
######################################################################################################################

This section is UPdated notes for Assignment 04 - Use to create new readme at end of assignment

# Current Direction Summary

Iteration 1–2:
Heatmaps revealed strong wait-time distribution differences across organs.

Iteration 3–4:
Scatter and bubble explorations began examining relationships between wait burden and transplant/removal outcomes.

Iteration 5–6:
Small multiple concepts improved cross-organ comparison while preserving visibility for smaller organ categories.

Current likely final direction:
Bubble scatter and/or small multiples emphasizing wait burden and transplant outcomes across organs.



                                    
                                    WARNING!!!!
                < MAY NEED TO RE-REVIEW,...THIS WAS FROM ASSIGNMENT >



######################################################################################
######################################################################################
######################################################################################
######################################################################################
######################################################################################



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
├── Exploratory/
│   ├── eda.ipynb                 # EDA + transformation + visualization
│   └── iteration_*.png           # saved exploratory chart iterations
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

EDA is documented in `Exploratory/eda.ipynb`, with saved iteration images in `Exploratory/`, and includes:

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






