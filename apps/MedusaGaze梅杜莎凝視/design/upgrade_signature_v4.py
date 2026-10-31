"""Remove turbo acceleration from Medusa's signature and align the local review."""
from pathlib import Path
APP=Path(__file__).resolve().parent.parent
p=APP/'src/components/MedusaThrow.svelte';s=p.read_text(encoding='utf-8')
s=s.replace('toTotal, pace })','toTotal })').replace("\t\t\tconst fast = pace === 'turbo' || pace === 'turboFreegame';\n",'')
s=s.replace('turbo: fast','turbo: false').replace('speed:fast?1.5:1','speed:1').replace('speed:fast?1.25:1','speed:1')
s=s.replace('const beamAt = applied ? action.beamAtMs : Math.max(0, plan.releaseMs - 100);','const beamAt=action.beamAtMs;')
s=s.replace('fast ? 100 : 200','200').replace('const chargeMs=fast?70:130;','const chargeMs=plan.chargeMs;')
s=s.replace('fast ? 120 : 200','200').replace('fast ? 90 : 150','200')
assert 'fast' not in s
p.write_text(s,encoding='utf-8')
p=APP/'design/multiplierPreview.ts';s=p.read_text(encoding='utf-8')
s=s.replace('const charge=current.turbo?70:130','const charge=plan.chargeMs').replace('sound(key,current.turbo?1.5:1)','sound(key,1)')
s=s.replace("cue(current.turbo?100:200,'sfx_glasses_slide')","cue(200,'sfx_glasses_slide')")
s=s.replace("current.applied?medusaAnimations[plan.animation].beamAtMs:Math.max(0,plan.releaseMs-100)","medusaAnimations[plan.animation].beamAtMs")
s=s.replace("{name:'Turbo ×100',free:false,turbo:true,applied:true,values:[100],mult:100}","{name:'TURBO 1 ×25',free:false,turbo:true,applied:true,values:[25],mult:25},{name:'TURBO 2 ×25',free:false,turbo:true,applied:true,values:[25],mult:25},{name:'金色倍率 ×100',free:false,turbo:false,applied:true,values:[100],mult:100}")
s=s.replace('clock>=3.6','clock>=5.2')
p.write_text(s,encoding='utf-8')
p=APP/'design/source/medusagaze/multiplier/preview/index.html';s=p.read_text(encoding='utf-8').replace('招牌演出 · v3','招牌演出 · v4').replace('max="3.6"','max="5.2"').replace('scene.js?v=3','scene.js?v=4')
s=s.replace('固定鏡頭。此頁共用','一般／TURBO 1／TURBO 2 的角色、光芒、倍率球與跳數速度相同。固定鏡頭。此頁共用')
p.write_text(s,encoding='utf-8')
print('Signature v4: shared timings at all turbo tiers, longer eye radiance and orb condensation, updated frame review.')
