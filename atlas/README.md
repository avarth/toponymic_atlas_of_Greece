# atlas/

The interactive Greek Toponymic Atlas web application.

## Serving

```bash
cd atlas
python -m http.server 8000
# open http://localhost:8000/greek_toponymic_atlas_v9.html
```

## File Roles

| File/Dir | Role | Modified by |
|---|---|---|
| `greek_toponymic_atlas_v9.html` | Current deployable atlas (monolith, pre-Tier-2) | Manual edits / future: build.py |
| `prep_filtered_data.py` | Reads `round3/final/` + geodata → writes `data/*.json` | Data pipeline changes |
| `build.py` | **STUB** — will assemble `src/` → built HTML (Tier 2, T2-G) | Tier 2 |
| `serve.sh` | Convenience wrapper for python -m http.server | — |
| `data/` | **Output of prep_filtered_data.py** — JSON fetched at runtime | Auto-generated |
| `src/` | **SCAFFOLD** — source modules for Tier 2 modularisation | Tier 2 |
| `tests/` | **SCAFFOLD** — pytest + JS tests (Tier 3) | Tier 3 |

## Data Pipeline

`prep_filtered_data.py` reads:
- `../round3/final/gazetteer_classified.jsonl` — 90,592 classified features
- `../data/geodata/ghsl_builtup_greece_wgs84.tif` — GHSL built-up raster
- `../data/geodata/oikismoi_2011/ΟΙΚΙΣΜΟΙ_2011.shp` — 2011 census settlements

and writes to `data/`:
- `ent.json` — naming entropy per hex
- `sem.json` — semantic category per hex
- `etym.json` — etymology breakdown per hex
- `prefix.json` — modifier prefix counts per hex
- `profiles.json` — per-hex name frequency lists
- `charts.json` — global aggregate counts (for sidebar charts)
- `hagio.json` — sacred name geography
- `poly.json` — polymorphic name locations
- `oddnames.json` — curated oddities

**Do not edit `data/*.json` manually** — regenerate with `prep_filtered_data.py`.

## Refactor Status

See `vault/decisions/atlas-refactor-plan.md`.
- Tier 1 (bug fixes): ✅ complete — commit 632cb09
- Tier 2 (source modularisation): pending
- Tier 3 (tests): pending
