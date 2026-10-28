#!/bin/zsh
# Hypno Monkey — stage the release into upload/HypnoMonkey/. Ported from
# SumoMonkey's design/ship.sh, without the playtest stub (this app has its own
# ?mock=1 dev RGS, which never ships: it is gated on import.meta.env.DEV).
#
#   ./design/ship.sh          full pipeline, staged into upload/HypnoMonkey/ — NO zips
#   ./design/ship.sh --zip    the same, and then build the three zips
#   ./design/ship.sh --check  sanity greps only, no rebuild
#
# A green run is not a verified game — open the build and look.
set -e

ROOT=/Users/stone/stake-engine
APP=$ROOT/wp-hypno/apps/HypnoMonkey
GAME=hypno_monkey
NAME=HypnoMonkey
OUT=$ROOT/upload/$NAME

say() { print -P "%F{cyan}==> $1%f"; }

checks() {
  say "6. sanity checks (the actual gate, not the zip)"
  local fail=0
  # Medusa Gaze is the source game. Internal medusa* identifiers and folder
  # names are known leftovers (renamed later), and so are lowercase code props
  # like `petrify` and audio keys like sfx_petrify_1; these are the PLAYER-VISIBLE words.
  for term in "Medusa Gaze" "MEDUSA GAZE" "MEDUSA" "Aegis" "AEGIS" "Gorgon" "Petrif" "PETRIF" "sunglasses" "Sunglasses"; do
    local n=$(rg -o --glob "*.html" --glob "*.js" --glob "*.json" "$term" $OUT/frontend 2>/dev/null | wc -l | tr -d ' ')
    [[ "$n" != "0" ]] && { print "  FAIL: '$term' x$n in the upload frontend"; fail=1; }
  done
  local hosts=$(rg -o --glob "*.html" --glob "*.js" "localhost:[0-9]+|stub\.local|mock\.local" $OUT/frontend | sort -u)
  [[ -n "$hosts" ]] && { print "  FAIL: dev hosts in the upload frontend: $hosts"; fail=1; }
  # Medusa-only art that the game no longer loads must not ship.
  local old=$(cd $OUT/frontend/assets 2>/dev/null && find . -type d | grep -E "medusa43|medusaBackground|medusaBrand|medusaFrame|medusaIntro|medusaOrbs|medusaSymbols|medusaUi$|medusaWinBanners|hypnoInterim" || true)
  [[ -n "$old" ]] && { print "  FAIL: unused Medusa asset folders shipped:"; print "$old" | sed 's/^/    /'; fail=1; }
  rg -q "TM and © 2026 Engine\." $OUT/frontend \
    || { print "  FAIL: the dictated disclaimer line is missing or reworded"; fail=1; }
  grep -rqE "15e3|15000" $OUT/frontend/_app 2>/dev/null \
    || { print "  FAIL: 15,000x cap not present in the shipped bundle"; fail=1; }
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

say "3. upload frontend (fresh copy, then drop Medusa-only folders)"
rsync -a --delete $APP/build/ $OUT/frontend/
for d in spines/medusa43 sprites/medusaBackground sprites/medusaBrand sprites/medusaFrame sprites/medusaIntro \
         sprites/medusaOrbs sprites/medusaSymbols sprites/medusaUi sprites/medusaWinBanners sprites/hypnoInterim; do
  rm -rf $OUT/frontend/assets/$d
done

say "4. thumbnail and cover (design/store_upload/build_upload_store.py)"
python3 $APP/design/store_upload/build_upload_store.py
mkdir -p $OUT/thumbnail $OUT/cover
cp $APP/design/store_upload/thumbnail/*.png $OUT/thumbnail/
cp $APP/design/store_upload/cover/*.png $OUT/cover/

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
