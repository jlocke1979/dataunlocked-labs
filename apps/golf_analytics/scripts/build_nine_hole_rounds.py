#!/usr/bin/env python3
"""
Build nine_hole_rounds.csv from GolfPad rounds + holes exports (stdlib only).

Usage:
  python3 apps/golf_analytics/scripts/build_nine_hole_rounds.py
  python3 apps/golf_analytics/scripts/build_nine_hole_rounds.py --export-dir /path/to/folder
"""

from __future__ import annotations

import argparse
import csv
from collections import defaultdict
from datetime import datetime
from pathlib import Path

GOLF_ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = GOLF_ROOT / "data" / "raw"
PROCESSED_PATH = GOLF_ROOT / "data" / "processed" / "nine_hole_rounds.csv"
HOLES_PROCESSED_PATH = GOLF_ROOT / "data" / "processed" / "hole_scores.csv"
HANDICAP_ROUNDS_PATH = GOLF_ROOT / "data" / "processed" / "rounds_for_handicap.csv"
PROTOTYPES = Path.home() / "Documents/Businesses/Data_Unlocked/Prototypes/GolfPad_Data_Extract"
PRIMARY_PLAYER = "Justin"
OUTPUT_FIELDS = [
    "date",
    "course",
    "side",
    "tee",
    "score",
    "par",
    "score_vs_par",
    "completed_holes_in_round",
    "round_key",
]


def find_export_dir(explicit: Path | None) -> Path:
    if explicit and explicit.is_dir():
        return explicit
    if RAW_DIR.is_dir():
        rounds = list(RAW_DIR.rglob("rounds*.csv"))
        if rounds:
            return max(rounds, key=lambda p: p.stat().st_mtime).parent
    if PROTOTYPES.is_dir():
        candidates: list[Path] = []
        for p in PROTOTYPES.rglob("rounds*.csv"):
            if list(p.parent.glob("holes*.csv")):
                candidates.append(p.parent)
        if candidates:
            return max(candidates, key=lambda d: max(f.stat().st_mtime for f in d.glob("rounds*.csv")))
    raise FileNotFoundError(f"No GolfPad export in {RAW_DIR} or {PROTOTYPES}")


def pick_csv(folder: Path, stem: str) -> Path:
    files = sorted(folder.glob(f"{stem}*.csv"), key=lambda p: p.stat().st_mtime)
    if not files:
        raise FileNotFoundError(f"No {stem}*.csv in {folder}")
    return files[-1]


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def norm_cols(row: dict[str, str]) -> dict[str, str]:
    return {k.strip().lower().replace(" ", "_"): (v or "").strip().strip('"') for k, v in row.items()}


def round_key(player: str, date_s: str, course: str, start_time: str) -> str:
    return f"{player}||{date_s}||{course}||{start_time}"


