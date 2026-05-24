"""
Batch geocode nodes via OpenStreetMap Nominatim (free, no API key).

Fills lat/lon in data/reference/manual_geocoding/all_nodes_geocoded.csv for rows that still
need coordinates. Results should be spot-checked (especially hospitals).

Policy: max 1 request/second — ~3–4 minutes for 200 nodes.

Usage (from assignment_05_spatial/):
  python3 scripts/batch_geocode_nominatim.py --dry-run --limit 5
  python3 scripts/batch_geocode_nominatim.py --max-priority 2
  python3 scripts/batch_geocode_nominatim.py

Then:
  python3 scripts/apply_manual_geocoding.py
  python3 scripts/check_coordinate_coverage.py
"""

from __future__ import annotations

import argparse
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from geocode_utils import (
    BASE,
    MANUAL_DIR,
    NODE_FIELDS,
    build_geocode_query,
    classify_coordinates,
    read_csv_dicts,
    write_csv_dicts,
)

MANUAL_WORK_CSV = MANUAL_DIR / "all_nodes_geocoded.csv"
CACHE_JSON = MANUAL_DIR / ".nominatim_geocode_cache.json"
FAILURES_CSV = MANUAL_DIR / "geocode_failures.csv"

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "dataunlocked-labs-assignment05-geocode/1.0 (contact: assignment05-spatial@local)"
REQUEST_DELAY_SEC = 1.1


def load_cache() -> dict[str, dict]:
    if not CACHE_JSON.exists():
        return {}
    with open(CACHE_JSON, encoding="utf-8") as f:
        return json.load(f)


def save_cache(cache: dict[str, dict]) -> None:
    CACHE_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(CACHE_JSON, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2)


def query_variants(row: dict[str, str]) -> list[str]:
    """Ordered search strings — simple name+state works best in Nominatim."""
    name = row.get("name", "").strip()
    state = row.get("state", "").strip()
    raw = row.get("geocode_query", "").strip()

    variants: list[str] = []
    if name and state:
        variants.append(build_geocode_query(name, state, row.get("type", "")))
    if raw:
        # Strip legacy parenthetical suffixes from older workbooks
        cleaned = re.sub(r"\s*\([^)]*\)\s*$", "", raw).strip()
        if cleaned and cleaned not in variants:
            variants.append(cleaned)
        if cleaned and not cleaned.endswith("USA"):
            variants.append(f"{cleaned}, USA")
    if name:
        variants.append(f"{name}, USA")

    seen: set[str] = set()
    out: list[str] = []
    for q in variants:
        if q and q not in seen:
            seen.add(q)
            out.append(q)
    return out


def nominatim_search(query: str) -> dict | None:
    params = urllib.parse.urlencode(
        {
            "q": query,
            "format": "json",
            "limit": 1,
            "countrycodes": "us",
        }
    )
    url = f"{NOMINATIM_URL}?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    if not data:
        return None
    hit = data[0]
    return {
        "lat": f"{float(hit['lat']):.4f}",
        "lon": f"{float(hit['lon']):.4f}",
        "display_name": hit.get("display_name", ""),
        "class": hit.get("class", ""),
        "type": hit.get("type", ""),
        "matched_query": query,
    }


def search_with_fallbacks(row: dict[str, str]) -> tuple[dict | None, str | None, str | None]:
    """Try simpler queries until one matches. Returns (result, winning_query, error)."""
    last_error: str | None = None
    for query in query_variants(row):
        try:
            result = nominatim_search(query)
            time.sleep(REQUEST_DELAY_SEC)
        except urllib.error.HTTPError as exc:
            last_error = f"HTTP {exc.code}"
            time.sleep(REQUEST_DELAY_SEC)
            if exc.code == 403:
                return None, None, "blocked (403) — wait a minute and retry"
            continue
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            last_error = str(exc)
            time.sleep(REQUEST_DELAY_SEC)
            continue
        if result is not None:
            return result, query, None
    return None, None, last_error


def should_geocode(row: dict[str, str], statuses: set[str], max_priority: int | None) -> bool:
    if row.get("coordinate_status", "") not in statuses:
        return False
    if max_priority is not None and int(row.get("geocode_priority", "99")) > max_priority:
        return False
    return True


def append_note(existing: str, tag: str) -> str:
    existing = existing.strip()
    if not existing:
        return tag
    if tag in existing:
        return existing
    return f"{existing};{tag}"


