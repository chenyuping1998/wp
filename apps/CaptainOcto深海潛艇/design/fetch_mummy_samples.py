"""Fetch source recordings only; retain CC0 provenance and content hashes."""
import json, urllib.request, urllib.parse, re, hashlib
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

ROOT = Path(__file__).resolve().parent / 'source/mummy_audio'
RAW = ROOT / 'raw'
RAW.mkdir(parents=True, exist_ok=True)
tree = json.loads(Path('E:/stake/tmp/mummy_vcsl_tree.json').read_text())['tree']
paths = [x['path'] for x in tree if x['path'].endswith('.wav')]
filters = {
 'dum': 'Darbuka_1_hit_vl2_rr1.wav', 'tek': 'Darbuka_2_hit_vl2_rr1.wav',
 'slap': 'Darbuka_3_hit_vl2_rr1.wav', 'rim': 'Darbuka_4_hit_vl2_rr1.wav',
 'tap': 'Darbuka_5_hit_vl2_rr1.wav',
 'flute': 'AltRecorder_Stac_D4_rr1_Main.wav',
 'flute_long': 'AltRecorder_Sus_D4_rr1_Main.wav',
 'frame': 'HDrumS_Hit_v3_rr1_Sum.wav',
 'pluck': 'BowedPsaltery_C4_Main_Pluck_rr1.wav',
 'riq': 'Tamb1_Hit_v2_rr1_Mid.wav', 'zill': 'Fing_Cymb.wav',
 'shaker': 'LShaker_Hit_rr1_Mid.wav', 'timp': 'Timpani1_Hit_v3_rr3_Sum.wav',
}
for term in ['Tambourine', 'Finger Cymbal', 'Shaker', 'Timpani', 'Lute']:
 hits=[p for p in paths if term in p]
 print(term, hits[:4])
sources=[]
def fetch(key,path):
 url='https://raw.githubusercontent.com/sgossner/VCSL/master/'+urllib.parse.quote(path)
 out=RAW/(key+'.wav')
 if not out.exists(): out.write_bytes(urllib.request.urlopen(url,timeout=60).read())
 return dict(id=key,source_url='https://github.com/sgossner/VCSL',download_url=url,author='Versilian Studios LLC / VCSL contributors',license='CC0-1.0',original_filename=path,source_file=str(out.relative_to(ROOT)),sha256=hashlib.sha256(out.read_bytes()).hexdigest())
jobs=[]
for key,name in filters.items():
 hits=[p for p in paths if p.endswith('/'+name)]
 if not hits: raise RuntimeError(name)
 jobs.append((key,hits[0]))
with ThreadPoolExecutor(max_workers=6) as pool:
 sources=list(pool.map(lambda job:fetch(*job),jobs))
for key,page in [('stone','fall-of-stone-s1022'),('stone_scrape','knife-blade-scraped-on-a-stone-3-s0329'),('cloth','cloth-s0013'),('cat_wave','little-meow-of-a-cat-s0494'),('cat_cheer','little-meow-of-a-cat-9-s1479'),('cat_disappoint','little-meow-of-a-cat-3-s1473'),('cat_laugh','little-meow-of-a-cat-6-s1476')]:
 url='https://bigsoundbank.com/'+page+'.html'
 html=urllib.request.urlopen(url,timeout=40).read().decode()
 (ROOT/(key+'-license.html')).write_text(html,encoding='utf-8')
 links=re.findall(r'(?:src|href)=[\"\']([^\"\']+\.(?:wav|mp3))',html)
 print(key,links)
 media=next((x for x in links if x.endswith('.wav')),links[0] if links else None)
 if media:
  media=urllib.parse.urljoin(url,media); out=RAW/(key+Path(media).suffix)
  if not out.exists(): out.write_bytes(urllib.request.urlopen(media,timeout=60).read())
  sources.append(dict(id=key,source_url=url,download_url=media,author='Joseph SARDIN',license='CC0-1.0',original_filename=Path(media).name,source_file=str(out.relative_to(ROOT)),sha256=hashlib.sha256(out.read_bytes()).hexdigest()))
(ROOT/'SOURCES.json').write_text(json.dumps(sources,indent=2),encoding='utf-8')
print('Saved',len(sources),'sources')
