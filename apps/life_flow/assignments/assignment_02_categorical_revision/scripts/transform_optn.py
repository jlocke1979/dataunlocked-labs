from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]

raw_path = ROOT / "data" / "raw" / "optn_transplants_raw.csv"
processed_path = ROOT / "data" / "processed" / "optn_transplants_clean.csv"

# Read as TAB-delimited, not comma-delimited
df = pd.read_csv(raw_path, sep="\t")

# Rename first columns for clarity
df = df.rename(columns={
    df.columns[0]: "donor_type",
    df.columns[1]: "organ",
    df.columns[2]: "blank",
    df.columns[3]: "to_date"
})

# Carry donor type down the grouped rows
df["donor_type"] = df["donor_type"].replace("", pd.NA).ffill()

# Clean organ labels
df["organ"] = df["organ"].astype(str).str.strip()

# Keep only rows that actually have an organ name
df = df[df["organ"].notna() & (df["organ"] != "")]

# Clean numeric columns
value_cols = ["to_date"] + [c for c in df.columns if str(c).isdigit()]

for col in value_cols:
    df[col] = (
        df[col]
        .astype(str)
        .str.replace(",", "", regex=False)
        .str.strip()
        .replace({"": pd.NA, "nan": pd.NA})
    )
    df[col] = pd.to_numeric(df[col], errors="coerce")

# Melt years into long format
year_cols = [c for c in df.columns if str(c).isdigit()]

clean = df.melt(
    id_vars=["donor_type", "organ", "to_date"],
    value_vars=year_cols,
    var_name="year",
    value_name="transplants"
)

clean["year"] = clean["year"].astype(int)
clean = clean.dropna(subset=["transplants"])
clean["transplants"] = clean["transplants"].astype(int)

# Sort nicely
clean = clean.sort_values(["donor_type", "organ", "year"]).reset_index(drop=True)

processed_path.parent.mkdir(parents=True, exist_ok=True)
clean.to_csv(processed_path, index=False)

print(f"✅ Wrote {len(clean)} rows to {processed_path}")
print("Unique donor types:", sorted(clean["donor_type"].dropna().unique()))
print("Unique organs:", sorted(clean["organ"].dropna().unique()))
print(clean.head(12).to_string(index=False))