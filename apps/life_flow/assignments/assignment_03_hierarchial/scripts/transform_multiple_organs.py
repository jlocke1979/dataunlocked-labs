from pathlib import Path
import pandas as pd
import re

ROOT = Path(__file__).resolve().parents[1]
RAW_PATH = ROOT / "data" / "raw" / "optn_multiple_organs_raw.csv"
PROCESSED_PATH = ROOT / "data" / "processed" / "optn_multiple_organs_clean.csv"

YEAR_COLS = [str(y) for y in range(2026, 1987, -1)]  # 2026 ... 1988


def clean_number(value):
    if pd.isna(value):
        return None
    s = str(value).strip().replace(",", "")
    if s == "":
        return None
    try:
        return int(float(s))
    except ValueError:
        return None


def main():
    print(f"RAW PATH: {RAW_PATH}")
    print(f"PROCESSED PATH: {PROCESSED_PATH}")

    # Read raw wide file
    df = pd.read_csv(RAW_PATH, dtype=str)

    # Normalize first column name if blank/odd
    first_col = df.columns[0]
    df = df.rename(columns={first_col: "organ"})

    # Keep only needed columns if present
    keep_cols = ["organ", "To Date"] + [c for c in YEAR_COLS if c in df.columns]
    df = df[keep_cols].copy()

    # Drop the overall total row if present
    df = df[df["organ"].notna()]
    df["organ"] = df["organ"].str.strip()
    df = df[df["organ"] != ""]
    df = df[df["organ"] != "All Multiple Organ"]

    # Clean To Date
    if "To Date" in df.columns:
        df["to_date"] = df["To Date"].apply(clean_number)
        df = df.drop(columns=["To Date"])
    else:
        df["to_date"] = None

    # Melt years long
    year_cols_present = [c for c in YEAR_COLS if c in df.columns]
    long_df = df.melt(
        id_vars=["organ", "to_date"],
        value_vars=year_cols_present,
        var_name="year",
        value_name="transplants"
    )

    # Clean numeric fields
    long_df["year"] = long_df["year"].astype(int)
    long_df["transplants"] = long_df["transplants"].apply(clean_number)

    # Drop empty rows
    long_df = long_df[long_df["transplants"].notna()].copy()

    # Sort
    long_df = long_df.sort_values(["organ", "year"]).reset_index(drop=True)

    # Save
    PROCESSED_PATH.parent.mkdir(parents=True, exist_ok=True)
    long_df.to_csv(PROCESSED_PATH, index=False)

    print(f"✅ Wrote {len(long_df)} rows to {PROCESSED_PATH}")
    print(long_df.head(12).to_string(index=False))


if __name__ == "__main__":
    main()