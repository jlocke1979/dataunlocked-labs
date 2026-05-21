"""
Filter and summarize D2T edge list (all organs).
"""

from __future__ import annotations

import csv
from collections import defaultdict
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
PROCESSED = BASE / "data/processed"
INPUT_CSV = PROCESSED / "d2t_edges_all_organs.csv"

EDGE_FIELDNAMES = ("source_dsa_id", "destination_center_id", "flow_count")
TOP_EDGE_FILES = (
    (25, PROCESSED / "top_25_edges_all_organs.csv"),
    (50, PROCESSED / "top_50_edges_all_organs.csv"),
    (100, PROCESSED / "top_100_edges_all_organs.csv"),
)
SOURCE_SUMMARY_CSV = PROCESSED / "d2t_source_summary.csv"
DESTINATION_SUMMARY_CSV = PROCESSED / "d2t_destination_summary.csv"


def read_edges(path: Path) -> list[tuple[str, str, int]]:
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        edges: list[tuple[str, str, int]] = []
        for row in reader:
            edges.append(
                (
                    row["source_dsa_id"].strip(),
                    row["destination_center_id"].strip(),
                    int(row["flow_count"]),
                )
            )
    return edges


def write_edges(path: Path, edges: list[tuple[str, str, int]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(EDGE_FIELDNAMES)
        writer.writerows(edges)


def write_summary(
    path: Path,
    fieldnames: tuple[str, str],
    rows: list[tuple[str, int]],
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(fieldnames)
        writer.writerows(rows)


def aggregate_outflow(edges: list[tuple[str, str, int]]) -> list[tuple[str, int]]:
    totals: dict[str, int] = defaultdict(int)
    for source, _, flow in edges:
        totals[source] += flow
    return sorted(totals.items(), key=lambda item: item[1], reverse=True)


def aggregate_inflow(edges: list[tuple[str, str, int]]) -> list[tuple[str, int]]:
    totals: dict[str, int] = defaultdict(int)
    for _, destination, flow in edges:
        totals[destination] += flow
    return sorted(totals.items(), key=lambda item: item[1], reverse=True)


def print_top_entities(
    title: str,
    id_label: str,
    total_label: str,
    rows: list[tuple[str, int]],
    limit: int = 20,
) -> None:
    print(f"\n{title}")
    print(f"{id_label:<22} {total_label:>12}")
    for entity_id, total in rows[:limit]:
        print(f"{entity_id:<22} {total:>12,}")


def main() -> None:
    if not INPUT_CSV.exists():
        raise SystemExit(f"Input not found: {INPUT_CSV}")

    edges = read_edges(INPUT_CSV)
    edges_by_flow = sorted(edges, key=lambda e: e[2], reverse=True)

    for n, path in TOP_EDGE_FILES:
        write_edges(path, edges_by_flow[:n])
        print(f"Wrote {path.relative_to(BASE)} ({n} edges)")

    source_summary = aggregate_outflow(edges)
    destination_summary = aggregate_inflow(edges)

    write_summary(
        SOURCE_SUMMARY_CSV,
        ("source_dsa_id", "total_outflow"),
        source_summary,
    )
    write_summary(
        DESTINATION_SUMMARY_CSV,
        ("destination_center_id", "total_inflow"),
        destination_summary,
    )

    print(f"Wrote {SOURCE_SUMMARY_CSV.relative_to(BASE)} ({len(source_summary)} sources)")
    print(f"Wrote {DESTINATION_SUMMARY_CSV.relative_to(BASE)} ({len(destination_summary)} destinations)")

    print_top_entities(
        "Top 20 sources by total_outflow",
        "source_dsa_id",
        "total_outflow",
        source_summary,
    )
    print_top_entities(
        "Top 20 destinations by total_inflow",
        "destination_center_id",
        "total_inflow",
        destination_summary,
    )


if __name__ == "__main__":
    main()
