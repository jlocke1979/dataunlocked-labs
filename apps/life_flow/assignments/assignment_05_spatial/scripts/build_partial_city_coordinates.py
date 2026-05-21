"""
Replace state-centroid coordinates with hardcoded city approximations for
top-flow nodes only (prototype step — no geocoding APIs).
"""

from __future__ import annotations

import csv
from collections import defaultdict
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
PROCESSED = BASE / "data/processed"

NODES_IN = PROCESSED / "top50_all_nodes_with_state_centroids.csv"
EDGES_IN = PROCESSED / "top50_edges_all_organs_enriched.csv"
NODES_OUT = PROCESSED / "top50_all_nodes_partial_real_coordinates.csv"

TOP_N = 15

# node_id -> (lat, lon, inferred_city, confidence)
# Approximate downtown / campus coordinates for major nodes in top flows.
CITY_COORDINATES: dict[str, tuple[float, float, str, str]] = {
    # Arizona
    "AZMC-TX1": (33.5044, -112.0740, "Phoenix", "high"),
    "AZOB-OP1": (33.4484, -112.0740, "Phoenix", "high"),
    # Colorado
    "COUC-TX1": (39.7467, -104.8378, "Aurora/Denver", "high"),
    "CORS-OP1": (39.7392, -104.9903, "Denver", "high"),
    # California — LA / OC / IE
    "CAUC-TX1": (34.0652, -118.4450, "Los Angeles (UCLA)", "high"),
    "CAOP-OP1": (34.1336, -117.9073, "Los Angeles area (OneLegacy)", "high"),
    "CACS-TX1": (34.0753, -118.3808, "Los Angeles", "high"),
    "CALL-TX1": (34.0483, -117.2611, "Loma Linda", "high"),
    "CAUH-TX1": (34.0612, -118.2840, "Los Angeles (USC)", "high"),
    "CAIM-TX1": (33.6461, -117.8428, "Irvine", "high"),
    # California — Bay / Sacramento
    "CASF-TX1": (37.7629, -122.4580, "San Francisco", "high"),
    "CAPM-TX1": (37.7864, -122.4212, "San Francisco", "high"),
    "CASU-TX1": (37.4346, -122.1750, "Palo Alto", "high"),
    "CASM-TX1": (38.5382, -121.7617, "Sacramento", "high"),
    "CASD-TX1": (32.8753, -117.2364, "San Diego", "high"),
    "CADN-OP1": (37.7799, -121.9780, "San Ramon", "medium"),  # multi-state OPO HQ
    # Washington / Oregon
    "WAUW-TX1": (47.6489, -122.3035, "Seattle", "high"),
    "WALC-OP1": (47.6145, -122.1860, "Bellevue", "high"),
    "WASM-TX1": (47.6092, -122.3205, "Seattle", "high"),
    "ORUO-TX1": (45.4995, -122.6865, "Portland", "high"),
    # Florida
    "FLTG-TX1": (27.9370, -82.4584, "Tampa", "high"),
    "FLWC-OP1": (27.9506, -82.4572, "Tampa", "high"),
    "FLJM-TX1": (25.7919, -80.2128, "Miami", "high"),
    "FLMP-OP1": (25.7617, -80.1918, "Miami", "high"),
    # Northeast
    "MAMG-TX1": (42.3631, -71.0686, "Boston", "high"),
    "MAOB-OP1": (42.3765, -71.2356, "Waltham", "medium"),
    "PADV-OP1": (39.9526, -75.1652, "Philadelphia", "high"),
    "PAUP-TX1": (39.9496, -75.1924, "Philadelphia", "high"),
    "NYMS-TX1": (40.7903, -73.9529, "New York City", "high"),
    # Southeast
    "TNVU-TX1": (36.1447, -86.8027, "Nashville", "high"),
    "TNDS-OP1": (36.1627, -86.7816, "Nashville", "high"),
    "GAEM-TX1": (33.7925, -84.3244, "Atlanta", "high"),
    "GALL-OP1": (33.7490, -84.3880, "Atlanta", "high"),
    "GAPH-TX1": (33.8086, -84.3943, "Atlanta", "high"),
    "LAOF-TX1": (29.9511, -90.0753, "New Orleans", "high"),
    "LAOP-OP1": (29.9511, -90.0718, "New Orleans", "high"),
    "SCMU-TX1": (32.7848, -79.9498, "Charleston", "high"),
    "SCOP-OP1": (32.7765, -79.9311, "Charleston", "high"),
    "NCDU-TX1": (36.0103, -78.9392, "Durham", "high"),
    "NCNC-OP1": (35.9940, -78.8986, "Durham", "medium"),
    # Midwest
    "MOBH-TX1": (38.6369, -90.2602, "St. Louis", "high"),
    "MOMA-OP1": (38.6270, -90.1994, "St. Louis", "high"),
    "MWOB-OP1": (39.0997, -94.5786, "Kansas City", "medium"),
    "ILNM-TX1": (41.8958, -87.6208, "Chicago", "high"),
    "ILUC-TX1": (41.7891, -87.6047, "Chicago", "high"),
    "ILIP-OP1": (41.9753, -87.9073, "Itasca (Chicago area)", "medium"),
    "MNUM-TX1": (44.9778, -93.2650, "Minneapolis", "high"),
    "MNMC-TX1": (44.0225, -92.4660, "Rochester", "high"),
    "MNOP-OP1": (44.9750, -93.2250, "Minneapolis", "medium"),
    "INIM-TX1": (39.7767, -86.1458, "Indianapolis", "high"),
    "INOP-OP1": (39.7684, -86.1581, "Indianapolis", "high"),
    "MIHF-TX1": (42.3679, -83.0524, "Detroit", "high"),
    "MIUM-TX1": (42.2922, -83.7226, "Ann Arbor", "high"),
    "MIOP-OP1": (42.3314, -83.0458, "Detroit", "medium"),
    "OHCC-TX1": (41.5025, -81.6186, "Cleveland", "high"),
    "OHLB-OP1": (41.4993, -81.6944, "Cleveland", "high"),
    "NEUN-TX1": (41.2565, -96.0166, "Omaha", "high"),
    "NEOR-OP1": (41.2565, -96.0166, "Omaha", "high"),
    "KSUK-TX1": (39.0563, -94.6068, "Kansas City", "high"),
    # Texas
    "TXMH-TX1": (29.7097, -95.3984, "Houston", "high"),
    "TXGC-OP1": (29.7604, -95.3698, "Houston", "high"),
    "TXHI-TX1": (29.7111, -95.3975, "Houston", "high"),
    "TXSP-TX1": (32.8125, -96.8386, "Dallas", "high"),
    "TXTX-TX1": (32.7876, -96.7949, "Dallas", "high"),
    "TXSB-OP1": (32.7767, -96.7970, "Dallas", "high"),
    "TXHS-TX1": (29.5199, -98.4982, "San Antonio", "high"),
    "TXSA-OP1": (29.4241, -98.4936, "San Antonio", "high"),
    # Utah / Hawaii / Alabama
    "UTLD-TX1": (40.6530, -111.8907, "Murray", "high"),
    "UTMC-TX1": (40.7650, -111.8350, "Salt Lake City", "high"),
    "UTOP-OP1": (40.7608, -111.8910, "Salt Lake City", "high"),
    "HIQM-TX1": (21.3089, -157.8581, "Honolulu", "high"),
    "HIOP-OP1": (21.3069, -157.8583, "Honolulu", "high"),
    "ALUA-TX1": (33.5074, -86.8034, "Birmingham", "high"),
    "ALOB-OP1": (33.5186, -86.8104, "Birmingham", "high"),
}


