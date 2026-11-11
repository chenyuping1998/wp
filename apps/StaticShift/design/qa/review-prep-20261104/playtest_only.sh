#!/bin/zsh
# Build Static Shift and refresh dist/staticshift-playtest only. Does NOT touch upload/.
set -e
ROOT=/Users/stone/stake-engine
APP=$ROOT/wp-banandit/apps/StaticShift
P=$ROOT/dist/staticshift-playtest
PY=/Applications/anaconda3/envs/math-sdk/bin/python
cd "$APP"
npm run build
rsync -a --exclude stub-data.js --exclude stub.js --exclude review.html --exclude measure.html --delete-after build/ "$P/"
cp design/playtest_stub.js "$P/stub.js"
cp design/review_shell.html "$P/review.html"
cp design/measure_shell.html "$P/measure.html"
$PY - "$P/index.html" <<'PYEOF'
import sys
p=sys.argv[1];s=open(p).read();s=s.replace('</head>','<script src="./stub-data.js"></script><script src="./stub.js"></script></head>',1);open(p,'w').write(s)
PYEOF
echo PLAYTEST_OK
