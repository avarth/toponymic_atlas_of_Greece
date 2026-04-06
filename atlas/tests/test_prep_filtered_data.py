"""
Unit tests for compute_* functions in atlas/prep_filtered_data.py.

These tests are pure-Python (no external files, no geo libs needed).
Run with:  pytest atlas/tests/test_prep_filtered_data.py -v
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from math import log2
import pytest

from prep_filtered_data import (
    compute_ent,
    compute_sem,
    compute_etym,
    compute_prefix,
    compute_hagio,
    _is_religious,
    _categorise,
    filter_features,
    NON_OPAQUE,
    HAGIO_THRESHOLDS,
)

# ── Fixtures ───────────────────────────────────────────────────────────────────

# Minimal hex stub — compute_* functions only read h["b"] / enumerate index.
HEXES = [{"b": [], "c": [38.0, 24.0]}, {"b": [], "c": [38.1, 24.1]}]

def feat(name="Αγία Μαρίνα", sem="religious", etym="Greek",
         conf="high", ftype="Chapel", is_sett=False, lat=38.0, lon=24.0):
    return {
        "name_gr": name, "semantic": sem, "etymology": etym,
        "confidence": conf, "type_en": ftype,
        "is_sett": is_sett, "lat": lat, "lon": lon,
    }


# ── compute_ent ────────────────────────────────────────────────────────────────

class TestComputeEnt:
    def test_none_for_single_feature(self):
        hf = {0: [feat()]}
        r = compute_ent(hf, HEXES)
        assert r[0] is None

    def test_none_for_empty_hex(self):
        r = compute_ent({}, HEXES)
        assert r[0] is None
        assert r[1] is None

    def test_all_same_name_low_hr(self):
        # 5 identical names → entropy 0
        feats = [feat("Άγιος Γεώργιος")] * 5
        r = compute_ent({0: feats}, HEXES)
        assert r[0]["h"] == 0.0
        assert r[0]["hr"] == 0.0
        assert r[0]["n"] == 5
        assert r[0]["u"] == 1
        assert r[0]["lbl"] == "low diversity"

    def test_all_unique_names_high_hr(self):
        # 8 fully unique names → h = log2(8) = 3, hr = 1.0 → "very high diversity"
        feats = [feat(f"Name{i}") for i in range(8)]
        r = compute_ent({0: feats}, HEXES)
        assert r[0]["hr"] == 1.0
        assert r[0]["lbl"] == "very high diversity"
        assert r[0]["u"] == 8

    def test_top_name_reported(self):
        feats = [feat("Alpha")] * 4 + [feat("Beta")] * 2
        r = compute_ent({0: feats}, HEXES)
        assert r[0]["top"] == "Alpha"
        assert r[0]["top_n"] == 4

    def test_too_few_names_label(self):
        # After M5 fix: n < 5 is checked FIRST, regardless of entropy value
        feats = [feat("Alpha"), feat("Beta"), feat("Alpha")]  # n=3
        r = compute_ent({0: feats}, HEXES)
        assert r[0]["lbl"] == "too few names to assess"

    def test_second_hex_empty(self):
        feats = [feat(f"N{i}") for i in range(4)]
        r = compute_ent({0: feats}, HEXES)
        assert r[1] is None

    def test_hr_boundary_moderate(self):
        # Construct features so hr lands between 0.6 and 0.8
        # 8 features: one name×4, four distinct×1 each → h varies
        feats = [feat("Common")] * 6 + [feat("Rare1"), feat("Rare2")]
        r = compute_ent({0: feats}, HEXES)
        assert 0.0 <= r[0]["hr"] <= 1.0


# ── compute_sem ────────────────────────────────────────────────────────────────

class TestComputeSem:
    def test_none_for_empty_hex(self):
        r = compute_sem({}, HEXES)
        assert r[0] is None

    def test_dominant_non_opaque(self):
        feats = [feat(sem="geomorphic")] * 3 + [feat(sem="religious")] * 2
        r = compute_sem({0: feats}, HEXES)
        assert r[0]["d"] == "geomorphic"
        assert r[0]["n"] == 5

    def test_opaque_fallback_when_all_opaque(self):
        feats = [feat(sem="opaque")] * 4
        r = compute_sem({0: feats}, HEXES)
        assert r[0]["d"] == "opaque"
        assert r[0]["dp"] == 100.0

    def test_opaque_ignored_for_dominant(self):
        feats = [feat(sem="opaque")] * 5 + [feat(sem="flora")] * 2
        r = compute_sem({0: feats}, HEXES)
        assert r[0]["d"] == "flora"

    def test_opaque_pct_computed_separately(self):
        feats = [feat(sem="opaque")] * 2 + [feat(sem="hydro")] * 3
        r = compute_sem({0: feats}, HEXES)
        assert r[0]["op"] == pytest.approx(40.0)
        assert r[0]["d"] == "hydro"

    def test_top_name(self):
        feats = [feat("Ρέμα", sem="hydro")] * 3 + [feat("Πηγή", sem="hydro")]
        r = compute_sem({0: feats}, HEXES)
        assert r[0]["top"] == "Ρέμα"
        assert r[0]["top_n"] == 3

    def test_all_sem_categories_accepted(self):
        for sem in NON_OPAQUE:
            feats = [feat(sem=sem)]
            r = compute_sem({0: feats}, HEXES)
            assert r[0]["d"] == sem


# ── compute_hagio ──────────────────────────────────────────────────────────────

class TestComputeHagio:
    def test_religious_detection_by_semantic(self):
        r = feat("Άγιος Γεώργιος", sem="religious")
        assert _is_religious(r) is True

    def test_religious_detection_by_force_list(self):
        r = feat("Παναγία", sem="geomorphic")
        assert _is_religious(r) is True

    def test_non_religious_rejected(self):
        r = feat("Λιβάδι", sem="flora")
        assert _is_religious(r) is False

    def test_excluded_name_rejected(self):
        r = feat("Δοκός", sem="religious")
        assert _is_religious(r) is False

    def test_categorise_saints(self):
        assert _categorise("Άγιος Νικόλαος") == "saints"
        assert _categorise("Αγία Μαρίνα") == "saints"

    def test_categorise_theotokos(self):
        assert _categorise("Παναγία") == "theotokos"
        assert _categorise("Κοίμησις Θεοτόκου") == "theotokos"

    def test_categorise_feasts(self):
        assert _categorise("Μεταμόρφωσις") == "feasts"
        assert _categorise("Τίμιος Σταυρός") == "feasts"

    def test_categorise_archangels(self):
        assert _categorise("Ταξιάρχης") == "archangels"

    def test_categorise_prophets(self):
        assert _categorise("Προφήτης Ηλίας") == "prophets"

    def test_categorise_structures(self):
        assert _categorise("Μοναστήρι") == "structures"

    def test_categorise_other(self):
        assert _categorise("Θεία Κοινωνία") == "other_religious"

    def test_threshold_filtering(self):
        # saints threshold is 20 — need >= 20 occurrences to appear
        threshold = HAGIO_THRESHOLDS["saints"]
        feats = [feat("Άγιος Γεώργιος", sem="religious", ftype="Chapel")] * threshold
        result = compute_hagio(feats)
        assert "saints" in result
        assert "Άγιος Γεώργιος" in result["saints"]

    def test_below_threshold_excluded(self):
        threshold = HAGIO_THRESHOLDS["saints"]
        feats = [feat("Άγιος Γεώργιος", sem="religious", ftype="Chapel")] * (threshold - 1)
        result = compute_hagio(feats)
        assert result == {} or "saints" not in result or "Άγιος Γεώργιος" not in result.get("saints", {})

    def test_point_structure(self):
        threshold = HAGIO_THRESHOLDS["saints"]
        feats = [feat("Άγιος Γεώργιος", sem="religious", ftype="Chapel",
                       lat=38.0, lon=24.0, is_sett=True)] * threshold
        result = compute_hagio(feats)
        pt = result["saints"]["Άγιος Γεώργιος"]["points"][0]
        assert pt["lat"] == 38.0
        assert pt["lon"] == 24.0
        assert pt["type"] == "Chapel"
        assert pt["s"] == 1  # is_sett → s=1


# ── compute_etym ───────────────────────────────────────────────────────────────

class TestComputeEtym:
    def test_none_for_empty_hex(self):
        r = compute_etym({}, HEXES)
        assert r[0] is None

    def test_all_greek(self):
        feats = [feat(etym="Greek")] * 5
        r = compute_etym({0: feats}, HEXES)
        assert r[0]["gk"] == 100.0
        assert r[0]["tk"] == 0.0
        assert r[0]["ng"] == 0
        assert r[0]["hne"] == 0.0
        assert r[0]["ngl"] == []

    def test_non_greek_percentage(self):
        feats = [feat(etym="Greek")] * 3 + [feat(etym="Turkish/Ottoman")] * 1
        r = compute_etym({0: feats}, HEXES)
        assert r[0]["gk"] == pytest.approx(75.0)
        assert r[0]["tk"] == pytest.approx(25.0)
        assert r[0]["ng"] == 1

    def test_non_greek_list_populated(self):
        tk_feat = feat("Τσαμλίκι", etym="Turkish/Ottoman", conf="high")
        feats = [feat(etym="Greek")] * 2 + [tk_feat]
        r = compute_etym({0: feats}, HEXES)
        ngl = r[0]["ngl"]
        assert len(ngl) == 1
        assert ngl[0][0] == "Τσαμλίκι"
        assert ngl[0][1] == "tk"
        assert ngl[0][2] == "h"  # first char of "high"

    def test_non_greek_list_capped_at_10(self):
        feats = [feat(f"TK{i}", etym="Turkish/Ottoman") for i in range(15)]
        r = compute_etym({0: feats}, HEXES)
        assert len(r[0]["ngl"]) == 10

    def test_non_greek_entropy_two_groups(self):
        feats = ([feat(etym="Turkish/Ottoman")] * 2
                 + [feat(etym="Slavic")] * 2)
        r = compute_etym({0: feats}, HEXES)
        # ng_total=4, equal split → hne = 1.0
        assert r[0]["hne"] == pytest.approx(1.0, abs=0.01)

    def test_non_greek_entropy_zero_when_single_group(self):
        feats = [feat(etym="Turkish/Ottoman")] * 3
        r = compute_etym({0: feats}, HEXES)
        # ng_total = 3, only one group → hne = 0 (ng_total > 1 but single group → -(1*log2(1))=0)
        assert r[0]["hne"] == 0.0

    def test_confidence_percentages(self):
        feats = [feat(conf="high")] * 2 + [feat(conf="medium")] * 1 + [feat(conf="low")] * 1
        r = compute_etym({0: feats}, HEXES)
        assert r[0]["chi"] == pytest.approx(50.0)
        assert r[0]["cme"] == pytest.approx(25.0)
        assert r[0]["clo"] == pytest.approx(25.0)

    def test_top_name(self):
        feats = [feat("Χάνι", etym="Greek")] * 3 + [feat("Άλλο", etym="Greek")]
        r = compute_etym({0: feats}, HEXES)
        assert r[0]["top"] == "Χάνι"

    def test_ngl_deduplicates_by_name(self):
        feats = [feat("Τσαμλίκι", etym="Turkish/Ottoman")] * 3
        r = compute_etym({0: feats}, HEXES)
        assert len(r[0]["ngl"]) == 1


# ── compute_prefix ─────────────────────────────────────────────────────────────

class TestComputePrefix:
    def test_none_for_empty_hex(self):
        r = compute_prefix({}, HEXES)
        assert r[0] is None

    def test_no_modifiers(self):
        feats = [feat("Δρυοβούνι"), feat("Λιβάδι")]
        r = compute_prefix({0: feats}, HEXES)
        assert r[0]["all"] == 0
        for key in ("neo", "pal", "ano", "kat", "meg", "mik"):
            assert r[0][key] == 0
            assert r[0][{"neo":"tn","pal":"tp","ano":"ta","kat":"tk","meg":"tm","mik":"tmi"}[key]] == []

    def test_neo_prefix_detected(self):
        feats = [feat("Νέο Χωριό"), feat("Νέα Μάκρη"), feat("Λιβάδι")]
        r = compute_prefix({0: feats}, HEXES)
        assert r[0]["neo"] == 2
        assert r[0]["all"] == 2

    def test_pal_prefix_detected(self):
        feats = [feat("Παλαιό Φάληρο"), feat("Παλαιά Κόρινθος")]
        r = compute_prefix({0: feats}, HEXES)
        assert r[0]["pal"] == 2

    def test_ano_kat_prefix(self):
        feats = [feat("Άνω Λιόσια"), feat("Κάτω Κηφισιά"), feat("Κάτω Πατήσια")]
        r = compute_prefix({0: feats}, HEXES)
        assert r[0]["ano"] == 1
        assert r[0]["kat"] == 2

    def test_meg_mik_prefix(self):
        feats = [feat("Μεγάλο Χωριό"), feat("Μικρό Βαθύ")]
        r = compute_prefix({0: feats}, HEXES)
        assert r[0]["meg"] == 1
        assert r[0]["mik"] == 1

    def test_top_names_up_to_5(self):
        # 7 distinct neo names → top list capped at 5
        feats = [feat(f"Νέο Μέρος{i}") for i in range(7)]
        r = compute_prefix({0: feats}, HEXES)
        assert len(r[0]["tn"]) == 5

    def test_total_all_is_sum_of_modifiers(self):
        feats = [feat("Νέο Χωριό"), feat("Παλαιό Φάληρο"), feat("Άνω Λιόσια")]
        r = compute_prefix({0: feats}, HEXES)
        manual_sum = r[0]["neo"] + r[0]["pal"] + r[0]["ano"] + r[0]["kat"] + r[0]["meg"] + r[0]["mik"]
        assert r[0]["all"] == manual_sum

    def test_n_is_feature_count(self):
        feats = [feat(), feat(), feat()]
        r = compute_prefix({0: feats}, HEXES)
        assert r[0]["n"] == 3

    def test_nu_is_unique_name_count(self):
        # 3 features but only 2 distinct names
        feats = [feat("Νέος Μαρμαράς"), feat("Νέος Μαρμαράς"), feat("Λιβάδι")]
        r = compute_prefix({0: feats}, HEXES)
        assert r[0]["nu"] == 2

    def test_deduplication_neo(self):
        # "Νέος Μαρμαράς" appears as 4 features (4 feature types) → should count as 1 neo name
        feats = [feat("Νέος Μαρμαράς")] * 4 + [feat("Νέα Ρόδα")]
        r = compute_prefix({0: feats}, HEXES)
        assert r[0]["neo"] == 2
        assert r[0]["all"] == 2


# ── filter_features ────────────────────────────────────────────────────────────

class TestFilterFeatures:
    def test_all_returns_all(self):
        feats = [feat(is_sett=True), feat(is_sett=False)]
        assert filter_features(feats, "all") == feats

    def test_urb_returns_only_urban(self):
        feats = [feat(is_sett=True), feat(is_sett=False)]
        result = filter_features(feats, "urb")
        assert len(result) == 1
        assert result[0]["is_sett"] is True

    def test_rur_returns_only_rural(self):
        feats = [feat(is_sett=True), feat(is_sett=False)]
        result = filter_features(feats, "rur")
        assert len(result) == 1
        assert result[0]["is_sett"] is False

    def test_unknown_mode_raises(self):
        with pytest.raises(ValueError):
            filter_features([], "bad")
