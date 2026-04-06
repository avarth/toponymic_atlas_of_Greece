"""
Unified atlas data generator with All/Urban/Rural filtering.

Classifies gazetteer features as urban/rural using:
  Tier 1: GHSL-BUILT-S R2023A pixel > 200 (>2% built-up)
  Tier 2: Within 400m of a zero-GHSL census settlement

Then computes all hex metrics 3x (all/urb/rur) and writes
data files with embedded sub-objects.

Replaces: prep_coherence.py, prep_hagio_expanded.py,
          regen_sem_data.py, prep_diff_ghsl.py
"""

import json
import numpy as np
import rasterio
import geopandas as gpd
from scipy.spatial import cKDTree
from pyproj import Transformer
from collections import Counter, defaultdict
from math import log2
import os

# ── Config ──────────────────────────────────────────────────
BASE = os.path.dirname(os.path.abspath(__file__))
# _r4 = R4 patched version with confidence_r3 and semantic_r3 fields
GAZ_PATH = os.path.join(BASE, "..", "round3", "final", "gazetteer_classified_r4.jsonl")
HEX_PATH = os.path.join(BASE, "data", "ent.json")
GHSL_PATH = os.path.join(BASE, "..", "data", "geodata", "ghsl_builtup_greece_wgs84.tif")
SETT_SHP = os.path.join(BASE, "..", "data", "geodata", "oikismoi_2011", "ΟΙΚΙΣΜΟΙ_2011.shp")
OUT_DIR = os.path.join(BASE, "data")

GHSL_THRESHOLD = 200  # GHSL pixel >200 ≈ >2% built-up; separates built from open land
BUFFER_M = 400        # census settlements with zero GHSL get a 400m catchment (avg village radius)
GRID_SIZE = 0.5       # degrees — coarse grid for hex-assignment spatial index; ~55km cells
FILTERS = ["all", "urb", "rur"]


def load_gazetteer(path):
    """Load classified gazetteer from JSONL."""
    rows = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            rows.append(json.loads(line))
    print(f"Loaded {len(rows)} gazetteer features")
    return rows


def _find_zero_ghsl_settlements(ghsl, ghsl_data, sett_shp_path):
    """Return list of (lat, lon) for census settlements with zero GHSL signal.

    These are small settlements that the GHSL raster misses (pixel value 0 or
    nodata 65535). Used by classify_features() to build the Tier-2 KD-tree.
    """
    gdf = gpd.read_file(sett_shp_path).to_crs("EPSG:4326")
    zero_setts = []
    oob_count = 0
    err_count = 0
    for _, row in gdf.iterrows():
        lon, lat = row.geometry.x, row.geometry.y
        try:
            r, c = ghsl.index(lon, lat)
            if 0 <= r < ghsl_data.shape[0] and 0 <= c < ghsl_data.shape[1]:
                if ghsl_data[r, c] == 0 or ghsl_data[r, c] == 65535:
                    zero_setts.append((lat, lon))
            else:
                oob_count += 1  # outside raster extent — skip, not zero-GHSL
        except Exception as exc:
            err_count += 1
            if err_count == 1:
                print(f"  WARNING: GHSL lookup error for census settlement: {exc}")
    if oob_count:
        print(f"  WARNING: {oob_count} census settlements outside GHSL raster extent (skipped)")
    if err_count:
        print(f"  WARNING: {err_count} census settlement GHSL lookups failed")
    return zero_setts


