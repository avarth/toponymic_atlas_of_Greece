# Greek Toponymic Atlas

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.19443730.svg)](https://doi.org/10.5281/zenodo.19443730)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Language: Python](https://img.shields.io/badge/Python-3.10+-yellow.svg)](https://python.org)
[![Language: JavaScript](https://img.shields.io/badge/JavaScript-ES6+-f7df1e.svg)](atlas/greek_toponymic_atlas.html)

Etymological classification and interactive spatial analysis of 41,932 unique place names (90,592 geocoded features) from the Greek National Gazetteer.

The project combines morphological rule-based classification, large language model (LLM) disambiguation, and expert validation to assign each toponym an etymological origin (Greek, Turkish/Ottoman, Slavic, etc.) and semantic category (religious, geomorphic, flora, etc.). Results are visualised in an interactive hex-binned web atlas.

## Data Sources

| Source | Description | Access |
|--------|-------------|--------|
| **National Gazetteer of Geographical Names of Greece** | 90,592 named, typed, geocoded geographic features. Published by the Hellenic Military Geographical Service (HMGS) and the Hellenic Navy Hydrographic Service (HNHS). | [gys.gr](https://www.gys.gr/index.html) |
| **GHSL Built-Up Surface** | Global Human Settlement Layer, epoch 2030, 100m resolution (GHS-BUILT-S R2023A). Used to classify features as urban or rural. | [EU JRC](https://ghsl.jrc.ec.europa.eu/download.php?ds=bu) |
| **Greek Census Settlements** | 2011 census settlement points (ELSTAT). Used as a secondary urban classification tier for settlements missed by GHSL. | ELSTAT open data |
| **Kaikki.org Greek Dictionary** | 84,619 Greek lemmas extracted from Wiktionary, with etymological annotations. | [kaikki.org](https://kaikki.org/dictionary/Greek/) |
| **EELLAK Spell Dictionary** | 1,047,153 Greek word forms. Used for morphological validation. | [EELLAK](https://ellak.gr/) |

## Classification Methodology

The classification pipeline assigns each of the 41,932 unique place names an etymological origin using a three-stage hybrid approach.

### Stage 1: Morphological Rule-Based Classification

An algorithmic classifier processes each name against a Greek lexicon (Kaikki.org + EELLAK) and curated pattern inventories for non-Greek morphemes:

- **Greek lexicon lookup** -- names whose root appears in the combined Greek dictionary (84,619 lemmas, 1,047,153 forms) are classified as Greek.
- **Slavic markers** -- suffixes such as *-oβο/-oβα* (possessive), *-ίστα* (locative), *-ίτσα* (diminutive on non-Greek root), and known Slavic roots (e.g. *Αράχοβα* < *orehova*, walnut).
- **Turkish/Ottoman markers** -- roots from Ottoman Turkish (*derbent*, *kazan*, *pasha*), excluding absorbed morphology (*-λίκι*, *-τζής*) when attached to Greek roots.
- **Venetian/Italian** -- restricted to words that remain recognisably foreign (*fortezza*, *loggia*); absorbed loanwords (*kastro*, *scala*, *porta*) are classified as Greek.
- **Albanian markers** -- suffixes *-έσι*, *-έζι*, *-έζα* combined with opaque (non-Greek) roots.

The core classification rule is: **etymology follows the root's living language**. Absorbed foreign suffixes attached to Greek roots do not change the classification. This stage resolves approximately 78% of names with high confidence.

### Stage 2: LLM Disambiguation

Names not resolved by Stage 1 (ambiguous morphology, opaque roots, or conflicting signals) are processed through Claude Sonnet (Anthropic) with the full classification ruleset embedded in the system prompt. The LLM receives the name, its geographic feature type, and coordinates, and returns an etymology, semantic category, and reasoning chain. Results are adjudicated against Stage 1 output using a confidence-weighted merge.

### Stage 3: Expert Validation and Correction

The pipeline output is validated through two complementary reviews:

1. **Stratified sample review** -- 200 names drawn from all etymology categories (minority classes oversampled) are manually reviewed by a domain expert. Error patterns identified in the sample (e.g., systematic over-classification of absorbed loanwords as Venetian/Italian) are corrected across the full dataset.

2. **Full non-Greek review** -- all 2,468 names classified as non-Greek are reviewed individually. An LLM generates draft corrections with reasoning; the expert accepts, modifies, or rejects each suggestion. This ensures that the high-error-rate minority categories (which represent the analytically interesting cases) receive exhaustive human oversight.

Classification rules and validation methodology are described in the info panel of the interactive atlas.

### Semantic Category Classification

In parallel with etymological origin, each name is assigned a semantic category describing what the name *means* (as distinct from the gazetteer's feature type, which describes what the feature *is*). For example, a peak named *Σταυρός* (Cross) has feature type "Peak" but semantic category "religious".

The gazetteer's 104 feature types provide a coarse signal -- names assigned to religious feature types (Chapel, Monastery, Church) are reliably religious, and hydrological types (Stream, Spring, Lake) correlate with hydro-semantic names. However, many names are semantically unrelated to their feature type (a mountain named after a plant, a village named after a person), and the majority of Greek place names have opaque meanings not recoverable from the feature type alone.

Semantic categories are assigned primarily by the LLM in Stage 2, which analyses the name's morphology, root meaning, and feature-type context to classify it into one of 11 categories: geomorphic, hydro, flora, fauna, religious, anthroponym, ethnic, colour, occupation, descriptive, or opaque (meaning unclear). Approximately 65% of names are classified as opaque -- an accurate reflection of the deep lexical erosion in Greek toponymy, not a classification failure.

### Final Distribution

| Etymology | Unique Names | % |
|-----------|-------------|---|
| Greek | 40,670 | 96.99% |
| Turkish/Ottoman | 691 | 1.65% |
| Slavic | 350 | 0.83% |
| Mixed/Compound | 148 | 0.35% |
| Unknown | 37 | 0.09% |
| Albanian | 18 | 0.04% |
| Venetian/Italian | 18 | 0.04% |

## Interactive Atlas

The atlas is a single-page web application that visualises the classified gazetteer on an H3 hexagonal grid (resolution 6, ~3.2 km edge, 3,981 hexes). Six analysis tabs:

1. **Naming** -- dominant semantic theme per hex, thematic diversity (Shannon entropy)
2. **Modifiers** -- geographic prevalence of prefixes (Νέο, Παλαιό, Άνω, Κάτω, Μεγάλο, Μικρό)
3. **Sacred Names** -- 82 hagionyms across 7 categories, mapped as point layers
4. **Polymorphism** -- names appearing as multiple feature types, ranked by type entropy
5. **Origins** -- linguistic diversity per hex, with classification confidence
6. **Oddities** -- curated collection of colourful place names

All layers support urban/rural filtering (GHSL-based classification) and bilingual display (English/Greek).

### Running the Atlas

```bash
cd atlas
python -m http.server 8000
# open http://localhost:8000/greek_toponymic_atlas.html
```

### Regenerating Atlas Data

```bash
# From classified gazetteer → hex-aggregated JSON (requires geodata files)
python atlas/prep_filtered_data.py
# Rebuild single HTML from source modules
python atlas/build.py
```

## Repository Structure

```
atlas/                  Interactive web atlas
  src/                  HTML template, CSS, JS modules (9 files)
  data/                 Hex-aggregated JSON (auto-generated)
  build.py              Assembles src/ into single deployable HTML
  prep_filtered_data.py Generates atlas/data/ from classified gazetteer
  tests/                Pytest suite (54 tests)

```

## Citation

*Citation information and DOI will be added upon publication.*

## License

Code and atlas application are released under the [MIT License](LICENSE). The hex-aggregated atlas data (`atlas/data/`) is included under the same license. The source gazetteer and classified datasets are not included in this repository.

## AI Disclosure

This tool was developed with AI assistance (Anthropic Claude Opus 4.6 / Sonnet 4.6). The author designed the architecture and planned all features; AI tools were used to draft code diffs, code cleanup and implementation. All AI-generated code was reviewed by the author before inclusion. The author takes full responsibility for the correctness, design, and scientific validity of the code.

## Acknowledgements

- Hellenic Military Geographical Service (HMGS) for the National Gazetteer of Geographical Names of Greece
- European Commission Joint Research Centre for the Global Human Settlement Layer (GHSL)
- Kaikki.org for the Wiktionary-derived Greek dictionary
- EELLAK for the Greek spelling dictionary
- Leaflet, CARTO, and OpenStreetMap contributors for the basemap
