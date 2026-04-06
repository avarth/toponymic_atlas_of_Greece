"""
Atlas build script — assembles src/ into a single deployable HTML file.

Reads:
  src/index.html              — HTML skeleton with {{STYLE}} and {{SCRIPT}} placeholders
  src/css/style.css           — stylesheet
  src/js/*.js (JS_ORDER)      — JS modules, concatenated in dependency order

Writes:
  greek_toponymic_atlas.html  — single deployable file, placed in atlas/
                                 alongside atlas/data/*.json

VERSION is the cache-buster integer appended to JSON fetch URLs (?vN).
Git tracks history — we don't version the output filename.

The output file must be served by a local HTTP server so that the
fetch('data/*.json') calls resolve correctly:
    cd atlas
    python -m http.server 8000

Usage:
    python build.py                  # → greek_toponymic_atlas.html
    python build.py --version 14     # override cache-buster
    python build.py --dry-run        # print summary only, no file written
"""

import argparse
import os
import sys

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

VERSION = 15

JS_ORDER = [
    "src/js/constants.js",
    "src/js/i18n.js",
    "src/js/colors.js",
    "src/js/layers.js",
    "src/js/charts.js",
    "src/js/sacred.js",
    "src/js/poly.js",
    "src/js/oddities.js",
    "src/js/main.js",
]

# ---------------------------------------------------------------------------
# Script envelope — wraps all JS modules in a shared closure scope.
# The data loader fetches all JSON files, then passes them into the closure
# as `D` so every module can access ENT, SEM, etc. without ES imports.
# _v is version-keyed to bust the browser cache on each build.
# ---------------------------------------------------------------------------

def make_script_header(version: int) -> str:
    """Return the JS script header with a version-keyed cache buster."""
    return f"""\
// ── DATA (loaded from external JSON) ─────────────────────────
const DATA_FILES = {{
  ENT:'data/ent.json', SEM:'data/sem.json',
  PREFIX:'data/prefix.json', ETYM:'data/etym.json', HAGIO:'data/hagio.json',
  POLY:'data/poly.json', PROFILES:'data/profiles.json', CHARTS:'data/charts.json',
  ODD:'data/oddnames.json'
}};

const _v='v{version}';
Promise.all(
  Object.entries(DATA_FILES).map(([k,url]) =>
    fetch(url+'?'+_v).then(r => {{ if(!r.ok) throw new Error('Failed to load '+url); return r.json(); }})
              .then(d => [k, d])
  )
).then(entries => {{
const D = Object.fromEntries(entries);
document.getElementById('loading').remove();
"""

SCRIPT_FOOTER = """\
}).catch(err => {
  console.error('Atlas init error:', err);
  document.getElementById('loading').innerHTML =
    '<p style="color:#dc2626;font-family:Inter,system-ui,sans-serif;font-size:13px;text-align:center;max-width:400px;">'
    + 'Failed to load data.<br><br>'
    + '<span style="color:#6b6b63">The atlas needs a local server.<br>'
    + 'Run: <code>python -m http.server 8000</code><br>'
    + 'Then open <code>http://localhost:8000</code></span><br><br>'
    + '<span style="color:#dc2626;font-size:11px;">'+String(err.message||err).replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</span></p>';
});
"""

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def read_file(path: str) -> str | None:
    """Return file contents as a string, or None if missing/unreadable."""
    try:
        with open(path, "r", encoding="utf-8") as fh:
            return fh.read()
    except FileNotFoundError:
        return None
    except OSError as exc:
        print(f"  ERROR reading {path}: {exc}", file=sys.stderr)
        return None


def is_stub(content: str) -> bool:
    """Return True if the file has no real content (empty or .gitkeep-only)."""
    stripped = content.strip()
    return stripped == "" or stripped == ".gitkeep"


# ---------------------------------------------------------------------------
# Core build
# ---------------------------------------------------------------------------

