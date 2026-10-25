"""Reproducible SDK-compatible books, positive integer LUTs and measured RTP.

Run with E:/stake/math-sdk/env/Scripts/python.exe from the SDK root.
The final index is written only after ALL matching mode files and weights exist.
"""
import argparse
import csv
import hashlib
import json
import os
import pickle
import time
import io
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path
from types import SimpleNamespace
import zstandard as zstd
from game_config import GameConfig,RULES,ROOT
from gamestate import GameState
from game_optimization import calibrate,statistics
from src.write_data.write_configs import make_fe_config

def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def read_books(path):
    with Path(path).open('rb') as f,zstd.ZstdDecompressor().stream_reader(f) as stream:
        for line in io.TextIOWrapper(stream,encoding='utf-8'):
            if line.strip():yield json.loads(line)

def generate(config,mode,count,seed):
    game=GameState(config)
    path=Path(config.publish_path)/f'books_{mode}.jsonl.zst'
    records=[];start=time.time()
    fixtures={};mode_offset=list(RULES['modes']).index(mode)*10000000
    with path.open('wb') as file, zstd.ZstdCompressor(level=6).stream_writer(file) as writer:
        for i in range(count):
            force=None
            if i==0:force='cap'
            elif mode=='base':force='ordinary'
            book=game.run(mode,seed+mode_offset+i,force=force);book['id']=i+1
            writer.write((json.dumps(book,separators=(',',':'))+'\n').encode())
            records.append({'id':i+1,'payout':book['payoutMultiplier'],'criteria':book['criteria']})
            if book['criteria']=='cap':fixtures.setdefault('cap',book)
            if book['payoutMultiplier']>0 and book['payoutMultiplier']<2000000:fixtures.setdefault('win',book)
            if any(e['type']=='wildExpand' for e in book['events']):fixtures.setdefault('sweep',book)
            if any(e['type']=='freeSpinRetrigger' for e in book['events']):fixtures.setdefault('retrigger',book)
            if any(e['type']=='newFrames' and any(f['size']>1 for f in e['frames']) for e in book['events']):fixtures.setdefault('largeZone',book)
            if (i+1)%10000==0:print(f'{mode}: generated {i+1:,}/{count:,}, {time.time()-start:.1f}s',flush=True)
    configs=Path(config.library_path)/'configs'
    configs.mkdir(exist_ok=True)
    (configs/f'books_{mode}.verification.json').write_text(json.dumps({
        'file_hash':sha(path),'payout_hash':hashlib.md5(pickle.dumps([r['payout'] for r in records])).hexdigest(),
        'num_entries':count},indent=2),encoding='utf-8')
    lookup=Path(config.library_path)/'lookup_tables';lookup.mkdir(exist_ok=True)
    with (lookup/f'lookUpTableSegmented_{mode}.csv').open('w',newline='') as f:
        csv.writer(f).writerows((r['id'],r['criteria']) for r in records)
    with (lookup/f'lookUpTable_{mode}.csv').open('w',newline='') as f:
        csv.writer(f).writerows((r['id'],1,r['payout']) for r in records)
    (configs/f'fixtures_{mode}.json').write_text(json.dumps(fixtures,separators=(',',':')),encoding='utf-8')
    print(f'{mode}: {count:,} evaluated books written in {time.time()-start:.1f}s',flush=True)
    return records

def append_natural_features(config,ordinary_count,seed):
    # zstd concatenated frames form one valid streaming jsonl.zst file.
    game=GameState(config);records=[];next_id=ordinary_count+1
    with (Path(config.publish_path)/'books_base.jsonl.zst').open('ab') as file, zstd.ZstdCompressor(level=6).stream_writer(file) as writer:
        for mode in ('bonus','bonus_hits','bonus_epic'):
            for source in read_books(Path(config.publish_path)/f'books_{mode}.jsonl.zst'):
                book=game.natural_from_buy(source,seed+90000000+next_id);book['id']=next_id
                writer.write((json.dumps(book,separators=(',',':'))+'\n').encode())
                records.append({'id':next_id,'payout':book['payoutMultiplier'],'criteria':book['criteria']})
                next_id+=1
            print(f'base: mirrored {mode} with the identical feature weights',flush=True)
    return records

