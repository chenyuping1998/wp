"""The MOOOO expanding wild and the Milk Meter."""

import random

from game_calculations import GameCalculations
from src.calculations.lines import Lines
from src.calculations.statistics import get_random_outcome

# How many placements to try before giving up and landing no cows at all, on a
# distribution that has declared its books cannot win.
MAX_PLACEMENT_ATTEMPTS = 8


class GameExecutables(GameCalculations):
    """Executables for the MOOOO cow mechanic."""

    # ------------------------------------------------------------------
    # Rolling a cow
    # ------------------------------------------------------------------
    def draw_cow_count(self) -> int:
        """Sample how many cows land this spin."""
        conditions = self.get_current_distribution_conditions()
        counts = conditions["cow_counts"].get(self.gametype)
        if not counts:
            return 0
        return int(get_random_outcome(counts))

    def draw_cow_tier(self, reel: int) -> str:
        """Pick a bell tier for a cow landing on `reel`.

        This is the whole point of the Milk Meter. The reel's meter LEVEL indexes
        a table of its own, rather than filtering one shared ladder.

        The difference is not cosmetic and it was the reference that settled it.
        Filtering a single ladder leaves the tiers above the floor in whatever
        ratio they already had, so a level-2 reel handed out Champions one roll
        in six. The reference measures 2.9% (n=1324): each level is
        overwhelmingly its own tier with a thin tail above it. A per-level table
        is the only way to say that, and it is what makes reaching level 3 worth
        anything - under the old model the reel was already paying Champions
        before it got there.
        """
        conditions = self.get_current_distribution_conditions()
        by_level = conditions["tier_weights"][self.gametype]
        weights = by_level.get(self.meter_level(reel))
        if not weights:
            # A level with no table cannot produce a bell. Fall back to the top
            # tier rather than raising: this is reachable only from a typo, and a
            # crash 30,000 books into a run is a worse way to find one than a
            # skewed statistic in the report.
            return self.config.tier_order[-1]
        return get_random_outcome(weights)

    def draw_bell_value(self, tier: str) -> int:
        """Sample one bell multiplier from the tier's ladder."""
        conditions = self.get_current_distribution_conditions()
        return int(get_random_outcome(conditions["bell_values"][self.gametype][tier]))

    # ------------------------------------------------------------------
    # Landing cows
    # ------------------------------------------------------------------
    def place_cows(self, count: int) -> list:
        """Land up to `count` cows, at most one per eligible reel.

        The cow is written onto the board BEFORE the reveal event, so the player
        sees it arrive as a symbol and only then sees the mouth open. Nothing
        about expansion has happened yet at this point.

        A distribution carrying `cows_must_not_win` has declared that its books
        pay zero. Expansion cannot break that promise - a reel only expands if
        it takes part in a win, and there are none - but a landed cow is still
        an ordinary wild sitting on the board, and an ordinary wild can complete
        a line that would otherwise have died. So on those books the placement
        is checked and retried, and if no placement is clean the spin lands no
        cows rather than being redrawn. Rejecting the board instead would work
        too, and would quietly bias which boards survive: every board where a
        cow happens to complete a line would be thrown away, thinning exactly
        the near-miss boards out of the dead-spin population.
        """
        conditions = self.get_current_distribution_conditions()
        must_not_win = bool(conditions.get("cows_must_not_win"))
        # Unconditionally, and before the early return. `self.cows` is read by
        # `resolve_cows` on every spin, so a spin that lands nothing must say so
        # - otherwise the previous free spin's cows are still in the list and
        # get repainted onto a board they never landed on.
        self.cows = []
        if count <= 0:
            return []

        attempts = MAX_PLACEMENT_ATTEMPTS if must_not_win else 1
        drawn = self.snapshot_board()
        for _ in range(attempts):
            self.cows = []
            for _ in range(count):
                eligible = self.cow_eligible_reels()
                if not eligible:
                    break
                reel = random.choice(eligible)
                row = random.randrange(self.config.num_rows[reel])
                tier = self.draw_cow_tier(reel)
                self.cows.append(
                    {"reel": reel, "row": row, "tier": tier, "mult": self.draw_bell_value(tier)}
                )
            self.cows.sort(key=lambda cow: cow["reel"])
            for cow in self.cows:
                self.board[cow["reel"]][cow["row"]] = self.create_symbol("W")
            if not must_not_win:
                return [dict(cow) for cow in self.cows]
            if Lines.get_lines(self.board, self.config)["totalWin"] == 0:
                return [dict(cow) for cow in self.cows]
            self.board = self.snapshot_restore(drawn)

        self.cows = []
        self.board = self.snapshot_restore(drawn)
        return []

    @staticmethod
    def snapshot_restore(snapshot: list) -> list:
        """Rebuild a board from a snapshot taken by `snapshot_board`."""
        return [list(reel) for reel in snapshot]

    # ------------------------------------------------------------------
    # Expansion
    # ------------------------------------------------------------------
    def paint_cows(self, drawn: list, expanded: set) -> None:
        """Repaint the board with exactly the cows in `expanded` filled out.

        Every reel starts from the drawn board - which already carries the
        landed cow at its own position - and each expanded reel is then
        overwritten top to bottom with wilds carrying that cow's bell.

        The bell is written onto every row of the reel, but only one row of a
        reel can ever sit on a given payline, so `apply_added_symbol_mult` picks
        the bell up exactly once per line. That is what makes several cows on
        one winning line ADD rather than multiply.
        """
        self.board = self.snapshot_restore(drawn)
        for cow in self.cows:
            if cow["reel"] not in expanded:
                continue
            for row in range(self.config.num_rows[cow["reel"]]):
                symbol = self.create_symbol("W")
                symbol.assign_attribute({"multiplier": cow["mult"]})
                self.board[cow["reel"]][row] = symbol

    def resolve_cows(self, drawn: list) -> list:
        """Expand every cow whose reel takes part in a win once expanded.

        The reference's rule is conditional: the mouth only opens "if the
        expanded reel would be part of at least one winning combination once
        expanded". That rule is self-referential - whether reel 4 earns its
        expansion can depend on reel 2 having expanded - so it is resolved as a
        fixed point rather than a single pass.

        Start with every cow expanded, which is the reading the rule states
        ("once expanded"), and drop the reels that took part in nothing. Losing
        a reel can kill the win that justified another, so repeat until the set
        stops shrinking. It only ever shrinks, so this terminates in at most one
        pass per cow.

        Without this, a 100x Champion bell is unaffordable at any sane hit rate:
        it would be paying out on reels that never touched a win line. With it,
        a cow on a dead board costs nothing at all - which is why dead spins can
        show cows freely.
        """
        if not self.cows:
            self.expanded_reels = set()
            return []

        candidate = {cow["reel"] for cow in self.cows}
        while candidate:
            self.paint_cows(drawn, candidate)
            wins = Lines.get_lines(self.board, self.config, multiplier_method="symbol")
            participating = {
                position["reel"] for win in wins["wins"] for position in win["positions"]
            } & candidate
            if participating == candidate:
                break
            candidate = participating

        self.paint_cows(drawn, candidate)
        self.expanded_reels = candidate
        return [dict(cow) for cow in self.cows if cow["reel"] in candidate]

    # ------------------------------------------------------------------
    # Milk Meter
    # ------------------------------------------------------------------
    def init_meters(self, level: int) -> None:
        """Start every reel's meter at `level` for the coming feature."""
        self.meters = [level] * self.config.num_reels

    def advance_meters(self) -> list:
        """Raise the meter of every reel showing a Milk Churn.

        One churn, one level, permanently, capped at the top of the ladder.
        Returns only the reels that actually moved, so a churn landing on a reel
        already at Champion emits nothing and the frontend has no phantom
        animation to play.
        """
        changed = []
        for position in self.special_syms_on_board.get("churn", []):
            reel = position["reel"]
            if self.meters[reel] < self.config.meter_levels:
                self.meters[reel] += 1
                changed.append({"reel": reel, "level": self.meters[reel]})
        return changed
