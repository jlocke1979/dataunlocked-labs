# Streamlight – Project Overview

## What it does

Streamlight is a small web app that compares three golf membership options (Pay As You Go, Course Pass, All Inclusive) and recommends the cheapest option for a given number of rounds per year.

## Main inputs

- **Rounds per year** – from `#rounds` (user input).
- **Per-round pricing** – loaded from CSV: green fee and cart fee per course.
- **Cart usage** – currently fixed at 50%; used to blend cart fee into average round cost.

## Main outputs

- **Best option** – which plan has the lowest total cost.
- **Total cost** for each plan (PayGo, Course Pass, All Inclusive).
- **Savings** – dollar difference between the best plan and the next-cheapest.

## Data files

- **Location:** `data/`
- **Round pricing:** App loads `../data/round_costs.csv` (columns: `course`, `green_fee`, `cart_fee`). The repo has `data/rounds_cost.csv` with the same structure—ensure the path/filename matches.

## How calculations work

1. **Average round cost:** Mean across all courses of `green_fee + (cart_fee × cart_usage)`.
2. **Pay As You Go:** `rounds × avg_round_cost`.
3. **Course Pass / All Inclusive:** Fixed annual amounts (currently $850 and $720 in code).
4. **Comparison:** Plans sorted by total cost; lowest is “best”; savings = cost of second plan minus cost of best.

(Rendered in `#output`.)