def export_config(config):
    symbols={name:SimpleNamespace(name=name,paytable=data['paytable']) for name,data in RULES['symbols'].items()}
    config_path=Path(config.library_path)/'configs';config_path.mkdir(exist_ok=True)
    adapter=SimpleNamespace(config=config,output_files=SimpleNamespace(config_path=str(config_path)),
                            symbol_storage=SimpleNamespace(symbol_defs=symbols))
    make_fe_config(adapter)
    return config_path/f'config_fe_{config.game_id}.json'

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--books',type=int,default=100000,help='independent books per buy mode')
    parser.add_argument('--base-books',type=int,default=100000)
    parser.add_argument('--seed',type=int,default=20261023)
    args=parser.parse_args()
    if min(args.books,args.base_books)<1000:parser.error('at least 1000 books per mode required')
    config=GameConfig();Path(config.publish_path).mkdir(parents=True,exist_ok=True)
    # Invalidate the previous readiness marker before any mode is regenerated.
    (Path(config.publish_path)/'index.json').unlink(missing_ok=True)
    fe=export_config(config)
    metrics={};buy_profiles={};manifest=[];shelf=[]
    with ProcessPoolExecutor(max_workers=3) as workers:
        futures={mode:workers.submit(generate,config,mode,args.books,args.seed) for mode in ('bonus','bonus_hits','bonus_epic')}
        for mode in ['bonus','bonus_hits','bonus_epic','base']:
            count=args.base_books if mode=='base' else args.books
            records=generate(config,mode,count,args.seed) if mode=='base' else futures[mode].result()
            if mode=='base':
                records+=append_natural_features(config,count,args.seed);count=len(records)
            weights,details=calibrate(mode,records,buy_profiles)
            if mode!='base':buy_profiles[mode]=weights
            publish_mode(config,mode,count,records,weights,details,metrics,manifest,shelf)
    # Base sidecar includes the mirrored features, not only the ordinary prefix.
    payouts=[b['payoutMultiplier'] for b in read_books(Path(config.publish_path)/'books_base.jsonl.zst')]
    (Path(config.library_path)/'configs/books_base.verification.json').write_text(json.dumps({
        'file_hash':sha(Path(config.publish_path)/'books_base.jsonl.zst'),
        'payout_hash':hashlib.md5(pickle.dumps(payouts)).hexdigest(),'num_entries':len(payouts)},indent=2),encoding='utf-8')
    order={name:i for i,name in enumerate(RULES['modes'])}
    manifest.sort(key=lambda m:order[m['name']]);shelf.sort(key=lambda m:order[m['name']])
    configs=Path(config.library_path)/'configs'
    be={'workingName':config.working_name,'gameID':config.game_id,'rtp':96,
        'frontendConfig':{'file':fe.name,'sha256':sha(fe)},'bookShelfConfig':shelf}
    (configs/f'config_{config.game_id}.json').write_text(json.dumps(be,indent=2),encoding='utf-8')
    reports=Path(config.library_path)/'reports';reports.mkdir(exist_ok=True)
    (reports/'metrics.json').write_text(json.dumps({'game':config.game_id,'seed':args.seed,'modes':metrics},indent=2),encoding='utf-8')
    (Path(config.publish_path)/'index.json').write_text(json.dumps({'modes':manifest},indent=2),encoding='utf-8')
    print('All four modes calibrated: exact positive-integer weighted RTP 0.96. Run verify_books.py before upload.',flush=True)

def publish_mode(config,mode,count,records,weights,details,metrics,manifest,shelf):
        cost=RULES['modes'][mode]['cost']
        lut=Path(config.publish_path)/f'lookUpTable_{mode}_0.csv'
        with lut.open('w',newline='',encoding='utf-8') as f:
            csv.writer(f).writerows((r['id'],w,r['payout']) for r,w in zip(records,weights))
        result=statistics(records,weights,cost);result['calibration']=details
        metrics[mode]=result
        book=Path(config.publish_path)/f'books_{mode}.jsonl.zst'
        manifest.append({'name':mode,'cost':float(cost),'events':book.name,'weights':lut.name})
        shelf.append({'name':mode,'cost':float(cost),'rtp':.96,'maxWin':20000,
                      'feature':mode=='base','buyBonus':mode!='base','autoEndRoundDisabled':False,
                      'bookLength':count,'std':result['stdDevCostUnits'],
                      'booksFile':{'file':book.name,'sha256':sha(book)},
                      'tables':[{'file':lut.name,'sha256':sha(lut)}]})
        print(json.dumps({'mode':mode,**result}),flush=True)

if __name__=='__main__':main()
