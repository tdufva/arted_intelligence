#!/usr/bin/env python3

from __future__ import annotations

import shutil
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"

FILES_TO_COPY = [
    ("index.html", "index.html"),
    ("site/styles.css", "site/styles.css"),
    ("site/app.js", "site/app.js"),
    ("site/data/corpus-data.js", "site/data/corpus-data.js"),
    ("site/data/openalex-data.js", "site/data/openalex-data.js"),
]


def rebuild_data_assets() -> None:
    subprocess.run(["python3", str(ROOT / "scripts" / "build_dataset.py")], check=True)

    openalex_json = ROOT / "site" / "data" / "openalex_citations.json"
    openalex_js = ROOT / "site" / "data" / "openalex-data.js"
    openalex_js.write_text(f"window.OPENALEX_DATA = {openalex_json.read_text(encoding='utf-8')};\n", encoding="utf-8")


def prepare_docs_dir() -> None:
    DOCS.mkdir(exist_ok=True)
    (DOCS / ".nojekyll").write_text("", encoding="utf-8")


def copy_bundle() -> None:
    for src_rel, dest_rel in FILES_TO_COPY:
        src = ROOT / src_rel
        dest = DOCS / dest_rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dest)


def main() -> None:
    rebuild_data_assets()
    prepare_docs_dir()
    copy_bundle()
    print(f"Prepared GitHub Pages bundle in {DOCS}")
    print("Publish by pushing this folder to GitHub and enabling Pages from the /docs folder on your main branch.")


if __name__ == "__main__":
    main()
