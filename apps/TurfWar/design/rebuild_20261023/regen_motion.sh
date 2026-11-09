#!/bin/sh
# Rebuild the Turf v5 cast from the recipes (2026-11-05):
#   kit/<who>/recipe.json + recipe_celebrate.json → kit/<who>/spine/turf_<who>.json
#   → build_mesh_cast.py (weights) → mesh_to_spine.mjs (installs static/.../turf/v5)
set -e
D=$(cd "$(dirname "$0")" && pwd); APP=$(cd "$D/../.." && pwd)
GEN="node $HOME/tools/spine-generator/bin/spine-motion.js generate"
for w in mg fg; do
  K="$D/kit/$w/spine/turf_$w.json"
  $GEN "$K" "$D/kit/$w/recipe.json" -o "$K" >/dev/null
  $GEN "$K" "$D/kit/$w/recipe_celebrate.json" -o "$K" >/dev/null
done
cd "$APP"
/Applications/anaconda3/bin/python3 "$D/build_mesh_cast.py"
node "$D/mesh_to_spine.mjs"
