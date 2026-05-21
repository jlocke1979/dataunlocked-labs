"""
Inspect OPTN Report 3.D2T: Transplant flows from Donation Service Area of
Donor Recovery (source) by Transplant Center (destination).

Read-only structural inspection — no transforms or plots.
"""

from __future__ import annotations

import argparse
import csv
import re
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]

DEFAULT_CSV = (
    BASE
    / "data/raw/source_to_destination_by_organ/Transplants"
    / "3.D2T_Transplant___Donation_Service_Area_of_Donor_Recovery_by_Transplant_Center.csv"
)
FALLBACK_CSV = (
    BASE
    / "data/raw/center_reports"
    / "3.D2T_Transplant___Donation_Service_Area_of_Donor_Recovery_by_Transplant_Center.csv"
)

EDGE_LIST_HINTS = re.compile(
    r"\b(source|destination|from|to|origin|target|donor|recipient|weight|count|value)\b",
    re.I,
)
CENTER_ID = re.compile(r"^([A-Z]{2,5}-TX\d+)\b", re.I)
DSA_ID = re.compile(r"^([A-Z]{2,5}-(?:OP|IO)\d+)\b", re.I)
ORGAN_COLUMN_NAMES = {"organ", "organs", "organ type", "organ detail"}


def resolve_csv_path(cli_path: str | None) -> Path:
    if cli_path:
        path = Path(cli_path)
        if not path.is_absolute():
            path = BASE / path
        if not path.exists():
            sys.exit(f"CSV not found: {path}")
        return path

    if DEFAULT_CSV.exists():
        return DEFAULT_CSV
    if FALLBACK_CSV.exists():
        print(f"Note: primary path missing; using fallback:\n  {FALLBACK_CSV.relative_to(BASE)}\n")
        return FALLBACK_CSV

    sys.exit(
        "CSV not found. Expected:\n"
        f"  {DEFAULT_CSV.relative_to(BASE)}\n"
        f"  or {FALLBACK_CSV.relative_to(BASE)}"
    )


def read_csv_safe(path: Path) -> list[list[str]]:
    with open(path, newline="", encoding="utf-8-sig") as f:
        return list(csv.reader(f))


def clean_cell(value: str) -> str:
    return value.strip() if value else ""


def detect_structure(rows: list[list[str]]) -> str:
    if not rows:
        return "empty"

    n_rows = len(rows)
    n_cols = max(len(r) for r in rows) if rows else 0

    if n_rows < 2 or n_cols < 3:
        return "unknown (too small)"

    header = [clean_cell(c) for c in rows[0]]
    header_text = " ".join(header).lower()
    if EDGE_LIST_HINTS.search(header_text) and n_cols <= 8:
        return "edge-list / network table"

    # D2T exports: row entity in first columns, many DSA/OPO columns in header row 1
    data_cols = n_cols - 2
    if n_cols >= 15 and data_cols > n_rows:
        return "wide matrix (origin–destination flow table)"

    # Few columns, many rows → long / edge-like
    if n_cols <= 6 and n_rows > n_cols * 5:
        return "edge-list / network table"

    return "wide matrix (origin–destination flow table)"


def parse_center_id(cell: str) -> str | None:
    text = clean_cell(cell)
    if not text or text.lower() == "all centers":
        return None
    match = CENTER_ID.match(text)
    return match.group(1).upper() if match else None


def parse_dsa_id(header_cell: str) -> str | None:
    text = clean_cell(header_cell)
    if not text:
        return None
    match = DSA_ID.match(text)
    return match.group(1).upper() if match else None


def extract_dsa_columns(header: list[str]) -> list[str]:
    """Return donor-recovery area labels from the header row."""
    labels: list[str] = []
    for cell in header:
        text = clean_cell(cell)
        if not text:
            continue
        if text.lower() in {"all donation service areas", "all centers", "na"}:
            continue
        labels.append(text)
    return labels


def find_organ_column(header: list[str]) -> str | None:
    for cell in header:
        text = clean_cell(cell)
        if text.lower() in ORGAN_COLUMN_NAMES:
            return text
    return None


