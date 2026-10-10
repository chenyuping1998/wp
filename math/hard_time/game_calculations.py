"""Helper calculations for Hard Time.

The board state this game carries is `self.lit`: a dict mapping
`(reel, row) -> multiplier` for every cell a searchlight is currently shining on.

It is keyed **per cell**, not per light, and that is forced by the rules rather
than chosen for convenience. When a second searchlight lands on a reel that is
already lit, only the cells where the two beams OVERLAP double; cells the new
beam reaches for the first time take the new light's own value. One beam can
therefore hold two different multipliers at once, which a per-light `mult` (the
shape Capo Nostra's Vault Frames used) cannot represent at all.
"""

from src.executables.executables import Executables


class GameCalculations(Executables):
    """Board inspection helpers for the searchlight mechanic."""

    def light_cells(self, reel: int, row: int) -> list:
        """Every (reel, row) a searchlight landing at `(reel, row)` covers.

        The beam travels DOWN only. A light landing on the top row covers the
        whole reel; one landing on the bottom row covers a single cell. That
        asymmetry IS the mechanic — it makes where a light lands matter as much
        as whether one landed, and it is the reason this game's ceiling is
        12,000x rather than Capo Nostra's 20,000x (see SPEC.md).
        """
        return [(reel, r) for r in range(row, self.config.num_rows[reel])]

    def lit_positions(self) -> set:
        """Set of (reel, row) tuples any searchlight is currently covering."""
        return set(self.lit.keys())

    def lit_cells_payload(self) -> list:
        """Every lit cell as an event-shaped dict, in a stable order.

        Sorted by reel then row so two books with the same lit board emit byte
        identical events — the payout hash checks in `check_math_bundle.py`
        compare generated output across runs, and dict iteration order following
        insertion would make an identical board look like a different one purely
        because its beams landed in a different sequence.
        """
        return [
            {"reel": reel, "row": row, "mult": self.lit[(reel, row)]}
            for reel, row in sorted(self.lit)
        ]

    def total_light_multiplier(self) -> int:
        """Sum of every multiplier currently on the board, counted per cell.

        Per cell, not per light: a line crossing two lit cells collects both, so
        the per-cell sum is the figure that actually corresponds to what a win
        can pick up.
        """
        return int(sum(self.lit.values()))

    def special_wild_positions(self) -> list:
        """Every searchlight symbol on the board, as {"reel", "row"} dicts."""
        return list(self.special_syms_on_board.get("expandwild", []))

    def print_lights(self) -> None:
        """Terminal view of the lit board, for debugging."""
        for row in range(self.config.num_rows[0]):
            cells = []
            for reel in range(self.config.num_reels):
                name = self.board[reel][row].name
                mult = self.lit.get((reel, row))
                cells.append(f"{name}:{mult}x".ljust(9) if mult else name.ljust(9))
            print("".join(cells))
        print("")
