"""Install only Volt asset paths and theme overrides in this app."""
from pathlib import Path
import re
APP=Path(__file__).resolve().parent.parent
p=APP/'src/game/assets.ts';s=p.read_text(encoding='utf-8')
unused=['mummyLivingLinen','mummyWheelCat','mummyHoldProps','mummyFeatureProps','mummyBaseProps','mummyBandage','mummyBandageEnd']
unused += ['mummyBaseLinen'+str(i) for i in range(6)]
unused += ['mummyFlame'+scene+str(i) for scene in ['Base','Feature','Hold'] for i in range(2)]
for key in unused:s=re.sub(r'(?m)^\s*'+key+r':\s*\{[^}]*\},?\s*\n','\n',s)
for before,after in [('mummySymbols','voltSymbols'),('mummyBackground','voltBackground'),('mummyFrame','voltFrame'),('mummyWheel','voltWheel'),('mummyBanners','voltBanners'),('mummyCoins','voltCoins')]:
    s=s.replace('/'+before+'/', '/'+after+'/')
s=s.replace('/mummyUi/buy_icon.webp','/voltUi/buy_icon.webp')
s=s.replace('/mummyCat/mummyCat.','/voltMonster/voltMonster.')
for i in range(1,6):
    s=re.sub(r'(gbL'+str(i)+r'Plate:\s*\{[^}]*?voltSymbols/l'+str(i)+r')\.webp',r'\1_plate.webp',s)
extra={
 'voltGear':'voltBackground/gear','voltLamp':'voltBackground/lamp','voltElectrodes':'voltBackground/electrodes',
 'voltTubes':'voltBackground/tubes','voltCoil':'voltBackground/coil','voltScope':'voltBackground/scope',
 'voltCables':'voltBackground/cables','voltBeacon':'voltBackground/beacon','voltValve':'voltBackground/valve',
 'voltBattery':'voltBackground/battery','voltIndicators':'voltBackground/indicators','voltGauge':'voltBackground/gauge',
}
for symbol in ['W','S']:
    for suffix in ['Plate','Subject','Shadow']:extra['gb'+symbol+suffix]='voltSymbols/'+symbol.lower()+'_'+suffix.lower()
entries=''
for key,path in extra.items():
    if re.search(r'\b'+key+r'\s*:',s):continue
    entries+=f"\n {key}:{{type:'sprite',src:new URL('../../assets/sprites/{path}.webp',import.meta.url).href,preload:true}},"
s=s.replace('export default {','export default {'+entries,1)
p.write_text(s,encoding='utf-8')
p=APP/'src/components/ui/BuyEmblem.svelte';s=p.read_text(encoding='utf-8')
s=s.replace("scarab:'scarab',sure:'scarab',sun:'sun'","scarab:'volt',sure:'volt',sun:'tesla'")
s=s.replace('/mummyUi/','/voltUi/');p.write_text(s,encoding='utf-8')
p=APP/'src/components/ui/ModalBuyBonus.svelte';s=p.read_text(encoding='utf-8')
s=s.replace('CHOOSE YOUR CURSE','CHARGE UP YOUR LAB')
for a,b in {'#d9b77a':'#C47A3A','#a9c3c0':'#b9c7d0','#123a45':'#2E3640','#0b2229':'#1B2430','#0f2e37':'#273441','#04171c':'#15202b','#2ec4b6':'#4FF0C8'}.items():s=s.replace(a,b)
p.write_text(s,encoding='utf-8')
# Local shared-modal overrides still inherited a brown/olive skin. No package changes.
p=APP/'src/components/ui/Modals.svelte';s=p.read_text(encoding='utf-8')
for a,b in {'#4a3a22':'#354451','#2e2416':'#1B2430','#6a4f26':'#465a65','#3e2f18':'#2E3640','#ffa53a':'#C47A3A','#6e5e4a':'#5E6B78','#9b876e':'#8496a1','#ffc45a':'#4FF0C8','#ffd75e':'#4FF0C8','#d0c6b2':'#bdcbd3','#f3e6c8':'#edf5f6'}.items():s=s.replace(a,b)
p.write_text(s,encoding='utf-8')
p=APP/'src/components/FgArcWheel.svelte';s=p.read_text(encoding='utf-8')
for a,b in {'0xf2c65c':'0x4ff0c8','0xffe8a1':'0xbbfff0','0xfff3c4':'0xf2fff9','0x2a1600':'0x1b2430','0xf2e8d0':'0x4ff0c8','0xffd76a':'0x4ff0c8','0xfff2a0':'0xf3fafb','0xffe5a5':'0xeafff8'}.items():s=s.replace(a,b)
p.write_text(s,encoding='utf-8')
print('Installed Volt sprites, removed dormant mummy ambience loads, retained SplitBar v4')
