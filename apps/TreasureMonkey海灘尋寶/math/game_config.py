"""Treasure Monkey: independent 5x4 / 14-line math, all modes target 96%."""
import csv
import json
from pathlib import Path
from src.config.config import Config
from src.config.betmode import BetMode

ROOT = Path(__file__).resolve().parent
RULES = json.loads((ROOT / 'rules.json').read_text(encoding='utf-8'))

class GameConfig(Config):
    def __init__(self):
        super().__init__()
        self.game_id = self.game_name = 'TreasureMonkey'
        self.working_name = 'Treasure Monkey'
        self.provider_name = 'igs'
        self.provider_number = 0
        self.rtp = .96
        self.wincap = 20000
        self.win_type = 'lines'
        self.num_reels, self.num_rows = 5, [4] * 5
        self.include_padding = True
        self.construct_paths()
        self.paylines = {int(k): v for k, v in RULES['paylines'].items()}
        self.paytable = {(int(k), name): value for name, data in RULES['symbols'].items()
                         for entry in data['paytable'] or [] for k, value in entry.items()}
        self.special_symbols = {'wild': ['W'], 'scatter': ['S'], 'expandwild': ['SW']}
        self.freespin_triggers = {'basegame': {3: 10, 4: 10, 5: 10}, 'freegame': {2: 2, 3: 4, 4: 6, 5: 8}}
        self.bet_modes = [BetMode(name=name, cost=data['cost'], rtp=.96, max_win=20000,
                                 auto_close_disabled=False, is_feature=name == 'base',
                                 is_buybonus=name != 'base', distributions=[])
                          for name, data in RULES['modes'].items()]
        self.reels = {}
        for key in ('BR0', 'FR0'):
            with (ROOT / 'reels' / f'{key}.csv').open(encoding='utf-8') as handle:
                rows = list(csv.reader(handle))
            self.reels[key] = [list(column) for column in zip(*rows)]
        self.padding_reels = {'basegame': self.reels['BR0'], 'freegame': self.reels['FR0']}

