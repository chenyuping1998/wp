#!/bin/zsh
# Local staging only. No network upload or publication.
set -e
ROOT=/Users/stone/stake-engine
APP=$ROOT/wp-banandit/apps/StaticShift
U=$ROOT/upload/StaticShift
P=$ROOT/dist/staticshift-playtest
PY=/Applications/anaconda3/envs/math-sdk/bin/python
cd "$APP"
npm run build
mkdir -p "$U/math" "$U/frontend" "$P"
rsync -a --delete "$ROOT/math-sdk/games/StaticShift/library/publish_files/" "$U/math/"
if [[ -z "$SKIP_STUB" ]]; then $PY design/build_playtest_stub_data.py "$U/math" "$P/stub-data.js"; fi
rsync -a --exclude stub-data.js --exclude stub.js --exclude review.html --exclude measure.html --delete-after build/ "$P/"
cp design/playtest_stub.js "$P/stub.js"
cp design/review_shell.html "$P/review.html"
cp design/measure_shell.html "$P/measure.html"
$PY - "$P/index.html" <<'PYEOF'
import sys
p=sys.argv[1];s=open(p).read();s=s.replace('</head>','<script src="./stub-data.js"></script><script src="./stub.js"></script></head>',1);open(p,'w').write(s)
PYEOF
# Replace code, then stage only assets reachable from the production registry.
cp build/index.html "$U/frontend/index.html"
rsync -a --delete build/_app/ "$U/frontend/_app/"
rsync -a --delete build/fonts/ "$U/frontend/fonts/"
cp build/favicon.svg "$U/frontend/"
$PY design/stage_assets.py
# Store layers are part of every package update, not only the first stage.
mkdir -p "$U/thumbnail" "$U/cover"
cp design/thumbnail/StaticShift-BG.png design/thumbnail/StaticShift-FG.png design/thumbnail/Silverstars-Logo.png "$U/thumbnail/"
cp design/cover/StaticShift-Cover-BG.png design/cover/StaticShift-Cover-FG.png "$U/cover/"
$PY "$ROOT/wp/.claude/skills/game-reskin/scripts/check_thumbnail.py" --upload "$U"
print "Staged: $U (platform unchanged)"
