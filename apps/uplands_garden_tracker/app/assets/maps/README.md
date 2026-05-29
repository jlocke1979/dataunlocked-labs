# Maps

This folder holds base map images for the Uplands Garden Tracker.

## How maps work

The app renders an image as the base layer, then overlays clickable plot
markers positioned with **percentage-based** `x_pct` / `y_pct` coordinates
(0–100, measured from the top-left of the image). No GIS coordinates are
required yet.

The first/default base map lives at `assets/map_base.jpg`.

## Adding or swapping a map

1. Drop your image file in this folder (e.g. `columbia_terrace_2026.jpg`).
2. Register it in `app.js` in the `MAPS` array:

   ```js
   const MAPS = [
     { id: "uplands_base", label: "Uplands base map", src: "assets/map_base.jpg" },
     { id: "columbia_2026", label: "Columbia Terrace 2026", src: "assets/maps/columbia_terrace_2026.jpg" }
   ];
   ```

3. In `data/plots.csv`, set each plot's `map_id` to the matching map `id`.
   Only plots whose `map_id` matches the selected map are shown on it.
4. Adjust each plot's `x_pct` / `y_pct` so the marker sits over the right spot.

Because positions are percentages, markers stay aligned no matter the image's
pixel dimensions, and the map selector dropdown lets you switch between maps.

> The seeded `map_base.jpg` is a **placeholder schematic**. Replace it with the
> real garden/site map and then field-verify every marker position.
