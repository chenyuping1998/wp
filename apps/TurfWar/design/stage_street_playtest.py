#!/usr/bin/env python3
"""Local QA only: copy a successful build, add existing local RGS fixtures.

The toolbar is never copied into build/ or upload/. It exercises the exact
presentation event handlers from accessible UI controls, with visible status.
"""
from pathlib import Path
import shutil

D=Path(__file__).resolve().parent
ROOT=D.parents[3]
OUT=ROOT/'dist/turfwar-street-v2'
OUT.mkdir(parents=True,exist_ok=True)
shutil.copytree(D.parent/'build',OUT,dirs_exist_ok=True)
for name in ('stub.js','stub-data.js'):
    shutil.copy2(ROOT/'dist/turfwar-playtest'/name,OUT/name)
stub=OUT/'stub.js'
stub.write_text(stub.read_text().replace('var balance = 1000 * MUL', 'var balance = 100000 * MUL'))
page=OUT/'index.html'
html=page.read_text().replace('<head>','<head><script>window.__QA_ERRORS__=[];window.addEventListener("error",e=>{window.__QA_ERRORS__.push(String(e.error?.stack||e.message));console.error("[QA app exception]",String(e.error?.stack||e.message))});</script><script src="./stub-data.js"></script><script src="./stub.js"></script>',1)
page.write_text(html)
(OUT/'qa.html').write_text('''<!doctype html><meta charset="utf-8"><title>Turf street v2 QA</title>
<style>body{margin:0;background:#121212;color:#F7F5F0;font:13px sans-serif}nav{height:48px;display:flex;align-items:center;gap:6px;padding:0 8px;box-sizing:border-box}button{background:#F5893D;border:2px solid #F7F5F0;border-radius:6px;color:#121212;padding:5px 8px;cursor:pointer}iframe{width:100%;height:calc(100vh - 48px);border:0}output{margin-left:auto;font-size:11px}</style>
<nav><b>LOCAL QA</b><button onclick="round('BASE',1)">Bruiser</button><button onclick="round('BONUS',0)">Lookout</button><button onclick="round('BONUS_HITS',0)">Muscle</button><button onclick="round('BONUS_EPIC',0)">Kingpin</button><button onclick="emit({type:'bigScorePlay',mult:20,pays:true})">Big Score</button><button onclick="emit({type:'framesNew',frames:[{reel:1,row:2,size:2,mult:8}]})">Tape Bag</button><button onclick="banner()">Mega sticker</button><button onclick="clearFx()">Clear FX</button><output id="status">loading</output></nav>
<iframe id="game" src="./?hmdebug=1&rgs_url=stub.local&sessionID=playtest&currency=USD&lang=en"></iframe>
<script>
const game=document.querySelector('#game');const status=document.querySelector('#status');
function emit(e){game.contentWindow.__HM_EMIT__?.(e);status.textContent=e.type;}
function round(mode,id){const w=game.contentWindow;const trigger={BONUS:11,BONUS_HITS:29,BONUS_EPIC:50};w.__stub?.force(trigger[mode]??id);w.__HM_BETMODE__?.('BASE');status.textContent=mode+' trigger book '+(trigger[mode]??id)+' — press SPIN';}
function clearFx(){for(const type of ['winHide','bigScoreClear','framesClear'])emit({type});}
function banner(){emit({type:'winUpdate',amount:50000,winLevelData:{level:8,alias:'mega',type:'big',text:'MEGA WIN',presentDuration:3600,sound:{},animation:{}}});emit({type:'winShow'});}
setInterval(()=>{const state=game.contentWindow.__HM_GAME__?.();if(state) status.textContent=state.gameType+' '+state.betMode+' dim:'+state.dimmedBy;},500);
</script>''')
print(OUT)
qa=OUT/'qa.html'
qa.write_text(qa.read_text().replace('<b>LOCAL QA</b>', '<b>LOCAL QA</b><button onclick="round(\'BASE\',64)">Win</button><button onclick="round(\'BASE\',821)">Big win</button>'))
