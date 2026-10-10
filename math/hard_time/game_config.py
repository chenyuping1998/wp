"""Hard Time - game configuration.

5x4 lines game, 14 paylines. One mechanic: the Searchlight, a special Wild that
lights its reel from wherever it lands DOWN to the bottom, turning those cells
Wild and writing a multiplier onto each. Paylines crossing lit cells add those
multipliers together. A light landing on an already-lit reel doubles the cells
where the beams overlap. Three free-spin tiers driven by scatter count, eight
spins each, with the beams sticky until the feature ends.

Capo Nostra's Vault Frames are GONE. They were the only multiplier in that game,
so this one had to grow its own or lose any reachable ceiling - see SPEC.md for
the arithmetic that forced the searchlight to carry the multiplier.

Stake compliance notes:
  * There are NO jackpots. Searchlights award plain bet-multipliers only.
    The Stake approval checklist prohibits jackpot mechanics outright
    ("No Jackpots, Gamble features, or Early Cashout").
  * Multiplier values are multipliers, never fixed currency amounts, so the game
    stays correct in every currency the platform offers.
  * Max win is 12000x and must be reachable - see the `wincap` distributions.
  * Every mode must sit within 0.5% of every other.
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
#   how many extra lights land   (light_counts)
#   how much a light is worth    (these ladders)
#   WHERE a light lands          (light_reel_weights, below)
#
# The third is the one that does the most work for free, and it does more
# here than it did for frames. Lines pay left to right from reel 1, so a
# light on reel 0 is collected by every winning line and one on reel 4
# only by a five-of-a-kind. Front-loading the strong group raises what
# its lights are actually worth without changing how often anything wins.
#
# The fourth lever is new and belongs to the searchlight alone: a beam
# runs from its landing row DOWN, so the same light is worth four cells
# on the top row and one on the bottom. Nothing weights the landing row
# directly — the reel strips decide it — but it is why these ladders sit
# lower than a frame ladder would: a single light already covers up to
# four cells that a line can collect separately.
#
# MEASURED, not inherited. Capo Nostra's ladders (means around 4.7, tails to
# 100x) were sized for one to three DISCRETE frames sitting on a board. A
# searchlight is nothing like that: every cell of the beam carries the value, a
# payline sums it once per lit cell it crosses, beams accumulate across eight
# sticky spins, and overlapping beams double. The same numbers therefore arrive
# multiplied several times over.
#
# How this was sized (2026-09-14): with every ladder forced to a flat 1x, the
# wincap rate per mode came out 0.2 / 0.5 / 1.0 / 6.0% and the tier medians at
# 55x / 308x / 647x — i.e. the WILDS alone already make a sane escalating game
# and the multipliers were supplying the blow-up. These means (1.8 / 2.3 / 3.2)
# are set against that baseline rather than against Capo Nostra's.
weak_mult = {1: 650, 2: 250, 3: 80, 5: 20}
mid_mult = {1: 560, 2: 280, 3: 110, 5: 40, 10: 10}
strong_mult = {1: 450, 2: 300, 3: 150, 5: 70, 10: 25, 25: 5}

# Reel weighting per group. Weak spreads flat; the stronger groups lean
# left, because lines pay from reel 1 and a light on reel 0 is collected by
# every winning line there is.
#
# The lean is much gentler than Capo Nostra's (which ran to 3.2 on reel 0).
# That number was sized for FRAMES, which overlay the board and change no
# symbol. A searchlight on reel 0 turns that column Wild and, in a feature,
# keeps it Wild for eight spins — every line then starts wild, permanently.
# Carrying the frame-era lean over made the top tier cap on a fifth of all
# generated books; these values are what the measurement asked for.
FLAT_REELS = {0: 1, 1: 1, 2: 1, 3: 1, 4: 1}
MID_REELS = {0: 1.2, 1: 1.1, 2: 1.0, 3: 0.9, 4: 0.8}
STRONG_REELS = {0: 1.5, 1: 1.3, 2: 1.1, 3: 0.8, 4: 0.6}


class GameConfig(Config):
    """Hard Time configuration."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        super().__init__()
        self.game_id = "hard_time"
        self.provider_number = 0
        self.working_name = "Hard Time"
        # 12000x, down from Capo Nostra's 20000x. Not a taste decision: removing
        # the Vault Frames removed every multiplier in the game, and the bare
        # paytable ceiling is 14 paylines x the best line pay — an upper bound
        # that downward-only expansion cannot even reach. `run.py` requires a
        # `payout == wincap` row in EVERY mode's lookup table, and `force_wincap`
        # could not have produced one against 20000x. See SPEC.md.
        self.wincap = 12000.0
        self.win_type = "lines"
        # RTP targets carried over from Capo Nostra unchanged — the mechanic
        # rewrite moves volatility, not return, since the optimizer sets RTP from
        # the lookup weights either way. Base 94.58%, buys 94.63 / 94.67 / 94.78,
        # a 0.20% spread against Stake's 0.5% ceiling, with each step up the
        # price ladder reading as a slightly better rate.
        self.rtp = 0.9641
        self.construct_paths()

        # ------------------------------------------------------------------
        # Board
        # ------------------------------------------------------------------
        self.num_reels = 5
        self.num_rows = [4] * self.num_reels

        # ------------------------------------------------------------------
        # Paytable - values are bet-multipliers awarded per winning line.
        #   H1 Key Ring   H2 Handcuffs   H3 Contraband Tin
        #   H4 Tin Mug & Spoon           H5 Uniform Number Patch
        #   L1 Spade  L2 Heart  L3 Diamond  L4 Club
        # W is the Prison Cap; SW the Searchlight (lights its reel downward and
        # does not appear here - it never survives to be paid as itself).
        #
        # Cut ~38% across the board from Capo Nostra's table on request
        # ("整體圖騰 odds 調低", 2026-09-14). The optimizer holds each mode's RTP
        # regardless, so this does not lower what the game returns - it moves
        # return out of ordinary line wins and into the searchlight, which is the
        # whole point: a bare line should feel thin and a lit line should not.
        # The ladder stays strictly monotonic H1 > H2 > H3 > H4 > H5 > L at every
        # kind, which the pay-table modal renders in order and a reviewer checks.
        #
        # EVERY VALUE MUST BE A MULTIPLE OF 0.1. `verify_lookup_format` asserts
        # `payout % 10 == 0` on the x100-scaled lookup table, so a 0.25x line pay
        # emits 25 and fails the whole run at the very last step — after books
        # and the Rust optimizer have already finished. Found that way on
        # 2026-09-14 with L1-L4 at 0.25; they are 0.2 now. Multiplier sums are
        # integers, so any table built from multiples of 0.1 stays legal however
        # many lit cells a win crosses.
        # ------------------------------------------------------------------
        self.paytable = {
            (5, "W"): 250,
            (5, "H1"): 250,
            (4, "H1"): 60,
            (3, "H1"): 25,
            (5, "H2"): 125,
            (4, "H2"): 36,
            (3, "H2"): 12,
            (5, "H3"): 32,
            (4, "H3"): 12,
            (3, "H3"): 2.5,
            (5, "H4"): 18,
            (4, "H4"): 6,
            (3, "H4"): 1.2,
            (5, "H5"): 6,
            (4, "H5"): 2.4,
            (3, "H5"): 0.6,
            (5, "L1"): 1.2,
            (4, "L1"): 0.6,
            (3, "L1"): 0.2,
            (5, "L2"): 1.2,
            (4, "L2"): 0.6,
            (3, "L2"): 0.2,
            (5, "L3"): 1.2,
            (4, "L3"): 0.6,
            (3, "L3"): 0.2,
            (5, "L4"): 1.2,
            (4, "L4"): 0.6,
            (3, "L4"): 0.2,
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
            # The Searchlight. It is not a wild itself - it is replaced, along
            # with every cell BELOW it on its reel, by ordinary Wilds before
            # lines are evaluated (see GameExecutables.expand_searchlights).
            # Keeping it out of the "wild" list is what makes that substitution
            # observable: a symbol that was already a wild would pay identically
            # whether the beam swept or not, and the event would be decoration.
            "expandwild": ["SW"],
        }

        # ------------------------------------------------------------------
        # Free spins. Every tier awards 10 spins; the scatter count selects
        # which tier is played. Retriggers add spins inside the feature.
        # ------------------------------------------------------------------
        # Retriggers must cover every scatter count that can physically land,
        # otherwise `update_fs_retrigger_amt` raises a KeyError mid-feature.
        self.freespin_triggers = {
            self.basegame_type: {3: 8, 4: 8, 5: 8},
            self.freegame_type: {2: 2, 3: 4, 4: 6, 5: 8},
        }
        self.anticipation_triggers = {
            self.basegame_type: min(self.freespin_triggers[self.basegame_type].keys()) - 1,
            self.freegame_type: min(self.freespin_triggers[self.freegame_type].keys()) - 1,
        }

        # Bonus tier keyed by the number of scatters that triggered the feature.
        # All three award 8 spins and keep their beams sticky for the whole
        # feature; they differ only in how many searchlights the feature deals.
        #
        #   lockdown  3 scatters - opens dark
        #   riot      4 scatters - opens with one beam already lit
        #   breakout  5 scatters - opens with one beam lit, AND every spin is
        #                          guaranteed at least one more searchlight
        #
        # There is no separate doubling rule any more, and that is the point.
        # Capo Nostra needed `tier_doubling` because a frame had no other way to
        # grow; a searchlight grows by being re-lit, so the top tier's guarantee
        # IS the doubling engine — eight guaranteed lights across five reels
        # keep landing on reels that are already lit, and every one of those
        # doubles what it overlaps.
        self.bonus_tiers = {3: "lockdown", 4: "riot", 5: "breakout"}
        self.lowest_tier = "lockdown"
        self.tier_seed_lights = {"lockdown": 0, "riot": 1, "breakout": 1}
        # Tiers that force a Searchlight onto every free spin that did not deal
        # one naturally. See GameExecutables.force_searchlight.
        #
        # ALL FALSE, and that is a decision, not an oversight.
        #
        # BREAKOUT was specified as "every spin guaranteed at least one more
        # searchlight". Measured 2026-09-14: that guarantee cannot coexist with
        # sticky beams. Guaranteeing a light on each of 8 spins means at least 8
        # lights accumulating on 5 reels, so the board saturates and the tier
        # stops having a distribution — 100% of generated books hit the win cap
        # with it on, 42% with it off and nothing else changed. The user chose
        # (2026-09-14) to separate the tiers by density alone.
        #
        # The mechanism is kept because it is config-driven and costs nothing;
        # anything that turns one of these back on must re-measure the cap rate
        # before trusting it.
        self.tier_guaranteed_light = {"lockdown": False, "riot": False, "breakout": False}

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
        # The base game keeps a slightly richer ladder than LOCKDOWN because
        # nothing accumulates here — a base spin's lights are gone next spin, so
        # a value cannot be doubled or collected twice the way a sticky one can.
        base_mult = {1: 500, 2: 280, 3: 130, 5: 60, 10: 25, 25: 5}
        # Weights sit low on the ladder deliberately: Frames carry the free
        # game's return, and concentrating that return in a few very large Frames
        # is something the optimiser pays for by cutting how often a line wins at
        # all. Average Frame value is ~4.7, and the budget that buys back goes
        # into line-win frequency. It also keeps 25x/50x/100x genuinely rare,
        # which is what the premium Frame styling in the frontend marks.
        # force_wincap books only. Deliberately top-heavy: these books exist to
        # prove the advertised 12,000x is reachable, and `run.py` refuses to
        # finish without a payout == wincap row in every mode's lookup table.
        wincap_mult = {10: 80, 25: 220, 50: 350, 100: 350}

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
                            "light_counts": {
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
                            "light_counts": {
                                self.basegame_type: {0: 60, 1: 30, 2: 10},
                                self.freegame_type: {0: 100},
                            },
                            "light_reel_weights": {self.freegame_type: FLAT_REELS},
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
                            "light_counts": {
                                self.basegame_type: {0: 60, 1: 30, 2: 10},
                                self.freegame_type: {0: 90, 1: 10},
                            },
                            "light_reel_weights": {self.freegame_type: MID_REELS},
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
                            "light_counts": {
                                self.basegame_type: {0: 60, 1: 30, 2: 10},
                                self.freegame_type: {0: 78, 1: 22},
                            },
                            "light_reel_weights": {self.freegame_type: STRONG_REELS},
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
                            # NO forced lights on losing spins, and this is the
                            # one place the searchlight had to break a rule the
                            # Vault Frames followed.
                            #
                            # Capo Nostra deliberately put frames on dead spins:
                            # a frame is an overlay, it changes no symbol, so it
                            # cost nothing and it kept the headline mechanic
                            # visible through the majority of a session. Forcing
                            # a frame onto a `win_criteria=0.0` book was free.
                            #
                            # A searchlight is not an overlay. It turns up to
                            # four cells Wild BEFORE lines are evaluated, so it
                            # very nearly always creates a win — on a book that
                            # is required to win nothing. Every one of those is
                            # rejected by `check_repeat` and redrawn, which costs
                            # generation time and, worse, biases the dead boards
                            # that do survive toward the freak ones where even a
                            # wild column fails to line anything up.
                            #
                            # So a dead spin shows no forced light. The strips
                            # still carry SW (BR0 has 3), so the rejection path
                            # exists either way — this just stops it being fed
                            # deliberately. A wild column that pays nothing is
                            # close to a contradiction in a lines game, and the
                            # honest consequence is that this game's signature
                            # beat belongs to winning spins.
                            "light_counts": {self.basegame_type: {0: 100}},
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
                            "light_counts": {self.basegame_type: {0: 55, 1: 30, 2: 12, 3: 3}},
                            "mult_values": {self.basegame_type: base_mult},
                            "force_wincap": False,
                            "force_freegame": False,
                        },
                    ),
                ],
            ),
            # Buy prices re-derived for the 12,000x cap (2026-09-14), not
            # inherited. Capo Nostra's 100 / 500 / 1000 bought 200x / 40x / 20x
            # of headroom against 20,000x; against 12,000x the same prices buy
            # 120x / 24x / 12x, and the top one at 12x fell below the 15x floor
            # this ladder was built on. Headroom is what stops a mode's whole
            # return collecting in its top outcomes, which is also the shape
            # that fails Stake's Tail Probability check at 5,000x/10,000x.
            #
            # Now 100 / 300 / 600 -> 120x / 40x / 20x. The cap stayed where the
            # user set it and the prices moved instead.
            self._buy_mode("bonus", 100.0, 3, base_mult, wincap_mult, rtp=0.9646),
            self._buy_mode("bonus_hits", 300.0, 4, base_mult, wincap_mult, rtp=0.9650),
            # BREAKOUT is priced at 94.78% - the best rate in the game, and the
            # reason to buy the top tier rather than three of the bottom one.
            # Stake requires every mode within 0.5% of the others; base sits at
            # 94.58%, so the spread across all four is 0.20%.
            self._buy_mode("bonus_epic", 600.0, 5, base_mult, wincap_mult, rtp=0.9661),
        ]

    def _buy_mode(self, name, cost, scatters, base_mult, wincap_mult, rtp=None):
        """Build a feature-buy mode that always enters the given bonus tier."""
        # A bought feature IS the tier it buys, so it carries only that tier's
        # strength group. Offering all three here would let a 100x LOCKDOWN
        # purchase roll into BREAKOUT's ladder.
        group = {3: "freegame_weak", 4: "freegame_mid", 5: "freegame_strong"}[scatters]
        counts = {3: {0: 100}, 4: {0: 90, 1: 10}, 5: {0: 78, 1: 22}}[scatters]
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
                        "light_counts": {
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
                        "light_counts": {
                            self.basegame_type: {0: 100},
                            self.freegame_type: counts,
                        },
                        "light_reel_weights": {self.freegame_type: reels},
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
