"""
Build master geocoding queue for every DSA and transplant center in the full edge list.

Inputs:
  data/processed/d2t_edges_all_organs_enriched.csv
  data/processed/top50_all_nodes_partial_real_coordinates.csv  (optional seed coords)

Outputs:
  data/processed/all_nodes_for_geocoding.csv
  data/processed/all_sources_for_geocoding.csv
  data/processed/all_destinations_for_geocoding.csv
  data/reference/manual_geocoding/all_nodes_geocoded.csv  (created once; preserved on reruns)

Run:
  python3 scripts/build_all_nodes_for_geocoding.py
"""

from __future__ import annotations

import csv
from collections import defaultdict
from pathlib import Path

from geocode_utils import (
    BASE,
    MANUAL_DIR,
    NODE_FIELDS,
    PROCESSED,
    build_geocode_query,
    classify_coordinates,
    geocode_priority,
    read_csv_dicts,
    write_csv_dicts,
)

EDGES_CSV = PROCESSED / "d2t_edges_all_organs_enriched.csv"
SEED_COORDS_CSV = PROCESSED / "top50_all_nodes_partial_real_coordinates.csv"
QUEUE_CSV = PROCESSED / "all_nodes_for_geocoding.csv"
SOURCES_CSV = PROCESSED / "all_sources_for_geocoding.csv"
DESTINATIONS_CSV = PROCESSED / "all_destinations_for_geocoding.csv"
MANUAL_WORK_CSV = MANUAL_DIR / "all_nodes_geocoded.csv"


def load_seed_coords(path: Path) -> dict[str, dict[str, str]]:
    if not path.exists():
        return {}
    seeds: dict[str, dict[str, str]] = {}
    for row in read_csv_dicts(path):
        node_id = row["id"].strip()
        seeds[node_id] = {
            "lat": row.get("lat", "").strip(),
            "lon": row.get("lon", "").strip(),
            "notes": row.get("notes", "").strip(),
        }
    return seeds


def load_manual_overrides(path: Path) -> dict[str, dict[str, str]]:
    if not path.exists():
        return {}
    overrides: dict[str, dict[str, str]] = {}
    for row in read_csv_dicts(path):
        node_id = row["id"].strip()
        lat = row.get("lat", "").strip()
        lon = row.get("lon", "").strip()
        if lat and lon:
            overrides[node_id] = {
                "lat": lat,
                "lon": lon,
                "notes": row.get("notes", "").strip(),
            }
    return overrides


def collect_nodes_from_edges(rows: list[dict[str, str]]) -> dict[str, dict]:
    nodes: dict[str, dict] = {}

    def ensure(
        node_id: str,
        node_type: str,
        name: str,
        state: str,
        region: str,
    ) -> dict:
        if node_id not in nodes:
            nodes[node_id] = {
                "id": node_id,
                "type": node_type,
                "name": name,
                "state": state,
                "region": region,
                "total_inflow": 0,
                "total_outflow": 0,
                "total_flow": 0,
                "edge_count": 0,
            }
        return nodes[node_id]

    for row in rows:
        flow = int(row["flow_count"])
        src_id = row["source_dsa_id"].strip()
        dst_id = row["destination_center_id"].strip()

        src = ensure(
            src_id,
            "source_dsa",
            row["source_dsa_name"].strip(),
            row["source_state"].strip(),
            row["source_region"].strip(),
        )
        dst = ensure(
            dst_id,
            "transplant_center",
            row["destination_center_name"].strip(),
            row["destination_state"].strip(),
            row["destination_region"].strip(),
        )

        src["total_outflow"] += flow
        src["total_flow"] += flow
        src["edge_count"] += 1

        dst["total_inflow"] += flow
        dst["total_flow"] += flow
        dst["edge_count"] += 1

    return nodes


