# Uplands Garden Tracker — Photo Data Notes

46 original iPhone photos imported.
GPS metadata verified present via exiftool.
`photo_metadata.csv` generated successfully.

## Folder layout

```
data/uplands_garden_tracker/
  photos_raw/                 # original iPhone photos — NOT published
  photos_processed/           # reserved for web-safe / reviewed images
  metadata/photo_metadata.csv # raw exiftool output (SourceFile, GPS, datetime)
  scripts/build_photos_csv.py # builds the app photo index
  exports/                    # reserved for shared/exported outputs
```

## How the photo index works

- **Raw photos stay outside the public app.** The files in `photos_raw/` are
  original iPhone images and are never copied into
  `apps/uplands_garden_tracker/app/`. They are also git-ignored so they are not
  committed or published. Do not publish raw photos yet.
- **`photos.csv` is a review / index file, not a gallery.** Running
  `scripts/build_photos_csv.py` reads `metadata/photo_metadata.csv` and writes
  `apps/uplands_garden_tracker/app/data/photos.csv`. Every row starts with
  `privacy_status = review`, `photo_type = field_photo`, and a blank `plot_id`.
  GPS `lat`/`lon` and `date_taken` are preserved when available.
- **Privacy.** The app loads `photos.csv` but does **not** display images and
  does **not** show exact `lat`/`lon` publicly. Coordinates are kept in the
  index only to support internal field organization until each photo is
  reviewed.

## Rebuild the index

```
python3 data/uplands_garden_tracker/scripts/build_photos_csv.py
```

## Next steps

- Assign each photo to a CE/CM plot (fill in `plot_id` in `photos.csv`).
- Once reviewed, flip `privacy_status` from `review` to a published state and
  decide which web-safe images (from `photos_processed/`) may be shown.
- Plot photo GPS locations on the map.
- Continue inventorying species and the move plan.
