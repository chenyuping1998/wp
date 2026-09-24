#!/bin/zsh
# Hard Time — the packaging pipeline, in the one order that works.
#
# Written on the FIRST packaging pass rather than after the fifth, because the
# sequence has a dependency that is easy to get wrong by hand: the playtest stub
# data is generated from upload/HardTime/math, so step 3 must run AFTER step 2,
# not before. Capo Nostra retyped this sequence five times in one session.
#
#   ./design/ship.sh          full pipeline, staged into upload/<Game>/ — NO zips
#   ./design/ship.sh --zip    the same, and then build the three zips
#   ./design/ship.sh --check  sanity greps only, no rebuild
#
# What this does NOT do is verify the game. A green run here means the bundle is
# internally consistent and free of playtest/old-game contamination; it says
# nothing about whether the game looks or plays right. See packaging.md §9.
set -e

ROOT=/Users/stone/stake-engine
APP=$ROOT/wp/apps/HardTime
GAME=hard_time
NAME=HardTime
PY=/Applications/anaconda3/envs/math-sdk/bin/python
PLAYTEST=$ROOT/dist/hardtime-playtest

say() { print -P "%F{cyan}==> $1%f"; }

checks() {
  say "7. sanity checks (the actual gate, not the zip)"
  local fail=0
  # Old-game contamination. Greps the BUILT bundle, never src: a stale build is
  # how a correct source change still ships the old behaviour.
  for term in "Capo Nostra" "capo_nostra" "CapoNostra" "Hot Miami" "hot_miami" \
              "Tommy Gun" "Vault Frame" "Vault Door" "Silverstars Studio" \
              "Signet Ring" "Black Sedan" "GoBananas" "SOLDIER" "THE DON"; do
    local n=$(grep -o "$term" $ROOT/upload/$NAME/frontend/index.html 2>/dev/null | wc -l | tr -d ' ')
    [[ "$n" != "0" ]] && { print "  FAIL: '$term' x$n in the upload frontend"; fail=1; }
  done
  # Playtest contamination.
  local hosts=$(grep -oE "localhost:[0-9]+|stub\.local" $ROOT/upload/$NAME/frontend/index.html | sort -u)
  [[ -n "$hosts" ]] && { print "  FAIL: playtest hosts in the upload frontend: $hosts"; fail=1; }
  local stubs=$(ls $ROOT/upload/$NAME/frontend | grep -iE "stub|playtest" || true)
  [[ -n "$stubs" ]] && { print "  FAIL: playtest files in the upload frontend: $stubs"; fail=1; }
  # Old asset folders — across ALL of assets/, not just sprites/.
  #
  # The first version of this check only listed assets/sprites. It reported
  # "all clean" on a bundle that was shipping assets/audio/capo/ — eleven MB of
  # Capo Nostra's audio including the Tommy Gun's gunfire — because the folder
  # was one level over from where the check looked. Found by listing the zip,
  # not by the gate. A check scoped to where the last bug was is scoped to miss
  # the next one.
  local old=$(cd $ROOT/upload/$NAME/frontend/assets 2>/dev/null && find . -type d | grep -iE "capo|hotMiami|gobananas|neon|miami" || true)
  [[ -n "$old" ]] && { print "  FAIL: old-game asset folders shipped:"; print "$old" | sed 's/^/    /'; fail=1; }
  # The disclaimer line review DICTATED — see review-findings.md §1.
  grep -q "TM and © 2026 Engine\." $ROOT/upload/$NAME/frontend/index.html \
    || { print "  FAIL: the dictated disclaimer line is missing or reworded"; fail=1; }
  # Every mode's max win must match the shipped math.
  # The minifier writes 12000 as `12e3`. The first version of this check grepped
  # for "12000", found nothing, and reported a correct bundle as broken.
  grep -qE "12e3|12000" $ROOT/upload/$NAME/frontend/index.html \
    || { print "  FAIL: 12000x cap not present in the shipped config"; fail=1; }

  [[ $fail == 1 ]] && { print "\nPACKAGE IS CONTAMINATED — do not zip."; return 1; }
  print "  all clean"
}

# ZIPPING IS OPT-IN — `--zip`.
#
# The user's standing instruction (2026-09-20): do not produce zips unless they
# ask for them. The deliverable of a normal run is the STAGED BUNDLE at
# upload/<Game>/ — frontend, math, thumbnail, README, all checked. The zips are
# a separate, explicit step because they are what gets handed to the platform,
# and that is the user's call to make, not a side effect of rebuilding.
ZIP=0
for arg in "$@"; do
  [[ "$arg" == "--zip" ]] && ZIP=1
done

if [[ "$1" == "--check" ]]; then
  checks
  exit $?
fi

say "1. sync the math config into the frontend"
cd $APP && $PY design/sync_math_config.py $ROOT/math-sdk

say "2. copy the math library into the upload package"
mkdir -p $ROOT/upload/$NAME/math
rsync -a --delete $ROOT/math-sdk/games/$GAME/library/publish_files/ $ROOT/upload/$NAME/math/

say "3. rebuild the playtest stub data (reads step 2's output)"
$PY design/build_playtest_stub_data.py $ROOT/upload/$NAME/math $PLAYTEST/stub-data.js

say "4. frontend build + guards"
cd $ROOT/wp && pnpm --filter hard-time build

say "5. deploy the playtest build"
mkdir -p $PLAYTEST
rsync -a --exclude stub-data.js --exclude stub.js --delete-after $APP/build/ $PLAYTEST/
cp $APP/design/playtest_stub.js $PLAYTEST/stub.js
# rsync overwrites index.html from the fresh build, which strips the stub tags.
# Re-inject rather than assume they survived.
PLAYTEST=$PLAYTEST $PY - <<'PYEOF'
import os
p = os.environ["PLAYTEST"] + "/index.html"
s = open(p).read()
if "stub.js" not in s:
    tags = '<script src="./stub-data.js"></script>\n<script src="./stub.js"></script>\n'
    open(p, "w").write(s.replace("<head>", "<head>\n" + tags, 1))
    print("   stub scripts re-injected")
else:
    print("   stub scripts already present")
PYEOF

say "6. deploy the upload frontend"
rsync -a --delete $APP/build/ $ROOT/upload/$NAME/frontend/

checks

if [[ "$ZIP" == "1" ]]; then
  say "8. zip (asked for with --zip)"
  cd $ROOT/upload
  rm -f $NAME-frontend.zip $NAME-math.zip $NAME-upload.zip
  zip -qr $NAME-frontend.zip $NAME/frontend
  zip -qr $NAME-math.zip $NAME/math
  zip -qr $NAME-upload.zip $NAME
  ls -lh $NAME-*.zip
else
  say "8. zip — SKIPPED (pass --zip to build them)"
  print "   staged bundle is ready at $ROOT/upload/$NAME/"
fi

say "done — now open the playtest shell and actually look at it (packaging.md §9)"
