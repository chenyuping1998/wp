"""Check symbol creation, round reset and multi-rung upgrades directly."""
from copy import deepcopy
from game_config import GameConfig
from gamestate import GameState
from game_optimization import OptimizationSetup

cfg = GameConfig()
OptimizationSetup(cfg)  # RTP slices must still sum to each mode's target.
gs = GameState(cfg)
gs.betmode = 'bonus'
gs.criteria = 'freegame'
original_reels = deepcopy(cfg.reels)
names = ['H1', 'H2', 'H3', 'H4', 'L1', 'L2', 'L3', 'L4', 'L5', 'W', 'P']
for level in range(4):
    gs.gametype = cfg.freegame_type
    gs.meter_level = level
    for name in names:
        sym = gs.create_symbol(name)
        expected = 'P' if name in cfg.plate_replacements[:level] else name
        assert sym.name == expected, (level, name, sym.name, expected)
        if expected == 'P':
            assert sym.get_attribute('prize') > 0
    assert gs.current_collect_mult() == 1

# Even after all upgrades, base-game symbols must remain unchanged.
gs.gametype = cfg.basegame_type
for name in names:
    assert gs.create_symbol(name).name == name
assert cfg.reels == original_reels, 'Conversion mutated shared reel strips'

# One reveal can cross all three thresholds; award and unlock each only once.
gs.gametype = cfg.freegame_type
gs.meter = 3
gs.meter_level = 0
gs.tot_fs = 10
gs.board = [[gs.create_symbol('W') for _ in range(3)] for _ in range(4)]
gs.update_bandit_meter()
event = gs.book.events[-1]
assert (gs.meter_level, gs.tot_fs) == (3, 40)
assert event['spinsAdded'] == 30 and event['levelUp'] == 3
assert event['removedSymbols'] == ['L5', 'L4', 'L3']
assert event['mult'] == 1
gs.update_bandit_meter()
assert gs.tot_fs == 40, 'Already unlocked upgrades added spins again'

gs.reset_book()
assert gs.meter_level == 0 and gs.meter == 0
gs.gametype = cfg.freegame_type
gs.start_meter_for_mode()
assert gs.meter_level == 0
gs.betmode = 'superbonus'
gs.start_meter_for_mode()
assert gs.meter_level == 1 and gs.create_symbol('L5').name == 'P'
assert gs.current_collect_mult() == 1
print('OK: all low-type mappings, prize assignment, x1, reset, head start and multi-rung awards')
