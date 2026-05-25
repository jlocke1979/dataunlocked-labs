from pathlib import Path
import pandas as pd

BASE = Path(__file__).resolve().parents[1]

shots_path = BASE / "data/processed/shots_clean.csv"
club_out = BASE / "data/processed/club_summary.csv"
session_out = BASE / "data/processed/session_summary.csv"

df = pd.read_csv(shots_path)
valid = df[~df["exclude_flag"]].copy()

club = (
    valid.groupby("club")
    .agg(
        shots=("club", "size"),
        carry_avg=("flat_carry_yd", "mean"),
        carry_median=("flat_carry_yd", "median"),
        carry_p25=("flat_carry_yd", lambda x: x.quantile(.25)),
        carry_p75=("flat_carry_yd", lambda x: x.quantile(.75)),
        total_avg=("total_yd", "mean"),
        ball_speed_avg=("ball_speed_mph", "mean"),
        launch_avg=("launch_deg", "mean"),
        apex_avg=("apex_ft", "mean"),
        offline_abs_avg=("offline_ft", "mean"),
    )
    .reset_index()
)

session = (
    valid.groupby(["session_id", "date"])
    .agg(
        shots=("club", "size"),
        total_clubs=("club", "nunique"),
        carry_avg=("flat_carry_yd", "mean"),
        offline_abs_avg=("offline_ft", "mean"),
    )
    .reset_index()
)

club.to_csv(club_out, index=False)
session.to_csv(session_out, index=False)

print(f"Wrote {club_out}")
print(f"Wrote {session_out}")
print(club)
