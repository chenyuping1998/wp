"""Versioned frontend delivery for the five screenshot review fixes."""
from pathlib import Path
import hashlib,json,zipfile,sys
APP=Path(__file__).resolve().parent.parent
audio='--wheel-audio'in sys.argv
stone='--stone-tiers'in sys.argv or audio
tiles='--wheel-tiles'in sys.argv or stone
revision='wheel_audio'if audio else'stone_tiers'if stone else'wheel_tiles'if tiles else'layout_fixes'
release=APP/'design/release';out=release/f'MummyMayhem_frontend_review_20261107_{revision}.zip'
paths={
 'components':'design/preview_mummy_20261107/layout_review/component_verification.json',
 'arcClearance':'design/preview_mummy_20261107/layout_review/arc_clearance_verification.json',
 'uiWheel':'design/source/mummy_delivery/ui_wheel_verification.json',
 'face':'design/preview_mummy_20261107/living_scene/face_verification.json',
 'background':'design/preview_mummy_20261107/living_scene/ambience_verification.json',
 'audio':'design/source/mummy_audio/verification.json',
 'clothSeams':'design/source/mummy_delivery/mascot/flow/seams_verification.json',
 'runtime':'design/source/mummy_delivery/runtime_verification.json'}
if audio:paths['wheelVolume']='design/source/mummy_delivery/audio/wheel_volume_verification.json'
reports={k:json.loads((APP/p).read_text(encoding='utf-8-sig'))for k,p in paths.items()}
assert all(r['passed']for r in reports.values())
assert reports['arcClearance']['samplesOutsidePaintedChannel']==0
assert all(v==1 for v in reports['clothSeams']['minCoverage'].values())
log=(APP.parents[2]/('tmp/mummy-wheel-audio-build.txt'if audio else'tmp/mummy-stone-tier-build.txt'if stone else'tmp/mummy-wheel-tiles-build.txt'if tiles else'tmp/mummy-review-five-final-build.txt')).read_text(encoding='utf-8-sig')
assert 'Wrote site to "build"'in log and 'OK: 22 type errors'in log,'Build not complete or baseline changed'
bundles=list((APP/'build/_app/immutable').glob('bundle.*.js'));assert bundles
assert all(p.stat().st_mtime<max(b.stat().st_mtime for b in bundles)for p in [APP/'src/components/FgArcWheel.svelte',APP/'src/components/ui/ModalBuyBonusConfirm.svelte',APP/'src/components/Win.svelte',APP/'src/components/ui/Modals.svelte'])
assert 'mummy-confirm-layer'in ''.join(p.read_text(encoding='utf-8')for p in bundles)
if audio:assert(APP/'src/components/Sound.svelte').stat().st_mtime<max(b.stat().st_mtime for b in bundles)
for name in ['bet_desktop.jpg','bet_mobile.jpg','confirm_desktop.jpg','confirm_mobile.jpg','wheel_result.jpg','big_win.jpg']:
 assert(APP/'design/preview_mummy_20261107/layout_review'/name).is_file()
if tiles:assert(APP/'design/preview_mummy_20261107/layout_review/wheel_tiles_result.jpg').is_file()
if stone:
 for name in ['wheel_stone_tiers_low.jpg','wheel_stone_tiers_high.jpg']:
  assert(APP/'design/preview_mummy_20261107/layout_review'/name).is_file()
for p in (APP/'static/assets').rglob('*'):
 if p.is_file():assert (APP/'build'/p.relative_to(APP/'static')).read_bytes()==p.read_bytes(),f'Stale asset: {p}'
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=6)as z:
 for p in sorted((APP/'build').rglob('*')):
  if p.is_file():z.write(p,p.relative_to(APP/'build').as_posix())
with zipfile.ZipFile(out)as z:
 assert 'index.html'in z.namelist()
 assert any(n.startswith('_app/immutable/bundle.')for n in z.namelist())
meta=dict(file=out.name,bytes=out.stat().st_size,sha256=hashlib.sha256(out.read_bytes()).hexdigest(),reports=paths,
 changes=['Scoped legacy selected-label rule to shared buttons; gold BET cells retain dark numerals, including hover',
 'Local Buy/Activate confirmation matches charcoal, gold and Nunito UI; existing balance guard, mode activation and events retained',
 'Big-win amount y increased from 0.16 to 0.23 of plaque height',
 'Scarab centre multiplier uses centred anchor and optical well offset; flying numeral matches its final position, size, anchor and rotation',
 'Only stopped result lights up, using an inset annular sector; rectangular tile sprites removed'],
 previews=['bet_desktop.jpg','bet_mobile.jpg','confirm_desktop.jpg','confirm_mobile.jpg','wheel_result.jpg','big_win.jpg'],
 previewDirectory='design/preview_mummy_20261107/layout_review',
 validationScope='Local full build; actual DOM components under complete global modal CSS; actual Pixi FgArcWheel, BannerMesh and GoldText in isolated mock fixture; no real bets or live Stake end-to-end test',
 typeDiagnostics=22)
if tiles:
 meta['changes'][-1]='Every multiplier has an inset curved plate with visible gaps; high tiers retain distinct colours; the stopped plate receives an extra gold light. Angle-dependent outer radii and end-cap clipping keep every plate off the stone frame.'
 meta['previews'].append('wheel_tiles_result.jpg')
 meta['validationScope']='Local type baseline and production build; every plate sampled across all stop offsets; Pixi wheel timing and actual isolated FgArcWheel visual checks; prior DOM/art/audio checks retained; no real bets or live Stake end-to-end test'
if stone:
 meta['changes'][-1]='Restored original mummyTile/mummyTileHot/mummyTileTop carved stone textures, each masked to its inset annular footprint; bevel rims and a restrained gold result glaze preserve material detail.'
 meta['changes'].append('Multiplier numeral tiers: 2/4 ivory, 6/8 gold, 10/12 orange, 14/16 rose, 32 violet. The strip, flyer and held result use the same colour for each value.')
 meta['previews']+=['wheel_stone_tiers_low.jpg','wheel_stone_tiers_high.jpg','wheel_stone_tiers_held.jpg']
if audio:
 meta['changes'].append('Raised general/sun wheel ticks by 5.35/5.46dB; general wheel stop by 3.15dB, multiplier selection by 3.52dB; sun stop/result by 2.63dB. Original player SFX controls and master compressor retained.')
 meta['audioPreview']='design/source/mummy_delivery/audio/wheel_volume_before_after.wav'
 meta['validationScope']='Decoded wheel cue gain/headroom audit and A/B demo; licensed audio checks; type baseline and production build. Earlier geometry/DOM/visual reports retained. No live Stake end-to-end test.'
(release/f'PACKAGE_{revision}.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(meta,ensure_ascii=False,indent=2))
