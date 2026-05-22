"""
Report coordinate coverage for full D2T edge list vs node coordinates.

Inputs:
  data/processed/d2t_edges_all_organs_enriched.csv
  data/processed/all_nodes_with_coordinates.csv

Outputs:
  data/processed/missing_source_nodes_by_flow.csv
  data/processed/missing_destination_nodes_by_flow.csv
"""

from __future__ import annotations

import csv
from collections import defaultdict
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
PROCESSED = BASE / "data/processed"

EDGES_CSV = PROCESSED / "d2t_edges_all_organs_enriched.csv"
NODES_CSV = PROCESSED / "all_nodes_with_coordinates.csv"
MISSING_SOURCE_CSV = PROCESSED / "missing_source_nodes_by_flow.csv"
MISSING_DESTINATION_CSV = PROCESSED / "missing_destination_nodes_by_flow.csv"


def has_coordinates(lat: str, lon: str) -> bool:
    try:
        return float(lat.strip()) == float(lat) and float(lon.strip()) == float(lon)
    except (TypeError, ValueError, AttributeError):
        return False


def load_coordinate_ids(path: Path) -> set[str]:
    ids: set[str] = set()
    with open(path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if has_coordinates(row.get("lat", ""), row.get("lon", "")):
                ids.add(row["id"].strip())
    return ids


def read_edges(path: Path) -> list[dict[str, str]]:
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def write_ranked_missing(
    path: Path,
    ranked: list[tuple[str, int, dict[str, str]]],
    fieldnames: tuple[str, ...],
) -> None:
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for node_id, total_flow, meta in ranked:
            writer.writerow({**meta, "id": node_id, "total_flow": total_flow})


def main() -> None:
    coord_ids = load_coordinate_ids(NODES_CSV)
    edges = read_edges(EDGES_CSV)

    total_edges = len(edges)
    total_flow = sum(int(e["flow_count"]) for e in edges)

    retained_edges = 0
    retained_flow = 0

    source_outflow: defaultdict[str, int] = defaultdict(int)
    dest_inflow: defaultdict[str, int] = defaultdict(int)
    source_meta: dict[str, dict[str, str]] = {}
    dest_meta: dict[str, dict[str, str]] = {}

    all_source_ids: set[str] = set()
    all_dest_ids: set[str] = set()

    for e in edges:
        source_id = e["source_dsa_id"].strip()
        dest_id = e["destination_center_id"].strip()
        flow = int(e["flow_count"])

        all_source_ids.add(source_id)
        all_dest_ids.add(dest_id)

        source_outflow[source_id] += flow
        dest_inflow[dest_id] += flow

        if source_id not in source_meta:
            source_meta[source_id] = {
                "name": e.get("source_dsa_name", ""),
                "state": e.get("source_state", ""),
                "region": e.get("source_region", ""),
            }
        if dest_id not in dest_meta:
            dest_meta[dest_id] = {
                "name": e.get("destination_center_name", ""),
                "state": e.get("destination_state", ""),
                "region": e.get("destination_region", ""),
            }

        source_ok = source_id in coord_ids
        dest_ok = dest_id in coord_ids

        if source_ok and dest_ok:
            retained_edges += 1
            retained_flow += flow

    missing_sources = [
        (sid, source_outflow[sid], source_meta[sid])
        for sid in all_source_ids
        if sid not in coord_ids
    ]
    missing_dests = [
        (did, dest_inflow[did], dest_meta[did])
        for did in all_dest_ids
        if did not in coord_ids
    ]

    missing_sources.sort(key=lambda x: x[1], reverse=True)
    missing_dests.sort(key=lambda x: x[1], reverse=True)

    pct_edges = (retained_edges / total_edges * 100) if total_edges else 0.0
    pct_flow = (retained_flow / total_flow * 100) if total_flow else 0.0

    print("Coordinate coverage (full all-organ edge list)")
    print(f"  edges file: {EDGES_CSV.name}")
    print(f"  nodes file: {NODES_CSV.name}")
    print(f"  nodes with coordinates: {len(coord_ids)}")
    print(f"  unique source IDs in edges: {len(all_source_ids)}")
    print(f"  unique destination IDs in edges: {len(all_dest_ids)}")
    print()
    print(f"  total edges: {total_edges}")
    print(f"  edges with both source and destination coordinates: {retained_edges}")
    print(f"  percent of edges retained: {pct_edges:.1f}%")
    print(f"  total flow_count in all-organ D2T list (denominator): {total_flow}")
    print(f"  flow_count retained with both endpoints geocoded (numerator): {retained_flow}")
    print(f"  percent of flow_count retained: {pct_flow:.1f}%")
    print()
    print(f"  missing source IDs: {len(missing_sources)}")
    print(f"  missing destination IDs: {len(missing_dests)}")
    print()
    print("Top 10 missing sources by total outflow:")
    for node_id, flow, meta in missing_sources[:10]:
        print(f"    {node_id}  {flow:>6}  {meta['name']} ({meta['state']})")
    print()
    print("Top 10 missing destinations by total inflow:")
    for node_id, flow, meta in missing_dests[:10]:
        print(f"    {node_id}  {flow:>6}  {meta['name']} ({meta['state']})")

    write_ranked_missing(
        MISSING_SOURCE_CSV,
        missing_sources,
        ("id", "name", "state", "region", "total_flow"),
    )
    write_ranked_missing(
        MISSING_DESTINATION_CSV,
        missing_dests,
        ("id", "name", "state", "region", "total_flow"),
    )

    print()
    print(f"Wrote {MISSING_SOURCE_CSV.relative_to(BASE)}")
    print(f"Wrote {MISSING_DESTINATION_CSV.relative_to(BASE)}")


if __name__ == "__main__":
    main()