def parse_date(s: str) -> str:
    for fmt in ("%Y-%m-%d", "%m/%d/%Y"):
        try:
            return datetime.strptime(s, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return s


def build_rows(rounds_path: Path, holes_path: Path) -> list[dict]:
    rounds = [norm_cols(r) for r in read_csv(rounds_path)]
    holes = [norm_cols(h) for h in read_csv(holes_path)]

    rounds = [r for r in rounds if r.get("player_name") == PRIMARY_PLAYER]
    holes = [h for h in holes if h.get("player_name") == PRIMARY_PLAYER]

    start_by_pcm: dict[tuple[str, str, str], str] = {}
    for r in rounds:
        key = (r["player_name"], parse_date(r["date"]), r["course_name"])
        st = r.get("start_time", "")
        if key not in start_by_pcm or st < start_by_pcm[key]:
            start_by_pcm[key] = st

    round_meta: dict[str, dict] = {}
    for r in rounds:
        d = parse_date(r["date"])
        st = r.get("start_time") or start_by_pcm.get((r["player_name"], d, r["course_name"]), "")
        rk = round_key(r["player_name"], d, r["course_name"], st)
        round_meta[rk] = {
            "date": d,
            "course": r["course_name"],
            "tee": r.get("tee_name", ""),
            "completed": int(r.get("completed_holes") or 0),
        }

    hole_groups: dict[str, list[dict]] = defaultdict(list)
    for h in holes:
        d = parse_date(h["date"])
        st = start_by_pcm.get((h["player_name"], d, h["course_name"]), "")
        rk = round_key(h["player_name"], d, h["course_name"], st)
        if rk not in round_meta:
            continue
        try:
            hn = int(h["hole_number"])
            strokes = int(h["total_strokes"])
            par = int(h["hole_par"])
        except (TypeError, ValueError):
            continue
        tee = h.get("tee_name") or round_meta[rk]["tee"]
        hole_groups[rk].append(
            {"hole_number": hn, "strokes": strokes, "par": par, "tee": tee}
        )

    rows: list[dict] = []
    for rk, grp in hole_groups.items():
        meta = round_meta[rk]
        by_hole = {x["hole_number"]: x for x in grp}
        played = sorted(by_hole)
        completed = meta["completed"] or len(played)

        def segment(side: str, nums: range) -> None:
            if not all(n in by_hole for n in nums):
                return
            score = sum(by_hole[n]["strokes"] for n in nums)
            par = sum(by_hole[n]["par"] for n in nums)
            rows.append(
                {
                    "date": meta["date"],
                    "course": meta["course"],
                    "side": side,
                    "tee": by_hole[nums[0]]["tee"] or meta["tee"],
                    "score": score,
                    "par": par,
                    "score_vs_par": score - par,
                    "completed_holes_in_round": completed,
                    "round_key": rk,
                }
            )

        has_front = all(n in played for n in range(1, 10))
        has_back = all(n in played for n in range(10, 19))

        if completed == 18 and has_front and has_back:
            segment("front", range(1, 10))
            segment("back", range(10, 19))
        elif completed == 9:
            if has_front and not has_back:
                segment("front", range(1, 10))
            elif has_back and not has_front:
                segment("back", range(10, 19))
            elif has_front:
                segment("front", range(1, 10))
        elif has_front:
            segment("front", range(1, 10))
        elif has_back:
            segment("back", range(10, 19))

    rows.sort(key=lambda r: (r["score"], r["score_vs_par"], r["date"]))
    return rows


HOLE_OUTPUT_FIELDS = [
    "date",
    "course",
    "round_key",
    "side",
    "hole_number",
    "strokes",
    "par",
    "score_vs_par",
]


def build_hole_rows(rounds_path: Path, holes_path: Path) -> list[dict]:
    """Per-hole strokes vs par for interactive heatmaps."""
    rounds = [norm_cols(r) for r in read_csv(rounds_path)]
    holes = [norm_cols(h) for h in read_csv(holes_path)]
    rounds = [r for r in rounds if r.get("player_name") == PRIMARY_PLAYER]
    holes = [h for h in holes if h.get("player_name") == PRIMARY_PLAYER]

    start_by_pcm: dict[tuple[str, str, str], str] = {}
    for r in rounds:
        key = (r["player_name"], parse_date(r["date"]), r["course_name"])
        st = r.get("start_time", "")
        if key not in start_by_pcm or st < start_by_pcm[key]:
            start_by_pcm[key] = st

    round_keys: set[str] = set()
    for r in rounds:
        d = parse_date(r["date"])
        st = r.get("start_time") or start_by_pcm.get((r["player_name"], d, r["course_name"]), "")
        round_keys.add(round_key(r["player_name"], d, r["course_name"], st))

    rows: list[dict] = []
    for h in holes:
        d = parse_date(h["date"])
        course = h["course_name"]
        st = start_by_pcm.get((h["player_name"], d, course), "")
        rk = round_key(h["player_name"], d, course, st)
        if rk not in round_keys:
            continue
        try:
            hn = int(h["hole_number"])
            strokes = int(h["total_strokes"])
            par = int(h["hole_par"])
        except (TypeError, ValueError):
            continue
        side = "front" if hn <= 9 else "back"
        rows.append(
            {
                "date": d,
                "course": course,
                "round_key": rk,
                "side": side,
                "hole_number": hn,
                "strokes": strokes,
                "par": par,
                "score_vs_par": strokes - par,
            }
        )

    rows.sort(key=lambda r: (r["date"], r["course"], r["round_key"], r["hole_number"]))
    return rows


HANDICAP_FIELDS = [
    "date",
    "course",
    "tee",
    "completed_holes",
    "gross_score",
    "gross_over_par",
    "rating",
    "slope",
    "penalties",
    "score_differential",
    "differential_type",
]


def build_handicap_rounds(rounds_path: Path) -> list[dict]:
    """Rounds row for WHS-style index (18-hole differentials when rating/slope exist)."""
    rounds = [norm_cols(r) for r in read_csv(rounds_path)]
    rounds = [r for r in rounds if r.get("player_name") == PRIMARY_PLAYER]
    rows: list[dict] = []

    for r in rounds:
        try:
            completed = int(r.get("completed_holes") or 0)
            gross = int(r.get("gross_score") or 0)
        except (TypeError, ValueError):
            continue
        if completed < 9 or gross <= 0:
            continue

        rating_s = r.get("rating", "")
        slope_s = r.get("slope", "")
        rating = float(rating_s) if rating_s else None
        slope = int(float(slope_s)) if slope_s else None
        try:
            over_par = int(r.get("gross_score_over_par") or 0)
        except (TypeError, ValueError):
            over_par = None

        diff: float | str = ""
        dtype = "nine_hole" if completed == 9 else "incomplete"

        if completed == 18:
            if rating is not None and slope:
                # WHS 5.1a (no PCC adjustment in export)
                diff = round((113 / slope) * (gross - rating), 1)
                dtype = "whs_18"
            elif over_par is not None:
                diff = float(over_par)
                dtype = "estimate_over_par"

        try:
            penalties = int(r.get("penalties") or 0)
        except (TypeError, ValueError):
            penalties = 0

        rows.append(
            {
                "date": parse_date(r["date"]),
                "course": r["course_name"],
                "tee": r.get("tee_name", ""),
                "completed_holes": completed,
                "gross_score": gross,
                "gross_over_par": over_par if over_par is not None else "",
                "rating": rating if rating is not None else "",
                "slope": slope if slope else "",
                "penalties": penalties,
                "score_differential": diff,
                "differential_type": dtype,
            }
        )

    rows.sort(key=lambda r: r["date"])
    return rows


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--export-dir", type=Path, default=None)
    args = parser.parse_args()

    export_dir = find_export_dir(args.export_dir)
    rounds_path = pick_csv(export_dir, "rounds")
    holes_path = pick_csv(export_dir, "holes")
    rows = build_rows(rounds_path, holes_path)
    hole_rows = build_hole_rows(rounds_path, holes_path)
    handicap_rows = build_handicap_rounds(rounds_path)

    PROCESSED_PATH.parent.mkdir(parents=True, exist_ok=True)
    with PROCESSED_PATH.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=OUTPUT_FIELDS)
        w.writeheader()
        w.writerows(rows)

    with HOLES_PROCESSED_PATH.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=HOLE_OUTPUT_FIELDS)
        w.writeheader()
        w.writerows(hole_rows)

    print(f"export_dir={export_dir}")
    print(f"rounds={rounds_path.name} holes={holes_path.name}")
    print(f"wrote {PROCESSED_PATH} rows={len(rows)}")
    print(f"wrote {HOLES_PROCESSED_PATH} rows={len(hole_rows)}")

    with HANDICAP_ROUNDS_PATH.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=HANDICAP_FIELDS)
        w.writeheader()
        w.writerows(handicap_rows)

    print(f"wrote {HANDICAP_ROUNDS_PATH} rows={len(handicap_rows)}")
    if rows:
        best = min(rows, key=lambda r: (r["score"], r["score_vs_par"]))
        print(
            f"best_by_score: {best['date']} {best['course']} {best['side']} "
            f"score={best['score']} vs_par={best['score_vs_par']}"
        )


if __name__ == "__main__":
    main()
