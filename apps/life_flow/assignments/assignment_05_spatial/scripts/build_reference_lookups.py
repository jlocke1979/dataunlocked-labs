"""
Build clean geography lookup tables from OPTN hierarchical reference CSVs.

A.1 → state → OPTN region
A.2 → OPO/DSA → state (then join region via A.1)
A.3 → transplant center → state (then join region via A.1)
"""

from __future__ import annotations

import csv
import re
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
REF_DIR = BASE / "data/raw/hierarchial_references"
PROCESSED = BASE / "data/processed"

STATE_REGION_CSV = PROCESSED / "state_region_lookup.csv"
DSA_LOOKUP_CSV = PROCESSED / "dsa_state_region_lookup.csv"
CENTER_LOOKUP_CSV = PROCESSED / "center_state_region_lookup.csv"

CENTER_ID = re.compile(r"^([A-Z]{2,5}-TX\d+)\s*(.*)$", re.I)
DSA_ID = re.compile(r"^([A-Z]{2,5}-(?:OP|IO)\d+)\s*(.*)$", re.I)
REGION_LABEL = re.compile(r"^Region\s+\d+", re.I)
AGGREGATE = re.compile(
    r"^All (Regions|Center States|Donation Service Areas|Centers)$", re.I
)
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


def find_ref(pattern: str) -> Path:
    matches = sorted(REF_DIR.glob(pattern))
    if not matches:
        raise SystemExit(f"No file matching {pattern} in {REF_DIR}")
    return matches[0]


def read_csv(path: Path) -> list[list[str]]:
    with open(path, newline="", encoding="utf-8-sig") as f:
        return list(csv.reader(f))


def clean(cell: str) -> str:
    return cell.strip() if cell else ""


def cell(row: list[str], index: int) -> str:
    return clean(row[index]) if index < len(row) else ""


