#!/bin/zsh
# Capo Nostra — the packaging pipeline, in the one order that works.
#
# Written on the FOURTH pass, which is three passes too late: this sequence has
# been retyped by hand every time and has cost the same two mistakes twice.
# Hard Time's design/ship.sh is the model; the differences are listed at the
# bottom of this comment.
#
#   ./design/ship.sh          full pipeline, staged into upload/<Game>/ — NO zips
#   ./design/ship.sh --zip    the same, and then build the three zips
#   ./design/ship.sh --check  sanity greps only, no rebuild
#
# THE TWO THINGS THAT GO WRONG BY HAND, both now steps rather than memory:
#
#  1. The playtest rsync overwrites index.html with the fresh build, which
#     STRIPS the two stub <script> tags. Forgetting to put them back leaves a
#     playtest shell that cannot reach its fake RGS, which looks exactly like a
#     broken game. Step 5 re-injects and says so.
#  2. Packaging before the last edit is built. Step 4 always rebuilds; never
#     zip on the assumption that build/ is current.
#
# What this does NOT do is verify the game. A green run means the bundle is
# internally consistent and free of playtest/old-game contamination; it says
# nothing about whether the game looks or plays right. Open the playtest shell
# and actually look (packaging.md §9).
#
# Differences from Hard Time's copy:
#  - Capo Nostra IS the source game the others were reskinned from, so the
#    contamination list is the OTHER games' names, plus Hot Miami's, which this
#    game was itself reskinned out of.
#  - Max win is 20,000x, which the minifier writes as `2e4`.
set -e

ROOT=/Users/stone/stake-engine
APP=$ROOT/wp/apps/CapoNostra
GAME=capo_nostra
NAME=CapoNostra
PY=/Applications/anaconda3/envs/math-sdk/bin/python
PLAYTEST=$ROOT/dist/caponostra-playtest

say() { print -P "%F{cyan}==> $1%f"; }

checks() {
  say "7. sanity checks (the actual gate, not the zip)"
  local fail=0
  # Old-game contamination. Greps the BUILT bundle, never src: a stale build is
  # how a correct source change still ships the old behaviour.
  #
  # `hotMiami` in lower camel is here because it is how the asset FOLDERS were
  # named, and folder names ship inside the bundle's URLs even when no visible
  # text mentions the other game. It was 35 occurrences until 2026-09-20.
  for term in "Hot Miami" "hot_miami" "hotMiami" "GoBananas" "Go Bananas" \
              "Moooo" "WildParty" "Turf War" "turf_war" "Loot Bag" "Bruiser" \
              "Hard Time" "hard_time" "Searchlight" "Lockdown"; do
    local n=$(grep -o "$term" $ROOT/upload/$NAME/frontend/index.html 2>/dev/null | wc -l | tr -d ' ')
    [[ "$n" != "0" ]] && { print "  FAIL: '$term' x$n in the upload frontend"; fail=1; }
  done
  # Playtest contamination.
  local hosts=$(grep -oE "localhost:[0-9]+|stub\.local" $ROOT/upload/$NAME/frontend/index.html | sort -u)
  [[ -n "$hosts" ]] && { print "  FAIL: playtest hosts in the upload frontend: $hosts"; fail=1; }
  local stubs=$(ls $ROOT/upload/$NAME/frontend | grep -iE "stub|playtest" || true)
  [[ -n "$stubs" ]] && { print "  FAIL: playtest files in the upload frontend: $stubs"; fail=1; }
  # Old asset folders — across ALL of assets/, not just sprites/. Hard Time's
  # copy of this check was scoped to sprites/ first time round and reported
  # "all clean" on a bundle shipping another game's audio one folder over.
  local old=$(cd $ROOT/upload/$NAME/frontend/assets 2>/dev/null && find . -type d | grep -iE "hotMiami|gobananas|neon|miami|turf|hardtime" || true)
  [[ -n "$old" ]] && { print "  FAIL: old-game asset folders shipped:"; print "$old" | sed 's/^/    /'; fail=1; }
  # The disclaimer line review dictated.
  grep -q "TM and © 2026 Engine\." $ROOT/upload/$NAME/frontend/index.html \
    || { print "  FAIL: the dictated disclaimer line is missing or reworded"; fail=1; }
  # The max win must match the shipped math. The minifier writes 20000 as `2e4`,
  # so grep for both rather than for the number as written in the config.
  grep -qE "2e4|20000" $ROOT/upload/$NAME/frontend/index.html \
    || { print "  FAIL: 20,000x cap not present in the shipped config"; fail=1; }

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
cd $ROOT/wp && pnpm --filter capo-nostra build

say "5. deploy the playtest build"
mkdir -p $PLAYTEST
rsync -a --exclude stub-data.js --exclude stub.js --delete-after $APP/build/ $PLAYTEST/
cp $APP/design/playtest_stub.js $PLAYTEST/stub.js
# The rsync above overwrites index.html from the fresh build, which strips the
# stub tags. Re-inject rather than assume they survived — see the header.
PLAYTEST=$PLAYTEST $PY - <<'PYEOF'
import os
p = os.environ["PLAYTEST"] + "/index.html"
s = open(p, encoding="utf-8").read()
if "stub-data.js" not in s:
    tags = '\t\t<script src="./stub-data.js"></script>\n\t\t<script src="./stub.js"></script>\n'
    open(p, "w", encoding="utf-8").write(s.replace("\t</head>", tags + "\t</head>", 1))
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
