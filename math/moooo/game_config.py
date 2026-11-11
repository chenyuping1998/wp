"""Moooo - game configuration.

5x4 lines game, 10 fixed paylines, MOOOO expanding wilds carrying additive bell
multipliers, and a per-reel Milk Meter that raises each reel's minimum bell tier
across a free-spin round.

Stake compliance notes:
  * There are NO jackpots. Bells award plain bet-multipliers only. The Stake
    approval checklist prohibits jackpot mechanics outright ("No Jackpots,
    Gamble features, or Early Cashout").
  * Bell values are multipliers, never fixed currency amounts, so the game stays
    correct in every currency the platform offers.
  * Max win is 10000x and must be reachable - see the `wincap` distributions and
    the paytable note below.
"""

import os
from src.config.config import Config
from src.config.distributions import Distribution
from src.config.betmode import BetMode


# ----------------------------------------------------------------------------
# Bell tiers
# ----------------------------------------------------------------------------
# Three tiers, told apart by the colour of the bell around the cow's neck.
# Ordered weakest first: the Milk Meter raises a reel's FLOOR by index into this
# tuple, so the order is load-bearing, not cosmetic.
PASTURE, PRIZE, CHAMPION = "pasture", "prize", "champion"
TIERS = (PASTURE, PRIZE, CHAMPION)

# Discrete value sets with deliberate overlap, mirroring the reference rather
# than using clean non-overlapping bands.
#
# The overlap is the point. A Prize bell can roll a 5x that a Pasture bell can
# also beat, so raising a reel's floor does NOT hand the player a better roll
# every time - it moves the worst case. That is what stops a filling meter
# reading as a straight line to a jackpot.
#
# ---------------------------------------------------------------------------
# Pasture is TWO tables, base game and free game, and that is measured.
#
# The reference's Common ladder differs between its main game and its feature by
# a wide margin (2x is 35.3% of main-game rolls against 17.6% in the feature,
# p < 1e-4 over n=434/478), and the same shape shows up in its natural play as
# well as its bought rounds - so it is the game's design, not a sampling
# artefact of how the data was collected. Weights below are the reference's own
# counts.
#
#   Pasture (brass)   base game   average  3.45x
#                     free game            4.12x
#   Prize   (silver)  5, 10, 15, 20, 25, 50x       12.12x
#   Champion (gold)   10, 15, 20, 25, 50, 100x     20.28x
#
# Prize and Champion are shared between base and free: the reference could not
# separate them either (n=38 and n=8 on the main-game side), so splitting them
# here would be inventing a distinction the data does not support.
PASTURE_BASE = {2: 353, 3: 267, 4: 168, 5: 111, 6: 58, 7: 16, 8: 9, 9: 7, 10: 12}
PASTURE_FREE = {2: 176, 3: 270, 4: 199, 5: 149, 6: 134, 7: 27, 8: 10, 9: 15, 10: 21}
PRIZE_LADDER = {5: 340, 10: 260, 15: 170, 20: 105, 25: 70, 50: 20}
CHAMPION_LADDER = {10: 300, 15: 230, 20: 170, 25: 120, 50: 60, 100: 25}

BASE_LADDERS = {PASTURE: PASTURE_BASE, PRIZE: PRIZE_LADDER, CHAMPION: CHAMPION_LADDER}
FREE_LADDERS = {PASTURE: PASTURE_FREE, PRIZE: PRIZE_LADDER, CHAMPION: CHAMPION_LADDER}

# Wincap hunt: the same value sets, weighted to the top of each so forced
# max-win books converge. Still the same numbers a player could genuinely draw -
# a wincap book has to be a board the game could really have dealt.
WINCAP_LADDERS = {
    PASTURE: {8: 10, 9: 20, 10: 70},
    PRIZE: {20: 15, 25: 35, 50: 50},
    CHAMPION: {25: 10, 50: 30, 100: 60},
}

