#!/usr/bin/env python3
"""Dump homework section structure for each Chinese notebook."""
import json
import os
import glob
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIR = os.path.join(ROOT, "notebooks")


def load_notebook(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def dump(path):
    nb = load_notebook(path)
    cells = nb["cells"]
    hw_idx = None
    for i, c in enumerate(cells):
        if c["cell_type"] == "markdown":
            src = "".join(c["source"])
            if re.search(r"^#+\s*作业", src, re.M):
                hw_idx = i
                break
    if hw_idx is None:
        print(f"### {os.path.relpath(path, ROOT)}: NO HW")
        return
    hw_cells = cells[hw_idx:]
    for i, c in enumerate(hw_cells):
        if i == 0:
            continue
        if c["cell_type"] == "markdown":
            src = "".join(c["source"])
            if re.match(r"^##\s", src) and not re.match(r"^##\s*作业", src):
                hw_cells = hw_cells[:i]
                break
    print(f"\n### {os.path.relpath(path, ROOT)}  ({len(hw_cells)} cells)")
    for i, c in enumerate(hw_cells):
        src = "".join(c["source"])
        first = src.strip().splitlines()[0] if src.strip() else "(empty)"
        if len(first) > 90:
            first = first[:90] + "..."
        print(f"  [{i}] {c['cell_type']:<8} | {first}")


def main():
    files = sorted(glob.glob(os.path.join(DIR, "**", "*.ipynb"), recursive=True))
    for path in files:
        dump(path)


if __name__ == "__main__":
    main()