"""
Extract unique source and destination node IDs from top-50 D2T edges.

Outputs placeholder node lookup tables for manual geocoding.
"""

from __future__ import annotations

import csv
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
PROCESSED = BASE / "data/processed"
INPUT_CSV = PROCESSED / "top_50_edges_all_organs.csv"
SOURCE_NODES_CSV = PROCESSED / "top50_source_nodes_needed.csv"
DESTINATION_NODES_CSV = PROCESSED / "top50_destination_nodes_needed.csv"

NODE_FIELDNAMES = ("id", "name", "city", "state", "lat", "lon", "notes")
BLANK_FIELDS = ("", "", "", "", "")


def read_unique_ids(path: Path, source_key: str, dest_key: str) -> tuple[set[str], set[str]]:
    sources: set[str] = set()
    destinations: set[str] = set()
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            sources.add(row[source_key].strip())
            destinations.add(row[dest_key].strip())
    return sources, destinations


def write_node_template(path: Path, ids: set[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(NODE_FIELDNAMES)
        for node_id in sorted(ids):
            writer.writerow((node_id, *BLANK_FIELDS))


def main() -> None:
    if not INPUT_CSV.exists():
        raise SystemExit(f"Input not found: {INPUT_CSV}")

    sources, destinations = read_unique_ids(
        INPUT_CSV, "source_dsa_id", "destination_center_id"
    )

    write_node_template(SOURCE_NODES_CSV, sources)
    write_node_template(DESTINATION_NODES_CSV, destinations)

    print(f"Wrote {SOURCE_NODES_CSV.relative_to(BASE)}")
    print(f"Wrote {DESTINATION_NODES_CSV.relative_to(BASE)}")
    print(f"Unique source nodes needed: {len(sources)}")
    print(f"Unique destination nodes needed: {len(destinations)}")


if __name__ == "__main__":
    main()
