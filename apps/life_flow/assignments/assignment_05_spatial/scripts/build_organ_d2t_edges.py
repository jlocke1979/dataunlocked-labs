"""
Build long edge lists from per-organ OPTN D2T source-to-destination CSVs.

Usage:
  python3 scripts/build_organ_d2t_edges.py kidney
  python3 scripts/build_organ_d2t_edges.py --all
  python3 scripts/build_organ_d2t_edges.py --list
"""

from __future__ import annotations

import csv
import re
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
PROCESSED = BASE / "data/processed"
TRANSPLANTS_DIR = BASE / "data/raw/source_to_destination_by_organ/Transplants"
MULTI_DIR = BASE / "data/raw/source_to_destination_by_organ/MultiTransplants"

CENTER_ID = re.compile(r"^([A-Z]{2,5}-TX\d+)\b", re.I)
DSA_ID = re.compile(r"^([A-Z]{2,5}-(?:OP|IO)\d+)\b", re.I)
FIELDNAMES = ("source_dsa_id", "destination_center_id", "flow_count")

# slug → raw OPTN wide-matrix CSV
ORGAN_SOURCES: dict[str, Path] = {
    "kidney": TRANSPLANTS_DIR
    / "T_SD.1.kidney_Transplant___Donation_Service_Area_of_Donor_Recovery_by_Transplant_Center.csv",
    "liver": TRANSPLANTS_DIR
    / "T_SD.2.liver_Transplant___Donation_Service_Area_of_Donor_Recovery_by_Transplant_Center.csv",
    "heart": TRANSPLANTS_DIR
    / "T_SD.5.heart_Transplant___Donation_Service_Area_of_Donor_Recovery_by_Transplant_Center.csv",
    "lung": TRANSPLANTS_DIR
    / "T_SD.6.lung_Transplant___Donation_Service_Area_of_Donor_Recovery_by_Transplant_Center.csv",
    "pancreas": TRANSPLANTS_DIR
    / "T_SD.3.pancrease_Transplant___Donation_Service_Area_of_Donor_Recovery_by_Transplant_Center.csv",
    "kidney_pancreas": TRANSPLANTS_DIR
    / "T_SD.4.kidney_and_pancrease_Transplant___Donation_Service_Area_of_Donor_Recovery_by_Transplant_Center.csv",
    "multi_liver_kidney": MULTI_DIR
    / "MT_SD.01.Liver-Kidney_Multiple_Organ_Transplant___Donation_Service_Area_of_Center_by_Transplant_Center.csv",
}


def clean_cell(value: str) -> str:
    return value.strip() if value else ""


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


def parse_flow_count(cell: str) -> int | None:
    text = clean_cell(cell).replace(",", "")
    if not text:
        return None
    try:
        return int(text)
    except ValueError:
        return None


def read_csv(path: Path) -> list[list[str]]:
    with open(path, newline="", encoding="utf-8-sig") as f:
        return list(csv.reader(f))


def build_dsa_column_map(header: list[str]) -> list[tuple[int, str]]:
    mapping: list[tuple[int, str]] = []
    for idx, cell in enumerate(header):
        dsa_id = parse_dsa_id(cell)
        if dsa_id:
            mapping.append((idx, dsa_id))
    return mapping


def wide_to_edges(rows: list[list[str]]) -> list[tuple[str, str, int]]:
    if not rows:
        return []

    header = rows[0]
    dsa_columns = build_dsa_column_map(header)
    edges: list[tuple[str, str, int]] = []

    for row in rows[1:]:
        center_id = parse_center_id(row[0] if row else "")
        if not center_id:
            continue

        for col_idx, dsa_id in dsa_columns:
            if col_idx >= len(row):
                continue
            flow = parse_flow_count(row[col_idx])
            if flow is None or flow <= 0:
                continue
            edges.append((dsa_id, center_id, flow))

    return edges


def write_edges(path: Path, edges: list[tuple[str, str, int]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(FIELDNAMES)
        writer.writerows(edges)


def print_summary(organ: str, output: Path, edges: list[tuple[str, str, int]]) -> None:
    sources = {e[0] for e in edges}
    destinations = {e[1] for e in edges}
    total_flow = sum(e[2] for e in edges)

    print(f"Organ: {organ}")
    print(f"Output: {output.relative_to(BASE)}")
    print(f"Edges: {len(edges):,}")
    print(f"Unique source DSAs: {len(sources):,}")
    print(f"Unique destination centers: {len(destinations):,}")
    print(f"Total flow count: {total_flow:,}")


def build_one(organ: str) -> None:
    input_csv = ORGAN_SOURCES.get(organ)
    if input_csv is None:
        raise SystemExit(f"Unknown organ '{organ}'.")

    if not input_csv.exists():
        raise SystemExit(f"Input CSV not found: {input_csv}")

    output_csv = PROCESSED / f"d2t_edges_{organ}.csv"
    rows = read_csv(input_csv)
    edges = wide_to_edges(rows)
    write_edges(output_csv, edges)
    print_summary(organ, output_csv, edges)
    print()


def main() -> None:
    if len(sys.argv) < 2:
        organs = ", ".join(sorted(ORGAN_SOURCES))
        raise SystemExit(
            "Usage: python3 scripts/build_organ_d2t_edges.py <organ|--all|--list>\n"
            f"  organs: {organs}"
        )

    arg = sys.argv[1].strip().lower()

    if arg == "--list":
        for slug, path in sorted(ORGAN_SOURCES.items()):
            status = "ok" if path.exists() else "MISSING"
            print(f"  {slug:<22} [{status}] {path.name}")
        return

    if arg == "--all":
        for organ in sorted(ORGAN_SOURCES):
            print("=" * 60)
            build_one(organ)
        return

    organ = arg
    if organ not in ORGAN_SOURCES:
        raise SystemExit(
            f"Unknown organ '{organ}'. Available: {', '.join(sorted(ORGAN_SOURCES))}"
        )
    build_one(organ)


if __name__ == "__main__":
    main()
