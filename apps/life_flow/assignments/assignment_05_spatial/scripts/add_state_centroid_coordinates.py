"""
Add approximate lat/lon to node tables using US state/territory centroids.
"""

from __future__ import annotations

import csv
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
PROCESSED = BASE / "data/processed"

INPUT_CSV = PROCESSED / "top50_all_nodes_for_geocoding.csv"
OUTPUT_CSV = PROCESSED / "top50_all_nodes_with_state_centroids.csv"

# Approximate geographic centroids (decimal degrees, WGS84).
STATE_CENTROIDS: dict[str, tuple[float, float]] = {
    "Alabama": (32.8067, -86.7911),
    "Alaska": (61.3707, -152.4044),
    "Arizona": (33.7298, -111.4312),
    "Arkansas": (34.9697, -92.3731),
    "California": (36.1162, -119.6816),
    "Colorado": (39.0598, -105.3111),
    "Connecticut": (41.5978, -72.7554),
    "Delaware": (39.3185, -75.5071),
    "District of Columbia": (38.9072, -77.0369),
    "Florida": (27.7663, -81.6868),
    "Georgia": (33.0406, -83.6431),
    "Hawaii": (21.0943, -157.4983),
    "Idaho": (44.2405, -114.4788),
    "Illinois": (40.3495, -88.9861),
    "Indiana": (39.8494, -86.2583),
    "Iowa": (42.0115, -93.2105),
    "Kansas": (38.5266, -96.7265),
    "Kentucky": (37.6681, -84.6701),
    "Louisiana": (31.1695, -91.8678),
    "Maine": (44.6939, -69.3819),
    "Maryland": (39.0639, -76.8021),
    "Massachusetts": (42.2302, -71.5301),
    "Michigan": (43.3266, -84.5361),
    "Minnesota": (45.6945, -93.9002),
    "Mississippi": (32.7416, -89.6787),
    "Missouri": (38.4561, -92.2884),
    "Montana": (46.9219, -110.4544),
    "Nebraska": (41.1254, -98.2681),
    "Nevada": (38.3135, -117.0554),
    "New Hampshire": (43.4525, -71.5639),
    "New Jersey": (40.2989, -74.5210),
    "New Mexico": (34.8405, -106.2485),
    "New York": (42.1657, -74.9481),
    "North Carolina": (35.6301, -79.8064),
    "North Dakota": (47.5280, -99.7840),
    "Ohio": (40.3888, -82.7649),
    "Oklahoma": (35.5653, -96.9289),
    "Oregon": (44.5720, -122.0709),
    "Pennsylvania": (40.5908, -77.2098),
    "Puerto Rico": (18.2208, -66.5901),
    "Rhode Island": (41.6809, -71.5118),
    "South Carolina": (33.8569, -80.9450),
    "South Dakota": (44.2998, -99.4388),
    "Tennessee": (35.7478, -86.6923),
    "Texas": (31.0545, -97.5635),
    "Utah": (40.1500, -111.8624),
    "Vermont": (44.0459, -72.7107),
    "Virginia": (37.7693, -78.1700),
    "Washington": (47.4009, -121.4905),
    "West Virginia": (38.4912, -80.9545),
    "Wisconsin": (44.2685, -89.6165),
    "Wyoming": (42.7560, -107.3025),
}


def has_coordinates(lat: str, lon: str) -> bool:
    return bool(lat.strip() and lon.strip())


def format_coord(value: float) -> str:
    return f"{value:.4f}"


def main() -> None:
    if not INPUT_CSV.exists():
        raise SystemExit(f"Input not found: {INPUT_CSV}")

    with open(INPUT_CSV, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        if not fieldnames:
            raise SystemExit("Input CSV has no header row")
        rows = list(reader)

    filled = 0
    preserved = 0
    missing_state = 0
    unknown_states: set[str] = set()

    for row in rows:
        lat = row.get("lat", "")
        lon = row.get("lon", "")

        if has_coordinates(lat, lon):
            preserved += 1
            continue

        state = row.get("state", "").strip()
        if not state:
            missing_state += 1
            print(f"  Warning: no state for id={row.get('id', '')!r}; lat/lon left blank")
            continue

        centroid = STATE_CENTROIDS.get(state)
        if centroid is None:
            unknown_states.add(state)
            continue

        row["lat"] = format_coord(centroid[0])
        row["lon"] = format_coord(centroid[1])
        filled += 1

    for state in sorted(unknown_states):
        print(f"  Warning: unknown state {state!r}; lat/lon left blank for affected rows")

    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Input:  {INPUT_CSV.relative_to(BASE)} ({len(rows)} nodes)")
    print(f"Output: {OUTPUT_CSV.relative_to(BASE)}")
    print(f"Coordinates preserved (already set): {preserved}")
    print(f"Coordinates filled from state centroid: {filled}")
    if missing_state:
        print(f"Rows with missing state: {missing_state}")
    if unknown_states:
        print(f"Rows with unknown state: {sum(1 for r in rows if r.get('state', '').strip() in unknown_states and not has_coordinates(r.get('lat',''), r.get('lon','')))}")


if __name__ == "__main__":
    main()