def build_row(node: dict, seed: dict[str, str], manual: dict[str, str]) -> dict[str, str]:
    node_id = node["id"]
    lat = ""
    lon = ""
    notes = ""

    if node_id in manual:
        lat = manual[node_id]["lat"]
        lon = manual[node_id]["lon"]
        notes = manual[node_id].get("notes", "")
        if notes and "manual_map" not in notes and "manual_geocode" not in notes:
            notes = f"manual_map;{notes}"
        elif not notes:
            notes = "manual_map;high"
    elif node_id in seed:
        lat = seed[node_id]["lat"]
        lon = seed[node_id]["lon"]
        notes = seed[node_id].get("notes", "")

    status = classify_coordinates(lat, lon, node["state"], notes)
    priority = geocode_priority(status, node["total_flow"])

    return {
        "id": node_id,
        "type": node["type"],
        "name": node["name"],
        "state": node["state"],
        "region": node["region"],
        "total_inflow": str(node["total_inflow"]),
        "total_outflow": str(node["total_outflow"]),
        "total_flow": str(node["total_flow"]),
        "edge_count": str(node["edge_count"]),
        "lat": lat,
        "lon": lon,
        "coordinate_status": status,
        "geocode_priority": str(priority),
        "geocode_query": build_geocode_query(node["name"], node["state"], node["type"]),
        "notes": notes,
    }


def init_manual_workbook(rows: list[dict[str, str]]) -> None:
    """Create manual work file once; never overwrite existing edits."""
    if MANUAL_WORK_CSV.exists():
        return
    MANUAL_DIR.mkdir(parents=True, exist_ok=True)
    write_csv_dicts(MANUAL_WORK_CSV, rows, NODE_FIELDS)
    print(f"Created manual workbook (edit lat/lon here): {MANUAL_WORK_CSV.relative_to(BASE)}")


def print_summary(rows: list[dict[str, str]]) -> None:
    total = len(rows)
    by_status: dict[str, int] = defaultdict(int)
    by_type: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    for row in rows:
        by_status[row["coordinate_status"]] += 1
        by_type[row["type"]][row["coordinate_status"]] += 1

    print(f"\nTotal nodes: {total}")
    print("By coordinate_status:")
    for status in sorted(by_status, key=lambda s: -by_status[s]):
        n = by_status[status]
        print(f"  {status:18} {n:>4}  ({n / total * 100:5.1f}%)")

    print("\nNeeds manual map work (priority 1–2):")
    todo = [r for r in rows if int(r["geocode_priority"]) <= 2 and r["coordinate_status"] != "manual_verified"]
    for row in todo[:15]:
        print(
            f"  P{row['geocode_priority']}  {row['id']:12}  flow={row['total_flow']:>5}  "
            f"{row['coordinate_status']:16}  {row['name'][:40]}"
        )
    if len(todo) > 15:
        print(f"  ... and {len(todo) - 15} more (see CSV sorted by geocode_priority)")


def main() -> None:
    if not EDGES_CSV.exists():
        raise SystemExit(f"Missing input: {EDGES_CSV}")

    edges = read_csv_dicts(EDGES_CSV)
    nodes = collect_nodes_from_edges(edges)
    seeds = load_seed_coords(SEED_COORDS_CSV)
    manual = load_manual_overrides(MANUAL_WORK_CSV)

    rows = [build_row(nodes[nid], seeds, manual) for nid in sorted(nodes)]
    rows.sort(
        key=lambda r: (int(r["geocode_priority"]), -int(r["total_flow"]), r["id"])
    )

    write_csv_dicts(QUEUE_CSV, rows, NODE_FIELDS)
    write_csv_dicts(SOURCES_CSV, [r for r in rows if r["type"] == "source_dsa"], NODE_FIELDS)
    write_csv_dicts(
        DESTINATIONS_CSV, [r for r in rows if r["type"] == "transplant_center"], NODE_FIELDS
    )

    init_manual_workbook(rows)

    print(f"Wrote {QUEUE_CSV.relative_to(BASE)} ({len(rows)} nodes)")
    print(f"Wrote {SOURCES_CSV.relative_to(BASE)}")
    print(f"Wrote {DESTINATIONS_CSV.relative_to(BASE)}")
    if manual:
        print(f"Applied {len(manual)} manual coordinate overrides from {MANUAL_WORK_CSV.name}")
    print_summary(rows)


if __name__ == "__main__":
    main()
