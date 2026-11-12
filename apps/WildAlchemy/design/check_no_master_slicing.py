"""Gate: flag any design/ script that slices Spine/cast parts from one master image.

Five rounds now (2026-08-27 x2, 2026-08-28, 2026-08-29 x2) a "final art" delivery
turned out to be a script that opens ONE whole-figure illustration and calls
.crop() a dozen-plus times to fabricate "independent parts" — sometimes with
added noise to inflate check_source_art.py's colour count, sometimes with
colour-threshold masking to erase the overlap check_spine_parts_overlap.py
looks for. Each version was aimed at whatever check existed at the time; none
of them involved an artist actually drawing anything. This gate does not try
to out-clever the next version of that trick — it flags the STRUCTURAL shape
that every version shares: one source image, opened once, cropped many times,
each crop saved as a differently-named "part".

This is a lint over design/*.py, not over the images themselves — it exists so
the next occurrence gets caught at the script-review stage, before a batch
even reaches check_spine_parts_overlap.py or review_sheet.py.

Usage: python3 design/check_no_master_slicing.py
Exits non-zero if any file matches the pattern.
"""

import re
import sys
from pathlib import Path

DESIGN_DIR = Path(__file__).resolve().parent
CROP_THRESHOLD = 4  # this many .crop() calls in one file is not "trim one image"

# Scripts that legitimately do lots of geometric/compositing work on purpose
# (this file's own test fixtures, atlas packers that paste already-separate
# parts, etc.) — reviewed once, allowed to stay.
ALLOWLIST = {
    "check_no_master_slicing.py",
}


def scan(path: Path):
    text = path.read_text(encoding="utf-8", errors="ignore")
    crop_calls = len(re.findall(r"\.crop\s*\(", text))
    if crop_calls < CROP_THRESHOLD:
        return None

    # How many distinct source images does this script open? Slicing-from-one-
    # master looks like a SINGLE Image.open(...) feeding all those .crop()
    # calls; a legitimate multi-file pipeline opens roughly as many sources as
    # parts it produces.
    #
    # A script can dilute this by opening a couple of extra one-off paths
    # alongside the real master (2026-08-29: generate_each_spine_part_
    # independently.py mixed a few genuinely separate assets in with 25
    # .crop() calls on GUY_REF/GIRL_REF, which pushed distinct_sources past a
    # flat threshold while the master-slicing was still doing the bulk of the
    # work). So this also checks, per variable, how many .crop( calls are
    # actually chained off IT — `GUY_REF.crop(`, `ref.crop(` where `ref =
    # GUY_REF...`, etc. — and flags if any single variable accounts for most
    # of the crops on its own, regardless of what else the file opens.
    opens = re.findall(r"Image\.open\(\s*([A-Za-z_][A-Za-z0-9_]*)", text)
    distinct_sources = len(set(opens))

    per_var_crops: dict[str, int] = {}
    for var in set(opens):
        # crops directly on the variable, or on a name assigned from it
        # (`sub = VAR...`, `x = VAR.something...`) — one hop of aliasing.
        aliases = {var}
        # `X = VAR` or `X = Image.open(VAR)...` (any chained calls after)
        pattern = (
            rf"^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"
            rf"(?:{re.escape(var)}\b|Image\.open\(\s*{re.escape(var)}\b)"
        )
        for m in re.finditer(pattern, text, re.MULTILINE):
            aliases.add(m.group(1))
        count = 0
        for alias in aliases:
            count += len(re.findall(rf"{re.escape(alias)}\.crop\s*\(", text))
        per_var_crops[var] = count
    max_single_var_crops = max(per_var_crops.values(), default=0)

    save_calls = len(re.findall(r"\.save\s*\(", text))

    if (distinct_sources <= 2 or max_single_var_crops >= CROP_THRESHOLD) and save_calls >= CROP_THRESHOLD:
        return (
            f"{crop_calls} .crop() calls, {save_calls} .save() calls, but only "
            f"{distinct_sources} distinct source image(s) opened — looks like one "
            f"master illustration sliced into many \"parts\" rather than each part "
            f"independently drawn."
        )
    return None


def main():
    hits = []
    for path in sorted(DESIGN_DIR.glob("*.py")):
        if path.name in ALLOWLIST:
            continue
        reason = scan(path)
        if reason:
            hits.append((path, reason))

    if not hits:
        print("check_no_master_slicing: PASSED — no script matches the master-slice shape")
        return

    print("check_no_master_slicing: FAILED\n")
    for path, reason in hits:
        print(f"  {path.relative_to(DESIGN_DIR.parent)}")
        print(f"    {reason}\n")
    print(
        "These scripts should not run against real deliverable art. If a script here "
        "is a genuine multi-source compositor, add it to ALLOWLIST after reviewing it "
        "by hand — do not add it just to make this pass."
    )
    sys.exit(1)


if __name__ == "__main__":
    main()
