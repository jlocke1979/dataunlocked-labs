"""
Inspect OPTN hierarchical reference CSVs (lookup tables, not viz datasets).

Prints a concise structured summary for join planning (MSDS 455 Assignment 5).
"""

from __future__ import annotations

import csv
import re
from dataclasses import dataclass, field
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
REF_DIR = BASE / "data/raw/hierarchial_references"

CENTER_ID = re.compile(r"([A-Z]{2,5}-TX\d+)", re.I)
DSA_ID = re.compile(r"([A-Z]{2,5}-(?:OP|IO)\d+)", re.I)
REGION_LABEL = re.compile(r"^Region\s+\d+", re.I)
US_STATE = re.compile(
    r"^(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|"
    r"Delaware|District of Columbia|Florida|Georgia|Hawaii|Idaho|Illinois|"
    r"Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|"
    r"Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|"
    r"New Hampshire|New Jersey|New Mexico|New York|North Carolina|"
    r"North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Puerto Rico|"
    r"Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|"
    r"Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming)$",
    re.I,
)


@dataclass
class FileSummary:
    filename: str
    rows: int
    columns: int
    tx_columns: list[str] = field(default_factory=list)
    opo_columns: list[str] = field(default_factory=list)
    state_columns: list[str] = field(default_factory=list)
    region_columns: list[str] = field(default_factory=list)
    tx_ids: set[str] = field(default_factory=set)
    opo_ids: set[str] = field(default_factory=set)
    states: set[str] = field(default_factory=set)
    regions: set[str] = field(default_factory=set)
    likely_use: str = ""


def read_csv(path: Path) -> list[list[str]]:
    with open(path, newline="", encoding="utf-8-sig") as f:
        return list(csv.reader(f))


def clean(cell: str) -> str:
    return cell.strip() if cell else ""


def col_label(index: int, header: list[str]) -> str:
    text = clean(header[index]) if index < len(header) else ""
    return f"col_{index}" + (f" ({text})" if text else "")


def analyze_file(path: Path) -> FileSummary:
    rows = read_csv(path)
    header = rows[0] if rows else []
    n_cols = max((len(r) for r in rows), default=0)

    tx_by_col: dict[int, set[str]] = {}
    opo_by_col: dict[int, set[str]] = {}
    state_by_col: dict[int, set[str]] = {}
    region_by_col: dict[int, set[str]] = {}

    summary = FileSummary(
        filename=path.name,
        rows=len(rows),
        columns=n_cols,
    )

    for row in rows[1:]:
        for idx, cell in enumerate(row):
            text = clean(cell)
            if not text:
                continue

            if REGION_LABEL.match(text):
                region_by_col.setdefault(idx, set()).add(text)
                summary.regions.add(text)
            if US_STATE.match(text):
                state_by_col.setdefault(idx, set()).add(text)
                summary.states.add(text)

            for match in CENTER_ID.findall(text):
                tx_by_col.setdefault(idx, set()).add(match.upper())
                summary.tx_ids.add(match.upper())
            for match in DSA_ID.findall(text):
                opo_by_col.setdefault(idx, set()).add(match.upper())
                summary.opo_ids.add(match.upper())

    def columns_with_hits(by_col: dict[int, set[str]], min_count: int = 1) -> list[str]:
        ranked = sorted(by_col.items(), key=lambda item: len(item[1]), reverse=True)
        return [
            f"{col_label(idx, header)} — {len(values)} values"
            for idx, values in ranked
            if len(values) >= min_count
        ]

    summary.tx_columns = columns_with_hits(tx_by_col)
    summary.opo_columns = columns_with_hits(opo_by_col)
    summary.state_columns = columns_with_hits(state_by_col)
    summary.region_columns = columns_with_hits(region_by_col)
    summary.likely_use = infer_likely_use(path, summary)
    return summary


def infer_likely_use(path: Path, summary: FileSummary) -> str:
    name = path.name.lower()
    if "region" in name and "state" in name:
        return "State → OPTN region lookup; no center or OPO IDs."
    if "donation_service_area" in name:
        return "OPO/DSA of center → state lookup (hierarchical rows)."
    if "transplant_center" in name:
        return "Transplant center TX id → state lookup (hierarchical rows)."
    return "Reference hierarchy; review column keys before joining."


