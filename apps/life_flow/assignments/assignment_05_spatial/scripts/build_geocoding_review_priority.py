"""
Build manual_geocoding/geocoding_review_priority.csv — prioritized editable queue for Assignment 5.

Reads:
  - data/processed/missing_destination_nodes_by_flow.csv (reference + coverage check)
  - data/processed/missing_source_nodes_by_flow.csv
  - manual_geocoding/all_nodes_geocoded.csv (source of truth for attributes / status)

Writes:
  - manual_geocoding/geocoding_review_priority.csv

Rows included: blank lat/lon, coordinate_status=missing, or batch/notes flagged needs_review —
excluding nodes already manual / manual_verified or with manual_map in notes (verified edits).

Preserves non-empty manual_*, review_notes from an existing geocoding_review_priority.csv when re-run.
"""

from __future__ import annotations

from pathlib import Path

from geocode_utils import BASE, MANUAL_DIR, PROCESSED, has_coordinates, read_csv_dicts, write_csv_dicts

MISSING_DEST = PROCESSED / "missing_destination_nodes_by_flow.csv"
MISSING_SRC = PROCESSED / "missing_source_nodes_by_flow.csv"
GEO_MANUAL_CSV = MANUAL_DIR / "all_nodes_geocoded.csv"
REVIEW_PRIORITY_CSV = MANUAL_DIR / "geocoding_review_priority.csv"

OUTPUT_FIELDS = (
    "id",
    "type",
    "name",
    "state",
    "region",
    "flow_total",
    "current_lat",
    "current_lon",
    "coordinate_status",
    "suggested_search",
    "manual_city",
    "manual_state",
    "manual_lat",
    "manual_lon",
    "review_notes",
)


def blank(value: str | None) -> bool:
    return value is None or not str(value).strip()


def is_verified_or_manual_coordinates(row: dict[str, str]) -> bool:
    """Do not queue rows that represent finished manual work."""
    status = (row.get("coordinate_status") or "").strip().lower()
    notes = (row.get("notes") or "").lower()

    if status in {"manual", "manual_verified"}:
        return True
    if "manual_map" in notes:
        return True
    return False


def is_missing_coordinates(row: dict[str, str]) -> bool:
    lat, lon = row.get("lat", ""), row.get("lon", "")
    if not has_coordinates(str(lat), str(lon)):
        return True
    if (row.get("coordinate_status") or "").strip() == "missing":
        return True
    return False


def needs_review_mark(row: dict[str, str]) -> bool:
    """Spot-check queue: batch hit not yet acknowledged with manual_map in notes."""
    notes = row.get("notes") or ""
    notes_l = notes.lower()

    if (row.get("coordinate_status") or "").strip().lower() == "needs_review":
        return True

    if "needs_review" in notes_l:
        return True
    if "nominatim_batch;review" in notes and "manual_map" not in notes_l:
        return True
    return False


def should_include_review_row(row: dict[str, str]) -> bool:
    if is_verified_or_manual_coordinates(row):
        return False
    return is_missing_coordinates(row) or needs_review_mark(row)


def transplant_suffix(type_field: str) -> str:
    t = (type_field or "").strip().lower()
    if t == "transplant_center":
        return "transplant center"
    return "organ procurement organization"


def build_suggested_search(name: str, state: str, type_field: str) -> str:
    return f"{name.strip()}, {state.strip()}, {transplant_suffix(type_field)}"


def load_missing_id_sets() -> tuple[set[str], set[str], dict[str, int]]:
    dest_ids: set[str] = set()
    src_ids: set[str] = set()
    flows: dict[str, int] = {}
    for path, bucket in (
        (MISSING_DEST, dest_ids),
        (MISSING_SRC, src_ids),
    ):
        if not path.exists():
            raise SystemExit(f"Missing expected file: {path}")
        for r in read_csv_dicts(path):
            nid = r.get("id", "").strip()
            if not nid:
                continue
            bucket.add(nid)
            flows[nid] = max(flows.get(nid, 0), int(float(r.get("total_flow") or "0")))
    return dest_ids, src_ids, flows


def preserved_manual_by_id(path: Path) -> dict[str, dict[str, str]]:
    if not path.exists():
        return {}
    out: dict[str, dict[str, str]] = {}
    for r in read_csv_dicts(path):
        nid = r.get("id", "").strip()
        if not nid:
            continue
        out[nid] = {
            k: str(r.get(k, "") or "") for k in ("manual_city", "manual_state", "manual_lat", "manual_lon", "review_notes")
        }
    return out


