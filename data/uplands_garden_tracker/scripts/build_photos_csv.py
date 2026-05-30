#!/usr/bin/env python3
"""Build the Uplands Garden Tracker photo index (photos.csv) from exiftool output.

Reads the exiftool-generated metadata CSV of raw iPhone photos and produces a
review/index file for the static app. This index is intentionally a *staging*
file: every photo starts with privacy_status=review and an unassigned plot_id,
so a human can confirm location and plot assignment before anything is
published.

Usage:
    python3 build_photos_csv.py

Input:
    data/uplands_garden_tracker/metadata/photo_metadata.csv
Output:
    apps/uplands_garden_tracker/app/data/photos.csv
"""

from __future__ import annotations

import csv
import os
import re
import sys

# Repo-relative paths resolved from this script's location so the script works
# regardless of the current working directory.
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", "..", ".."))

INPUT_CSV = os.path.join(
    REPO_ROOT, "data", "uplands_garden_tracker", "metadata", "photo_metadata.csv"
)
OUTPUT_CSV = os.path.join(
    REPO_ROOT, "apps", "uplands_garden_tracker", "app", "data", "photos.csv"
)

OUTPUT_COLUMNS = [
    "photo_id",
    "source_file",
    "plot_id",
    "date_taken",
    "lat",
    "lon",
    "photo_type",
    "privacy_status",
    "caption",
    "notes",
]

DEFAULT_PHOTO_TYPE = "field_photo"
DEFAULT_PRIVACY_STATUS = "review"

# Matches exiftool DMS strings like: 40 deg 42' 12.16" N
_DMS_RE = re.compile(
    r"""(?P<deg>\d+(?:\.\d+)?)\s*deg\s*
        (?P<min>\d+(?:\.\d+)?)'\s*
        (?P<sec>\d+(?:\.\d+)?)"\s*
        (?P<hemi>[NSEW])""",
    re.VERBOSE,
)


def dms_to_decimal(value: str) -> str:
    """Convert an exiftool DMS coordinate string to signed decimal degrees.

    Returns an empty string when the value is missing or unparseable so the
    caller can simply preserve the blank.
    """
    if not value:
        return ""
    match = _DMS_RE.search(value.strip())
    if not match:
        return ""
    deg = float(match.group("deg"))
    minutes = float(match.group("min"))
    seconds = float(match.group("sec"))
    decimal = deg + minutes / 60.0 + seconds / 3600.0
    if match.group("hemi") in ("S", "W"):
        decimal = -decimal
    return f"{decimal:.6f}"


def normalize_date(value: str) -> str:
    """Convert exiftool '2026:05:28 20:23:11' to ISO '2026-05-28 20:23:11'."""
    value = (value or "").strip()
    if not value:
        return ""
    # exiftool uses colons in the date portion; swap the first two only.
    parts = value.split(" ", 1)
    date_part = parts[0].replace(":", "-")
    time_part = parts[1] if len(parts) > 1 else ""
    return f"{date_part} {time_part}".strip()


def photo_id_from_filename(source_file: str) -> str:
    """photo_id is the filename without its extension (e.g. IMG_8472)."""
    base = os.path.basename(source_file.strip())
    return os.path.splitext(base)[0]


def build_rows(reader: csv.DictReader) -> list[dict]:
    rows = []
    for record in reader:
        source_file = (record.get("SourceFile") or "").strip()
        if not source_file:
            continue
        rows.append(
            {
                "photo_id": photo_id_from_filename(source_file),
                "source_file": source_file,
                "plot_id": "",  # assigned later during review
                "date_taken": normalize_date(record.get("DateTimeOriginal", "")),
                "lat": dms_to_decimal(record.get("GPSLatitude", "")),
                "lon": dms_to_decimal(record.get("GPSLongitude", "")),
                "photo_type": DEFAULT_PHOTO_TYPE,
                "privacy_status": DEFAULT_PRIVACY_STATUS,
                "caption": "",
                "notes": "",
            }
        )
    return rows


def main() -> int:
    if not os.path.exists(INPUT_CSV):
        sys.stderr.write(f"ERROR: input metadata not found: {INPUT_CSV}\n")
        return 1

    with open(INPUT_CSV, newline="", encoding="utf-8") as f:
        rows = build_rows(csv.DictReader(f))

    os.makedirs(os.path.dirname(OUTPUT_CSV), exist_ok=True)
    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=OUTPUT_COLUMNS)
        writer.writeheader()
        writer.writerows(rows)

    with_gps = sum(1 for r in rows if r["lat"] and r["lon"])
    print(f"Wrote {len(rows)} photo rows to {OUTPUT_CSV}")
    print(f"  with GPS: {with_gps}  |  needing plot assignment: {len(rows)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
