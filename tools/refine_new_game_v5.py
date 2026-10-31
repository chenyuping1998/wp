"""Install local CTA, object-specific prize performances and stronger ambient motion."""
from pathlib import Path
root=Path(__file__).parent;apps=root.parent/'apps'
for folder,kind,art in [('Purrfia喵菲亞家族','purrfia','purrfiaUi'),('ParrotRadio鸚鵡電台','parrot','parrotUi')]:
 app=apps/folder
 for name,target in [('new_game_buy_bonus.svelte','src/components/BuyBonusEntry.svelte'),('new_game_symbol_performance.ts','src/game/symbolPerformance.ts'),('new_game_symbol_win.svelte','src/components/SymbolMeshWin.svelte')]:
  (app/target).write_text((root/name).read_text(encoding='utf-8').replace('__KIND__',kind),encoding='utf-8')
 p=app/'src/components/Game.svelte';s=p.read_text(encoding='utf-8')
 if "import BuyBonusEntry" not in s:s=s.replace('<script lang="ts">','<script lang="ts">\n import BuyBonusEntry from \'./BuyBonusEntry.svelte\';',1)
 if '<BuyBonusEntry' not in s:s=s.replace('</App>',f'</App>\n<BuyBonusEntry kind="{kind}" art="./assets/sprites/{art}/buybonus_plate.png"/>')
 p.write_text(s,encoding='utf-8')
 p=app/'src/game/uiTheme.ts';s=p.read_text(encoding='utf-8').replace('buyBonusButtonScale:.9','buyBonusButtonScale:0')
 if 'accessible local CTA' not in s:s=s.replace(' buyBonusOnRail:', ' // The accessible local CTA owns the entry; suppress the tiny canvas duplicate.\n buyBonusOnRail:')
 p.write_text(s,encoding='utf-8')
 for name in ['backgroundMotion.ts','backgroundScene.ts']:(app/'src/game'/name).write_text((root/('new_game_background_motion.ts' if 'Motion' in name else 'new_game_background_scene.ts')).read_text(encoding='utf-8'),encoding='utf-8')
 print(folder,'V5 presentation installed',flush=True)