def classify_features(features, ghsl_path, sett_shp_path):
    """Tag each feature with is_sett=True/False using GHSL + census buffer.

    Tier 1: GHSL pixel value > GHSL_THRESHOLD at feature coords.
    Tier 2: Within BUFFER_M of a census settlement with zero GHSL.
    """
    with rasterio.open(ghsl_path) as ghsl:
        ghsl_data = ghsl.read(1)
        zero_setts = _find_zero_ghsl_settlements(ghsl, ghsl_data, sett_shp_path)

        # Build KD-tree for zero-GHSL settlements (metric CRS for distance)
        # always_xy=True → transform(lon, lat) order; zero_setts stores (lat, lon)
        tr_to_m = Transformer.from_crs("EPSG:4326", "EPSG:2100", always_xy=True)
        zero_xy = np.array([tr_to_m.transform(lon, lat) for lat, lon in zero_setts])
        zero_tree = cKDTree(zero_xy) if len(zero_xy) > 0 else None

        tier1 = tier2 = 0
        t1_err = 0
        for f in features:
            is_sett = False
            try:
                ri, ci = ghsl.index(f["lon"], f["lat"])
                if 0 <= ri < ghsl_data.shape[0] and 0 <= ci < ghsl_data.shape[1]:
                    val = ghsl_data[ri, ci]
                    if val != 65535 and val > GHSL_THRESHOLD:
                        is_sett = True
                        tier1 += 1
            except Exception as exc:
                t1_err += 1
                if t1_err == 1:
                    print(f"  WARNING: GHSL Tier 1 lookup error: {exc}")

            if not is_sett and zero_tree is not None:
                mx, my = tr_to_m.transform(f["lon"], f["lat"])
                dist, _ = zero_tree.query([mx, my])
                if dist <= BUFFER_M:
                    is_sett = True
                    tier2 += 1

            f["is_sett"] = is_sett

        sett_n = sum(1 for f in features if f["is_sett"])
        print(f"Classification: {sett_n:,} urban (GHSL:{tier1:,} buf:{tier2:,}), "
              f"{len(features)-sett_n:,} rural")
        if t1_err:
            print(f"  WARNING: {t1_err} Tier 1 GHSL lookups failed")
        return features


def assign_to_hexes(features, hexes):
    """Assign features to H3 hexes via point-in-polygon with grid acceleration.

    Returns dict mapping hex index -> list of features.
    """
    def point_in_hex(lat, lon, boundary):
        """Raycast (crossing-number) point-in-polygon test."""
        n = len(boundary)
        inside = False
        j = n - 1
        for i in range(n):
            yi, xi = boundary[i]
            yj, xj = boundary[j]
            if ((yi > lat) != (yj > lat)) and \
               (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi):
                inside = not inside
            j = i
        return inside

    feat_grid = defaultdict(list)
    for feat in features:
        gk = (round(feat["lat"] / GRID_SIZE), round(feat["lon"] / GRID_SIZE))
        feat_grid[gk].append(feat)

    hex_features = defaultdict(list)
    for hi, hx in enumerate(hexes):
        boundary = hx["b"]
        lats = [p[0] for p in boundary]
        lons = [p[1] for p in boundary]
        min_lat, max_lat = min(lats), max(lats)
        min_lon, max_lon = min(lons), max(lons)
        gk_set = set()
        for ls in range(int(min_lat / GRID_SIZE) - 1, int(max_lat / GRID_SIZE) + 2):
            for lo in range(int(min_lon / GRID_SIZE) - 1, int(max_lon / GRID_SIZE) + 2):
                gk_set.add((ls, lo))
        for gk in gk_set:
            for feat in feat_grid.get(gk, []):
                if min_lat <= feat["lat"] <= max_lat and \
                   min_lon <= feat["lon"] <= max_lon:
                    if point_in_hex(feat["lat"], feat["lon"], boundary):
                        hex_features[hi].append(feat)

    assigned = sum(len(v) for v in hex_features.values())
    print(f"Assigned {assigned:,} features to {len(hex_features)} hexes")
    return hex_features


def filter_features(features, mode):
    """Filter feature list by urban/rural mode."""
    if mode == "all":
        return features
    elif mode == "urb":
        return [f for f in features if f["is_sett"]]
    elif mode == "rur":
        return [f for f in features if not f["is_sett"]]
    raise ValueError(f"Unknown filter mode: {mode}")


ENT_MIN_FEATURES = 2        # Hexes with fewer features → None
ENT_MIN_FOR_LABEL = 5       # Below this → "too few names to assess"
ENT_VERY_HIGH = 0.95        # hr thresholds for diversity labels
ENT_HIGH = 0.80
ENT_MODERATE = 0.60