def print_key_list(label: str, items: list[str]) -> None:
    if items:
        for item in items:
            print(f"  - {label}: {item}")
    else:
        print(f"  - {label}: (none detected)")


def print_file_summary(summary: FileSummary) -> None:
    print("\n" + "=" * 50)
    print(f"FILENAME: {summary.filename}")
    print(f"ROWS: {summary.rows}")
    print(f"COLUMNS: {summary.columns}")
    print("\nLIKELY KEYS:")
    print_key_list("center IDs (*-TX#)", summary.tx_columns)
    print_key_list("OPO/DSA IDs (*-OP1/*-IO1)", summary.opo_columns)
    print_key_list("states", summary.state_columns)
    print_key_list("regions", summary.region_columns)
    print("\nUNIQUE COUNTS:")
    print(f"  - TX IDs: {len(summary.tx_ids)}")
    print(f"  - OP1/IO1 IDs: {len(summary.opo_ids)}")
    print(f"  - states: {len(summary.states)}")
    print(f"  - regions: {len(summary.regions)}")
    print(f"\nLIKELY USE:\n  {summary.likely_use}")


def print_final_summary(summaries: list[FileSummary]) -> None:
    a1 = next(
        (s for s in summaries if "Region" in s.filename and "State" in s.filename),
        None,
    )
    a2 = next((s for s in summaries if "Donation_Service_Area" in s.filename), None)
    a3 = next((s for s in summaries if "Transplant_Center" in s.filename), None)

    print("\n" + "=" * 50)
    print("FINAL SUMMARY")
    print("-" * 50)

    print("\n1. Mapping transplant centers to states:")
    if a3 and a3.tx_ids:
        print(f"   Best: {a3.filename} ({len(a3.tx_ids)} TX ids → state in col_0).")
    else:
        print("   Best: none — no TX ids in reference folder.")

    print("\n2. Mapping transplant centers to regions:")
    if a3 and a1:
        print(f"   Best: chain {a3.filename} (TX→state) + {a1.filename} (state→Region N).")
    else:
        print("   Best: indirect chain A.3 + A.1 (if both present).")

    print("\n3. Mapping OPOs/DSAs to states:")
    if a2 and a2.opo_ids:
        print(f"   Best: {a2.filename} ({len(a2.opo_ids)} OPO ids → state in col_0).")
    else:
        print("   Best: none — no OPO ids in reference folder.")

    print("\n4. Mapping OPOs/DSAs to regions:")
    if a2 and a1:
        print(f"   Best: chain {a2.filename} (OPO→state) + {a1.filename} (state→region).")
    else:
        print("   Best: indirect chain A.2 + A.1 (if both present).")

    print("\n5. Potential geocoding support:")
    print("   These files provide IDs and state/region labels only — no lat/lon.")
    print("   Use for joins to external geocoders or manual node tables.")
    if a3:
        print(f"   Center geocoding: enrich TX ids from {a3.filename}.")
    if a2:
        print(f"   OPO geocoding: enrich OP/IO ids from {a2.filename}.")

    print("\nNotes:")
    print("   - Skip aggregate rows (All Centers, All Donation Service Areas, etc.).")
    print("   - A.2 is DSA *of center*; D2T flows use DSA *of donor recovery* — verify IDs.")
    print("   - Organ columns are waitlist metrics, not geographic join keys.")


def main() -> None:
    if not REF_DIR.is_dir():
        raise SystemExit(f"Reference directory not found: {REF_DIR}")

    files = sorted(REF_DIR.glob("*.csv"))
    if not files:
        raise SystemExit(f"No CSV files in {REF_DIR}")

    print(f"Reference folder: {REF_DIR.relative_to(BASE)}")
    print(f"Files: {len(files)}")

    summaries = [analyze_file(path) for path in files]
    for summary in summaries:
        print_file_summary(summary)
    print_final_summary(summaries)


if __name__ == "__main__":
    main()
