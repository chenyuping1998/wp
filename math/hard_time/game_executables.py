"""Searchlight mechanics for Hard Time.

Everything the old Vault Frame code did is gone. One mechanic replaces it:

    A searchlight lands on a cell and lights that reel from its row DOWN to the
    bottom. The lit cells become Wilds and each carries a multiplier. Paylines
    crossing lit cells ADD those multipliers together.

    If a light lands on a reel that is already lit, the OVERLAPPING cells have
    their existing multiplier doubled, and any cell the beam reaches for the
    first time takes the new light's own value.

Base game clears the lights between spins; a feature keeps them sticky until it
ends, which is what makes the doubling rule fire at all — two beams meeting on
one reel is near-impossible inside a single deal and routine across eight sticky
spins.
"""

import random

from game_calculations import GameCalculations
from src.calculations.statistics import get_random_outcome

# Doubling compounds, so it needs a ceiling. A single cell can be re-lit at most
# a handful of times across eight spins, but the cap makes the tail finite rather
# than relying on that.
MAX_LIGHT_MULTIPLIER = 100

EXPAND_WILD = "SW"
WILD = "W"


class GameExecutables(GameCalculations):
    """Executables for the searchlight mechanic."""

    # ------------------------------------------------------------------
    # Sampling
    # ------------------------------------------------------------------
    def draw_light_multiplier(self) -> int:
        """Sample the multiplier a newly landed searchlight carries."""
        conditions = self.get_current_distribution_conditions()
        return int(get_random_outcome(conditions["mult_values"][self.gametype]))

    def draw_light_count(self) -> int:
        """Sample how many EXTRA searchlights this distribution forces on.

        The reel strips deal searchlights on their own; this is the knob on top,
        and it is the one the optimiser uses to tell the three feature tiers
        apart. Without it the tiers would differ only by their seed and the top
        tier's guarantee, which is too little separation for the optimiser to
        hold three distinct RTPs against.
        """
        conditions = self.get_current_distribution_conditions()
        counts = conditions.get("light_counts", {}).get(self.gametype)
        if not counts:
            return 0
        return int(get_random_outcome(counts))

    def light_reel_weights(self) -> list:
        """Relative chance of a forced searchlight landing on each reel.

        Position is not cosmetic. Lines pay left to right from reel 1, so a light
        on reel 0 is collected by every winning line there is, while one on reel
        4 is only ever reached by a five-of-a-kind. Two tiers with identical
        light counts and identical ladders are worth very different amounts
        depending only on where the lights sit — which is how a tier gains
        strength without touching how often a line wins.
        """
        conditions = self.get_current_distribution_conditions()
        weights = conditions.get("light_reel_weights", {}).get(self.gametype)
        if not weights:
            return [1.0] * self.config.num_reels
        return [float(weights.get(reel, weights.get(str(reel), 1.0))) for reel in range(self.config.num_reels)]

    # ------------------------------------------------------------------
    # Lighting
    # ------------------------------------------------------------------
    def add_light(self, reel: int, row: int, mult: int) -> dict:
        """Light `reel` from `row` downward, carrying `mult`.

        Returns the beat the frontend needs to animate it: where the light
        landed, what it carried, and the resulting value of every cell it
        covers with a flag saying whether that cell doubled or was lit fresh.
        """
        cells = []
        for cell in self.light_cells(reel, row):
            if cell in self.lit:
                value = min(self.lit[cell] * 2, MAX_LIGHT_MULTIPLIER)
                doubled = True
            else:
                value = mult
                doubled = False
            self.lit[cell] = value
            cells.append({"reel": cell[0], "row": cell[1], "mult": value, "doubled": doubled})
        return {"reel": reel, "row": row, "mult": mult, "cells": cells}

    def place_extra_searchlights(self, count: int) -> None:
        """Drop `count` searchlight SYMBOLS onto the board, before the reveal.

        Symbols, not lights: everything that puts a searchlight into play —  the
        reel strip, a tier's opening seed, the top tier's per-spin guarantee, and
        this distribution knob — goes through the same `expand_searchlights`
        afterwards. That is what keeps one code path deciding what a light does,
        so the guarantee cannot quietly behave differently from a dealt light.

        A cell already holding a Scatter is never overwritten (it would fight the
        retrigger and bias `force_freegame`'s rejection sampling), nor is one
        already holding a searchlight. A cell that is already LIT is fair game:
        landing there is not a wasted guarantee, it is the doubling rule firing.
        """
        weights = self.light_reel_weights()
        for _ in range(count):
            candidates = [
                (reel, row)
                for reel in range(self.config.num_reels)
                for row in range(self.config.num_rows[reel])
                if not self.board[reel][row].check_attribute("scatter")
                and self.board[reel][row].name != EXPAND_WILD
            ]
            if not candidates:
                break
            w = [weights[reel] for reel, _ in candidates]
            reel, row = random.choices(candidates, weights=w, k=1)[0] if sum(w) > 0 else random.choice(candidates)
            self.board[reel][row] = self.create_symbol(EXPAND_WILD)
        self.get_special_symbols_on_board()

    def force_searchlight(self) -> None:
        """Guarantee at least one searchlight on this spin (top tier only)."""
        if self.special_wild_positions():
            return
        self.place_extra_searchlights(1)

    def expand_searchlights(self) -> list:
        """Turn every searchlight symbol on the board into a beam.

        Returns one entry per light, in landing order, so the frontend can play
        them as separate beats.
        """
        landed = []
        for light in self.special_wild_positions():
            landed.append(self.add_light(light["reel"], light["row"], self.draw_light_multiplier()))
        return landed

    def apply_lights_to_board(self) -> None:
        """Make every lit cell a Wild carrying its multiplier.

        Idempotent, and called twice per spin on purpose: once before the reveal
        so a feature's sticky beams are part of the board the player is shown,
        and once after the new lights land so their values (and any doubling) are
        on the board the lines are evaluated against.

        `Lines.get_lines` runs with multiplier_method="symbol", which SUMS the
        `multiplier` attribute across a win's positions — that is the "line
        multipliers add" rule, and it is why the value has to live on the symbol
        rather than in a side table.

        A Scatter is never overwritten, so a Scatter dealt onto a sticky lit cell
        survives and still counts toward the retrigger. The cell keeps its entry
        in `self.lit` and lights up again next spin.
        """
        for (reel, row), mult in self.lit.items():
            if self.board[reel][row].check_attribute("scatter"):
                continue
            self.board[reel][row] = self.create_symbol(WILD)
            self.board[reel][row].assign_attribute({"multiplier": mult})
        # The board changed identity, so the cached special-symbol index is
        # stale: the searchlights are gone and there are new Wilds. Everything
        # downstream (scatter counting for the trigger, the retrigger check)
        # reads that cache.
        self.get_special_symbols_on_board()

    def clear_lights(self) -> None:
        """Put the board back in the dark."""
        self.lit = {}
