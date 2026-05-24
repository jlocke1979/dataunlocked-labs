"""
Summarize geocoding progress and list all rows that still need real coordinates.

Reads: data/reference/manual_geocoding/all_nodes_geocoded.csv
Writes: data/reference/manual_geocoding/still_needs_work.csv  (full queue for manual map / retry)
"""

from __future__ import annotations

from collections import Counter
from pathlib import Path

from geocode_utils import BASE, MANUAL_DIR, read_csv_dicts, write_csv_dicts

MANUAL_CSV = MANUAL_DIR / "all_nodes_geocoded.csv"
STILL_NEEDS_CSV = MANUAL_DIR / "still_needs_work.csv"
NEEDS_REVIEW_CSV = MANUAL_DIR / "needs_spot_check.csv"

OUTPUT_FIELDS = (
    "id",
    "type",
    "name",
    "state",
    "total_flow",
    "lat",
    "lon",
    "coordinate_status",
    "geocode_priority",
    "why_still_needs_work",
    "geocode_query",
)


def blank(value: str) -> bool:
    return not str(value).strip()


def why_needs_work(row: dict[str, str]) -> str | None:
    status = row.get("coordinate_status", "")
    notes = row.get("notes", "")

    if blank(row.get("lat", "")) or blank(row.get("lon", "")):
        return "blank_lat_lon"
    if status == "state_centroid":
        return "state_centroid_placeholder"
    if status == "missing":
        return "marked_missing"
    if "nominatim_batch;review" in notes and "manual_map" not in notes:
        return "batch_hit_needs_spot_check"
    return None


def main() -> None:
    if not MANUAL_CSV.exists():
        raise SystemExit(f"Missing {MANUAL_CSV}")

    rows = read_csv_dicts(MANUAL_CSV)
    by_status = Counter(r.get("coordinate_status", "") for r in rows)
    blank_count = sum(1 for r in rows if blank(r.get("lat", "")) or blank(r.get("lon", "")))

    still_needs: list[dict[str, str]] = []
    needs_review: list[dict[str, str]] = []
    for row in rows:
        reason = why_needs_work(row)
        if reason is None:
            continue
        entry = (
            {
                "id": row["id"],
                "type": row.get("type", ""),
                "name": row.get("name", ""),
                "state": row.get("state", ""),
                "total_flow": row.get("total_flow", ""),
                "lat": row.get("lat", ""),
                "lon": row.get("lon", ""),
                "coordinate_status": row.get("coordinate_status", ""),
                "geocode_priority": row.get("geocode_priority", ""),
                "why_still_needs_work": reason,
                "geocode_query": row.get("geocode_query", ""),
            }
        )
        if reason == "batch_hit_needs_spot_check":
            needs_review.append(entry)
        else:
            still_needs.append(entry)

    sort_key = lambda r: (
        0 if r["why_still_needs_work"] == "blank_lat_lon" else 1,
        int(r.get("geocode_priority", "99") or 99),
        -int(r.get("total_flow", "0") or 0),
    )
    still_needs.sort(key=sort_key)
    needs_review.sort(key=sort_key)
    write_csv_dicts(STILL_NEEDS_CSV, still_needs, OUTPUT_FIELDS)
    write_csv_dicts(NEEDS_REVIEW_CSV, needs_review, OUTPUT_FIELDS)

    real_coords = sum(
        1
        for r in rows
        if not blank(r.get("lat", ""))
        and r.get("coordinate_status")
        in ("facility_or_city", "manual_verified", "city_approx")
    )

    print("Geocoding status — data/reference/manual_geocoding/all_nodes_geocoded.csv")
    print(f"  Total nodes: {len(rows)}")
    print()
    print("  By coordinate_status (column L):")
    for status, n in by_status.most_common():
        print(f"    {status:22} {n:>4}")
    print()
    print(f"  Blank lat or lon: {blank_count}")
    print(f"  state_centroid (lat/lon present but state center only): {by_status.get('state_centroid', 0)}")
    print(f"  Rows with real/batch coords (facility_or_city, city_approx, etc.): {real_coords}")
    print()
    print("  Why this is NOT a conflict:")
    print("    • geocode_failures.csv = only the LAST batch run that got 'no OSM match'")
    print("    • blank lat/lon rows may never have been in that run")
    print("    • state_centroid rows HAVE lat/lon — they are not empty, but wrong for mapping")
    print()
    print(f"  Must fix (no real coords): {len(still_needs)}  → still_needs_work.csv")
    by_why = Counter(r["why_still_needs_work"] for r in still_needs)
    for why, n in by_why.most_common():
        print(f"    {why:30} {n:>4}")
    print(f"  Batch OK but verify on map: {len(needs_review)}  → needs_spot_check.csv")
    print()
    print(f"  Wrote {STILL_NEEDS_CSV.relative_to(BASE)}")
    print(f"  Wrote {NEEDS_REVIEW_CSV.relative_to(BASE)}")


if __name__ == "__main__":
    main()