# ---------------------------------------------------------------------------
# Tier weights, indexed by the reel's Milk Meter LEVEL.
#
# This replaces a single ladder that was filtered and renormalised by the floor.
# That model could not express the reference's actual behaviour: filtering
# {pasture 88, prize 10, champion 2} at level 2 leaves prize/champion in an
# 83/17 split, where the reference measures 97.1/2.9 (n=1324). The floor does
# not merely delete the tiers below it, it re-shapes what is left - each level
# is overwhelmingly its OWN tier, with a thin tail above.
#
# That difference is the whole feel of the meter. Under the old model a level-2
# reel was already handing out Champions one roll in six; under this one it
# gives them one in 34, and reaching level 3 is what actually buys them. Weights
# are the reference's counts.
#
#   level 1    89.4% / 9.5% / 1.1%     average bell  4.90x
#   level 2       -  / 97.1% / 2.9%                 12.36x
#   level 3       -  /   -   / 100%                 20.28x
#
# The base game has no meter and is always level 1, so it uses the same table -
# three independent samples in the reference (natural play and both bought
# variants) are indistinguishable from its level-1 feature rolls.
TIER_WEIGHTS_BY_LEVEL = {
    1: {PASTURE: 894, PRIZE: 95, CHAMPION: 11},
    2: {PRIZE: 971, CHAMPION: 29},
    3: {CHAMPION: 1000},
}

# Wincap hunt only: every level rolls Champion, so a forced max-win round is not
# fighting the tier table as well as the reels.
WINCAP_TIER_WEIGHTS_BY_LEVEL = {
    1: {PASTURE: 1, PRIZE: 9, CHAMPION: 90},
    2: {PRIZE: 5, CHAMPION: 95},
    3: {CHAMPION: 1000},
}


