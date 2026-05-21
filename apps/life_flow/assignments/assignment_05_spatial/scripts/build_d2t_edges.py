"""
Build a long edge list from OPTN Report 3.D2T (all organs).

Wide matrix: transplant centers (rows) × donor-recovery DSA/OPO (columns).
"""

from __future__ import annotations

import csv
import re
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
INPUT_CSV = (
    BASE
    / "data/raw/center_reports"
    / "3.D2T_Transplant___Donation_Service_Area_of_Donor_Recovery_by_Transplant_Center.csv"
)
OUTPUT_CSV = BASE / "data/processed/d2t_edges_all_organs.csv"

CENTER_ID = re.compile(r"^([A-Z]{2,5}-TX\d+)\b", re.I)
DSA_ID = re.compile(r"^([A-Z]{2,5}-(?:OP|IO)\d+)\b", re.I)

FIELDNAMES = ("source_dsa_id", "destination_center_id", "flow_count")


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
    """Map column index → source DSA/OPO id (skip aggregate/non-DSA columns)."""
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


def print_summary(edges: list[tuple[str, str, int]]) -> None:
    sources = {e[0] for e in edges}
    destinations = {e[1] for e in edges}
    total_flow = sum(e[2] for e in edges)

    print(f"Output: {OUTPUT_CSV.relative_to(BASE)}")
    print(f"Edges: {len(edges):,}")
    print(f"Unique source DSAs: {len(sources):,}")
    print(f"Unique destination centers: {len(destinations):,}")
    print(f"Total flow count: {total_flow:,}")

    print("\nTop 20 edges by flow_count:")
    print(f"{'source_dsa_id':<12} {'destination_center_id':<22} {'flow_count':>10}")
    for dsa_id, center_id, flow in sorted(edges, key=lambda e: e[2], reverse=True)[:20]:
        print(f"{dsa_id:<12} {center_id:<22} {flow:>10,}")


def main() -> None:
    if not INPUT_CSV.exists():
        raise SystemExit(f"Input CSV not found: {INPUT_CSV}")

    rows = read_csv(INPUT_CSV)
    edges = wide_to_edges(rows)
    write_edges(OUTPUT_CSV, edges)
    print_summary(edges)


if __name__ == "__main__":
    main()