def compute_ent(hex_feats, hexes):
    """Compute naming diversity (entropy) per hex.

    Returns list aligned to hexes. Entry is None if <ENT_MIN_FEATURES features.
    """
    results = []
    for hi, hx in enumerate(hexes):
        feats = hex_feats.get(hi, [])
        n = len(feats)
        if n < ENT_MIN_FEATURES:
            results.append(None)
            continue
        names = [f["name_gr"] for f in feats]
        unique = set(names)
        u = len(unique)
        c = Counter(names)
        h = -sum((cnt / n) * log2(cnt / n) for cnt in c.values())
        hr = h / log2(n) if n > 1 else 0
        if n < ENT_MIN_FOR_LABEL:
            lbl = "too few names to assess"
        elif hr > ENT_VERY_HIGH:
            lbl = "very high diversity"
        elif hr > ENT_HIGH:
            lbl = "high diversity"
        elif hr > ENT_MODERATE:
            lbl = "moderate diversity"
        else:
            lbl = "low diversity"
        top_name, top_count = c.most_common(1)[0]
        results.append({
            "n": n, "u": u, "h": round(h, 2), "hr": round(hr, 2),
            "lbl": lbl, "top": top_name, "top_n": top_count,
        })
    return results


NON_OPAQUE = {"religious", "anthroponym", "geomorphic", "flora", "hydro",
              "fauna", "colour", "occupation", "ethnic", "descriptive_other",
              "built", "transport"}

# Fixed vocabulary of transparent semantic categories (excludes opaque)
N_SEM_CATS = 12


def compute_sem(hex_feats, hexes):
    """Compute dominant semantic category and thematic entropy per hex.

    he = Shannon entropy over all semantic categories, normalised by
    log2(N_SEM_CATS) so it is always in [0, 1].

    Returns list aligned to hexes. Entry is None if no features.
    """
    results = []
    for hi, hx in enumerate(hexes):
        feats = hex_feats.get(hi, [])
        n = len(feats)
        if n == 0:
            results.append(None)
            continue
        sem_counts = Counter(f["semantic"] for f in feats)
        opaque_pct = round(100 * sem_counts.get("opaque", 0) / n, 1)
        non_opaque = {k: v for k, v in sem_counts.items() if k in NON_OPAQUE}
        if non_opaque:
            dominant = max(non_opaque, key=non_opaque.get)
            dom_pct = round(100 * non_opaque[dominant] / n, 1)
        else:
            dominant = "opaque"
            dom_pct = opaque_pct
        name_counts = Counter(f["name_gr"] for f in feats)
        top_name, top_count = name_counts.most_common(1)[0]
        # Thematic entropy: over transparent (non-opaque) categories only
        no_total = sum(non_opaque.values())
        if no_total > 1 and len(non_opaque) > 1:
            h_raw = -sum((c / no_total) * log2(c / no_total) for c in non_opaque.values())
            he = round(h_raw / log2(N_SEM_CATS), 3)
        else:
            he = 0.0
        results.append({
            "n": n, "d": dominant, "dp": dom_pct, "op": opaque_pct,
            "top": top_name, "top_n": top_count, "he": he,
        })
    return results




# ── Prefix/Modifier Constants ──────────────────────────────────
MODIFIERS = {
    "neo": ("Νέο ", "Νέα ", "Νέοι ", "Νέον ", "Νέος ", "Νέες ", "Νέοις "),
    "pal": ("Παλαιό ", "Παλαιά ", "Παλαιοί ", "Παλαιόν ", "Παλαιός ", "Παλαιές ", "Παλαιάς "),
    "ano": ("Άνω ",), "kat": ("Κάτω ",),
    "meg": ("Μεγάλο ", "Μεγάλη ", "Μεγάλοι ", "Μεγάλον ", "Μεγάλος ", "Μεγάλες ", "Μεγάλα "),
    "mik": ("Μικρό ", "Μικρή ", "Μικροί ", "Μικρόν ", "Μικρός ", "Μικρές ", "Μικρά "),
}
MOD_TOP_KEYS = {"neo": "tn", "pal": "tp", "ano": "ta", "kat": "tk", "meg": "tm", "mik": "tmi"}


