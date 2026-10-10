"""Go Banandit: 5x4, 1,024 ways. Banana Sacks carry values; the Bandit (Wild) collects them.

Spec: wp-banandit/apps/GoBanandit/SPEC.md. Numbers the frontend prints (spins per
trigger, meter thresholds, collect multipliers, superbonus head start) live here
and are lifted into the client config by design/sync_math_config.mjs.
"""

import os
from src.config.config import Config
from src.config.distributions import Distribution
from src.config.betmode import BetMode


class GameConfig(Config):
    """Game specific configuration class."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        super().__init__()
        self.game_id = "GoBanandit"
        self.provider_number = 0
        self.working_name = "Go Banandit"
        self.wincap = 10000
        self.win_type = "ways"
        self.rtp = 0.9612  # 2026-10-10: user asked for 96.0–96.7 (LUT reweighted)
        self.construct_paths()

        self.num_reels = 5
        self.num_rows = [4] * self.num_reels

        # Go Boomana's table cut ~25% (2026-09-30: the Sacks carry most of the
        # value here). Every value sits on the 0.1 grid, and ways are integers,
        # so every ways win does too (RGS rejects payouts off that grid).
        self.paytable = {
            (5, "H1"): 4.0, (4, "H1"): 1.8, (3, "H1"): 0.8,
            (5, "H2"): 3.0, (4, "H2"): 1.3, (3, "H2"): 0.6,
            (5, "H3"): 2.2, (4, "H3"): 1.0, (3, "H3"): 0.5,
            (5, "H4"): 1.7, (4, "H4"): 0.8, (3, "H4"): 0.3,
            (5, "L1"): 1.2, (4, "L1"): 0.5, (3, "L1"): 0.2,
            (5, "L2"): 1.0, (4, "L2"): 0.4, (3, "L2"): 0.2,
            (5, "L3"): 0.7, (4, "L3"): 0.3, (3, "L3"): 0.1,
            (5, "L4"): 0.5, (4, "L4"): 0.2, (3, "L4"): 0.1,
            (5, "L5"): 0.4, (4, "L5"): 0.2, (3, "L5"): 0.1,
        }

        self.include_padding = True
        # P = Banana Sack (carries a prize), W = Bandit (wild + collector).
        self.special_symbols = {"wild": ["W"], "scatter": ["S"], "prize": ["P"]}

        self.freespin_triggers = {
            self.basegame_type: {3: 10, 4: 12, 5: 15},
            self.freegame_type: {3: 0, 4: 0, 5: 0},  # no retrigger: FG strips carry no S
        }
        self.anticipation_triggers = {self.basegame_type: 2, self.freegame_type: 99}

        # The Bandit meter (free spins only). Crossing a threshold adds spins and
        # lifts the multiplier on every later collection.
        self.meter_thresholds = [4, 8, 12]
        self.meter_spins_added = 10
        self.collect_mults = [1, 2, 3, 10]
        # superbonus opens as if the first threshold had already been crossed
        # (without its +10 spins).
        self.buy_start_meter = {"bonus": 0, "superbonus": 4}
        self.buy_spins = {"bonus": 10, "superbonus": 10}

        reels = {"BR0": "BR0.csv", "FR0": "FR0.csv", "FRWCAP": "FRWCAP.csv"}
        self.reels = {}
        for r, f in reels.items():
            self.reels[r] = self.read_reels_csv(os.path.join(self.reels_path, f))
        # what the client spins before the reveal lands (config_fe paddingReels)
        self.padding_reels[self.basegame_type] = self.reels["BR0"]
        self.padding_reels[self.freegame_type] = self.reels["FR0"]

        base_prizes = {1: 400, 2: 250, 3: 150, 4: 80, 5: 60, 10: 25, 15: 8, 20: 4, 25: 2, 50: 1}
        # 100 and the rare 250 exist for the tail: without them no natural book
        # reached 5,000x-10,000x (2026-10-01: max natural was ~4,100x, only the
        # capped books lived above it). 250 at x10 with two Bandits is 5,000x.
        fg_prizes = {1: 260, 2: 220, 3: 160, 4: 110, 5: 100, 10: 50, 15: 20, 20: 12, 25: 6, 50: 2, 100: 0.6, 250: 0.5}
        cap_prizes = {5: 50, 10: 80, 15: 60, 20: 50, 25: 40, 50: 30}

        mode_maxwins = {"base": self.wincap, "bonus": self.wincap, "superbonus": self.wincap}

        def buy_distributions(mode):
            return [
                Distribution(
                    criteria="wincap",
                    quota=0.001,
                    win_criteria=mode_maxwins[mode],
                    conditions={
                        "reel_weights": {
                            self.basegame_type: {"BR0": 1},
                            self.freegame_type: {"FR0": 1, "FRWCAP": 3},
                        },
                        "force_wincap": True,
                        "force_freegame": True,
                        "scatter_triggers": {3: 1},
                        "prize_values": cap_prizes,
                        "fg_prize_values": cap_prizes,
                        "start_meter": self.buy_start_meter[mode],
                    },
                ),
                Distribution(
                    criteria="freegame",
                    quota=0.999,
                    conditions={
                        "reel_weights": {
                            self.basegame_type: {"BR0": 1},
                            self.freegame_type: {"FR0": 1},
                        },
                        "force_wincap": False,
                        "force_freegame": True,
                        "scatter_triggers": {3: 1},
                        "prize_values": base_prizes,
                        "fg_prize_values": fg_prizes,
                        "start_meter": self.buy_start_meter[mode],
                    },
                ),
            ]

        self.bet_modes = [
            BetMode(
                name="base",
                cost=1.0,
                rtp=self.rtp,
                max_win=mode_maxwins["base"],
                auto_close_disabled=False,
                is_feature=True,
                is_buybonus=False,
                distributions=[
                    Distribution(
                        criteria="wincap",
                        quota=0.001,
                        win_criteria=mode_maxwins["base"],
                        conditions={
                            "reel_weights": {
                                self.basegame_type: {"BR0": 1},
                                self.freegame_type: {"FR0": 1, "FRWCAP": 3},
                            },
                            "force_wincap": True,
                            "force_freegame": True,
                            "scatter_triggers": {3: 60, 4: 25, 5: 8},
                            "prize_values": base_prizes,
                            "fg_prize_values": cap_prizes,
                            "start_meter": 0,
                        },
                    ),
                    Distribution(
                        criteria="freegame",
                        quota=0.1,
                        conditions={
                            "reel_weights": {
                                self.basegame_type: {"BR0": 1},
                                self.freegame_type: {"FR0": 1},
                            },
                            "force_wincap": False,
                            "force_freegame": True,
                            "scatter_triggers": {3: 100, 4: 20, 5: 4},
                            "prize_values": base_prizes,
                            "fg_prize_values": fg_prizes,
                            "start_meter": 0,
                        },
                    ),
                    Distribution(
                        criteria="0",
                        quota=0.4,
                        win_criteria=0.0,
                        conditions={
                            "reel_weights": {self.basegame_type: {"BR0": 1}},
                            "force_wincap": False,
                            "force_freegame": False,
                            "prize_values": base_prizes,
                            "start_meter": 0,
                        },
                    ),
                    Distribution(
                        criteria="basegame",
                        quota=0.499,
                        conditions={
                            "reel_weights": {self.basegame_type: {"BR0": 1}},
                            "force_wincap": False,
                            "force_freegame": False,
                            "prize_values": base_prizes,
                            "start_meter": 0,
                        },
                    ),
                ],
            ),
            BetMode(
                name="bonus",
                cost=100.0,
                rtp=self.rtp,
                max_win=mode_maxwins["bonus"],
                auto_close_disabled=False,
                is_feature=False,
                is_buybonus=True,
                distributions=buy_distributions("bonus"),
            ),
            BetMode(
                name="superbonus",
                cost=150.0,
                rtp=self.rtp,
                max_win=mode_maxwins["superbonus"],
                auto_close_disabled=False,
                is_feature=False,
                is_buybonus=True,
                distributions=buy_distributions("superbonus"),
            ),
        ]
