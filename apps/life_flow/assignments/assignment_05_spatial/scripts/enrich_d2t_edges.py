"""
Enrich D2T edge lists with DSA and transplant center geography lookups.
"""

from __future__ import annotations

import csv
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
PROCESSED = BASE / "data/processed"

EDGES_ALL = PROCESSED / "d2t_edges_all_organs.csv"
EDGES_TOP50 = PROCESSED / "top_50_edges_all_organs.csv"
DSA_LOOKUP = PROCESSED / "dsa_state_region_lookup.csv"
CENTER_LOOKUP = PROCESSED / "center_state_region_lookup.csv"

OUTPUT_ALL = PROCESSED / "d2t_edges_all_organs_enriched.csv"
OUTPUT_TOP50 = PROCESSED / "top50_edges_all_organs_enriched.csv"

ENRICHED_FIELDS = (
    "source_dsa_id",
    "source_dsa_name",
    "source_state",
    "source_region",
    "destination_center_id",
    "destination_center_name",
    "destination_state",
    "destination_region",
    "flow_count",
)


def read_dsa_lookup(path: Path) -> dict[str, tuple[str, str, str]]:
    with open(path, newline="", encoding="utf-8") as f:
        return {
            row["dsa_id"].strip(): (
                row["dsa_name"].strip(),
                row["state"].strip(),
                row["region"].strip(),
            )
            for row in csv.DictReader(f)
        }


def read_center_lookup(path: Path) -> dict[str, tuple[str, str, str]]:
    with open(path, newline="", encoding="utf-8") as f:
        return {
            row["center_id"].strip(): (
                row["center_name"].strip(),
                row["state"].strip(),
                row["region"].strip(),
            )
            for row in csv.DictReader(f)
        }


def read_edges(path: Path) -> list[tuple[str, str, int]]:
    with open(path, newline="", encoding="utf-8") as f:
        return [
            (
                row["source_dsa_id"].strip(),
                row["destination_center_id"].strip(),
                int(row["flow_count"]),
            )
            for row in csv.DictReader(f)
        ]


def enrich_edges(
    edges: list[tuple[str, str, int]],
    dsa_lookup: dict[str, tuple[str, str, str]],
    center_lookup: dict[str, tuple[str, str, str]],
) -> tuple[list[tuple], set[str], set[str]]:
    enriched: list[tuple] = []
    unmatched_sources: set[str] = set()
    unmatched_destinations: set[str] = set()

    for source_id, dest_id, flow in edges:
        dsa = dsa_lookup.get(source_id)
        center = center_lookup.get(dest_id)

        if dsa is None:
            unmatched_sources.add(source_id)
            dsa_name, source_state, source_region = "", "", ""
        else:
            dsa_name, source_state, source_region = dsa

        if center is None:
            unmatched_destinations.add(dest_id)
            center_name, dest_state, dest_region = "", "", ""
        else:
            center_name, dest_state, dest_region = center

        enriched.append(
            (
                source_id,
                dsa_name,
                source_state,
                source_region,
                dest_id,
                center_name,
                dest_state,
                dest_region,
                flow,
            )
        )

    return enriched, unmatched_sources, unmatched_destinations


def write_enriched(path: Path, rows: list[tuple]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(ENRICHED_FIELDS)
        writer.writerows(rows)


def print_top_edges(rows: list[tuple], limit: int = 20) -> None:
    ranked = sorted(rows, key=lambda r: r[8], reverse=True)[:limit]
    print(f"\nTop {limit} enriched edges by flow_count:")
    print(
        f"{'source':<12} {'dest':<12} {'flow':>6}  "
        f"{'src_state':<18} {'dst_state':<18}"
    )
    for row in ranked:
        source_id, _, src_state, _, dest_id, _, dest_state, _, flow = row
        print(
            f"{source_id:<12} {dest_id:<12} {flow:>6}  "
            f"{src_state:<18} {dest_state:<18}"
        )


def process_file(
    input_path: Path,
    output_path: Path,
    dsa_lookup: dict[str, tuple[str, str, str]],
    center_lookup: dict[str, tuple[str, str, str]],
    label: str,
) -> list[tuple]:
    edges = read_edges(input_path)
    enriched, unmatched_src, unmatched_dst = enrich_edges(
        edges, dsa_lookup, center_lookup
    )
    write_enriched(output_path, enriched)

    print(f"\n{label}")
    print(f"  Input:  {input_path.relative_to(BASE)} ({len(edges)} edges)")
    print(f"  Output: {output_path.relative_to(BASE)}")
    print(f"  Total enriched edges: {len(enriched)}")
    print(f"  Unmatched source IDs: {len(unmatched_src)}")
    if unmatched_src:
        print(f"    {', '.join(sorted(unmatched_src))}")
    print(f"  Unmatched destination IDs: {len(unmatched_dst)}")
    if unmatched_dst:
        sample = sorted(unmatched_dst)
        shown = ", ".join(sample[:15])
        extra = f" ... (+{len(sample) - 15} more)" if len(sample) > 15 else ""
        print(f"    {shown}{extra}")

    return enriched


def main() -> None:
    for path in (EDGES_ALL, EDGES_TOP50, DSA_LOOKUP, CENTER_LOOKUP):
        if not path.exists():
            raise SystemExit(f"Missing input: {path}")

    dsa_lookup = read_dsa_lookup(DSA_LOOKUP)
    center_lookup = read_center_lookup(CENTER_LOOKUP)

    all_enriched = process_file(
        EDGES_ALL, OUTPUT_ALL, dsa_lookup, center_lookup, "All organs"
    )
    process_file(EDGES_TOP50, OUTPUT_TOP50, dsa_lookup, center_lookup, "Top 50")

    print_top_edges(all_enriched)


if __name__ == "__main__":
    main()
