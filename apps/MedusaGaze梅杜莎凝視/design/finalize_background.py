"""Save verified background delivery without marking the rest of the game done."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json
import re

app=Path(__file__).resolve().parent.parent
root=app/'design/source/medusagaze';folder=root/'background'
buildlog=Path('E:/stake/tmp/medusa-background-v2-build-20261025.log')
typelog=Path('E:/stake/tmp/medusa-background-v2-svelte-check-20261025.log')
build=buildlog.read_text(encoding='utf-8');assert 'adapter-static' in build and 'done' in build
types=typelog.read_text(encoding='utf-8');assert 'COMPLETED' in types
assert not re.search(r'ERROR.*(?:Background\.svelte|backgroundScene|backgroundMotion|backgroundPreview|Sound\.svelte|Game\.svelte|sound\.ts)',types)
manifest=json.loads((folder/'manifest.json').read_text(encoding='utf-8'))
validation=json.loads((folder/'validation.json').read_text(encoding='utf-8'))
recording=json.loads((folder/'recording_v2.json').read_text(encoding='utf-8'))
for image in manifest['files']:
    name=image['name']
    assert (folder/name).read_bytes()==(app/'static/assets/sprites/medusaBackground'/name).read_bytes()
    assert (folder/name).read_bytes()==(app/'build/assets/sprites/medusaBackground'/name).read_bytes()
manifest['animationVersion']=2
manifest['integration']={'component':'src/components/Background.svelte','renderer':'src/game/backgroundScene.ts','curves':'src/game/backgroundMotion.ts',
    'dayNightTransitionSeconds':1,'statueSeconds':1.2,'soundCue':'sfx_statues_crack','soundVolume':.6,
    'backgroundTargetUpdateHz':60,'statueFragmentsPerStatue':12,'crackStages':3,'statueAssembly':'bottom-to-top, one overshoot settle',
    'flameGrid':{'columns':18,'rows':28},'flameAction':'root-locked traveling curl and internal UV flow, independent seeds',
    'hiddenPage':'paused without catch-up','reducedMotion':'clouds/fire freeze; statue action disabled',
    'scope':'App-owned only; wp/packages unchanged','buildImagesMatch':True}
(folder/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

archive=folder/'MedusaGaze_background_v2.zip'
with ZipFile(archive,'w',ZIP_DEFLATED) as z:
    for image in manifest['files']:z.write(folder/image['name'],'assets/sprites/medusaBackground/'+image['name'])
    for name in ['BACKGROUND_PROMPTS.md','README.txt','manifest.json','validation.json','recording_v2.json','browser-review-v2.json','play.html','MedusaGaze_background_v2.mp4','MedusaGaze_background_v2_preview.gif']:z.write(folder/name,name)
    for name in ['backgroundScene.ts','backgroundMotion.ts','assets.ts','sound.ts']:z.write(app/'src/game'/name,'code/game/'+name)
    for name in ['fx_glow.png','fx_crack_1.png','fx_crack_2.png','fx_crack_3.png']:z.write(app/'static/assets/sprites/medusaFx'/name,'assets/sprites/medusaFx/'+name)
    z.write(app/'src/components/Background.svelte','code/Background.svelte')
    z.write(app/'src/components/Sound.svelte','code/Sound.svelte')
    z.write(app/'static/assets/audio/medusa/sfx_statues_crack.wav','assets/audio/medusa/sfx_statues_crack.wav')
    z.write(root/'_sheets/background_animation_v2_contact.jpg','background_animation_v2_contact.jpg')
with ZipFile(archive) as z:assert z.testzip() is None

status_file=root/'delivery-status.json';status=json.loads(status_file.read_text(encoding='utf-8'))
status['date']='2026-10-25';status['stage']='polished_symbols_and_background_animation_v2'
status['background']={'status':'three_background_actions_with_authored_break_hold_staggered_settle','version':2,'artFiles':6,'runtimeBytes':manifest['runtimeBytes'],
    'review':'background/preview/index.html','player':'background/play.html','video':'background/MedusaGaze_background_v2.mp4','silentSource':'background/MedusaGaze_background_v2.webm','animatedPreview':'background/MedusaGaze_background_v2_preview.gif','recordingSeconds':recording['durationSeconds'],
    'contactSheet':'_sheets/background_animation_v2_contact.jpg','prompts':'background/BACKGROUND_PROMPTS.md','manifest':'background/manifest.json',
    'download':'background/MedusaGaze_background_v2.zip','validation':'background/validation.json',
    'motion':['雲每分鐘移動場景寬度1/5','免費遊戲火舌分段翻捲與UV亮紋上移，火根固定','每次大獎一次1.2秒三階裂紋、12塊甩出、停頓、下方先扣回的石像演出'],
    'reviewCrops':'Video 7-14s shows inspection crops; game camera is fixed.',
    'architecture':'固定，沒有背景鏡頭晃動、縮放、全景亮暗呼吸或柱子擺動',
    'accessibility':'頁面隱藏暫停並清除時間差；尊重減少動態偏好',
    'browserReview':'Exact shared Pixi renderer v2 recorded, including fire and statue details, with no preview errors. Local mock baseThrow completed, day/dusk fire switch seen in bonusBigTotal. Game completion details are saved in browser-review-v2.json. Not Stake Engine footage.',
    'engineVerification':'not_yet_tested_in_Stake_Engine'}
status['validation'].update({'build':'background_v2_passed_exit_0_adapter_static_done','buildLog':str(buildlog).replace('\\','/'),
    'typeCheckLog':str(typelog).replace('\\','/'),'typeCheck':'Full svelte-check has 154 existing errors in tools/config/dependencies; no errors in changed background/game/sound sources.',
    'assetPathsChecked':137,'backgroundChecks':'384px/min; 12-piece complete partition; 1.2s staggered exact restoration; anchored fire and UV; 30s flame mesh triangle checks; all 6 packaged images match runtime.'})
status['audio']['notes']=[note.replace('Buy Bonus hover與confirm、蛇哈欠、背景石像碎裂的素材已交付，專屬動畫事件尚待接線。','Buy Bonus hover與confirm、蛇哈欠素材已交付，專屬事件尚待接線；背景石像碎裂已接入大獎事件。') for note in status['audio']['notes']]
status_file.write_text(json.dumps(status,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'version':2,'backgroundAssets':6,'runtimeBytes':manifest['runtimeBytes'],'videoSeconds':recording['durationSeconds'],'zipBytes':archive.stat().st_size,'zipIntegrity':'PASS','build':'PASS','changedBackgroundSourceErrors':0},indent=2))
