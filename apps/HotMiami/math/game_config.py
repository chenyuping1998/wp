"""Hot Miami - game configuration.

5x4 lines game, 14 paylines, Neon Frames carrying additive multipliers,
a Collector symbol, and three free-spin tiers driven by scatter count.

Stake compliance notes:
  * There are NO jackpots. Neon Frames award plain bet-multipliers only.
    The Stake approval checklist prohibits jackpot mechanics outright
    ("No Jackpots, Gamble features, or Early Cashout").
  * Frame values are multipliers, never fixed currency amounts, so the game
    stays correct in every currency the platform offers.
  * Max win is 20000x and must be reachable - see the `wincap` distributions.
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


class GameConfig(Config):
    """Hot Miami configuration."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        super().__init__()
        self.game_id = "hot_miami"
        self.provider_number = 0
        self.working_name = "Hot Miami"
        self.wincap = 20000.0
        self.win_type = "lines"
        # 2026-08-15: 0.965 -> 0.94. The free game was re-shaped into three
        # strength groups the day before, which took SD from 9.87 to 20.80 — the
        # game now delivers its return in fewer, larger hits, and the headline
        # rate came down to sit with that. Stake's checklist wants RTP inside
        # 90-98% and every mode within 0.5% of the others; 94.00% across all four
        # satisfies both.
        self.rtp = 0.94
        self.construct_paths()

        # ------------------------------------------------------------------
        # Board
        # ------------------------------------------------------------------
        self.num_reels = 5
        self.num_rows = [4] * self.num_reels

        # ------------------------------------------------------------------
        # Paytable - values are bet-multipliers awarded per winning line.
        #   H1 Neon Diamond   H2 Skyline   H3 Flamingo
        #   H4 Boombox        H5 Convertible
        #   L1 Palm  L2 Shades  L3 Cocktail  L4 Cassette
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
            "collector": ["C"],
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
        #   neon_nights  3 scatters - 1 sticky frame seeded on entry
        #   sunset_hits  4 scatters - 3 sticky frames, values double on a win
        #   ocean_drive  5 scatters - every position framed, no scatter/collector
        self.bonus_tiers = {3: "neon_nights", 4: "sunset_hits", 5: "ocean_drive"}
        self.tier_seed_frames = {"neon_nights": 1, "sunset_hits": 3, "ocean_drive": 20}
        self.tier_doubling = {"neon_nights": False, "sunset_hits": True, "ocean_drive": True}

        # Ocean Drive removes the Scatter and the Collector from play, so it
        # deals from a strip that does not contain them rather than dealing them
        # and then ignoring them.
        #
        # This is a substitution applied to whatever strip the distribution
        # chose, not a distribution of its own: every distribution that can
        # reach the tier (the three buy modes' wincap fences included) has to be
        # covered, and they do not all pick the same strip.
        self.ocean_drive_reels = {"FR0": "FR_OD", "WCAP": "WCAP_OD"}

        # ------------------------------------------------------------------
        # Reels
        # ------------------------------------------------------------------
        reels = {
            "BR0": "BR0.csv",
            "BR1": "BR1.csv",
            "FR0": "FR0.csv",
            "WCAP": "WCAP.csv",
            # Ocean Drive's own strips - identical to FR0/WCAP except that the
            # Scatter and the Collector are not on them. See ocean_drive_reels
            # below and GameStateOverride.create_board_reelstrips.
            "FR_OD": "FR_OD.csv",
            "WCAP_OD": "WCAP_OD.csv",
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
        # 2026-08-13: weights shifted down the ladder. The Collector is now rare
        # enough that Frames carry the free game's return, and at the old weights
        # that return was concentrated in a few very large Frames -- which the
        # optimiser paid for by cutting how often a line won at all (80% -> 50%).
        # Average Frame value drops 5.94 -> 4.69, and that budget goes back into
        # line-win frequency. It also makes 25x/50x/100x genuinely rare, which is
        # what the premium Frame styling in NeonFrames.svelte is there to mark.
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
                            # This was {0: 100} — a dead spin showed no Frame at
                            # all, ever. Since these books are the majority of
                            # what a player actually sits through, the game's
                            # headline mechanic was absent from most of the
                            # session, and worse, a Frame appearing had become a
                            # reliable tell that the spin had already won.
                            #
                            # It costs nothing. A Frame only pays two ways: it
                            # multiplies a line win, and the Collector sweeps it.
                            # These books are `win_criteria=0.0`, so there is no
                            # line win to multiply, and `cosmetic_frames` below
                            # suppresses them whenever a Collector is on the
                            # board. Both payout routes are closed, so RTP is
                            # untouched by construction rather than by hoping the
                            # optimiser absorbs it.
                            "frame_counts": {self.basegame_type: {0: 60, 1: 29, 2: 9, 3: 2}},
                            # Read by gamestate.run_spin. Do NOT set this on a
                            # distribution that can win — it would silently drop
                            # Frames from paying spins that happen to carry a
                            # Collector.
                            "cosmetic_frames": True,
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
                            "mult_values": {self.basegame_type: base_mult},
                            "force_wincap": False,
                            "force_freegame": False,
                        },
                    ),
                ],
            ),
            # Buy costs are kept well below the 20000x cap so that the advertised
            # max win stays a meaningful multiple of the mode's cost
            # (200x / 80x / 40x headroom respectively). A 1500x buy against a
            # 20000x cap leaves only ~13x of headroom, which concentrates the
            # mode's whole return in its top outcomes.
            self._buy_mode("bonus", 100.0, 3, base_mult, rich_mult, wincap_mult),
            self._buy_mode("bonus_hits", 250.0, 4, base_mult, rich_mult, wincap_mult),
            # 2026-08-22: Ocean Drive is now dealt from a strip with no Scatter
            # and no Collector on it, which hands ~7 of every 64 positions per
            # reel back to symbols that actually pay. The tier is priced at
            # 94.17% rather than the house 94.00% so that the removal reads as a
            # small gain to the player instead of being taken back through the
            # lookup weights. Stake requires every mode within 0.5% of the
            # others; the spread is 0.17%.
            self._buy_mode("bonus_epic", 500.0, 5, base_mult, rich_mult, wincap_mult, rtp=0.9417),
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
                        "scatter_triggers": {scatters: 1},
                        "force_wincap": False,
                        "force_freegame": True,
                    },
                ),
            ],
        )
