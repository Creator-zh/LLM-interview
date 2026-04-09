#!/usr/bin/env python3
"""Pre-process solution notebooks into a static JSON file for the frontend."""

import json
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
SOLUTIONS_DIR = ROOT / "solutions"
OUTPUT = ROOT / "web" / "src" / "lib" / "solutions.json"

SKIP_PATTERNS = ("google.colab", "torch_judge", "get_ipython", "colab.research.google.com")
SOLUTION_MARKER = re.compile(r"#\s*✅\s*SOLUTION")


def strip_comment_lines(src: str) -> str:
    lines = [l for l in src.splitlines() if not l.strip().startswith("#")]
    return "\n".join(lines).strip()


def strip_imports(src: str) -> str:
    lines = [l for l in src.splitlines() if not l.startswith("import ") and not l.startswith("from ")]
    return "\n".join(lines).strip()


def process_notebook(path: Path) -> list[dict]:
    nb = json.loads(path.read_text(encoding="utf-8"))
    cells = []
    for c in nb.get("cells", []):
        src = "".join(c["source"])
        if not src.strip() or any(s in src for s in SKIP_PATTERNS):
            continue
        if c["cell_type"] == "code":
            is_solution = bool(SOLUTION_MARKER.search(src))
            stripped = strip_imports(strip_comment_lines(src))
            if not stripped:
                continue
            role = "solution" if is_solution else "demo"
            cells.append({"type": "code", "source": stripped, "role": role})
        else:
            cells.append({"type": c["cell_type"], "source": src.strip(), "role": "explanation"})
    return cells


def main():
    result = {}
    notebooks = sorted(SOLUTIONS_DIR.glob("*_solution.ipynb"))
    for nb_path in notebooks:
        # filename: NN_{task_id}_solution.ipynb
        task_id = re.sub(r"^\d+_", "", nb_path.stem).replace("_solution", "")
        cells = process_notebook(nb_path)
        if not cells:
            print(f"WARNING: no cells for {task_id}")
            continue
        result[task_id] = {"cells": cells}

    OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Written {len(result)} solutions to {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
