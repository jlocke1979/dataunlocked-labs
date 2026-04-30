# MSDS 455 Assignment 02 Revision

## Live Visualization
The visualization can be viewed here:
https://jlocke1979.github.io/dataunlocked-labs/apps/life_flow/assignments/assignment_02_categorical_revision/

## D3 / JavaScript Structure
This visualization is built with D3.js. 
The code is 'modularized' rather than embedded directly in `index.html`.

## File Structure Overview
- `index.html` loads the page (Click here to start)
- `js/main_assignment_02.js` controls the visualization
- BOTH `js/scenes_assignment2/d_waitlist_vs_transplants.js` [and/or 
       `js/scenes_assignment2/d_waitlist_vs_transplants_white.js`]   
    contains the primary D3 code for the submitted one-page visualization
- `data/` contain the raw and cleaned CSV files used by the visualization
- `scripts/` contain the data ingestion scripts
- `analysis.ipynb` contains the Exploratory Data Analysis (EDA).
- `iterations` contain jpegs of 6 variations mostly around color and hue and text variations

## To run locally:
```bash
python3 -m http.server 8000
from this folder. 


## Data Source
OPTN national data reports.
https://www.hrsa.gov/optn
https://www.hrsa.gov/optn/data/data-reports
https://hrsa.unos.org/data/view-data-reports/build-advanced/
