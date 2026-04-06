# analysis/

Exploratory analysis outputs from Sessions 9–11. Not part of the active atlas pipeline.

## Structure

```
analysis/
├── figures/                        ← publication figures (PDF + PNG) — for the paper
├── metrics/                        ← exploratory spatial statistics
│   ├── cell_metrics.json           H3 cell-level metrics (entropy, polymorphism, etc.)
│   ├── step1_metrics.json          Summary stats from first-pass analysis
│   └── step3_metrics.json          Summary stats from coherence analysis
└── archived_atlas_versions/        ← superseded atlas data builds
    ├── v1/                         Earliest hex format (entropy, semantic, hagio, poly)
    ├── v2/                         Added sett_diff layer
    ├── v3/                         Current JSON schema (ent/sem/etym/prefix/profiles/charts)
    └── greek_toponymic_atlas_v9.html   8.6MB self-contained standalone (all data embedded)
```

## What to use

**For the paper:** `figures/` — 7 figures as PDF+PNG pairs.

> ⚠️ `figures/fig5_etymology_map` is retired — do NOT reintroduce as a point map.
> See vault/progress/CURRENT.md working rules (political risk in Balkan context).

**For analysis reference:** `metrics/cell_metrics.json` has per-hex metrics for all 3,981 hexes.

**Active atlas data** is in `atlas/data/`, not here.
To regenerate: `cd atlas && python prep_filtered_data.py`

## Archived atlas versions

These were the data files used by earlier atlas builds (v1–v8). The JSON schema
evolved across versions and is incompatible with the current atlas (v9+).

| Dir | Atlas version | Key difference |
|---|---|---|
| `v1/` | atlas v1–v3 | Different key names, no prefix/etym layers |
| `v2/` | atlas v4–v6 | Added `sett_diff`, still no etym layer |
| `v3/` | atlas v7–v8 | Current schema minus urban/rural filter sub-objects |
