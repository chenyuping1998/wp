#!/bin/zsh
# Dragon Tide — stage the release into upload/DragonTide/. Ported from HypnoMonkey's
# design/ship.sh (this app is a Hypno/Medusa reskin; its ?mock=1 dev RGS never ships:
# it is gated on import.meta.env.DEV).
#
#   ./design/ship.sh          full pipeline, staged into upload/DragonTide/ — NO zips
#   ./design/ship.sh --zip    the same, and then build the three zips
#   ./design/ship.sh --check  sanity greps only, no rebuild
#
# Store art is built separately (python3 design/build_store_art.py) and only verified here.
# A green run is not a verified game — open the build and look.
set -e

ROOT=/Users/stone/stake-engine
APP=$ROOT/wp-dragon/apps/DragonTide
GAME=dragon_tide
NAME=DragonTide
OUT=$ROOT/upload/$NAME

say() { print -P "%F{cyan}==> $1%f"; }

checks() {
  say "6. sanity checks (the actual gate, not the zip)"
  local fail=0
  # Medusa Gaze -> Hypno Monkey -> Dragon Tide. Internal medusa*/hypno* identifiers, folder
  # names and audio keys are known leftovers; these are the PLAYER-VISIBLE words.
  for term in "Medusa" "MEDUSA" "Aegis" "AEGIS" "Gorgon" "Petrif" "PETRIF" "Hypno Monkey" "HYPNO" "Hypnotist" "HYPNOTIST" \
              "pocket watch" "Pocket Watch" "POCKET WATCH" "Circus" "CIRCUS" "Sunglasses" "sunglasses"; do
    local n=$(rg -o --glob "*.html" --glob "*.js" --glob "*.json" "$term" $OUT/frontend 2>/dev/null | wc -l | tr -d ' ')
    [[ "$n" != "0" ]] && { print "  FAIL: '$term' x$n in the upload frontend"; fail=1; }
  done
  local hosts=$(rg -o --glob "*.html" --glob "*.js" "localhost:[0-9]+|stub\.local|mock\.local" $OUT/frontend | sort -u)
  [[ -n "$hosts" ]] && { print "  FAIL: dev hosts in the upload frontend: $hosts"; fail=1; }
  rg -q "TM and © 2026 Engine\." $OUT/frontend \
    || { print "  FAIL: the dictated disclaimer line is missing or reworded"; fail=1; }
  grep -rqE "2e4|20000" $OUT/frontend/_app 2>/dev/null \
    || { print "  FAIL: 20,000x cap not present in the shipped bundle"; fail=1; }
  # the shipped cast is the packed r12 revision (AGENTS.md: same final revision everywhere)
  for k in mg fg; do
    local want=$(python3 -c "import json;print(json.load(open('$APP/design/cast_dragon/runtime-manifest.json'))['$k']['atlasSha256'])")
    local got=$(shasum -a 256 $OUT/frontend/assets/sprites/dragonCast/$k-atlas.png | cut -d' ' -f1)
    [[ "$want" != "$got" ]] && { print "  FAIL: shipped $k cast atlas is not the packed r12 one"; fail=1; }
  done
  diff -rq $ROOT/math-sdk/games/$GAME/library/publish_files/ $OUT/math >/dev/null \
    || { print "  FAIL: staged math differs from the math library"; fail=1; }
  for f in cover/$NAME-Cover-BG.png cover/$NAME-Cover-FG.png thumbnail/$NAME-Thumbnail-BG.png thumbnail/$NAME-Thumbnail-FG.png; do
    [[ -f $OUT/$f ]] || { print "  FAIL: store art missing: $f"; fail=1; }
  done
  [[ $fail == 1 ]] && { print "\nPACKAGE IS CONTAMINATED — do not upload."; return 1; }
  print "  all clean"
}

ZIP=0
for arg in "$@"; do [[ "$arg" == "--zip" ]] && ZIP=1; done
if [[ "$1" == "--check" ]]; then checks; exit $?; fi

say "1. math library -> upload/$NAME/math"
mkdir -p $OUT/math
rsync -a --delete $ROOT/math-sdk/games/$GAME/library/publish_files/ $OUT/math/

say "2. frontend build + guards (syncs the math config first)"
cd $APP && pnpm run build

say "3. upload frontend (fresh copy)"
rsync -a --delete $APP/build/ $OUT/frontend/

say "4. thumbnail and cover — built by design/build_store_art.py, verified in checks"

say "5. README"
cp $APP/design/UPLOAD_README.md $OUT/README.md

checks

if [[ "$ZIP" == "1" ]]; then
  say "7. zip (asked for with --zip)"
  cd $ROOT/upload
  rm -f $NAME-frontend.zip $NAME-math.zip $NAME-upload.zip
  zip -qr $NAME-frontend.zip $NAME/frontend
  zip -qr $NAME-math.zip $NAME/math
  zip -qr $NAME-upload.zip $NAME
  ls -lh $NAME-*.zip
else
  say "7. zip — SKIPPED (pass --zip to build them)"
  print "   staged bundle is ready at $OUT/"
fi