def infer_organ_from_path(path: Path) -> str | None:
    name = path.name.lower()
    if "3.d2t" in name or "all centers" in name:
        return None
    match = re.search(r"t_sd\.\d+\.([a-z0-9_]+)_", name)
    if match:
        return match.group(1).replace("_", " ")
    return None


def print_section(title: str) -> None:
    print("\n" + "=" * 80)
    print(title)
    print("=" * 80)


def main() -> None:
    parser = argparse.ArgumentParser(description="Inspect OPTN 3.D2T CSV structure.")
    parser.add_argument(
        "csv_path",
        nargs="?",
        help="Optional path to CSV (relative to assignment root or absolute).",
    )
    args = parser.parse_args()

    path = resolve_csv_path(args.csv_path)
    rows = read_csv_safe(path)

    n_rows = len(rows)
    n_cols = max((len(r) for r in rows), default=0)
    header = rows[0] if rows else []
    column_names = [clean_cell(c) or f"<col_{i}>" for i, c in enumerate(header)]

    print_section("FILE")
    print(path.relative_to(BASE))

    print_section("SHAPE")
    print(f"rows: {n_rows}")
    print(f"columns: {n_cols}")

    print_section("COLUMN NAMES (header row)")
    for i, name in enumerate(column_names):
        print(f"  [{i:>3}] {name}")

    print_section("FIRST 10 ROWS")
    for i, row in enumerate(rows[:10]):
        preview = row[:12]
        suffix = " ..." if len(row) > 12 else ""
        print(f"row {i:>2}: {preview}{suffix}")

    structure = detect_structure(rows)
    print_section("STRUCTURE DETECTION")
    print(structure)

    dsa_labels = extract_dsa_columns(header)
    center_ids: list[str] = []
    for row in rows[1:]:
        center_id = parse_center_id(row[0] if row else "")
        if center_id:
            center_ids.append(center_id)

    organ_col = find_organ_column(header)
    organ_from_path = infer_organ_from_path(path)

    print_section("UNIQUE COUNTS")
    print(f"donor recovery areas (DSA/OPO columns): {len(set(dsa_labels))}")
    print(f"transplant centers (data rows):         {len(set(center_ids))}")
    if organ_col:
        print(f"organ column in file:                 {organ_col}")
    elif organ_from_path:
        print(f"organ (from filename):                {organ_from_path}")
    else:
        print("organ:                                not present (all-organs aggregate)")

    print_section("SAMPLE ENTITY IDS")
    dsa_codes = [pid for lbl in dsa_labels if (pid := parse_dsa_id(lbl))]
    print(f"DSA codes (sample): {dsa_codes[:5]}")
    print(f"Center codes (sample): {center_ids[:5]}")

    print_section("LIKELY JOIN KEYS & SPATIAL ENTITIES")
    print(
        """
Spatial / network entities:
  - Source nodes: Donation Service Areas of Donor Recovery (DSA), often labeled
    with OPO codes (e.g. ALOB-OP1) in column headers.
  - Sink nodes: Transplant Centers (TX codes, e.g. ALCH-TX1) in row labels.
  - Edge weight: transplant count from donor-recovery DSA → transplant center.

Likely join keys (when melting to long / joining to geography):
  - dsa_id or opo_code  — parsed from column header (token before space/name)
  - center_id           — first field of each data row (TX code)
  - Optional aggregates: "All Donation Service Areas", "NA" columns (non-spatial totals)

Suggested relational keys for spatial work:
  - Link center_id → transplant center point/region lookup table
  - Link dsa_id   → donation service area polygon or representative geography
  - Flow value column after unpivot: numeric count (strip commas if present)

Organ handling:
  - This 3.D2T file is all organs combined; per-organ flows live under
    data/raw/source_to_destination_by_organ/Transplants/T_SD.*.csv
    with organ encoded in the filename.
""".strip()
    )


if __name__ == "__main__":
    main()
