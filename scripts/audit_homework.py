#!/usr/bin/env python3
"""Positional homework audit for Chinese notebooks.

Walks cells in order. Tracks the current homework problem from markdown
"作业 N" markers, then marks each problem's code_assert / hint based on
the code cells and markdown that follow it.
"""
import json
import os
import glob
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIR = os.path.join(ROOT, "notebooks")


def load_notebook(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def analyze(path):
    nb = load_notebook(path)
    cells = nb["cells"]

    hw_idx = None
    for i, c in enumerate(cells):
        if c["cell_type"] == "markdown":
            src = "".join(c["source"])
            if re.search(r"作业", src) and re.search(r"^#+\s*作业", src, re.M):
                hw_idx = i
                break

    if hw_idx is None:
        return {"file": os.path.relpath(path, ROOT), "has_hw": False,
                "problems": [], "no_assert": [], "no_hint": [], "notes": "NO HW"}

    hw_cells = cells[hw_idx:]
    # stop at next top-level ## section (non-作业)
    for i, c in enumerate(hw_cells):
        if i == 0:
            continue
        if c["cell_type"] == "markdown":
            src = "".join(c["source"])
            if re.match(r"^##\s", src) and not re.match(r"^##\s*作业", src):
                hw_cells = hw_cells[:i]
                break

    # positional walk
    cur = None          # current problem number
    problems = {}       # num -> {"md":bool,"hint":bool,"code_assert":bool}
    for c in hw_cells:
        src = "".join(c["source"])
        if c["cell_type"] == "markdown":
            # detect new problem number in this cell
            nums = [int(x) for x in re.findall(r"作业\s*(\d+)", src)]
            if nums:
                cur = max(nums)
                problems.setdefault(cur, {"md": False, "hint": False, "code_assert": False})
                problems[cur]["md"] = True
                if re.search(r"小提示|提示", src):
                    problems[cur]["hint"] = True
            else:
                # general hint text in a problem-adjacent md cell
                if cur is not None and re.search(r"小提示|提示", src):
                    problems[cur]["hint"] = True
        else:  # code
            if cur is not None and "assert" in src:
                problems[cur]["code_assert"] = True

    nums = sorted(problems.keys())
    no_assert = [n for n, v in problems.items() if not v["code_assert"]]
    no_hint = [n for n, v in problems.items() if not v["hint"]]

    return {
        "file": os.path.relpath(path, ROOT),
        "has_hw": True,
        "problems": nums,
        "no_assert": no_assert,
        "no_hint": no_hint,
    }


def main():
    files = sorted(glob.glob(os.path.join(DIR, "**", "*.ipynb"), recursive=True))
    print(f"{'notebook':<58} {'#probs':<10} {'no_assert':<10} {'no_hint'}")
    print("-" * 100)
    for path in files:
        r = analyze(path)
        if not r["has_hw"]:
            print(f"{r['file']:<58} {'--':<10} {'NO HW':<10} {'':<10}")
            continue
        print(f"{r['file']:<58} {str(r['problems']):<10} {str(r['no_assert']):<10} {str(r['no_hint'])}")


if __name__ == "__main__":
    main()