def write_lookup(path: Path, fieldnames: tuple[str, ...], rows: list[tuple]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(fieldnames)
        writer.writerows(rows)


def parse_state_region_a1(rows: list[list[str]]) -> dict[str, str]:
    """state → region from hierarchical Region N blocks."""
    current_region: str | None = None
    mapping: dict[str, str] = {}
    conflicts: list[tuple[str, str, str]] = []

    for row in rows[1:]:
        col0 = cell(row, 0)
        col1 = cell(row, 1)

        if REGION_LABEL.match(col0):
            current_region = col0
            continue

        if not US_STATE.match(col1) or not current_region:
            continue

        if col1 in mapping and mapping[col1] != current_region:
            conflicts.append((col1, mapping[col1], current_region))
        mapping[col1] = current_region

    if conflicts:
        print(f"  Warning: {len(conflicts)} state(s) mapped to multiple regions (kept first):")
        for state, first, second in conflicts[:5]:
            print(f"    {state}: {first} vs {second}")
        if len(conflicts) > 5:
            print(f"    ... and {len(conflicts) - 5} more")

    return mapping


def parse_dsa_a2(rows: list[list[str]]) -> dict[str, tuple[str, str]]:
    """dsa_id → (dsa_name, state)."""
    current_state: str | None = None
    mapping: dict[str, tuple[str, str]] = {}

    for row in rows[1:]:
        col0 = cell(row, 0)
        col1 = cell(row, 1)

        if US_STATE.match(col0):
            current_state = col0
            continue

        if AGGREGATE.match(col0) or AGGREGATE.match(col1):
            continue

        match = DSA_ID.match(col1)
        if not match or not current_state:
            continue

        dsa_id = match.group(1).upper()
        dsa_name = clean(match.group(2))
        mapping[dsa_id] = (dsa_name, current_state)

    return mapping


def parse_center_a3(rows: list[list[str]]) -> dict[str, tuple[str, str]]:
    """center_id → (center_name, state)."""
    current_state: str | None = None
    mapping: dict[str, tuple[str, str]] = {}

    for row in rows[1:]:
        col0 = cell(row, 0)
        col1 = cell(row, 1)

        if US_STATE.match(col0):
            current_state = col0
            continue

        if AGGREGATE.match(col0) or AGGREGATE.match(col1):
            continue

        match = CENTER_ID.match(col1)
        if not match or not current_state:
            continue

        center_id = match.group(1).upper()
        center_name = clean(match.group(2))
        mapping[center_id] = (center_name, current_state)

    return mapping


def join_region(state: str, state_region: dict[str, str]) -> str:
    return state_region.get(state, "")


def build_state_region_rows(state_region: dict[str, str]) -> list[tuple[str, str]]:
    return sorted((state, region) for state, region in state_region.items())


def build_dsa_rows(
    dsa_map: dict[str, tuple[str, str]], state_region: dict[str, str]
) -> list[tuple[str, str, str, str]]:
    rows: list[tuple[str, str, str, str]] = []
    for dsa_id in sorted(dsa_map):
        name, state = dsa_map[dsa_id]
        region = join_region(state, state_region)
        rows.append((dsa_id, name, state, region))
    return rows


def build_center_rows(
    center_map: dict[str, tuple[str, str]], state_region: dict[str, str]
) -> list[tuple[str, str, str, str]]:
    rows: list[tuple[str, str, str, str]] = []
    for center_id in sorted(center_map):
        name, state = center_map[center_id]
        region = join_region(state, state_region)
        rows.append((center_id, name, state, region))
    return rows


def report_unmatched(
    label: str,
    entities: list[tuple[str, str]],
    state_region: dict[str, str],
) -> list[str]:
    """Return states with no region in A.1."""
    unmatched: list[str] = []
    seen: set[str] = set()
    for _id, state in entities:
        if state in seen:
            continue
        seen.add(state)
        if state and state not in state_region:
            unmatched.append(state)
    if unmatched:
        print(f"  Unmatched states ({label}, no region in A.1): {len(unmatched)}")
        print(f"    {', '.join(sorted(unmatched))}")
    else:
        print(f"  Unmatched states ({label}): 0")
    return unmatched


def main() -> None:
    path_a1 = find_ref("A.1*")
    path_a2 = find_ref("A.2*")
    path_a3 = find_ref("A.3*")

    print("Inputs:")
    print(f"  A.1: {path_a1.name}")
    print(f"  A.2: {path_a2.name}")
    print(f"  A.3: {path_a3.name}")

    state_region = parse_state_region_a1(read_csv(path_a1))
    dsa_map = parse_dsa_a2(read_csv(path_a2))
    center_map = parse_center_a3(read_csv(path_a3))

    state_rows = build_state_region_rows(state_region)
    dsa_rows = build_dsa_rows(dsa_map, state_region)
    center_rows = build_center_rows(center_map, state_region)

    write_lookup(STATE_REGION_CSV, ("state", "region"), state_rows)
    write_lookup(
        DSA_LOOKUP_CSV,
        ("dsa_id", "dsa_name", "state", "region"),
        dsa_rows,
    )
    write_lookup(
        CENTER_LOOKUP_CSV,
        ("center_id", "center_name", "state", "region"),
        center_rows,
    )

    print("\nOutputs:")
    print(f"  {STATE_REGION_CSV.relative_to(BASE)}: {len(state_rows)} rows")
    print(f"  {DSA_LOOKUP_CSV.relative_to(BASE)}: {len(dsa_rows)} rows")
    print(f"  {CENTER_LOOKUP_CSV.relative_to(BASE)}: {len(center_rows)} rows")

    dsa_missing_region = [r for r in dsa_rows if r[2] and not r[3]]
    center_missing_region = [r for r in center_rows if r[2] and not r[3]]

    print("\nJoin checks:")
    report_unmatched("A.2 DSAs", [(d, s) for d, (_, s) in dsa_map.items()], state_region)
    report_unmatched(
        "A.3 centers", [(c, s) for c, (_, s) in center_map.items()], state_region
    )

    if dsa_missing_region:
        print(f"  DSA rows with empty region: {len(dsa_missing_region)}")
    else:
        print("  DSA rows with empty region: 0")

    if center_missing_region:
        print(f"  Center rows with empty region: {len(center_missing_region)}")
    else:
        print("  Center rows with empty region: 0")

    states_in_a1 = set(state_region)
    states_in_a2 = {s for _, s in dsa_map.values()}
    states_in_a3 = {s for _, s in center_map.values()}
    only_a2_a3 = sorted((states_in_a2 | states_in_a3) - states_in_a1)
    if only_a2_a3:
        print(f"  States in A.2/A.3 but not in A.1 region map: {len(only_a2_a3)}")
        print(f"    {', '.join(only_a2_a3)}")
    else:
        print("  States in A.2/A.3 but not in A.1 region map: 0")


if __name__ == "__main__":
    main()
