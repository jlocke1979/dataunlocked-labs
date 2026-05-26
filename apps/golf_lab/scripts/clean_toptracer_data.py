from pathlib import Path
import pandas as pd

BASE = Path(__file__).resolve().parents[1]

raw_path = BASE / "data/raw/manual_entries/toptracer_2026_05_session.csv"
out_path = BASE / "data/processed/shots_clean.csv"

df = pd.read_csv(raw_path)

# Toptracer labels gap wedge as GW; normalize to AW for consistency
df["club"] = df["club"].astype(str).str.strip().str.upper().replace({"GW": "AW"})

numeric_cols = [
    "flat_carry_yd","total_yd","ball_speed_mph","launch_deg",
    "apex_ft","landing_deg","curve_ft","offline_ft"
]

for col in numeric_cols:
    df[col] = pd.to_numeric(df[col], errors="coerce")

df["exclude_flag"] = df["exclude_flag"].astype(str).str.upper().eq("TRUE")
df["offline_signed_ft"] = df.apply(
    lambda r: -r["offline_ft"] if str(r["offline_dir"]).upper() == "L" else r["offline_ft"],
    axis=1
)
df["curve_signed_ft"] = df.apply(
    lambda r: -r["curve_ft"] if str(r["curve_dir"]).upper() == "L" else r["curve_ft"],
    axis=1
)

out_path.parent.mkdir(parents=True, exist_ok=True)
df.to_csv(out_path, index=False)

print(f"Wrote {out_path}")
print(df.head())
