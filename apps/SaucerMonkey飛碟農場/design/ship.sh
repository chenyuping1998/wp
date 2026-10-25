#!/bin/zsh
# Sushi Monkey — the packaging pipeline, in the one order that works.
# Ported from Capo Nostra's design/ship.sh (see its header for the history).
#
#   ./design/ship.sh          full pipeline, staged into upload/<Game>/ — NO zips
#   ./design/ship.sh --zip    the same, and then build the three zips
#   ./design/ship.sh --check  sanity greps only, no rebuild
#
# The two things that go wrong by hand, both steps here: the playtest rsync
# strips the stub <script> tags (step 5 re-injects), and packaging a stale
# build (step 4 always rebuilds). A green run is not a verified game — open
# the playtest shell and look.
#
# Differences from Capo's copy: the app lives in the wp-banandit worktree, the
# math config sync is the app's node script, max win is 10,000x (`1e4`), and
# the contamination list is Go Boomana's (the source) plus its siblings.
set -e

ROOT=/Users/stone/stake-engine
APP=$ROOT/wp-banandit/apps/SushiMonkey
GAME=SushiMonkey
NAME=SushiMonkey
PY=/Applications/anaconda3/envs/math-sdk/bin/python
PLAYTEST=$ROOT/dist/sushimonkey-playtest

if [[ -f "$APP/design/WORK_IN_PROGRESS" ]]; then
  print "Sushi Monkey is in production: finish art and math verification before packaging."
  exit 1
fi

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
  for term in "GoBanandit" "Banandit" "banandit" "Boomana" "BOOMANA" "Dynamite" "DYNAMITE" "Hold and Spin" "HOLDANDSPIN" \
              "Golden Bananas" "Miner" "Pickaxe" "Delta" "Bananaut" "Bananubis"; do
    local n=$(rg -o --glob "*.html" --glob "*.js" "$term" $ROOT/upload/$NAME/frontend 2>/dev/null | wc -l | tr -d ' ')
    [[ "$n" != "0" ]] && { print "  FAIL: '$term' x$n in the upload frontend"; fail=1; }
  done
  # Playtest contamination.
  local hosts=$(rg -o --glob "*.html" --glob "*.js" "localhost:[0-9]+|stub\.local" $ROOT/upload/$NAME/frontend | sort -u)
  [[ -n "$hosts" ]] && { print "  FAIL: playtest hosts in the upload frontend: $hosts"; fail=1; }
  local stubs=$(ls $ROOT/upload/$NAME/frontend | grep -iE "stub|playtest" || true)
  [[ -n "$stubs" ]] && { print "  FAIL: playtest files in the upload frontend: $stubs"; fail=1; }
  # Old asset folders — across ALL of assets/, not just sprites/. Hard Time's
  # copy of this check was scoped to sprites/ first time round and reported
  # "all clean" on a bundle shipping another game's audio one folder over.
  local old=$(cd $ROOT/upload/$NAME/frontend/assets 2>/dev/null && find . -type d | grep -iE "banandit|boomana|miami|turf|hardtime|capo|heist" || true)
  [[ -n "$old" ]] && { print "  FAIL: old-game asset folders shipped:"; print "$old" | sed 's/^/    /'; fail=1; }
  # The disclaimer line review dictated.
  grep -q "TM and © 2026 Engine\." $ROOT/upload/$NAME/frontend/index.html \
    || { print "  FAIL: the dictated disclaimer line is missing or reworded"; fail=1; }
  # The max win must match the shipped math. The minifier writes 20000 as `2e4`,
  # so grep for both rather than for the number as written in the config.
  grep -rqE "1e4|10000" $ROOT/upload/$NAME/frontend/_app 2>/dev/null \
    || { print "  FAIL: 10,000x cap not present in the shipped bundle"; fail=1; }

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
cd $APP && node design/sync_math_config.mjs

say "2. copy the math library into the upload package"
mkdir -p $ROOT/upload/$NAME/math
rsync -a --delete $ROOT/math-sdk/games/$GAME/library/publish_files/ $ROOT/upload/$NAME/math/

say "3. rebuild the playtest stub data (reads step 2's output)"
mkdir -p $PLAYTEST
mkdir -p $PLAYTEST
$PY design/build_playtest_stub_data.py $ROOT/upload/$NAME/math $PLAYTEST/stub-data.js

say "4. frontend build + guards"
cd $APP && pnpm run build

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
if [[ ! -f "$ROOT/upload/$NAME/frontend/index.html" ]]; then
  mkdir -p $ROOT/upload/$NAME/frontend
  rsync -a $APP/build/ $ROOT/upload/$NAME/frontend/
else
  cp $APP/build/index.html $ROOT/upload/$NAME/frontend/index.html
  rsync -a --delete $APP/build/_app/ $ROOT/upload/$NAME/frontend/_app/
  # Refresh only this game's explicit assets; do not resurrect pruned leftovers.
  rsync -a $APP/static/assets/ $ROOT/upload/$NAME/frontend/assets/
  rsync -a $APP/static/fonts/ $ROOT/upload/$NAME/frontend/fonts/
fi

say "6b. thumbnail (BG / FG hero only / provider logo) and README"
mkdir -p $ROOT/upload/$NAME/thumbnail
cp $APP/design/thumbnail/SushiMonkey-BG.png $APP/design/thumbnail/SushiMonkey-FG.png \
   $APP/design/thumbnail/Silverstars-Logo.png $ROOT/upload/$NAME/thumbnail/
mkdir -p $ROOT/upload/$NAME/cover
cp $APP/design/cover/SushiMonkey-Cover-BG.png $APP/design/cover/SushiMonkey-Cover-FG.png $ROOT/upload/$NAME/cover/
cp $APP/design/UPLOAD_README.md $ROOT/upload/$NAME/README.md

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
