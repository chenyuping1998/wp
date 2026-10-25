#!/usr/bin/env bash
# design/swing/rebuild.sh [frames...] : cut -> mesh -> both casts' pieces -> (optional) contact sheet in $SHEET (CAST=fg for the caddie)
set -e
cd "$(dirname "$0")/../.."
PY=E:/stake/math-sdk/env/Scripts/python.exe
export PATH="/e/stake/tools/node-v22.23.1-win-x64:$PATH"
if [ -z "$SKIP_CUT" ]; then $PY -I design/swing/cut_golfer_arms.py >/dev/null; $PY -I design/swing/cut_caddie_flag.py >/dev/null; fi
$PY ../../tools/build_cast_mesh.py Putt >/dev/null
node design/swing/build_golfer_swing.mjs | grep -E "score|ball"
node design/swing/build_caddie_flag.mjs | grep -E "score"
if [ $# -gt 0 ]; then
  node design/swing/dump_frames.mjs "$SHEET.json" "$@"
  $PY -I design/swing/render_frames.py "$SHEET.json" "$SHEET" ${COLS:-4} ${SCALE:-0.9}
fi
