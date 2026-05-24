"""
Apply completed manual geocoding workbook to production node coordinate file.

Input:
  data/reference/manual_geocoding/all_nodes_geocoded.csv

Output:
  data/processed/all_nodes_with_coordinates.csv
  data/processed/node_coordinate_quality_report.csv  (regenerated summary)

Run after editing lat/lon in the manual workbook:
  python3 scripts/apply_manual_geocoding.py
"""

from __future__ import annotations

from collections import defaultdict
from pathlib import Path

from geocode_utils import (
    BASE,
    MANUAL_DIR,
    NODE_FIELDS,
    PROCESSED,
    classify_coordinates,
    has_coordinates,
    read_csv_dicts,
    write_csv_dicts,
)

MANUAL_WORK_CSV = MANUAL_DIR / "all_nodes_geocoded.csv"
OUTPUT_CSV = PROCESSED / "all_nodes_with_coordinates.csv"
QUALITY_REPORT_CSV = PROCESSED / "node_coordinate_quality_report.csv"

# Slim schema for D3 / downstream scripts
OUTPUT_FIELDS = ("id", "type", "name", "state", "region", "lat", "lon", "notes")


def main() -> None:
    if not MANUAL_WORK_CSV.exists():
        raise SystemExit(
            f"Manual workbook not found: {MANUAL_WORK_CSV}\n"
            "Run: python3 scripts/build_all_nodes_for_geocoding.py"
        )

    rows = read_csv_dicts(MANUAL_WORK_CSV)
    out_rows: list[dict[str, str]] = []
    by_status: dict[str, int] = defaultdict(int)
    missing_coords: list[str] = []

    for row in rows:
        node_id = row["id"].strip()
        lat = row.get("lat", "").strip()
        lon = row.get("lon", "").strip()
        notes = row.get("notes", "").strip()
        state = row.get("state", "").strip()

        status = classify_coordinates(lat, lon, state, notes)
        by_status[status] += 1

        if not has_coordinates(lat, lon):
            missing_coords.append(node_id)

        out_rows.append(
            {
                "id": node_id,
                "type": row.get("type", ""),
                "name": row.get("name", ""),
                "state": state,
                "region": row.get("region", ""),
                "lat": lat,
                "lon": lon,
                "notes": notes,
            }
        )

    write_csv_dicts(OUTPUT_CSV, out_rows, OUTPUT_FIELDS)

    report_rows = [
        {
            "id": r["id"],
            "type": r["type"],
            "name": r["name"],
            "state": r["state"],
            "lat": r["lat"],
            "lon": r["lon"],
            "coordinate_quality": classify_coordinates(
                r["lat"], r["lon"], r["state"], r["notes"]
            ),
            "notes": r["notes"],
        }
        for r in out_rows
    ]
    write_csv_dicts(
        QUALITY_REPORT_CSV,
        report_rows,
        ("id", "type", "name", "state", "lat", "lon", "coordinate_quality", "notes"),
    )

    total = len(rows)
    ready = sum(1 for r in out_rows if has_coordinates(r["lat"], r["lon"]))

    print(f"Wrote {OUTPUT_CSV.relative_to(BASE)} ({total} nodes)")
    print(f"Nodes with lat/lon: {ready} ({ready / total * 100:.1f}%)")
    print("\nBy coordinate quality:")
    for status, n in sorted(by_status.items(), key=lambda x: -x[1]):
        print(f"  {status:18} {n:>4}")

    if missing_coords:
        print(f"\nStill missing coordinates: {len(missing_coords)}")
        print(f"  First 10: {', '.join(missing_coords[:10])}")
    else:
        print("\nAll nodes have coordinates.")

    facility = by_status.get("manual_verified", 0) + by_status.get("facility_or_city", 0)
    print(f"\nFacility-level or verified: {facility} ({facility / total * 100:.1f}%)")


if __name__ == "__main__":
    main()
