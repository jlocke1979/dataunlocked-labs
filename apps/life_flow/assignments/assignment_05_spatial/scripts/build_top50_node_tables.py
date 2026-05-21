"""
Build deduplicated source and destination node tables from top-50 enriched edges.
"""

from __future__ import annotations

import csv
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
PROCESSED = BASE / "data/processed"

INPUT_CSV = PROCESSED / "top50_edges_all_organs_enriched.csv"
SOURCE_NODES_CSV = PROCESSED / "top50_source_nodes_enriched.csv"
DESTINATION_NODES_CSV = PROCESSED / "top50_destination_nodes_enriched.csv"

NODE_FIELDS = ("id", "type", "name", "state", "region", "lat", "lon", "notes")
BLANK_GEO = ("", "", "")


def read_enriched_edges(path: Path) -> list[dict[str, str]]:
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def collect_sources(rows: list[dict[str, str]]) -> dict[str, tuple[str, str, str, str]]:
    nodes: dict[str, tuple[str, str, str, str]] = {}
    for row in rows:
        node_id = row["source_dsa_id"].strip()
        if not node_id or node_id in nodes:
            continue
        nodes[node_id] = (
            row["source_dsa_name"].strip(),
            row["source_state"].strip(),
            row["source_region"].strip(),
            "source_dsa",
        )
    return nodes


def collect_destinations(rows: list[dict[str, str]]) -> dict[str, tuple[str, str, str, str]]:
    nodes: dict[str, tuple[str, str, str, str]] = {}
    for row in rows:
        node_id = row["destination_center_id"].strip()
        if not node_id or node_id in nodes:
            continue
        nodes[node_id] = (
            row["destination_center_name"].strip(),
            row["destination_state"].strip(),
            row["destination_region"].strip(),
            "transplant_center",
        )
    return nodes


def write_nodes(
    path: Path,
    nodes: dict[str, tuple[str, str, str, str]],
) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(NODE_FIELDS)
        for node_id in sorted(nodes):
            name, state, region, node_type = nodes[node_id]
            writer.writerow(
                (node_id, node_type, name, state, region, *BLANK_GEO)
            )
    return len(nodes)


def main() -> None:
    if not INPUT_CSV.exists():
        raise SystemExit(f"Input not found: {INPUT_CSV}")

    rows = read_enriched_edges(INPUT_CSV)
    sources = collect_sources(rows)
    destinations = collect_destinations(rows)

    source_count = write_nodes(SOURCE_NODES_CSV, sources)
    dest_count = write_nodes(DESTINATION_NODES_CSV, destinations)

    print(f"Input: {INPUT_CSV.relative_to(BASE)} ({len(rows)} edges)")
    print(f"Wrote {SOURCE_NODES_CSV.relative_to(BASE)}: {source_count} source nodes")
    print(f"Wrote {DESTINATION_NODES_CSV.relative_to(BASE)}: {dest_count} destination nodes")


if __name__ == "__main__":
    main()
