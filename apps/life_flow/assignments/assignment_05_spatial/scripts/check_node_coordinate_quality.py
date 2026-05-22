"""
Classify node coordinates: city-level approximations vs state centroids vs missing.

Input:
  data/processed/top50_all_nodes_partial_real_coordinates.csv

Compares each node's lat/lon to US state centroids (same table as add_state_centroid_coordinates.py).
"""

from __future__ import annotations

import csv
from collections import defaultdict
from pathlib import Path

from add_state_centroid_coordinates import STATE_CENTROIDS

BASE = Path(__file__).resolve().parents[1]
PROCESSED = BASE / "data/processed"
NODES_CSV = PROCESSED / "top50_all_nodes_partial_real_coordinates.csv"
REPORT_CSV = PROCESSED / "node_coordinate_quality_report.csv"

COORD_TOLERANCE = 0.0001  # degrees; match formatted 4-decimal centroids


def has_coordinates(lat: str, lon: str) -> bool:
    try:
        float(lat)
        float(lon)
        return bool(str(lat).strip() and str(lon).strip())
    except (TypeError, ValueError):
        return False


def matches_centroid(lat: float, lon: float, state: str) -> bool:
    centroid = STATE_CENTROIDS.get(state.strip())
    if centroid is None:
        return False
    clat, clon = centroid
    return abs(lat - clat) <= COORD_TOLERANCE and abs(lon - clon) <= COORD_TOLERANCE


def classify_row(row: dict[str, str]) -> str:
    notes = row.get("notes", "").strip()
    if "city_approx:" in notes:
        return "city_approx"

    lat_s = row.get("lat", "")
    lon_s = row.get("lon", "")
    if not has_coordinates(lat_s, lon_s):
        return "missing"

    lat = float(lat_s)
    lon = float(lon_s)
    state = row.get("state", "").strip()

    if matches_centroid(lat, lon, state):
        return "state_centroid"

    return "unique_coordinates"


def main() -> None:
    if not NODES_CSV.exists():
        raise SystemExit(f"Missing input: {NODES_CSV}")

    with open(NODES_CSV, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    by_type: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    by_class: dict[str, int] = defaultdict(int)
    coord_clusters: dict[tuple[str, str], list[str]] = defaultdict(list)
    report_rows: list[dict[str, str]] = []

    for row in rows:
        node_type = row.get("type", "unknown")
        quality = classify_row(row)
        by_type[node_type][quality] += 1
        by_class[quality] += 1

        lat = row.get("lat", "").strip()
        lon = row.get("lon", "").strip()
        if lat and lon:
            coord_clusters[(lat, lon)].append(row["id"].strip())

        report_rows.append(
            {
                "id": row["id"].strip(),
                "type": node_type,
                "name": row.get("name", ""),
                "state": row.get("state", ""),
                "lat": lat,
                "lon": lon,
                "coordinate_quality": quality,
                "notes": row.get("notes", ""),
            }
        )

    total = len(rows)
    sources = [r for r in rows if r.get("type") == "source_dsa"]
    destinations = [r for r in rows if r.get("type") == "transplant_center"]

    print("Node coordinate quality report")
    print(f"  file: {NODES_CSV.name}")
    print(f"  total nodes: {total}")
    print()
    print("By coordinate quality (all nodes):")
    for quality in (
        "city_approx",
        "unique_coordinates",
        "state_centroid",
        "missing",
    ):
        n = by_class.get(quality, 0)
        pct = (n / total * 100) if total else 0
        print(f"  {quality:20} {n:>3}  ({pct:5.1f}%)")

    print()
    print("Donor recovery / OPO (source_dsa):")
    for quality, n in sorted(by_type["source_dsa"].items()):
        print(f"  {quality:20} {n:>3}")

    print()
    print("Transplant centers:")
    for quality, n in sorted(by_type["transplant_center"].items()):
        print(f"  {quality:20} {n:>3}")

    multi = {k: v for k, v in coord_clusters.items() if len(v) > 1}
    print()
    print(f"Coordinate clusters (same lat/lon, >1 node): {len(multi)} locations")
    print(f"  nodes sharing a point: {sum(len(v) for v in multi.values())}")
    for (lat, lon), ids in sorted(multi.items(), key=lambda x: -len(x[1]))[:8]:
        print(f"    ({lat}, {lon}) -> {len(ids)} nodes: {', '.join(ids[:5])}{'...' if len(ids) > 5 else ''}")

    centroid_only = [r for r in report_rows if r["coordinate_quality"] == "state_centroid"]
    if centroid_only:
        print()
        print("Examples still on state centroid (not facility-level):")
        for r in centroid_only[:12]:
            print(f"    {r['id']}  {r['name']}  ({r['state']})")
        if len(centroid_only) > 12:
            print(f"    ... and {len(centroid_only) - 12} more")

    print()
    print("Scope note:")
    print("  This file lists nodes tied to top-50 flows only (~74 nodes), not every")
    print("  DSA/transplant center in the full OPTN edge list (~55 sources, ~246 destinations).")

    fieldnames = list(report_rows[0].keys()) if report_rows else []
    with open(REPORT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(report_rows)
    print()
    print(f"Wrote {REPORT_CSV.relative_to(BASE)}")


if __name__ == "__main__":
    main()
