#!/usr/bin/env python3
"""Local QA only: copy the finished build/ to dist/turfwar-motion6-20261109
with the local RGS stub and an exception catcher (never shipped).
--raf-shim adds a setTimeout rAF so a hidden Browser pane keeps animating."""
from pathlib import Path
import shutil, sys

D = Path(__file__).resolve().parent
APP = D.parent.parent
ROOT = APP.parents[2]
OUT = ROOT / 'dist/turfwar-motion6-20261109'
if OUT.exists():
  shutil.rmtree(OUT)
shutil.copytree(APP / 'build', OUT)
for name in ('stub.js', 'stub-data.js'):
  shutil.copy2(ROOT / 'dist/turfwar-playtest' / name, OUT / name)
stub = OUT / 'stub.js'
stub.write_text(stub.read_text().replace('var balance = 1000 * MUL', 'var balance = 100000 * MUL'))
inject = ('<script>window.__QA_ERRORS__=[];window.addEventListener("error",e=>{window.__QA_ERRORS__.push(String(e.error?.stack||e.message))});</script>'
          '<script src="./stub-data.js"></script><script src="./stub.js"></script>')
if '--raf-shim' in sys.argv:
  inject = ('<script>window.requestAnimationFrame=function(cb){return setTimeout(function(){cb(performance.now())},16)};'
            'window.cancelAnimationFrame=function(i){clearTimeout(i)};</script>') + inject
page = OUT / 'index.html'
page.write_text(page.read_text().replace('<head>', '<head>' + inject, 1))
print(OUT)