def compute_prefix(hex_feats, hexes):
    """Compute modifier prefix counts per hex, deduplicated by unique name.

    Counts distinct place names (not raw features) to avoid inflating
    counts when a settlement appears under multiple feature types.

    Returns list aligned to hexes. Entry is None if no features.
    """
    results = []
    for hi, hx in enumerate(hexes):
        feats = hex_feats.get(hi, [])
        n = len(feats)
        if n == 0:
            results.append(None)
            continue
        unique_names = set(f["name_gr"] for f in feats)
        nu = len(unique_names)
        obj = {"n": n, "nu": nu}
        total_mod = 0
        for mod, prefixes in MODIFIERS.items():
            matched_names = {f["name_gr"] for f in feats
                             if any(f["name_gr"].startswith(p) for p in prefixes)}
            cnt = len(matched_names)
            obj[mod] = cnt
            total_mod += cnt
            tk = MOD_TOP_KEYS[mod]
            # Top example names (up to 5, by frequency among features)
            if matched_names:
                top = [nm for nm, _ in
                       Counter(f["name_gr"] for f in feats
                               if f["name_gr"] in matched_names).most_common(5)]
                obj[tk] = top
            else:
                obj[tk] = []
        obj["all"] = total_mod
        results.append(obj)
    return results


# ── Etymology Constants ────────────────────────────────────────
ETYM_KEYS = ["Greek", "Turkish/Ottoman", "Slavic", "Mixed/Compound",
             "Venetian/Italian", "Albanian", "Unknown"]
ETYM_SHORT = {"Greek": "gk", "Turkish/Ottoman": "tk", "Slavic": "sl",
              "Mixed/Compound": "mx", "Venetian/Italian": "vn",
              "Albanian": "al", "Unknown": "un"}


def compute_etym(hex_feats, hexes):
    """Compute etymology breakdown per hex.

    Returns list aligned to hexes. Entry is None if no features.
    """
    results = []
    for hi, hx in enumerate(hexes):
        feats = hex_feats.get(hi, [])
        n = len(feats)
        if n == 0:
            results.append(None)
            continue
        ec = Counter(f["etymology"] for f in feats)
        obj = {"n": n}
        for full, short in ETYM_SHORT.items():
            obj[short] = round(100 * ec.get(full, 0) / n, 1)
        # Non-Greek entropy
        non_greek = {k: v for k, v in ec.items() if k != "Greek" and v > 0}
        ng_total = sum(non_greek.values())
        if ng_total > 1:
            hne = -sum((c / ng_total) * log2(c / ng_total) for c in non_greek.values())
        else:
            hne = 0
        obj["hne"] = round(hne, 2)
        obj["ng"] = ng_total
        # Confidence
        cc = Counter(f["confidence"] for f in feats)
        obj["chi"] = round(100 * cc.get("high", 0) / n, 1)
        obj["cme"] = round(100 * cc.get("medium", 0) / n, 1)
        obj["clo"] = round(100 * cc.get("low", 0) / n, 1)
        # Top name
        nc = Counter(f["name_gr"] for f in feats)
        obj["top"] = nc.most_common(1)[0][0]
        # Non-Greek names (up to 10, deduplicated by name)
        ng_feats = [f for f in feats if f["etymology"] != "Greek"]
        seen = set()
        ng_list = []
        for f in ng_feats:
            if f["name_gr"] not in seen:
                seen.add(f["name_gr"])
                ng_list.append([f["name_gr"],
                                ETYM_SHORT.get(f["etymology"], "?"),
                                f["confidence"][0]])  # h/m/l
                if len(ng_list) >= 10:
                    break
        obj["ngl"] = ng_list
        results.append(obj)
    return results