def main() -> None:
    parser = argparse.ArgumentParser(description="Batch geocode via OSM Nominatim")
    parser.add_argument(
        "--status",
        default="missing,state_centroid",
        help="Comma-separated coordinate_status values to fill (default: missing,state_centroid)",
    )
    parser.add_argument(
        "--max-priority",
        type=int,
        default=None,
        help="Only geocode rows with geocode_priority <= N (e.g. 2 for urgent)",
    )
    parser.add_argument("--limit", type=int, default=None, help="Max rows to geocode this run")
    parser.add_argument("--dry-run", action="store_true", help="Print queries only; no API/file writes")
    parser.add_argument("--force", action="store_true", help="Re-geocode even if cache has this id")
    parser.add_argument(
        "--node-type",
        choices=("all", "source_dsa", "transplant_center"),
        default="all",
        help="Only geocode this node type (transplant centers match OSM more often)",
    )
    args = parser.parse_args()

    if not MANUAL_WORK_CSV.exists():
        raise SystemExit(
            f"Missing {MANUAL_WORK_CSV}. Run: python3 scripts/build_all_nodes_for_geocoding.py"
        )

    statuses = {s.strip() for s in args.status.split(",") if s.strip()}
    rows = read_csv_dicts(MANUAL_WORK_CSV)
    cache = load_cache()

    targets = [r for r in rows if should_geocode(r, statuses, args.max_priority)]
    if args.node_type != "all":
        targets = [r for r in targets if r.get("type") == args.node_type]
    if args.limit is not None:
        targets = targets[: args.limit]

    print(f"Manual workbook: {MANUAL_WORK_CSV.resolve()}")
    print(f"Rows to geocode: {len(targets)} (status in {statuses})")
    if args.max_priority is not None:
        print(f"  max geocode_priority: {args.max_priority}")

    if args.dry_run:
        print("DRY RUN — no API calls")
        for row in targets[:10]:
            print(f"  {row['id']}: {query_variants(row)}")
        if len(targets) > 10:
            print(f"  ... and {len(targets) - 10} more")
        est_min = len(targets) * REQUEST_DELAY_SEC / 60
        print(f"Estimated runtime if run: ~{est_min:.1f} min ({REQUEST_DELAY_SEC}s/request)")
        return

    updated = 0
    failed_rows: list[dict[str, str]] = []
    skipped_cache = 0

    for i, row in enumerate(targets, start=1):
        node_id = row["id"]

        if not args.force and node_id in cache:
            hit = cache[node_id]
            if hit.get("ok"):
                row["lat"] = hit["lat"]
                row["lon"] = hit["lon"]
                row["notes"] = append_note(row.get("notes", ""), "nominatim_batch;review")
                row["coordinate_status"] = classify_coordinates(
                    row["lat"], row["lon"], row["state"], row["notes"]
                )
                updated += 1
                skipped_cache += 1
                continue

        print(f"[{i}/{len(targets)}] {node_id} …", end=" ", flush=True)
        result, winning_query, err = search_with_fallbacks(row)

        if err:
            print(err)
            cache[node_id] = {"ok": False, "error": err}
            failed_rows.append(
                {"id": node_id, "name": row["name"], "state": row["state"], "reason": err}
            )
            continue

        if result is None:
            print("no result")
            cache[node_id] = {"ok": False, "queries": query_variants(row)}
            failed_rows.append(
                {
                    "id": node_id,
                    "name": row["name"],
                    "state": row["state"],
                    "reason": "no OSM match",
                }
            )
            continue

        row["lat"] = result["lat"]
        row["lon"] = result["lon"]
        row["notes"] = append_note(row.get("notes", ""), "nominatim_batch;review")
        row["coordinate_status"] = classify_coordinates(
            row["lat"], row["lon"], row["state"], row["notes"]
        )
        cache[node_id] = {"ok": True, **result}
        print(f"ok ({winning_query}) → {result['lat']}, {result['lon']}")
        updated += 1

    if updated:
        write_csv_dicts(MANUAL_WORK_CSV, rows, NODE_FIELDS)
        save_cache(cache)
        print(f"\nSaved {updated} rows to {MANUAL_WORK_CSV.name}")
    else:
        print(
            "\nNo rows updated — CSV unchanged. "
            "Common causes: all lookups failed, --dry-run only, or wrong working directory."
        )

    if failed_rows:
        write_csv_dicts(
            FAILURES_CSV,
            failed_rows,
            ("id", "name", "state", "reason"),
        )
        print(f"Wrote failures list: {FAILURES_CSV.relative_to(BASE)}")

    print(f"Updated coordinates: {updated} ({skipped_cache} from cache)")
    print(f"Failed / no match: {len(failed_rows)}")
    if updated == 0 and not args.dry_run:
        print("\nTry: python3 scripts/batch_geocode_nominatim.py --limit 5")
        print("Watch for 'ok' lines. If all 'no result', use geocode_failures.csv for manual map.")
    elif updated:
        print("\nNext: spot-check a sample, then:")
        print("  python3 scripts/apply_manual_geocoding.py")


if __name__ == "__main__":
    main()
