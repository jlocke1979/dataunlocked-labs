# MSDS 455 Assignment 02 Revision

## Live Visualization

The visualization can be viewed here:

https://jlocke1979.github.io/dataunlocked-labs/apps/life_flow/assignments/assignment_02_categorical_revision/

## D3 / JavaScript Structure

This visualization is built with D3.js. 

The code is 'modularized' rather than embedded directly in `index.html`.

Key files:
- `index.html` loads the page
- `js/main_assignment_02.js` controls the visualization
- `js/scenes_assignment2/d_waitlist_vs_transplants.js` contains the primary D3 code for the submitted one-page visualization
- `data/` contains the cleaned CSV files used by the visualization

To run locally:
```bash
python3 -m http.server 8000



## How to View
D3.js requires a server so may not work without running on localhost. 
In Terminal [From this folder], run:
python3 -m http.server 8000
Then open:
http://localhost:8000


## Exploratory Data Analysis
Basic EDA is provided in analysis.ipynb to validate fields and category distributions used in the visualization.




## Iterations
- Version 1: basic waitlist vs transplant dot comparison
- Version 2: gray waitlist / colored transplant distinction
- Version 3: final version with ratio column and improved labeling



## Contents

- index.html: assignment visualization entry point
- js/main_assignment_02.js: main D3 controller
- js/scenes_assignment2/: D3 scene files
- data/: cleaned CSV data used by the visualization
- scripts/: Python data processing scripts

## Data Source

OPTN / UNOS national data reports.