def compute_profiles(hex_feats, hexes):
    """Compute word cloud and semantic counts per hex.

    Returns dict keyed by "lat,lon" center string.
    Each wc entry is [name, count, semantic_category].
    """
    profiles = {}
    for hi, hx in enumerate(hexes):
        feats = hex_feats.get(hi, [])
        if not feats:
            continue
        center_key = f"{hx['c'][0]},{hx['c'][1]}"
        name_counts = Counter(f["name_gr"] for f in feats)
        # For each name, pick the most common semantic category among its features
        name_sem = {}
        for f in feats:
            name = f["name_gr"]
            if name not in name_sem:
                name_sem[name] = Counter()
            name_sem[name][f["semantic"]] += 1
        wc = [
            [name, count, name_sem[name].most_common(1)[0][0]]
            for name, count in name_counts.most_common()
        ]
        sc = dict(Counter(f["semantic"] for f in feats).most_common())
        profiles[center_key] = {"wc": wc, "sc": sc, "n": len(feats)}
    return profiles


def compute_charts(features):
    """Compute global aggregate counts for sidebar charts."""
    sem = dict(Counter(f["semantic"] for f in features).most_common())
    etym = dict(Counter(f["etymology"] for f in features).most_common())
    conf = dict(Counter(f["confidence"] for f in features).most_common())
    names = Counter(f["name_gr"] for f in features)
    top_names = names.most_common(10)
    mod_counts = {}
    for mod, prefixes in MODIFIERS.items():
        mod_counts[mod] = sum(
            1 for f in features
            if any(f["name_gr"].startswith(p) for p in prefixes)
        )
    # Capitalize modifier keys for display
    display_mods = {
        "neo": "Νέο", "pal": "Παλαιό", "ano": "Άνω",
        "kat": "Κάτω", "meg": "Μεγάλο", "mik": "Μικρό",
    }
    mod_counts_display = {display_mods[k]: v for k, v in mod_counts.items()}
    return {
        "sem": sem, "top_names": top_names, "etym": etym,
        "conf": conf, "mod_counts": mod_counts_display,
        "n_total": len(features),
    }


# ── Hagio (sacred names) ────────────────────────────────────────────

RELIGIOUS_EXCLUDE = {"Δοκός"}
RELIGIOUS_NAMES_FORCE = {
    "Παναγία", "Παναγιά", "Κυρά Παναγιά", "Παναγίτσα", "Παναγιούδα",
    "Παναγούλα", "Παναγοπούλα", "Παναγία Φανερωμένη",
    "Μεγάλη Παναγία", "Ψηλή Παναγιά", "Παναγία Καλαμιώτισσα",
    "Παναγία Προυσιώτισσα", "Παναγία Μελέτη",
}
HAGIO_THRESHOLDS = {
    "saints": 20, "theotokos": 5, "feasts": 5,
    "archangels": 5, "prophets": 5, "structures": 10,
    "other_religious": 10,
}


def _is_religious(r):
    """Return True if feature qualifies as a religious place name.

    Uses semantic field first, then a force-include set for Panagia variants
    that the classifier may label as 'anthroponym'. Excludes known false
    positives (e.g. Δοκός island matching a saint-name pattern).
    """
    if r["name_gr"] in RELIGIOUS_EXCLUDE:
        return False
    if r["semantic"] == "religious":
        return True
    if r["name_gr"] in RELIGIOUS_NAMES_FORCE:
        return True
    return False


def _categorise(name):
    """Assign a religious name to one of 7 hagiographic sub-categories.

    Priority order: theotokos > feasts > archangels > prophets >
    structures > saints (Άγιος prefix) > other_religious (fallback).
    """
    if any(x in name for x in ["Παναγ", "Θεοτόκ", "Κοίμησ"]):
        return "theotokos"
    if any(x in name for x in [
        "Ανάληψ", "Ανάστασ", "Μεταμόρφωσ", "Πεντηκοστ",
        "Ευαγγελ", "Γενέσ", "Εισόδ", "Ύψωσ", "Αποκαθ",
        "Επιφάν", "Βάπτισ", "Θεοφάν", "Σωτήρ", "Σωτηρ",
        "Τίμιος Σταυρός", "Σταυρ", "Άγιον Πνεύμα",
    ]):
        return "feasts"
    if any(x in name for x in ["Ταξιάρχ", "Αρχάγγελ"]):
        return "archangels"
    if "Προφήτ" in name:
        return "prophets"
    if any(x in name for x in ["Μοναστ", "Μετόχ", "Εκκλησ", "Ναός", "Παρεκκλ", "Καθολικ"]):
        return "structures"
    if any(name.startswith(p) for p in [
        "Άγιος ", "Αγίος ", "Αγ. ", "Αγία ", "Αγίας ",
        "Άγιοι ", "Αγίοι ", "Άγιες ", "Αγίες ",
    ]):
        return "saints"
    return "other_religious"


