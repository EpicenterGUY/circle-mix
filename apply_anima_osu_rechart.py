#!/usr/bin/env python3
"""Replace only CIRCLE MIX's built-in ANiMA NORMAL/TECH generator block.

Usage from the repository root:
    python apply_anima_osu_rechart.py
Or:
    python apply_anima_osu_rechart.py /path/to/repository
"""
from __future__ import annotations

import shutil
import sys
from pathlib import Path

START = "  function generateAnimaNormalChart(){"
END = "  function generateNormalChart(){"


def main() -> int:
    repo = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path.cwd().resolve()
    target = repo / "src" / "game.js"
    snippet = Path(__file__).with_name("anima_osu_rechart_snippet.js")

    if not target.is_file():
        print(f"ERROR: not found: {target}", file=sys.stderr)
        return 2
    if not snippet.is_file():
        print(f"ERROR: not found: {snippet}", file=sys.stderr)
        return 2

    text = target.read_text(encoding="utf-8")
    if text.count(START) != 1 or text.count(END) != 1:
        print("ERROR: expected exactly one ANiMA generator block; repository structure changed.", file=sys.stderr)
        return 3

    start = text.index(START)
    end = text.index(END, start)
    block = snippet.read_text(encoding="utf-8").rstrip() + "\n\n"
    updated = text[:start] + block + text[end:]

    backup = target.with_suffix(".js.before-anima-osu-rechart.bak")
    if not backup.exists():
        shutil.copy2(target, backup)
    target.write_text(updated, encoding="utf-8")

    print(f"Updated: {target}")
    print(f"Backup:  {backup}")
    print("Only generateAnimaNormalChart() through generateAnimaTechChart() was replaced.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
