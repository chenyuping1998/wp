from pathlib import Path
import re
app=Path(__file__).resolve().parents[1]
def edit(rel,fn):
 p=app/rel;p.write_text(fn(p.read_text(encoding='utf8')),encoding='utf8')
edit('src/components/DevControls.svelte',lambda s:s.replace("let enabled=$state(false);","let enabled=$state(false);\nconst continueReview=()=>window.dispatchEvent(new Event('purrfia-review-continue'));").replace("onclick={()=>window.dispatchEvent(new Event('purrfia-review-continue'))}","onclick={continueReview}"))
edit('src/components/Territory.svelte',lambda s:s.replace('SYMBOL_SIZE/2,y=(cell.row-1)*SYMBOL_SIZE;','SYMBOL_SIZE/2;const y=(cell.row-1)*SYMBOL_SIZE;'))
edit('src/components/ui/ModalGameRules.svelte',lambda s:s.replace("const sections=[['clusterTitle','cluster'],['boxesTitle','boxes'],['territoryTitle','territory'],['freeTitle','free'],['buyTitle','bonus'],['buyTitle','super']] as const;","const sections=[{title:'clusterTitle',body:'cluster'},{title:'boxesTitle',body:'boxes'},{title:'territoryTitle',body:'territory'},{title:'freeTitle',body:'free'},{title:'buyTitle',body:'bonus'},{title:'buyTitle',body:'super'}] as const;").replace('{#each sections as [title,body]}','{#each sections as section}').replace('purrfiaText(title)','purrfiaText(section.title)').replace('purrfiaText(body)','purrfiaText(section.body)'))

