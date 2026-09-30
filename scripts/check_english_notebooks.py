#!/usr/bin/env python3
"""Validate the English notebook edition."""

import ast
import json
import re
import sys
from pathlib import Path


REPO = Path(__file__).resolve().parent.parent
ZH_DIR = REPO / "notebooks"
EN_DIR = REPO / "notebooks-en"
CJK = re.compile(r"[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]")


def untranslated_source(source, cell, zh_cell, errors, label):
    """Exclude only explicitly preserved data excerpts present in the source edition."""
    fragments = cell.get("metadata", {}).get("translation", {}).get(
        "preserved_source_fragments", []
    )
    if not isinstance(fragments, list):
        errors.append(f"{label}: preserved_source_fragments must be a list")
        return source
    zh_source = cell_source(zh_cell)
    for fragment in fragments:
        if not isinstance(fragment, str) or not fragment or not CJK.search(fragment):
            errors.append(f"{label}: invalid preserved data excerpt")
            continue
        if fragment not in zh_source or fragment not in source:
            errors.append(f"{label}: preserved excerpt must occur in both language sources")
            continue
        source = source.replace(fragment, "")
    return source


def syntax_source(source, zh_source):
    """Validate operator blanks without filling the student's answer in the notebook."""
    # A comparison-operator exercise deliberately uses `rand ___ t` in both editions.
    # Validate the surrounding Python using an arbitrary syntactic operator.
    pattern = r"(?m)^(\s*mask = rand )___( t\b)"
    if re.search(pattern, source) and re.search(pattern, zh_source):
        return re.sub(pattern, r"\1+\2", source)
    return source

def cell_source(cell):
    source = cell.get("source", "")
    if isinstance(source, list):
        return "".join(source)
    return source


def output_text(output):
    if output.get("output_type") == "stream":
        text = output.get("text", "")
        return "".join(text) if isinstance(text, list) else text

    data = output.get("data", {})
    text_chunks = []
    for key in ("text/plain", "text/html"):
        value = data.get(key)
        if value is None:
            continue
        text_chunks.append("".join(value) if isinstance(value, list) else value)
    return "\n".join(text_chunks)


def notebook_errors(path):
    rel = path.relative_to(EN_DIR)
    zh_path = ZH_DIR / rel
    errors = []

    if not zh_path.exists():
        errors.append(f"{rel}: missing Chinese source pair")
        return errors

    en_nb = json.loads(path.read_text(encoding="utf-8"))
    zh_nb = json.loads(zh_path.read_text(encoding="utf-8"))

    if len(en_nb.get("cells", [])) != len(zh_nb.get("cells", [])):
        errors.append(
            f"{rel}: cell count {len(en_nb.get('cells', []))} != "
            f"{len(zh_nb.get('cells', []))}"
        )

    en_types = [cell.get("cell_type") for cell in en_nb.get("cells", [])]
    zh_types = [cell.get("cell_type") for cell in zh_nb.get("cells", [])]
    if en_types != zh_types:
        errors.append(f"{rel}: cell type sequence differs from Chinese source")

    for index, cell in enumerate(en_nb.get("cells", [])):
        zh_cell = zh_nb.get("cells", [])[index] if index < len(zh_types) else {}
        label = f"{rel}: cell {index}"
        source = cell_source(cell)
        remaining = untranslated_source(source, cell, zh_cell, errors, label)
        if CJK.search(remaining):
            errors.append(f"{label}: untranslated CJK characters remain in source")
        if cell.get("cell_type") != "code":
            continue
        try:
            ast.parse(syntax_source(source, cell_source(zh_cell)), filename=label)
        except SyntaxError as exc:
            errors.append(f"{rel}: code cell {index} syntax error: {exc.msg}")

        output_source = "\n".join(output_text(output) for output in cell.get("outputs", []))
        if CJK.search(output_source):
            errors.append(f"{rel}: code cell {index} output still contains CJK characters")

        for output in cell.get("outputs", []):
            if output.get("output_type") == "error":
                errors.append(f"{rel}: code cell {index} has error output")

    return errors


def main():
    paths = sorted(EN_DIR.glob("**/*.ipynb"))
    errors = []
    for path in paths:
        errors.extend(notebook_errors(path))

    if errors:
        print("English notebook check failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print(f"English notebook check passed: {len(paths)} notebooks")
    return 0


if __name__ == "__main__":
    sys.exit(main())
