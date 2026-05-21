from pathlib import Path
import csv

print("SCRIPT STARTING")

BASE = Path(__file__).resolve().parents[1]
RAW = BASE / "data" / "raw"

print(f"Raw folder: {RAW}")

csv_files = sorted(RAW.rglob("*.csv"))
print(f"Found {len(csv_files)} CSV files")

for path in csv_files:
    print("\n" + "=" * 100)
    print(path.relative_to(BASE))

    try:
        with open(path, newline="", encoding="utf-8-sig") as f:
            reader = csv.reader(f)
            rows = []
            for i, row in enumerate(reader):
                rows.append(row)
                if i >= 5:
                    break

        print(f"First row has {len(rows[0]) if rows else 0} fields:")
        print(rows[0] if rows else "EMPTY")

        print("\nFirst 5 rows:")
        for row in rows[1:6]:
            print(row[:10], "..." if len(row) > 10 else "")

    except Exception as e:
        print(f"ERROR reading file: {e}")