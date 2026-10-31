"""Record the completed power-gradient review and prepare the local delivery."""
from pathlib import Path
import json
APP=Path(__file__).resolve().parent.parent
ROOT=APP/'design/source/medusagaze'
native=json.loads((APP/'design/multiplier-performance-validation.json').read_text(encoding='utf-8'))
audio=json.loads((ROOT/'audio/ORB_POWER_V10_AUDITION.json').read_text(encoding='utf-8'))
assert native['passed'] and native['version']==10 and audio['passed']
proofs=[f'source/medusagaze/_sheets/orb_power_20261031_{name}.png' for name in ['low_flight','high_charge','high_flight','high_impact','three_orbs','three_result','off_result','turbo2_result']]
for proof in proofs:assert (APP/'design'/proof).is_file(),proof
report={
 'date':'2026-10-31','revision':'20261031-orb-power-v10','passed':True,
 'scope':'Production-shared Pixi/Spine review with original art and local mock game; stills only, no video.',
 'changes':[
  'Eleven published multipliers from 2x to 500x use continuous logarithmic intensity; seven interpolated light-colour anchors.',
  'Body size, gathering motes, launch pressure, corona and flight wake increase with value. Original green/purple/gold painted orbs retained.',
  'High values introduce a golden flame crown and orbiting broken Greek-key marks; up to four distinct wake phases.',
  'Up to three staggered local impact fronts and peripheral golden release fingers; fixed camera and board.',
  'Crystal hit timbres crossfade with equal-power gains; charge/release/wind gain scales with value. One-to-three fly voices retain their power-aware budget.',
  'Numbers remain upright and render above orb bodies. Voice events, character breathing and FG forehead glasses retained.'],
 'native':{'report':'multiplier-performance-validation.json','values':native['powerGradient']['values'],'maxBodyScale':1.24,'maxWakeStrands':4,'flightCurveSamples':484,'turboTierComparisons':16,'chargeMs':350,'flightMs':600,'noAddedPerformanceDelay':True,'colourAndAudioBoundaryContinuity':'passed','reducedMotionAndOwnedGlowCleanup':'passed'},
 'visualReview':[
  {'case':'2x','frameSeconds':1.6,'notes':'Compact green orb, restrained open arcs, readable upright numeral.'},
  {'case':'500x charge','frameSeconds':.98,'notes':'Larger golden orb, gathering light, Greek-key mantle and flame fingers; green eyes remain visible.'},
  {'case':'500x flight','frameSeconds':1.2,'notes':'Larger silhouette and golden crown compared with low power; no scene-camera movement.'},
  {'case':'500x impact','frameSeconds':1.73,'notes':'Layered pressure fronts radiate around the cumulative plaque inside the existing impact beat.'},
  {'case':'8x / 100x / 500x volley','frameSeconds':1.35,'notes':'Three distinct bodies, palette/size differences and all three upright labels readable.'},
  {'case':'Sound-enabled three-orb replay','result':'x663 / $663.00 art-review example, resting body, no remaining flight orbs; forehead glasses retained.'},
  {'case':'Sound-enabled 2x replay','notes':'Reached completed count/readout at 4.479s.'}],
 'gameSmoke':[{'book':'baseThrow','tier':tier,'result':'$12.50','returnedToIdle':True} for tier in ['OFF','TURBO 2']],
 'audio':{'runtimeFiles':65,'mix':'source/medusagaze/audio/ORB_POWER_V10_MIX.json','audition':'source/medusagaze/audio/ORB_POWER_V10_AUDITION.wav','isolatedPeakDbFS':audio['peakDbFS'],'perExampleNormalization':False,'isolatedMixClipping':False,'note':'Four single-orb examples plus three-orb stress mix; existing runtime limiter retained. Vocals remain synthetic.'},
 'console':{'runtimeErrors':0,'previewAudioLoadErrors':0,'notes':'Existing Pixi TextStyle warning only in local development game.'},
 'fullBuild':'passed','buildLog':'E:/stake/tmp/medusa-orb-power-build-20261031.log',
 'typeCheck':{'errors':0,'warnings':1,'warning':'Existing tsconfig allowImportingTsExtensions/noEmit setting'},
 'screenshots':proofs,
 'limits':'Local mock/headless lifecycle and native replay, not live RGS/wallet accounting or end-to-end device loudness/frame-pacing certification. Portrait visual QA and the historical 15-spin feature were not repeated this pass.'}
(APP/'design/orb-power-browser-validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
progress_path=APP/'design/completion-progress.json'
progress=json.loads(progress_path.read_text(encoding='utf-8'));progress['revision']=report['revision'];progress['orbPowerRefinement']=report
progress['validation']='Production build passed; svelte-check 0 errors / 1 existing warning. Eleven multiplier powers, colour/audio continuity, equal turbo clocks, reduced motion/cleanup, OFF/T2 mock rounds and low/high/three-orb visuals verified.'
progress['multiplierSignature']['version']=10
progress_path.write_text(json.dumps(progress,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
page=ROOT/'review.html';html=page.read_text(encoding='utf-8')
panel='''<section id="orb-power"><h2>倍率球層次 · 低倍至神威 · 2026-10-31</h2><p>2×～500× 的球體、光芒、凝聚光點、飛行尾流與命中力道隨倍率平順增強。低倍清脆俐落，中倍帶紫色晶光，高倍轉為金色光冠；250×／500× 增加金色火冠、希臘刻紋與分層衝擊波。數字保持正向並位於球體前方，鏡頭與盤框固定。</p><p>蓄力、釋放與風壓音量隨倍率增加，晶石命中由清脆漸混入厚實重擊；三顆球共享飛行風聲預算。350ms 蓄力、600ms 飛行及三種 TURBO 的人物／倍率聲畫時序維持。</p><nav><a href="multiplier/preview/index.html?revision=2f1d49edd7fb">播放低倍／高倍／三球演出</a><a href="../../orb-power-browser-validation.json">本輪驗收</a><a href="../../multiplier-performance-validation.json">原生強度與時序檢查</a></nav><p>聲音對照依序為 2×、25×、100×、500×；各例使用相同輸出增益。仍使用本款原創合成音訊。</p><audio controls preload="none" src="audio/ORB_POWER_V10_AUDITION.wav"></audio><p>完整建置通過，型別檢查 0 錯誤、1 個既有設定警告。OFF／TURBO 2 本地回放各完成 $12.50 並返回待機；三球示例完成 ×663／$663.00，未見殘留球體或音訊載入錯誤。未錄製影片。</p><img src="_sheets/orb_power_20261031_three_orbs.png" alt="8倍、100倍與500倍同場的球體、光冠與清楚數字"><img src="_sheets/orb_power_20261031_high_impact.png" alt="500倍金色倍率球命中後的分層衝擊波"></section>'''
if '<section id="orb-power">' not in html:html=html.replace('<section id="temple-ui">',panel+'<section id="temple-ui">',1)
page.write_text(html,encoding='utf-8')
print('Power-gradient review, proof inventory and completion record updated.')
