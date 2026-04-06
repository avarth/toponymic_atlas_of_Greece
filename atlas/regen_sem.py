"""
Targeted regeneration of atlas/data/sem.json with the new `he` field
(thematic entropy). Runs classify→assign→compute_sem only.
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from prep_filtered_data import (
    load_gazetteer, classify_features, assign_to_hexes,
    build_filtered_hexes, compute_sem, write_json,
    GAZ_PATH, GHSL_PATH, SETT_SHP, HEX_PATH,
)

def main():
    features = load_gazetteer(GAZ_PATH)

    with open(HEX_PATH, encoding="utf-8") as f:
        hexes_raw = json.load(f)
    hexes = [{"b": h["b"], "c": h.get("c", [0, 0])} for h in hexes_raw]
    print(f"Loaded {len(hexes)} hexes")

    classify_features(features, GHSL_PATH, SETT_SHP)
    hex_features = assign_to_hexes(features, hexes)

    print("\n--- Regenerating sem.json ---")
    sem_data = build_filtered_hexes(compute_sem, hex_features, hexes, min_feats=1)
    write_json(sem_data, "sem.json")
    print("Done.")


if __name__ == "__main__":
    main()