def main() -> None:
    if not GEO_MANUAL_CSV.exists():
        raise SystemExit(f"Missing {GEO_MANUAL_CSV}")

    dest_missing_ids, src_missing_ids, flows_from_missing_reports = load_missing_id_sets()
    preserved = preserved_manual_by_id(REVIEW_PRIORITY_CSV)

    rows_geo = read_csv_dicts(GEO_MANUAL_CSV)
    geo_by_id: dict[str, dict[str, str]] = {r["id"].strip(): r for r in rows_geo}

    queued: list[dict[str, str]] = []

    for row in rows_geo:
        if not should_include_review_row(row):
            continue
        nid = row["id"].strip()

        sug = build_suggested_search(row.get("name", ""), row.get("state", ""), row.get("type", ""))
        merged = preserved.get(nid, {})
        queued.append(
            {
                "id": nid,
                "type": row.get("type", ""),
                "name": row.get("name", ""),
                "state": row.get("state", ""),
                "region": row.get("region", ""),
                "flow_total": str(int(float(row.get("total_flow") or "0"))),
                "current_lat": row.get("lat", "") or "",
                "current_lon": row.get("lon", "") or "",
                "coordinate_status": row.get("coordinate_status", ""),
                "suggested_search": sug,
                "manual_city": merged.get("manual_city", ""),
                "manual_state": merged.get("manual_state", ""),
                "manual_lat": merged.get("manual_lat", ""),
                "manual_lon": merged.get("manual_lon", ""),
                "review_notes": merged.get("review_notes", ""),
            }
        )

    def flow_key(rec: dict[str, str]) -> int:
        return int(float(rec.get("flow_total") or "0"))

    queued.sort(key=flow_key, reverse=True)

    write_csv_dicts(REVIEW_PRIORITY_CSV, queued, OUTPUT_FIELDS)

    # Diagnostics — missing_reports vs workbook
    all_geocoded_ids = set(geo_by_id.keys())
    workbook_set = dest_missing_ids | src_missing_ids
    orphaned_workbook = workbook_set - all_geocoded_ids
    workbook_not_queued = [
        nid for nid in workbook_set if nid in geo_by_id and not should_include_review_row(geo_by_id[nid])
    ]

    def sum_flow(first_n: int) -> tuple[int, int]:
        top = queued[:first_n]
        return len(top), sum(int(r["flow_total"]) for r in top)

    total_flow_all = sum(int(r["flow_total"]) for r in queued)

    print("Assignment 5 — geocoding review priority")
    print(f"  Wrote {REVIEW_PRIORITY_CSV.relative_to(BASE)}")
    print()
    print(f"  Total rows needing review: {len(queued)}")
    total_flow_sheet = flows_from_missing_reports and sum(flows_from_missing_reports.values())
    print(
        "  workbook missing_* row count (destination + source rows, IDs may overlap): "
        f"{len(dest_missing_ids) + len(src_missing_ids)}  | unique IDs: {len(workbook_set)}"
    )
    if total_flow_sheet:
        print(f"  sum(total_flow) in missing_* CSV rows (duplicate IDs max-merged): {total_flow_sheet}")
    print(f"  sum(flow_total) in review queue from all_nodes_geocoded.csv: {total_flow_all}")
    print()

    n25, cum25 = sum_flow(25)
    n50, cum50 = sum_flow(50)
    n100, cum100 = sum_flow(100)
    total_n = len(queued)
    print("  Estimated flow represented by highest-impact missing / needs-review rows:")
    print(f"    top {min(25, total_n)} of queue: cumulative flow_total = {cum25}")
    print(f"    top {min(50, total_n)} of queue: cumulative flow_total = {cum50}")
    print(f"    top {min(100, total_n)} of queue: cumulative flow_total = {cum100}")
    print()

    print("  Top 25 by flow impact (review queue)")
    display_n = min(25, len(queued))
    for i, rec in enumerate(queued[:display_n], 1):
        print(
            f"    {i:>2}.  {rec['id']:<12} flow={rec['flow_total']:>6}  "
            f"type={rec['type']:<18}  "
            f"{(rec['name'][:54] + '…') if len(rec['name']) > 54 else rec['name']}"
        )

    if orphaned_workbook:
        print()
        print(f"  WARNING: IDs in missing_* files but absent from workbook: {len(orphaned_workbook)}")
    if workbook_not_queued:
        print()
        print(
            "  NOTE: IDs in processed missing_* files but excluded from queue (manual/verified/coords OK):\n       "
            + ", ".join(sorted(workbook_not_queued)[:20])
            + (" …" if len(workbook_not_queued) > 20 else "")
        )


if __name__ == "__main__":
    main()
