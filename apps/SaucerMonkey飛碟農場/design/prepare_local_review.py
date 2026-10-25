"""Prepare isolated art-review shells from build/. Never modifies the shipped build.
Sample rounds are for presentation QA, not a production math distribution.
Run from the app: python design/prepare_local_review.py
Then: python -m http.server 4181 --bind 127.0.0.1 --directory build-playtest
"""
from pathlib import Path
import json, shutil, subprocess
APP=Path(__file__).resolve().parents[1]
NODE=Path("E:/stake/tools/node-v22.23.1-win-x64/node.exe")
books=json.loads((APP/"design/qa_replay_books.json").read_text(encoding="utf-8"))
for target in ("build-playtest","build-replaytest"):
 shutil.copytree(APP/"build",APP/target,dirs_exist_ok=True)
out=APP/"build-playtest"
data={}
for mode,rounds in books.items():
 samples=rounds
 rounds=[b for b in rounds if b["id"]<900000]
 data[mode.upper()]={"cost":1 if mode=="base" else 100 if mode=="bonus" else 150,
  "pool":[b["id"] for b in rounds],"books":{str(b["id"]):b for b in samples}}
(out/"stub-data.js").write_text("window.__STUB_DATA__="+json.dumps(data,separators=(",",":"))+";window.__STUB_CATALOGUE__={};",encoding="utf-8")
shutil.copy2(APP/"design/playtest_stub.js",out/"stub.js")
p=out/"index.html"
p.write_text(p.read_text(encoding="utf-8").replace("<head>",'<head><script src="./stub-data.js"></script><script src="./stub.js"></script>'),encoding="utf-8")
subprocess.run([str(NODE),"design/make_replay_harness.mjs"],cwd=APP,check=True,stdout=(APP/"design/replay-preview-urls.txt").open("w",encoding="utf-8"))
print("Prepared local review copies. build/ remains clean.")