def build(version: int, dry_run: bool) -> int:
    """Assemble the atlas HTML.  Returns exit code (0 = success)."""

    # Resolve paths relative to the directory containing this script
    script_dir = os.path.dirname(os.path.abspath(__file__))

    index_path = os.path.join(script_dir, "src", "index.html")
    css_path   = os.path.join(script_dir, "src", "css", "style.css")
    out_name   = "greek_toponymic_atlas.html"
    out_path   = os.path.join(script_dir, out_name)

    print(f"Atlas build  —  v{version}")
    print(f"  template : {index_path}")
    print(f"  css      : {css_path}")
    print(f"  output   : {out_path}")
    print()

    # -- 1. Read template ----------------------------------------------------
    template = read_file(index_path)
    if template is None:
        print(f"ERROR: src/index.html not found at {index_path}", file=sys.stderr)
        return 1

    if "{{STYLE}}" not in template:
        print("WARNING: {{STYLE}} placeholder not found in src/index.html", file=sys.stderr)
    if "{{SCRIPT}}" not in template:
        print("WARNING: {{SCRIPT}} placeholder not found in src/index.html", file=sys.stderr)

    # -- 2. Read CSS ---------------------------------------------------------
    css = read_file(css_path)
    if css is None:
        print(f"ERROR: src/css/style.css not found at {css_path}", file=sys.stderr)
        return 1

    # -- 3. Build JS string --------------------------------------------------
    js_parts = [make_script_header(version)]
    included = []
    skipped  = []

    for rel_path in JS_ORDER:
        abs_path = os.path.join(script_dir, rel_path)
        content  = read_file(abs_path)

        if content is None:
            print(f"  SKIP (missing)  : {rel_path}")
            skipped.append(rel_path)
            continue

        if is_stub(content):
            print(f"  SKIP (stub/empty): {rel_path}")
            skipped.append(rel_path)
            continue

        filename = os.path.basename(rel_path)
        js_parts.append(f"\n// ── {filename} ──\n")
        js_parts.append(content)
        included.append(rel_path)
        print(f"  OK              : {rel_path}  ({len(content):,} chars)")

    js_parts.append(SCRIPT_FOOTER)
    js_string = "".join(js_parts)

    # All modules in JS_ORDER are required — fail loudly if any are missing
    if skipped:
        print(f"\nERROR: {len(skipped)} required JS module(s) missing:", file=sys.stderr)
        for s in skipped:
            print(f"  - {s}", file=sys.stderr)
        return 1

    if not included:
        print("  WARNING: no JS modules were included — output will have no rendering code.", file=sys.stderr)

    # -- 4. Assemble HTML ----------------------------------------------------
    html = template
    html = html.replace("{{STYLE}}", css, 1)
    html = html.replace("{{SCRIPT}}", js_string, 1)

    # -- 5. Report -----------------------------------------------------------
    print()
    print(f"  JS modules included : {len(included)}")
    print(f"  JS modules skipped  : {len(skipped)}")
    print(f"  Output size         : {len(html.encode('utf-8')):,} bytes")

    if dry_run:
        print()
        print("  [dry-run] No file written.")
        return 0

    # -- 6. Write ------------------------------------------------------------
    try:
        with open(out_path, "w", encoding="utf-8") as fh:
            fh.write(html)
        print(f"  Written: {out_path}")
    except OSError as exc:
        print(f"ERROR writing output file: {exc}", file=sys.stderr)
        return 1

    return 0


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Assemble the Greek Toponymic Atlas into a single HTML file."
    )
    parser.add_argument(
        "--version",
        type=int,
        default=VERSION,
        metavar="N",
        help=f"Atlas version number (default: {VERSION})",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print summary but do not write the output file.",
    )
    args = parser.parse_args()

    sys.exit(build(version=args.version, dry_run=args.dry_run))


if __name__ == "__main__":
    main()
