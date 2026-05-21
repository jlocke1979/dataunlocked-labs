"""
Combine top-50 source and destination node tables for geocoding.
"""

from __future__ import annotations

import csv
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
PROCESSED = BASE / "data/processed"

SOURCE_NODES = PROCESSED / "top50_source_nodes_enriched.csv"
DESTINATION_NODES = PROCESSED / "top50_destination_nodes_enriched.csv"
OUTPUT_CSV = PROCESSED / "top50_all_nodes_for_geocoding.csv"

NODE_FIELDS = ("id", "type", "name", "state", "region", "lat", "lon", "notes")


def read_nodes(path: Path) -> list[dict[str, str]]:
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def row_from_record(record: dict[str, str]) -> tuple[str, ...]:
    return tuple(record[field].strip() for field in NODE_FIELDS)


def main() -> None:
    for path in (SOURCE_NODES, DESTINATION_NODES):
        if not path.exists():
            raise SystemExit(f"Missing input: {path}")

    nodes: dict[str, tuple[str, ...]] = {}
    duplicates: list[str] = []

    for path in (SOURCE_NODES, DESTINATION_NODES):
        for record in read_nodes(path):
            node_id = record["id"].strip()
            if not node_id:
                continue
            row = row_from_record(record)
            if node_id in nodes:
                duplicates.append(node_id)
                continue
            nodes[node_id] = row

    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(NODE_FIELDS)
        for node_id in sorted(nodes):
            writer.writerow(nodes[node_id])

    print(f"Wrote {OUTPUT_CSV.relative_to(BASE)}")
    print(f"Total nodes: {len(nodes)}")
    if duplicates:
        print(f"Skipped duplicate ids (kept first): {len(duplicates)}")
        print(f"  {', '.join(sorted(set(duplicates)))}")


if __name__ == "__main__":
    main()
