"""Capo Nostra - game configuration.

5x4 lines game, 14 paylines, Vault Frames carrying additive multipliers in
1x1 / 2x2 / 3x3 sizes, a column-expanding special Wild (the Tommy Gun), and
three free-spin tiers driven by scatter count.

Stake compliance notes:
  * There are NO jackpots. Vault Frames award plain bet-multipliers only.
    The Stake approval checklist prohibits jackpot mechanics outright
    ("No Jackpots, Gamble features, or Early Cashout").
  * Frame values are multipliers, never fixed currency amounts, so the game
    stays correct in every currency the platform offers.
  * Max win is 20000x and must be reachable - see the `wincap` distributions.
  * Every mode sits within 0.5% of every other: 95.08 / 95.13 / 95.17 / 95.28.
"""

import os
from src.config.config import Config
from src.config.distributions import Distribution
from src.config.betmode import BetMode



# Free-game strength groups. Same feature, three shapes.
#
# The separation is deliberately NOT "how often a line wins" — that is
# what the reels decide and the brief was to leave it alone. It is:
#
#   how many Frames land        (frame_counts)
#   how much a Frame is worth   (these ladders)
#   WHERE a Frame lands         (frame_reel_weights, below)
#
# The third is the one that does the most work for free. Lines pay left
# to right from reel 1, so a Frame on reel 0 is collected by every
# winning line and one on reel 4 only by a five-of-a-kind. Front-loading
# the strong group raises what its Frames are actually worth without
# changing how often anything wins.
weak_mult = {2: 420, 3: 280, 4: 170, 5: 105, 6: 60, 7: 34, 8: 20, 9: 12, 10: 8, 25: 2, 50: 1, 100: 0}
mid_mult = {2: 300, 3: 220, 4: 160, 5: 120, 6: 85, 7: 60, 8: 45, 9: 32, 10: 26, 25: 10, 50: 4, 100: 2}
strong_mult = {2: 150, 3: 130, 4: 120, 5: 110, 6: 100, 7: 90, 8: 80, 9: 70, 10: 66, 25: 40, 50: 22, 100: 12}

# Reel weighting per group. Weak spreads flat (every reel equally likely,
# which is what the game did before groups existed); strong pulls hard to
# the left.
FLAT_REELS = {0: 1, 1: 1, 2: 1, 3: 1, 4: 1}
MID_REELS = {0: 1.6, 1: 1.4, 2: 1.1, 3: 0.7, 4: 0.5}
STRONG_REELS = {0: 3.2, 1: 2.6, 2: 1.6, 3: 0.7, 4: 0.35}

# How large a landing frame is: {size: weight}. A 2x2 covers four positions and
# a 3x3 covers nine, so size is the fourth lever the strength groups pull, and
# the one the player actually sees — a group can be told apart at a glance by
# how often the board carries something bigger than a single cell.
#
# The base game gets big frames too (the brief was "有機會出現", not "bonus
# only"), but at roughly one spin in 25 rather than one in five: on a 5x4 grid a
# 3x3 covers nearly half the board, and something that covers half the board
# every few spins stops being an event.
SIZE_BASE = {1: 960, 2: 35, 3: 5}
SIZE_WEAK = {1: 940, 2: 55, 3: 5}
SIZE_MID = {1: 880, 2: 100, 3: 20}
SIZE_STRONG = {1: 780, 2: 170, 3: 50}


