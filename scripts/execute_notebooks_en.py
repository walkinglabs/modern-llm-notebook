#!/usr/bin/env python3
"""
Execute the English notebook edition in-place.

This script:
1) Finds all .ipynb under notebooks-en/
2) Clears existing code cell outputs (so results are fresh)
3) Executes notebooks with nbclient
4) Writes results back to the same .ipynb file

Usage:
  python scripts/execute_notebooks_en.py
  python scripts/execute_notebooks_en.py --only part2-training/11-training-loss.ipynb
  python scripts/execute_notebooks_en.py --timeout 1200
"""

from __future__ import annotations

import argparse
import sys
import traceback
from pathlib import Path

import nbformat
from nbclient import NotebookClient


REPO = Path(__file__).resolve().parent.parent
EN_DIR = REPO / "notebooks-en"


def _clear_outputs(nb):
    for cell in nb.get("cells", []):
        if cell.get("cell_type") != "code":
            continue
        cell["outputs"] = []
        cell["execution_count"] = None


def execute_notebook(path: Path, timeout_s: int) -> None:
    nb = nbformat.read(path, as_version=4)

    # Normalize (adds missing cell ids in newer nbformat; safe even if already present).
    try:
        # nbformat.validator.normalize returns (nbformat_minor, normalized_nb)
        nb = nbformat.validator.normalize(nb)[1]
    except Exception:
        # Older nbformat versions may not expose normalize consistently; keep going.
        pass

    _clear_outputs(nb)

    client = NotebookClient(
        nb,
        timeout=timeout_s,
        kernel_name="python3",
        resources={"metadata": {"path": str(path.parent)}},
    )
    # Respect the convention used by this repo: cells tagged with "skip-execution"
    # contain exercises/placeholders and should not run in batch execution.
    client.skip_cells_with_tag = "skip-execution"
    client.execute()

    nbformat.write(nb, path)


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--timeout",
        type=int,
        default=1200,
        help="Per-cell timeout in seconds (default: 1200).",
    )
    parser.add_argument(
        "--only",
        action="append",
        default=[],
        help=(
            "Run only one notebook relative to notebooks-en/ "
            "(can be provided multiple times)."
        ),
    )
    args = parser.parse_args(argv)

    if not EN_DIR.exists():
        print(f"notebooks-en directory not found: {EN_DIR}")
        return 2

    if args.only:
        paths = []
        for rel in args.only:
            p = EN_DIR / rel
            if not p.exists():
                print(f"--only path does not exist: {p}")
                return 2
            paths.append(p)
    else:
        paths = sorted(EN_DIR.glob("**/*.ipynb"))

    if not paths:
        print("No English notebooks found.")
        return 0

    for idx, path in enumerate(paths, start=1):
        rel = path.relative_to(EN_DIR)
        print(f"[{idx:02d}/{len(paths):02d}] Executing {rel} ...")
        try:
            execute_notebook(path, timeout_s=args.timeout)
        except Exception as exc:
            print(f"\nFAILED: {rel}")
            print(f"{type(exc).__name__}: {exc}")
            print("\nTraceback:")
            print(traceback.format_exc())
            return 1

    print(f"\nDone. Executed {len(paths)} notebooks in-place.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
