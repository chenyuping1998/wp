#!/usr/bin/env bash
# Repeatable packaging pipeline for Turf War (game-reskin skill, phase 8).
# Every math change invalidates config.ts, the playtest stub and every zip.
# Run this from anywhere; paths are absolute-relative to the repo.
set -euo pipefail

REPO="/Users/stone/stake-engine"
APP="$REPO/wp/apps/TurfWar"
GAME="turf_war"
NAME="TurfWar"
PY="/Applications/anaconda3/envs/math-sdk/bin/python"

# ZIPPING IS OPT-IN — `--zip`.
#
# The user's standing instruction (2026-09-20): do not produce zips unless they
# ask for them. The deliverable of a normal run is the STAGED BUNDLE at
# upload/<Game>/ — frontend, math, thumbnail, README, all checked. The zips are
# a separate, explicit step because they are what gets handed to the platform,
# and that is the user's call to make, not a side effect of rebuilding.
ZIP=0
for arg in "$@"; do
  [ "$arg" = "--zip" ] && ZIP=1
done

cd "$APP"

echo "== 1. sync math config -> src/game/config.ts =="
"$PY" design/sync_math_config.py "$REPO/math-sdk"

echo "== 2. copy math library into upload bundle =="
mkdir -p "$REPO/upload/$NAME/math"
rm -f "$REPO/upload/$NAME/math/"*
cp "$REPO/math-sdk/games/$GAME/library/publish_files/"* "$REPO/upload/$NAME/math/"

echo "== 3. check math bundle =="
"$PY" design/check_math_bundle.py "$REPO/upload/$NAME/math"

echo "== 4. check mechanics vs Game Info =="
"$PY" design/check_mechanics.py

echo "== 5. frontend build + guards =="
pnpm run build

echo "== 6. deploy upload frontend =="
mkdir -p "$REPO/upload/$NAME/frontend"
rsync -a --delete "$APP/build/" "$REPO/upload/$NAME/frontend/"

echo "== 7. sanity checks (the actual gate) =="
cd "$REPO/upload"
fail=0
if grep -rq "Capo Nostra\|CAPO NOSTRA\|Hot Miami\|HOT MIAMI" "$NAME/frontend/"; then
  echo "  !! old game display text in frontend"; fail=1; fi
if grep -qoE "localhost:[0-9]+|stub\.local" "$NAME/frontend/index.html"; then
  echo "  !! localhost/stub ref in index.html"; fail=1; fi
if ls "$NAME/frontend" | grep -qiE "stub|playtest"; then
  echo "  !! stub/playtest file in frontend root"; fail=1; fi
[ "$fail" = 0 ] && echo "  ok: no old-name / playtest contamination"
[ "$fail" = 0 ] || { echo "ABORT: sanity checks failed"; exit 1; }

if [ "$ZIP" = "1" ]; then
  echo "== 8. zip (asked for with --zip) =="
  rm -f "$NAME-frontend.zip" "$NAME-math.zip" "$NAME-upload.zip"
  zip -qr "$NAME-frontend.zip" "$NAME/frontend"
  zip -qr "$NAME-math.zip" "$NAME/math"
  zip -qr "$NAME-upload.zip" "$NAME"
  ls -lh "$NAME"-*.zip
else
  echo "== 8. zip — SKIPPED (pass --zip to build them) =="
  echo "   staged bundle is ready at $REPO/upload/$NAME/"
fi

echo
echo "done. staged bundle in $REPO/upload/$NAME/"
echo "NOTE: playtest stub (design/build_playtest_stub_data.py) is separate and local-only."