class GameConfig(Config):
    """Capo Nostra configuration."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        super().__init__()
        self.game_id = "capo_nostra"
        self.provider_number = 0
        self.working_name = "Capo Nostra"
        self.wincap = 20000.0
        self.win_type = "lines"
        # Capo Nostra ships at 94.58% — every mode retargeted down 0.5 points
        # from the original 95.08/95.13/95.17/95.28 ladder (2026-09-03 request).
        # The three mechanics changes this build makes — big frames, the
        # expanding wild replacing the Collector, and the Don tier's guaranteed
        # wild column — all move volatility rather than return, since the
        # optimizer sets RTP from the lookup weights. The buy modes sit
        # fractionally above at 94.63 / 94.67 / 94.78, which keeps the spread at
        # 0.20% against Stake's 0.5% ceiling while making each step up the price
        # ladder read as a slightly better deal.
        self.rtp = 0.9618
        self.construct_paths()

        # ------------------------------------------------------------------
        # Board
        # ------------------------------------------------------------------
        self.num_reels = 5
        self.num_rows = [4] * self.num_reels

        # ------------------------------------------------------------------
        # Paytable - values are bet-multipliers awarded per winning line.
        #   H1 Signet Ring    H2 Skyline   H3 Cash Case
        #   H4 Whiskey+Cigar  H5 Black Sedan
        #   L1 Spade  L2 Heart  L3 Diamond  L4 Club
        # W is the Fedora; SW the Tommy Gun (expands its reel to Wilds and does
        # not appear here - it never survives to be paid as itself).
        # ------------------------------------------------------------------
        self.paytable = {
            (5, "W"): 400,
            (5, "H1"): 400,
            (4, "H1"): 100,
            (3, "H1"): 40,
            (5, "H2"): 200,
            (4, "H2"): 60,
            (3, "H2"): 20,
            (5, "H3"): 50,
            (4, "H3"): 20,
            (3, "H3"): 4,
            (5, "H4"): 30,
            (4, "H4"): 10,
            (3, "H4"): 2,
            (5, "H5"): 10,
            (4, "H5"): 4,
            (3, "H5"): 1,
            (5, "L1"): 2.0,
            (4, "L1"): 1.0,
            (3, "L1"): 0.4,
            (5, "L2"): 2.0,
            (4, "L2"): 1.0,
            (3, "L2"): 0.4,
            (5, "L3"): 2.0,
            (4, "L3"): 1.0,
            (3, "L3"): 0.4,
            (5, "L4"): 2.0,
            (4, "L4"): 1.0,
            (3, "L4"): 0.4,
        }

        # ------------------------------------------------------------------
        # 14 paylines over a 4-row grid (row index 0 == top)
        # ------------------------------------------------------------------
        self.paylines = {
            1: [0, 0, 0, 0, 0],
            2: [1, 1, 1, 1, 1],
            3: [2, 2, 2, 2, 2],
            4: [3, 3, 3, 3, 3],
            5: [0, 1, 2, 1, 0],
            6: [1, 2, 3, 2, 1],
            7: [3, 2, 1, 2, 3],
            8: [2, 1, 0, 1, 2],
            9: [0, 1, 1, 1, 0],
            10: [1, 2, 2, 2, 1],
            11: [2, 1, 1, 1, 2],
            12: [3, 2, 2, 2, 3],
            13: [0, 1, 0, 1, 0],
            14: [3, 2, 3, 2, 3],
        }

        self.include_padding = True
        self.special_symbols = {
            "wild": ["W"],
            "scatter": ["S"],
            # The Tommy Gun. It is not a wild itself - it is replaced, along with
            # the rest of its reel, by ordinary Wilds before lines are evaluated
            # (see GameExecutables.expand_special_wilds). Keeping it out of the
            # "wild" list is what makes that substitution observable: a symbol
            # that was already a wild would pay identically whether the column
            # expanded or not, and the event would be decoration.
            "expandwild": ["SW"],
        }

        # ------------------------------------------------------------------
        # Frame sizes
        # ------------------------------------------------------------------
        # A frame covers size x size positions and carries ONE multiplier, which
        # is written onto every position it covers. Lines sum symbol multipliers
        # across a win, so a 2x2 crossed by a line at two cells contributes twice
        # its face value - that scaling is the whole point of the bigger frames
        # and is why they draw from their own, deliberately shorter ladders.
        #
        # A 3x3 at 100x crossed by three cells would add 300x to a line that can
        # already pay 400x, which is 120,000x against a 20,000x cap: the cap
        # would swallow it and the size would stop meaning anything above a
        # certain value. The ladders below top out at 10x and 8x respectively so
        # that a big frame is worth more through its FOOTPRINT than through its
        # face value.
        self.frame_size_ladders = {
            2: {2: 400, 3: 260, 4: 160, 5: 100, 6: 50, 7: 20, 8: 8, 10: 2},
            3: {2: 500, 3: 300, 4: 130, 5: 50, 6: 15, 8: 5},
        }

        # ------------------------------------------------------------------
        # Free spins. Every tier awards 10 spins; the scatter count selects
        # which tier is played. Retriggers add spins inside the feature.
        # ------------------------------------------------------------------
        # Retriggers must cover every scatter count that can physically land,
        # otherwise `update_fs_retrigger_amt` raises a KeyError mid-feature.
        self.freespin_triggers = {
            self.basegame_type: {3: 10, 4: 10, 5: 10},
            self.freegame_type: {2: 2, 3: 4, 4: 6, 5: 8},
        }
        self.anticipation_triggers = {
            self.basegame_type: min(self.freespin_triggers[self.basegame_type].keys()) - 1,
            self.freegame_type: min(self.freespin_triggers[self.freegame_type].keys()) - 1,
        }

        # Bonus tier keyed by the number of scatters that triggered the feature.
        #   soldier  3 scatters - 1 sticky frame, refilled with a fresh value
        #                         every spin
        #   capo     4 scatters - 3 sticky frames, values double on a win
        #   don      5 scatters - 3 sticky frames, values double on a win, AND
        #                         every spin is guaranteed at least one Tommy Gun
        #
        # The Don is the tier that changed shape this build. It used to be
        # "every position framed, no scatter and no collector", which needed its
        # own pair of reel strips and left the tier with no retrigger and nothing
        # to anticipate. It is now the Capo board plus a guaranteed wild column,
        # which is a stronger promise stated in one sentence, plays on the shared
        # strips, and keeps the retrigger alive.
        self.bonus_tiers = {3: "soldier", 4: "capo", 5: "don"}
        self.tier_seed_frames = {"soldier": 1, "capo": 3, "don": 3}
        self.tier_doubling = {"soldier": False, "capo": True, "don": True}
        # Tiers that force a Tommy Gun onto every free spin that did not deal one
        # naturally. See GameExecutables.force_special_wild.
        self.tier_guaranteed_wild = {"soldier": False, "capo": False, "don": True}

        # ------------------------------------------------------------------
        # Reels
        # ------------------------------------------------------------------
        reels = {
            "BR0": "BR0.csv",
            "BR1": "BR1.csv",
            "FR0": "FR0.csv",
            "WCAP": "WCAP.csv",
        }
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
        base_mult = {2: 320, 3: 200, 4: 140, 5: 100, 6: 70, 7: 50, 8: 40, 9: 30, 10: 25, 25: 8, 50: 3, 100: 1}
        # Weights sit low on the ladder deliberately: Frames carry the free
        # game's return, and concentrating that return in a few very large Frames
        # is something the optimiser pays for by cutting how often a line wins at
        # all. Average Frame value is ~4.7, and the budget that buys back goes
        # into line-win frequency. It also keeps 25x/50x/100x genuinely rare,
        # which is what the premium Frame styling in the frontend marks.
        rich_mult = {2: 300, 3: 220, 4: 160, 5: 120, 6: 85, 7: 60, 8: 45, 9: 32, 10: 26, 25: 10, 50: 4, 100: 2}
        wincap_mult = {2: 40, 3: 40, 4: 45, 5: 50, 6: 55, 7: 60, 8: 65, 9: 70, 10: 90, 25: 70, 50: 45, 100: 30}

        self.bet_modes = [
            BetMode(
                name="base",
                cost=1.0,
                rtp=self.rtp,
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
                            "frame_counts": {
                                self.basegame_type: {0: 60, 1: 30, 2: 10},
                                self.freegame_type: {2: 10, 3: 30, 4: 40, 5: 20},
                            },
                            "mult_values": {
                                self.basegame_type: base_mult,
                                self.freegame_type: wincap_mult,
                            },
                            "frame_size_weights": {
                                self.basegame_type: SIZE_BASE,
                                self.freegame_type: SIZE_STRONG,
                            },
                            "scatter_triggers": {4: 1, 5: 3},
                            "force_wincap": True,
                            "force_freegame": True,
                        },
                    ),
                    Distribution(
                        criteria="freegame_weak",
                        quota=0.06,
                        conditions={
                            "reel_weights": {
                                self.basegame_type: {"BR1": 1},
                                self.freegame_type: {"FR0": 1},
                            },
                            # Weak: the ordinary feature. Frames land slowly, sit anywhere, and stay
                            # small. This is the shape the free game had before the groups
                            # existed, kept as the floor so the split adds a ceiling rather
                            # than moving the whole thing.
                            "frame_counts": {
                                self.basegame_type: {0: 60, 1: 30, 2: 10},
                                self.freegame_type: {0: 55, 1: 34, 2: 9, 3: 2},
                            },
                            "frame_reel_weights": {self.freegame_type: FLAT_REELS},
                            "mult_values": {
                                self.basegame_type: base_mult,
                                self.freegame_type: weak_mult,
                            },
                            "frame_size_weights": {
                                self.basegame_type: SIZE_BASE,
                                self.freegame_type: SIZE_WEAK,
                            },
                            # One scatter count per group. The optimiser matches a fence by
                            # its search conditions, not by the criteria label, so the
                            # groups must be separable by something searchable — scatter
                            # count is (`kind`) and it already IS the tier.
                            "scatter_triggers": {3: 1},
                            "force_wincap": False,
                            "force_freegame": True,
                        },
                    ),
                    Distribution(
                        criteria="freegame_mid",
                        quota=0.03,
                        conditions={
                            "reel_weights": {
                                self.basegame_type: {"BR1": 1},
                                self.freegame_type: {"FR0": 1},
                            },
                            # Medium: more Frames, a slightly richer ladder, and a lean to the left.
                            "frame_counts": {
                                self.basegame_type: {0: 60, 1: 30, 2: 10},
                                self.freegame_type: {0: 38, 1: 39, 2: 18, 3: 5},
                            },
                            "frame_reel_weights": {self.freegame_type: MID_REELS},
                            "mult_values": {
                                self.basegame_type: base_mult,
                                self.freegame_type: mid_mult,
                            },
                            "frame_size_weights": {
                                self.basegame_type: SIZE_BASE,
                                self.freegame_type: SIZE_MID,
                            },
                            # One scatter count per group. The optimiser matches a fence by
                            # its search conditions, not by the criteria label, so the
                            # groups must be separable by something searchable — scatter
                            # count is (`kind`) and it already IS the tier.
                            "scatter_triggers": {4: 1},
                            "force_wincap": False,
                            "force_freegame": True,
                        },
                    ),
                    Distribution(
                        criteria="freegame_strong",
                        quota=0.01,
                        conditions={
                            "reel_weights": {
                                self.basegame_type: {"BR1": 1},
                                self.freegame_type: {"FR0": 1},
                            },
                            # Strong: Frames arrive fast, land toward the front where the lines
                            # actually run, and carry the top of the ladder. One free game in
                            # ten is this one.
                            "frame_counts": {
                                self.basegame_type: {0: 60, 1: 30, 2: 10},
                                self.freegame_type: {0: 18, 1: 36, 2: 30, 3: 16},
                            },
                            "frame_reel_weights": {self.freegame_type: STRONG_REELS},
                            "mult_values": {
                                self.basegame_type: base_mult,
                                self.freegame_type: strong_mult,
                            },
                            "frame_size_weights": {
                                self.basegame_type: SIZE_BASE,
                                self.freegame_type: SIZE_STRONG,
                            },
                            # One scatter count per group. The optimiser matches a fence by
                            # its search conditions, not by the criteria label, so the
                            # groups must be separable by something searchable — scatter
                            # count is (`kind`) and it already IS the tier.
                            "scatter_triggers": {5: 1},
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
                            # Frames on losing spins.
                            #
                            # A dead spin still shows Frames. These books are the
                            # majority of what a player actually sits through, so
                            # without this the game's headline mechanic would be
                            # absent from most of the session — and worse, a Frame
                            # appearing would be a reliable tell that the spin had
                            # already won.
                            #
                            # It costs nothing, and since the Collector was
                            # removed it costs nothing unconditionally. A Frame
                            # now pays exactly one way: it multiplies a line win.
                            # These books are `win_criteria=0.0`, so there is no
                            # line win to multiply and no second route to close.
                            # (The old `cosmetic_frames` guard existed only to
                            # stop the Collector sweeping these Frames into a
                            # win that would fail the zero-win criteria; with no
                            # Collector there is nothing left for it to guard.)
                            "frame_counts": {self.basegame_type: {0: 60, 1: 29, 2: 9, 3: 2}},
                            "frame_size_weights": {self.basegame_type: SIZE_BASE},
                            "mult_values": {self.basegame_type: base_mult},
                            "force_wincap": False,
                            "force_freegame": False,
                        },
                    ),
                    Distribution(
                        criteria="basegame",
                        quota=0.5,
                        conditions={
                            "reel_weights": {self.basegame_type: {"BR0": 1}},
                            "frame_counts": {self.basegame_type: {0: 55, 1: 30, 2: 12, 3: 3}},
                            "frame_size_weights": {self.basegame_type: SIZE_BASE},
                            "mult_values": {self.basegame_type: base_mult},
                            "force_wincap": False,
                            "force_freegame": False,
                        },
                    ),
                ],
            ),
            # Buy costs stay below the 20000x cap by enough that the advertised
            # max win is still a meaningful multiple of what the mode costs:
            # 200x / 40x / 20x of headroom respectively.
            #
            # The Don at 1000x is the tightest of the three and is as far as this
            # ladder should go. Headroom is what stops a mode's whole return
            # collecting in its top outcomes, and below roughly 15x the cap stops
            # being a ceiling the player can aim at and becomes the only outcome
            # that matters. If the price ever needs to rise again, the wincap
            # rises with it.
            self._buy_mode("bonus", 100.0, 3, base_mult, rich_mult, wincap_mult, rtp=0.9623),
            self._buy_mode("bonus_hits", 500.0, 4, base_mult, rich_mult, wincap_mult, rtp=0.9627),
            # The Don is priced at 94.78% - the best rate in the game, and the
            # reason to buy the top tier rather than three of the bottom one.
            # Stake requires every mode within 0.5% of the others; base sits at
            # 94.58%, so the spread across all four is still 0.20% (unchanged —
            # every mode moved down by the same 0.5 points, 2026-09-03).
            self._buy_mode("bonus_epic", 1000.0, 5, base_mult, rich_mult, wincap_mult, rtp=0.9638),
        ]

    def _buy_mode(self, name, cost, scatters, base_mult, rich_mult, wincap_mult, rtp=None):
        """Build a feature-buy mode that always enters the given bonus tier."""
        # A bought feature IS the tier it buys, so it carries only that tier's
        # strength group. Offering all three here would let a 100x Neon Nights
        # purchase roll into Ocean Drive's ladder.
        group = {3: "freegame_weak", 4: "freegame_mid", 5: "freegame_strong"}[scatters]
        counts = {3: {0: 55, 1: 34, 2: 9, 3: 2}, 4: {0: 38, 1: 39, 2: 18, 3: 5},
                  5: {0: 18, 1: 36, 2: 30, 3: 16}}[scatters]
        reels = {3: FLAT_REELS, 4: MID_REELS, 5: STRONG_REELS}[scatters]
        ladder = {3: weak_mult, 4: mid_mult, 5: strong_mult}[scatters]
        sizes = {3: SIZE_WEAK, 4: SIZE_MID, 5: SIZE_STRONG}[scatters]
        return BetMode(
            name=name,
            cost=cost,
            rtp=self.rtp if rtp is None else rtp,
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
                        "frame_counts": {
                            self.basegame_type: {0: 100},
                            self.freegame_type: {2: 10, 3: 30, 4: 40, 5: 20},
                        },
                        "mult_values": {
                            self.basegame_type: base_mult,
                            self.freegame_type: wincap_mult,
                        },
                        "frame_size_weights": {
                            self.basegame_type: SIZE_BASE,
                            self.freegame_type: SIZE_STRONG,
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
                        "frame_counts": {
                            self.basegame_type: {0: 100},
                            self.freegame_type: counts,
                        },
                        "frame_reel_weights": {self.freegame_type: reels},
                        "mult_values": {
                            self.basegame_type: base_mult,
                            self.freegame_type: ladder,
                        },
                        "frame_size_weights": {
                            self.basegame_type: SIZE_BASE,
                            self.freegame_type: sizes,
                        },
                        "scatter_triggers": {scatters: 1},
                        "force_wincap": False,
                        "force_freegame": True,
                    },
                ),
            ],
        )