def compute_hagio(features):
    """Build sacred names data with urban/rural flag on each point."""
    religious = [r for r in features if _is_religious(r)]
    name_counts = Counter(r["name_gr"] for r in religious)
    features_by_name = defaultdict(list)
    for r in religious:
        features_by_name[r["name_gr"]].append(r)

    output = {}
    for name, count in name_counts.most_common():
        cat = _categorise(name)
        threshold = HAGIO_THRESHOLDS.get(cat, 10)
        if count < threshold:
            continue
        feats = features_by_name[name]
        types_counter = Counter(f["type_en"] for f in feats)
        points = [
            {"lat": f["lat"], "lon": f["lon"], "type": f["type_en"],
             "s": 1 if f["is_sett"] else 0}
            for f in feats
        ]
        if cat not in output:
            output[cat] = {}
        output[cat][name] = {
            "count": count, "points": points,
            "types": dict(types_counter.most_common()),
        }
    return output


# ── Hex aggregation ────────────────────────────────────────────────

def build_filtered_hexes(compute_fn, hex_features, hexes, min_feats=2, **kwargs):
    """Run a hex compute function 3x (all/urb/rur), merge into filtered structure.

    Each hex gets: {b, c, all:{...}, urb:{...}, rur:{...}}.
    Filter keys are omitted if compute_fn returns None (e.g., <min_feats features).

    Args:
        compute_fn: function(filtered_hex_feats, hexes, **kwargs) -> list[dict|None]
        hex_features: dict[int, list[dict]] from assign_to_hexes
        hexes: list of hex objects (with 'b' and 'c')
        min_feats: minimum features for a filter to be included
        **kwargs: extra args passed to compute_fn
    """
    # Run compute for each filter
    filter_results = {}
    for mode in FILTERS:
        # Build filtered hex_features
        filtered = {}
        for hi, feats in hex_features.items():
            ff = filter_features(feats, mode)
            if len(ff) >= min_feats:
                filtered[hi] = ff
        filter_results[mode] = compute_fn(filtered, hexes, **kwargs)

    # Merge into output
    output = []
    for hi, hx in enumerate(hexes):
        obj = {"b": hx["b"], "c": hx.get("c", [0, 0])}
        has_any = False
        for mode in FILTERS:
            result = filter_results[mode][hi]
            if result is not None:
                obj[mode] = result
                has_any = True
        if has_any:
            output.append(obj)
    return output


def build_filtered_profiles(hex_features, hexes):
    """Build profiles.json with all/urb/rur sub-objects.

    Returns dict keyed by center string: {all:{wc,sc,n}, urb:{...}, rur:{...}}.
    """
    filter_results = {}
    for mode in FILTERS:
        filtered = {}
        for hi, feats in hex_features.items():
            ff = filter_features(feats, mode)
            if len(ff) >= 1:
                filtered[hi] = ff
        filter_results[mode] = compute_profiles(filtered, hexes)

    # Merge by center key
    all_keys = set()
    for profiles in filter_results.values():
        all_keys.update(profiles.keys())

    output = {}
    for key in all_keys:
        obj = {}
        for mode in FILTERS:
            if key in filter_results[mode]:
                obj[mode] = filter_results[mode][key]
        if obj:
            output[key] = obj
    return output


# ── I/O ────────────────────────────────────────────────────────────

def write_json(data, filename):
    """Write JSON data to output directory."""
    path = os.path.join(OUT_DIR, filename)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    print(f"Wrote {path}")


