#!/usr/bin/env python3
"""
Execute the English notebook edition in-place WITHOUT starting a Jupyter kernel.

Why this exists:
  Some execution environments (including certain sandboxed CI / agent runtimes)
  disallow opening local sockets. Standard notebook executors (nbclient,
  jupyter nbconvert --execute) communicate with the kernel over ZMQ sockets and
  will fail with PermissionError on socket bind.

This runner executes code cells via plain Python `exec()` in a single process
and writes results back into the `.ipynb` files.

What it captures:
  - stdout / stderr (as Jupyter stream outputs)
  - exceptions (as Jupyter error outputs with traceback)
  - the last expression value (as text/plain), similar to notebook behavior
  - matplotlib figures (as display_data image/png), best-effort

Limitations:
  - No ipywidgets / rich display protocol
  - The execution model is "single process, shared globals"; this matches a
    typical notebook but not an isolated kernel per notebook.

Usage:
  python scripts/execute_notebooks_en_no_kernel.py
  python scripts/execute_notebooks_en_no_kernel.py --only part4-frontiers/22-vlm.ipynb
"""

from __future__ import annotations

import argparse
import ast
import base64
import contextlib
import io
import os
import sys
import traceback
from pathlib import Path

import nbformat


REPO = Path(__file__).resolve().parent.parent
EN_DIR = REPO / "notebooks-en"


def _clear_outputs(nb) -> None:
    for cell in nb.get("cells", []):
        if cell.get("cell_type") != "code":
            continue
        cell["outputs"] = []
        cell["execution_count"] = None


def _as_stream(name: str, text: str):
    return nbformat.v4.new_output("stream", name=name, text=text)


def _as_error(exc: BaseException):
    return nbformat.v4.new_output(
        "error",
        ename=type(exc).__name__,
        evalue=str(exc),
        traceback=traceback.format_exception(type(exc), exc, exc.__traceback__),
    )


def _as_repr(value, execution_count: int):
    if value is None:
        return None
    try:
        text = repr(value)
    except Exception:
        return None
    return nbformat.v4.new_output(
        "execute_result",
        execution_count=execution_count,
        data={"text/plain": text},
        metadata={},
    )


def _as_png_display(png_bytes: bytes):
    payload = base64.b64encode(png_bytes).decode("ascii")
    return nbformat.v4.new_output(
        "display_data",
        data={"image/png": payload},
        metadata={},
    )


def _capture_matplotlib_figures():
    # Import lazily so notebooks that don't use matplotlib don't pay the cost.
    try:
        import matplotlib
        import matplotlib.pyplot as plt
    except Exception:
        return []

    # Force a non-interactive backend.
    try:
        matplotlib.use("Agg", force=True)
    except Exception:
        pass

    outputs = []
    fignums = list(plt.get_fignums())
    for num in fignums:
        try:
            fig = plt.figure(num)
            buf = io.BytesIO()
            fig.savefig(buf, format="png", bbox_inches="tight")
            outputs.append(_as_png_display(buf.getvalue()))
        except Exception:
            continue
    try:
        plt.close("all")
    except Exception:
        pass
    return outputs


def _exec_cell(source: str, env: dict):
    """
    Execute a code cell in `env`.

    If the last statement is an expression, evaluate it and return the value,
    similar to how notebooks display the last expression.
    """
    try:
        tree = ast.parse(source, mode="exec")
    except SyntaxError:
        exec(compile(source, "<cell>", "exec"), env, env)
        return None

    if not tree.body:
        exec(compile(source, "<cell>", "exec"), env, env)
        return None

    last = tree.body[-1]
    if isinstance(last, ast.Expr):
        # Execute all but the last Expr, then eval the expression.
        body = ast.Module(body=tree.body[:-1], type_ignores=[])
        expr = ast.Expression(last.value)
        exec(compile(body, "<cell>", "exec"), env, env)
        return eval(compile(expr, "<cell>", "eval"), env, env)

    exec(compile(tree, "<cell>", "exec"), env, env)
    return None


def execute_notebook(path: Path) -> None:
    nb = nbformat.read(path, as_version=4)

    # Normalize (adds missing cell ids in newer nbformat).
    try:
        nb = nbformat.validator.normalize(nb)[1]
    except Exception:
        pass

    _clear_outputs(nb)

    # Make common caches writable in this repo to avoid home-dir permission issues.
    writable_cache = str(REPO / ".xdg_cache")
    os.makedirs(writable_cache, exist_ok=True)
    os.environ.setdefault("XDG_CACHE_HOME", writable_cache)
    os.environ.setdefault("MPLCONFIGDIR", str(Path(writable_cache) / "matplotlib"))
    os.makedirs(os.environ["MPLCONFIGDIR"], exist_ok=True)

    # Ensure the repo root is importable (so notebooks can `import karpathy_models`, etc.).
    if str(REPO) not in sys.path:
        sys.path.insert(0, str(REPO))

    env: dict = {
        "__name__": "__main__",
        "__file__": str(path),
        # Convenience: many notebooks assume these exist when executed in Jupyter.
        "get_ipython": lambda: None,
    }

    exec_count = 0
    for cell in nb.get("cells", []):
        if cell.get("cell_type") != "code":
            continue
        tags = set((cell.get("metadata") or {}).get("tags") or [])
        if "skip-execution" in tags:
            # Keep it unexecuted, with cleared outputs.
            cell["execution_count"] = None
            cell["outputs"] = []
            continue
        exec_count += 1
        cell["execution_count"] = exec_count

        stdout_buf = io.StringIO()
        stderr_buf = io.StringIO()
        outputs: list[dict] = []

        with contextlib.redirect_stdout(stdout_buf), contextlib.redirect_stderr(stderr_buf):
            try:
                value = _exec_cell("".join(cell.get("source", [])), env)
            except Exception as exc:
                # flush streams
                out = stdout_buf.getvalue()
                err = stderr_buf.getvalue()
                if out:
                    outputs.append(_as_stream("stdout", out))
                if err:
                    outputs.append(_as_stream("stderr", err))
                outputs.append(_as_error(exc))
                cell["outputs"] = outputs
                # Stop executing further cells on error (matches typical batch exec).
                nbformat.write(nb, path)
                raise

        out = stdout_buf.getvalue()
        err = stderr_buf.getvalue()
        if out:
            outputs.append(_as_stream("stdout", out))
        if err:
            outputs.append(_as_stream("stderr", err))

        repr_out = _as_repr(value, execution_count=exec_count)
        if repr_out is not None:
            outputs.append(repr_out)

        outputs.extend(_capture_matplotlib_figures())
        cell["outputs"] = outputs

    nbformat.write(nb, path)


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--only",
        action="append",
        default=[],
        help="Run only one notebook relative to notebooks-en/ (can repeat).",
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
        print(f"[{idx:02d}/{len(paths):02d}] Executing {rel} (no-kernel) ...")
        try:
            execute_notebook(path)
        except Exception as exc:
            print(f"\nFAILED: {rel}")
            print(f"{type(exc).__name__}: {exc}")
            print("\nTraceback:")
            print(traceback.format_exc())
            return 1

    print(f"\nDone. Executed {len(paths)} notebooks in-place (no-kernel).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
