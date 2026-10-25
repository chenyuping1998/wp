"""Read the authoritative math model without changing its configuration."""
from pathlib import Path
import sys, json, contextlib, io
math_root=Path(__file__).resolve().parents[4]/'math-sdk'
game=math_root/'games'/'Purrfia喵菲亞家族'
sys.path[:0]=[str(math_root),str(game)]
with contextlib.redirect_stdout(io.StringIO()):
    from game_config import GameConfig
    c=GameConfig()
print(json.dumps({'freeSpins':{'trigger':min(c.freespin_triggers[c.basegame_type]),'spins':c.freespin_triggers[c.basegame_type][3],'awards':c.freespin_triggers[c.basegame_type],'retrigger':min(c.freespin_triggers[c.freegame_type]),'retriggerSpins':5},'cellMultCap':c.cell_mult_cap,'stampValues':{'bonus':[2,3,5,10,25],'super':[5,10,25,50],'wincap':[10,25,50,100]}}))