class GameConfig(Config):
    """Moooo configuration."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        super().__init__()
        self.game_id = "moooo"
        self.provider_number = 0
        self.working_name = "Moooo"
        self.wincap = 10000.0
        self.win_type = "lines"
        # ------------------------------------------------------------------
        # RTP, per mode
        # ------------------------------------------------------------------
        # Set deliberately against the reference's 96.40%. The three modes are
        # NOT identical, which is allowed and is the normal shape for a game
        # with buys: Stake requires every mode to be within 0.5% of the others,
        # not equal.
        #
        #   base   94.50%
        #   bonus  94.83%   Free Spins buy
        #   super  94.89%   Super Free Spins buy
        #
        # Spread is 0.39%, inside the 0.5% limit with room to spare. `self.rtp`
        # stays as the headline figure the frontend prints and the base game
        # plays at; the buys carry their own.
        #
        # If any of these move, the base-mode fences in game_optimization.py
        # move with them - a buy's average win and the matching fence's av_win
        # are the same number, and the two files are the only place that
        # equality is written down.
        self.rtp = 0.945
        self.mode_rtp = {"base": 0.945, "bonus": 0.9483, "super": 0.9489}
        self.construct_paths()

        # ------------------------------------------------------------------
        # Board
        # ------------------------------------------------------------------
        self.num_reels = 5
        self.num_rows = [4] * self.num_reels

        # ------------------------------------------------------------------
        # Paytable - values are bet-multipliers awarded per winning line.
        #
        # Five pay steps, not nine. The reference ships four royals paying
        # identically and two premiums sharing a tier, which collapses a
        # nine-face ladder into five steps; that is normal, and it is what makes
        # a paytable readable at a glance instead of a wall of near-identical
        # numbers.
        #
        #   H1 Champion Rosette   20 / 10 / 3
        #   H2 Runner-up Ribbon   15 /  6 / 2
        #   H3 Glass Milk Bottle  12 /  5 / 1.5
        #   H4 Hay Bale           10 /  3 / 1     <- shared tier
        #   H5 Enamel Feed Bucket 10 /  3 / 1     <- shared tier
        #   L1-L4 enamel show badges  2 / 0.5 / 0.1
        #   W  MOOOO cow          20 on five only
        #   S  tannoy horn (scatter)   M  milk churn (meter upgrade)
        #
        # No cow appears among the premiums, though "champion cow" is the
        # obvious top symbol for a cow game. The cow is the wild and only the
        # wild, so that a cow on the reel always means the same thing. See
        # docs/handoff/moooo_SYMBOLS.md.
        #
        # THE CAP IS BUILT INTO THIS TABLE. Five Champion bells on one line sum
        # to 5 x 100 = 500x, and 20x (a five of a kind on H1) x 500 = 10,000x,
        # exactly the advertised max win. The top of the paytable and the top of
        # the bell ladder are the same number by construction - change one and
        # the max win stops being reachable in a single line.
        # ------------------------------------------------------------------
        self.paytable = {
            (5, "W"): 20,
            (5, "H1"): 20,
            (4, "H1"): 10,
            (3, "H1"): 3,
            (5, "H2"): 15,
            (4, "H2"): 6,
            (3, "H2"): 2,
            (5, "H3"): 12,
            (4, "H3"): 5,
            (3, "H3"): 1.5,
            (5, "H4"): 10,
            (4, "H4"): 3,
            (3, "H4"): 1,
            (5, "H5"): 10,
            (4, "H5"): 3,
            (3, "H5"): 1,
            (5, "L1"): 2.0,
            (4, "L1"): 0.5,
            (3, "L1"): 0.1,
            (5, "L2"): 2.0,
            (4, "L2"): 0.5,
            (3, "L2"): 0.1,
            (5, "L3"): 2.0,
            (4, "L3"): 0.5,
            (3, "L3"): 0.1,
            (5, "L4"): 2.0,
            (4, "L4"): 0.5,
            (3, "L4"): 0.1,
        }

        # ------------------------------------------------------------------
        # 10 paylines over a 4-row grid (row index 0 == top).
        # 4 straight rows, 2 V, 2 inverted V, 2 shallow zigzags.
        # ------------------------------------------------------------------
        self.paylines = {
            1: [0, 0, 0, 0, 0],
            2: [1, 1, 1, 1, 1],
            3: [2, 2, 2, 2, 2],
            4: [3, 3, 3, 3, 3],
            5: [0, 1, 2, 1, 0],
            6: [3, 2, 1, 2, 3],
            7: [1, 2, 3, 2, 1],
            8: [2, 1, 0, 1, 2],
            9: [0, 1, 1, 1, 0],
            10: [3, 2, 2, 2, 3],
        }

        self.include_padding = True
        self.special_symbols = {
            "wild": ["W"],
            "scatter": ["S"],
            "churn": ["M"],
        }

        # ------------------------------------------------------------------
        # Free spins
        # ------------------------------------------------------------------
        # 3 scatters = 10 spins (Free Spins), 4 = 10 spins (Super Free Spins).
        # The count picks the mode, not the length. Retriggers add spins inside
        # the feature: 2 scatters = +2, 3 = +4, matching the reference.
        #
        # Every scatter count that can physically land must have an entry, in
        # both directions, or `update_freespin_amount` /
        # `update_fs_retrigger_amt` raise a KeyError mid-run. Base boards are
        # forced to exactly 3 or 4, but WCAP carries a scatter on all five reels
        # so the free-game table has to reach 5.
        self.freespin_triggers = {
            self.basegame_type: {3: 10, 4: 10, 5: 10},
            self.freegame_type: {2: 2, 3: 4, 4: 6, 5: 8},
        }
        self.anticipation_triggers = {
            self.basegame_type: min(self.freespin_triggers[self.basegame_type].keys()) - 1,
            self.freegame_type: min(self.freespin_triggers[self.freegame_type].keys()) - 1,
        }

        # ------------------------------------------------------------------
        # Milk Meter
        # ------------------------------------------------------------------
        # Three levels, no level 0 - the reference's buy cards show three dots
        # per tracker and plain Free Spins already starts on the first one. A
        # reel's meter level indexes TIERS: level 1 means "this reel can no
        # longer pay below Pasture", level 3 means "Champion only".
        #
        # One Milk Churn landing on a reel advances that reel's meter by one
        # level, permanently, for the rest of the feature.
        self.meter_levels = len(TIERS)
        self.tier_order = TIERS
        # Scatter count on the triggering board -> level every meter starts at.
        # 3 scatters is Free Spins (level 1); 4 or more is Super Free Spins,
        # which starts every meter one step in and is the steadier ride for it.
        self.meter_start_levels = {3: 1, 4: 2, 5: 2}

        # ------------------------------------------------------------------
        # Reels
        # ------------------------------------------------------------------
        reels = {"BR0": "BR0.csv", "BR1": "BR1.csv", "FR0": "FR0.csv", "WCAP": "WCAP.csv"}
        self.reels = {}
        for reel_name, filename in reels.items():
            self.reels[reel_name] = self.read_reels_csv(os.path.join(self.reels_path, filename))

        self.padding_reels = {
            self.basegame_type: self.reels["BR0"],
            self.freegame_type: self.reels["FR0"],
        }

        # ------------------------------------------------------------------
        # Bet modes
        # ------------------------------------------------------------------
        self.bet_modes = [
            BetMode(
                name="base",
                cost=1.0,
                rtp=self.mode_rtp["base"],
                max_win=self.wincap,
                auto_close_disabled=False,
                is_feature=True,
                is_buybonus=False,
                distributions=[
                    Distribution(
                        criteria="wincap",
                        quota=0.001,
                        win_criteria=self.wincap,
                        conditions={
                            "reel_weights": {
                                self.basegame_type: {"BR1": 1},
                                self.freegame_type: {"WCAP": 1},
                            },
                            "cow_counts": {
                                self.basegame_type: {0: 78, 1: 20, 2: 2},
                                self.freegame_type: {3: 10, 4: 30, 5: 60},
                            },
                            "tier_weights": {
                                self.basegame_type: TIER_WEIGHTS_BY_LEVEL,
                                self.freegame_type: WINCAP_TIER_WEIGHTS_BY_LEVEL,
                            },
                            "bell_values": {
                                self.basegame_type: BASE_LADDERS,
                                self.freegame_type: WINCAP_LADDERS,
                            },
                            "scatter_triggers": {4: 1},
                            "force_wincap": True,
                            "force_freegame": True,
                        },
                    ),
                    # Free Spins entry: exactly 3 scatters.
                    #
                    # The optimiser matches a fence by its search conditions,
                    # not by the criteria label, so the two feature fences must
                    # be separable by something searchable. Scatter count is
                    # (`kind`) and it already IS the distinction between Free
                    # Spins and Super Free Spins, so the fences are bound to it.
                    Distribution(
                        criteria="freegame",
                        quota=0.06,
                        conditions={
                            "reel_weights": {
                                self.basegame_type: {"BR1": 1},
                                self.freegame_type: {"FR0": 1},
                            },
                            "cow_counts": {
                                self.basegame_type: {0: 78, 1: 20, 2: 2},
                                self.freegame_type: {0: 55, 1: 32, 2: 11, 3: 2},
                            },
                            "tier_weights": {
                                self.basegame_type: TIER_WEIGHTS_BY_LEVEL,
                                self.freegame_type: TIER_WEIGHTS_BY_LEVEL,
                            },
                            "bell_values": {
                                self.basegame_type: BASE_LADDERS,
                                self.freegame_type: FREE_LADDERS,
                            },
                            "scatter_triggers": {3: 1},
                            "force_wincap": False,
                            "force_freegame": True,
                        },
                    ),
                    # Super Free Spins entry: exactly 4 scatters. Identical
                    # conditions to `freegame` - the difference is entirely the
                    # meters starting at level 2, which is decided by the
                    # scatter count in `run_freespin`, not by anything here.
                    # That is the whole design idea: the expensive entry is not
                    # "more", it is a higher floor.
                    Distribution(
                        criteria="freegame_super",
                        quota=0.02,
                        conditions={
                            "reel_weights": {
                                self.basegame_type: {"BR1": 1},
                                self.freegame_type: {"FR0": 1},
                            },
                            "cow_counts": {
                                self.basegame_type: {0: 78, 1: 20, 2: 2},
                                self.freegame_type: {0: 55, 1: 32, 2: 11, 3: 2},
                            },
                            "tier_weights": {
                                self.basegame_type: TIER_WEIGHTS_BY_LEVEL,
                                self.freegame_type: TIER_WEIGHTS_BY_LEVEL,
                            },
                            "bell_values": {
                                self.basegame_type: BASE_LADDERS,
                                self.freegame_type: FREE_LADDERS,
                            },
                            "scatter_triggers": {4: 1},
                            "force_wincap": False,
                            "force_freegame": True,
                        },
                    ),
                    Distribution(
                        criteria="0",
                        quota=0.4,
                        win_criteria=0.0,
                        conditions={
                            "reel_weights": {self.basegame_type: {"BR0": 1}},
                            # Cows on losing spins.
                            #
                            # These books are the majority of what a player
                            # actually sits through, so a game whose headline
                            # mechanic never appears on them is a game whose
                            # headline mechanic is absent from most of the
                            # session - and worse, a cow landing would become a
                            # reliable tell that the spin had already won.
                            #
                            # It costs nothing, and unlike Hot Miami's Frames it
                            # costs nothing *by the rules of the game* rather
                            # than by a special case: a cow only pays if its reel
                            # takes part in a win once expanded, and on a
                            # zero-win board no reel does. The single guard in
                            # `place_cows` is for the one case the rule does not
                            # cover - a landed cow acting as an ordinary wild and
                            # creating a win that was not there before.
                            "cow_counts": {self.basegame_type: {0: 55, 1: 33, 2: 10, 3: 2}},
                            "cows_must_not_win": True,
                            "tier_weights": {self.basegame_type: TIER_WEIGHTS_BY_LEVEL},
                            "bell_values": {self.basegame_type: BASE_LADDERS},
                            "force_wincap": False,
                            "force_freegame": False,
                        },
                    ),
                    Distribution(
                        criteria="basegame",
                        quota=0.5,
                        conditions={
                            "reel_weights": {self.basegame_type: {"BR0": 1}},
                            "cow_counts": {self.basegame_type: {0: 78, 1: 20, 2: 2}},
                            "tier_weights": {self.basegame_type: TIER_WEIGHTS_BY_LEVEL},
                            "bell_values": {self.basegame_type: BASE_LADDERS},
                            "force_wincap": False,
                            "force_freegame": False,
                        },
                    ),
                ],
            ),
            # Buy costs, and the headroom they leave against the 10000x cap:
            # 100x leaves 100x of headroom, 250x leaves 40x. The reference ships
            # a 500x buy against the same cap (20x), so 40x is comfortable.
            #
            # 250x is the reference's own Super price, and it is affordable here
            # only because of the level-indexed tier table.
            #
            # Under the first tier model - one ladder filtered and renormalised
            # by the floor - a Super round was intrinsically 1.79x a plain one,
            # and charging 2.5x would have forced the optimiser to stretch
            # Super's tail to cover the gap: the buy sold as the STEADIER one
            # would have become the wilder one, and the menu would have been
            # lying. That was the reason this sat at 175x.
            #
            # Indexing tier weights by meter level instead (the reference's own
            # measured shape) roughly doubles what a meter step is worth, and
            # Super starts a step in on all five reels. Measured on the raw
            # pools it is now 2.17x a plain round against the 2.50x its price
            # asks for - a 15% stretch rather than a 40% one. The objection was
            # real; the data the price came from is also what removed it.
            self._buy_mode("bonus", 100.0, 3),
            self._buy_mode("super", 250.0, 4),
        ]

    def _buy_mode(self, name, cost, scatters):
        """Build a feature-buy mode that always enters on `scatters` scatters."""
        # A bought feature IS the entry it buys, so it carries only that entry's
        # scatter count. That is what decides the meter start level, and
        # therefore what the player paid for.
        group = {3: "freegame", 4: "freegame_super"}[scatters]
        return BetMode(
            name=name,
            cost=cost,
            rtp=self.mode_rtp[name],
            max_win=self.wincap,
            auto_close_disabled=False,
            is_feature=False,
            is_buybonus=True,
            distributions=[
                Distribution(
                    criteria="wincap",
                    quota=0.001,
                    win_criteria=self.wincap,
                    conditions={
                        "reel_weights": {
                            self.basegame_type: {"BR1": 1},
                            self.freegame_type: {"WCAP": 1},
                        },
                        "cow_counts": {
                            self.basegame_type: {0: 100},
                            self.freegame_type: {3: 10, 4: 30, 5: 60},
                        },
                        "tier_weights": {
                            self.basegame_type: TIER_WEIGHTS_BY_LEVEL,
                            self.freegame_type: WINCAP_TIER_WEIGHTS_BY_LEVEL,
                        },
                        "bell_values": {
                            self.basegame_type: BASE_LADDERS,
                            self.freegame_type: WINCAP_LADDERS,
                        },
                        "scatter_triggers": {scatters: 1},
                        "force_wincap": True,
                        "force_freegame": True,
                    },
                ),
                Distribution(
                    criteria=group,
                    quota=0.999,
                    conditions={
                        "reel_weights": {
                            self.basegame_type: {"BR1": 1},
                            self.freegame_type: {"FR0": 1},
                        },
                        # No cows on the triggering spin of a bought feature:
                        # the player bought the feature, not a base-game win,
                        # and paying one out of a purchase price is return the
                        # feature itself never sees.
                        "cow_counts": {
                            self.basegame_type: {0: 100},
                            self.freegame_type: {0: 55, 1: 32, 2: 11, 3: 2},
                        },
                        "tier_weights": {
                            self.basegame_type: TIER_WEIGHTS_BY_LEVEL,
                            self.freegame_type: TIER_WEIGHTS_BY_LEVEL,
                        },
                        "bell_values": {
                            self.basegame_type: BASE_LADDERS,
                            self.freegame_type: FREE_LADDERS,
                        },
                        "scatter_triggers": {scatters: 1},
                        "force_wincap": False,
                        "force_freegame": True,
                    },
                ),
            ],
        )
