# MSDS 455 – Assignment 02 (Categorical Data) Revision

## Overview
This visualization compares 2025 organ transplant demand (waitlist) versus completed transplants across major organ categories. The goal is to highlight the imbalance between demand and supply.

## Key Insight
Kidney transplants account for the majority of volume, but demand significantly exceeds supply across all major organ categories.

## Live Visualization
https://jlocke1979.github.io/dataunlocked-labs/apps/life_flow/assignments/assignment_03_hierarchial/

Project Structure

* index.html – entry point
* js/main_assignment_02.js – controller
* js/scenes_assignment2/d_waitlist_vs_transplants.js – main D3 visualization
* js/scenes_assignment2/shared_waitlist_nodes.js – shared constants and category structure
* data/ – cleaned datasets used for visualization
* analysis.ipynb – exploratory data analysis

Data Source

OPTN national data reports (2025)
Parent Page: 
https://www.hrsa.gov/optn?from=optn.transplant.hrsa.gov
Data Portal: 
https://www.hrsa.gov/optn/data/data-reports
Data Portal: Advanced Reporting
https://hrsa.unos.org/data/view-data-reports/build-advanced/




Exploratory Data Analysis

EDA is provided in analysis.ipynb.
The workflow includes:

* inspection of raw tab-delimited OPTN data
* identification of structural issues (wide format, formatted numeric strings)
* transformation into a clean, structured dataset
* filtering to 2025 for categorical comparison

Visualization Iterations

Three iterations were developed:

1. Initial dot-based comparison of waitlist vs. transplants
2. Improved clarity using gray waitlist vs. colored transplant dots
3. Version adding a waitlist-to-transplant ratio and refined labeling
4. Version changing from beige to white background

Background styling was also evaluated to balance aesthetics with data-to-ink ratio.

Notes

The D3 code is modularized across JavaScript files rather than embedded directly in HTML.


Exploratory demand-side dataset:
The Organ by Diagnosis export summarizes transplant waitlist registrations by diagnosis and organ. 

Early inspection shows that kidney demand dominates the waiting list, with Type II diabetes, 
hypertensive nephrosclerosis, polycystic kidney disease, and graft failure among the largest diagnosis categories. 
Counts should be interpreted as waitlist registrations, not necessarily unique patients, 
because OPTN/HRSA distinguishes registrations from candidates.