def main():
    # 1. Load and classify
    features = load_gazetteer(GAZ_PATH)

    # Load hex grid (boundaries only, from existing ent.json)
    with open(HEX_PATH, encoding="utf-8") as f:
        hexes_raw = json.load(f)
    # Extract just b and c from existing ent.json
    hexes = [{"b": h["b"], "c": h.get("c", [0, 0])} for h in hexes_raw]
    print(f"Loaded {len(hexes)} hexes")

    classify_features(features, GHSL_PATH, SETT_SHP)

    # 2. Assign to hexes
    hex_features = assign_to_hexes(features, hexes)

    # 3. Generate filtered hex data
    print("\n--- Generating ent.json ---")
    ent_data = build_filtered_hexes(compute_ent, hex_features, hexes)
    write_json(ent_data, "ent.json")

    print("\n--- Generating sem.json ---")
    sem_data = build_filtered_hexes(compute_sem, hex_features, hexes, min_feats=1)
    write_json(sem_data, "sem.json")

    print("\n--- Generating prefix.json ---")
    pfx_data = build_filtered_hexes(compute_prefix, hex_features, hexes, min_feats=1)
    write_json(pfx_data, "prefix.json")

    print("\n--- Generating etym.json ---")
    etym_data = build_filtered_hexes(compute_etym, hex_features, hexes, min_feats=1)
    write_json(etym_data, "etym.json")

    print("\n--- Generating profiles.json ---")
    profiles_data = build_filtered_profiles(hex_features, hexes)
    write_json(profiles_data, "profiles.json")

    # 5. Charts (global aggregates per filter)
    print("\n--- Generating charts.json ---")
    charts = {}
    for mode in FILTERS:
        ff = filter_features(features, mode)
        charts[mode] = compute_charts(ff)
        print(f"  {mode}: {charts[mode]['n_total']:,} features")
    write_json(charts, "charts.json")

    # 6. Hagio
    print("\n--- Generating hagio.json ---")
    hagio = compute_hagio(features)
    for cat, names in hagio.items():
        total = sum(v["count"] for v in names.values())
        print(f"  {cat}: {len(names)} names, {total} points")
    write_json(hagio, "hagio.json")

    # 7. Enrich poly.json and oddnames.json with urban/rural flag
    print("\n--- Enriching poly.json & oddnames.json with settlement flags ---")
    # Build lookup: (lat, lon) -> is_sett
    sett_lookup = {(round(f["lat"], 6), round(f["lon"], 6)): f["is_sett"]
                   for f in features}

    def _enrich_points(points, sett_lookup):
        """Add s=1 (urban) or s=0 (rural) to each point dict in-place. Returns (enriched, missed)."""
        enriched = missed = 0
        for p in points:
            key = (round(p["lat"], 6), round(p["lon"], 6))
            if key in sett_lookup:
                p["s"] = 1 if sett_lookup[key] else 0
            else:
                p["s"] = 0
                missed += 1
            enriched += 1
        return enriched, missed

    poly_path = os.path.join(OUT_DIR, "poly.json")
    if not os.path.exists(poly_path):
        print(f"  WARNING: {poly_path} not found — skipping poly enrichment")
    if os.path.exists(poly_path):
        with open(poly_path, encoding="utf-8") as f:
            poly = json.load(f)
        all_pts = [p for info in poly.values() for p in info["points"]]
        enriched, missed = _enrich_points(all_pts, sett_lookup)
        write_json(poly, "poly.json")
        print(f"  poly.json: {enriched} points enriched")
        if missed:
            print(f"  WARNING: {missed} poly points not found in sett_lookup (defaulted to rural)")

    odd_path = os.path.join(OUT_DIR, "oddnames.json")
    if not os.path.exists(odd_path):
        print(f"  WARNING: {odd_path} not found — skipping oddnames enrichment")
    if os.path.exists(odd_path):
        with open(odd_path, encoding="utf-8") as f:
            odd = json.load(f)
        all_pts = [p for item in odd for p in item["points"]]
        enriched, missed = _enrich_points(all_pts, sett_lookup)
        write_json(odd, "oddnames.json")
        print(f"  oddnames.json: {enriched} points enriched")
        if missed:
            print(f"  WARNING: {missed} oddnames points not found in sett_lookup (defaulted to rural)")

    print("\nDone.")


if __name__ == "__main__":
    main()