def read_csv_dicts(path: Path) -> list[dict[str, str]]:
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def node_flow_totals(edges: list[dict[str, str]]) -> dict[str, int]:
    totals: dict[str, int] = defaultdict(int)
    for row in edges:
        flow = int(row["flow_count"])
        totals[row["source_dsa_id"].strip()] += flow
        totals[row["destination_center_id"].strip()] += flow
    return totals


def format_coord(value: float) -> str:
    return f"{value:.4f}"


def main() -> None:
    for path in (NODES_IN, EDGES_IN):
        if not path.exists():
            raise SystemExit(f"Missing input: {path}")

    nodes = read_csv_dicts(NODES_IN)
    edges = read_csv_dicts(EDGES_IN)
    totals = node_flow_totals(edges)

    top_ids = [
        node_id
        for node_id, _ in sorted(totals.items(), key=lambda item: item[1], reverse=True)[
            :TOP_N
        ]
    ]

    print(f"Top {TOP_N} nodes by total flow volume (in + out):")
    for rank, node_id in enumerate(top_ids, start=1):
        print(f"  {rank:>2}. {node_id}: {totals[node_id]} transplants")

    updated: list[tuple] = []
    ambiguous: list[str] = []
    out_rows: list[dict[str, str]] = []

    for row in nodes:
        node_id = row["id"].strip()
        old_lat = row.get("lat", "").strip()
        old_lon = row.get("lon", "").strip()
        new_row = dict(row)

        if node_id not in top_ids:
            out_rows.append(new_row)
            continue

        city_info = CITY_COORDINATES.get(node_id)
        if city_info is None:
            ambiguous.append(
                f"{node_id} ({row.get('name', '')}) — top-{TOP_N} but no hardcoded city"
            )
            out_rows.append(new_row)
            continue

        lat, lon, city, confidence = city_info
        new_lat = format_coord(lat)
        new_lon = format_coord(lon)
        note = f"city_approx:{city};{confidence}"
        if row.get("notes", "").strip():
            note = f"{row['notes'].strip()};{note}"

        updated.append(
            (node_id, row.get("name", ""), old_lat, old_lon, new_lat, new_lon, city, confidence)
        )
        new_row["lat"] = new_lat
        new_row["lon"] = new_lon
        new_row["notes"] = note
        out_rows.append(new_row)

    fieldnames = list(nodes[0].keys()) if nodes else [
        "id", "type", "name", "state", "region", "lat", "lon", "notes"
    ]
    NODES_OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(NODES_OUT, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(out_rows)

    print(f"\nWrote {NODES_OUT.relative_to(BASE)} ({len(out_rows)} nodes)")
    print(f"\nUpdated {len(updated)} nodes with city-level coordinates:")
    for node_id, name, old_lat, old_lon, new_lat, new_lon, city, conf in updated:
        print(f"  {node_id}")
        print(f"    name: {name}")
        print(f"    city: {city} ({conf} confidence)")
        print(f"    old:  {old_lat}, {old_lon}")
        print(f"    new:  {new_lat}, {new_lon}")

    if ambiguous:
        print(f"\nAmbiguous / manual review ({len(ambiguous)}):")
        for line in ambiguous:
            print(f"  - {line}")
    else:
        print("\nAmbiguous / manual review: none (all top nodes had hardcoded cities)")


if __name__ == "__main__":
    main()
