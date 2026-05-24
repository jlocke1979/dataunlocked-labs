"""
Shared helpers for node geocoding workflow.
"""

from __future__ import annotations

import csv
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
PROCESSED = BASE / "data/processed"
MANUAL_DIR = BASE / "data/reference/manual_geocoding"

# Keep in sync with add_state_centroid_coordinates.py
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

COORD_TOLERANCE = 0.0001

NODE_FIELDS = (
    "id",
    "type",
    "name",
    "state",
    "region",
    "total_inflow",
    "total_outflow",
    "total_flow",
    "edge_count",
    "lat",
    "lon",
    "coordinate_status",
    "geocode_priority",
    "geocode_query",
    "notes",
)


def read_csv_dicts(path: Path) -> list[dict[str, str]]:
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def write_csv_dicts(path: Path, rows: list[dict[str, str]], fieldnames: tuple[str, ...]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


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


def classify_coordinates(
    lat: str,
    lon: str,
    state: str,
    notes: str,
) -> str:
    notes_l = notes.lower()
    if "manual_map" in notes_l or "manual_geocode" in notes_l:
        return "manual_verified"
    if "city_approx" in notes_l:
        return "city_approx"
    if not has_coordinates(lat, lon):
        return "missing"
    lat_f = float(lat)
    lon_f = float(lon)
    if matches_centroid(lat_f, lon_f, state):
        return "state_centroid"
    return "facility_or_city"


def geocode_priority(status: str, total_flow: int) -> int:
    """1 = do first (high flow + needs real coords)."""
    high = total_flow >= 200
    medium = total_flow >= 50
    if status == "missing":
        return 1 if high else (2 if medium else 3)
    if status == "state_centroid":
        return 1 if high else (2 if medium else 4)
    if status == "city_approx":
        return 3 if high else 5
    if status == "facility_or_city":
        return 5
    if status == "manual_verified":
        return 9
    return 6


def build_geocode_query(name: str, state: str, node_type: str) -> str:
    """Short query string that works with OSM Nominatim batch search."""
    return f"{name}, {state}, USA"


def format_coord(value: float) -> str:
    return f"{value:.4f}"
