"""Helper calculations for Moooo."""

from src.executables.executables import Executables


class GameCalculations(Executables):
    """Board inspection helpers specific to the MOOOO cow and the Milk Meter."""

    def cow_eligible_reels(self) -> list:
        """Reels a cow may land on.

        Two rules collapse into one check here:

          * one cow per reel, so a reel already carrying one is out;
          * a cow never lands on a reel showing a scatter or a Milk Churn.

        The second is not decoration. A cow expands to fill its whole reel, so a
        cow sharing a reel with a scatter would erase that scatter after the
        board was drawn - which breaks the forced scatter counts the feature
        distributions depend on, and would let a cow silently cancel a trigger
        the player had already seen land. Keeping cows off those reels means
        expansion can never destroy anything, and it costs only the ~12% of free
        game reels that are showing a churn on a given spin.
        """
        taken = {cow["reel"] for cow in self.cows}
        blocked = set()
        for key in ("scatter", "churn"):
            for pos in self.special_syms_on_board.get(key, []):
                blocked.add(pos["reel"])
        return [reel for reel in range(self.config.num_reels) if reel not in taken and reel not in blocked]

    def meter_level(self, reel: int) -> int:
        """This reel's Milk Meter level, 1-based.

        Outside the free game there is no meter and every reel is level 1, which
        is also what the reference does: its main game runs permanently at the
        bottom of the same tier table its feature climbs.
        """
        if not self.meters:
            return 1
        return min(max(self.meters[reel], 1), self.config.meter_levels)

    def snapshot_board(self) -> list:
        """Copy the board's symbol references, reel by reel.

        Expansion is resolved by a shrinking fixed point that repaints the board
        several times, so it needs the drawn board kept intact. The symbols
        themselves are never mutated in place by the repaint - `paint_cows`
        builds fresh W symbols - so copying the references is enough.
        """
        return [list(reel) for reel in self.board]

    def print_cows(self) -> None:
        """Terminal view of the board and its bells, for debugging."""
        bells = {cow["reel"]: cow for cow in self.cows}
        for row in range(self.config.num_rows[0]):
            cells = []
            for reel in range(self.config.num_reels):
                name = self.board[reel][row].name
                cow = bells.get(reel)
                if cow and self.board[reel][row].check_attribute("multiplier"):
                    cells.append(f"{name}:{cow['mult']}x".ljust(10))
                else:
                    cells.append(name.ljust(10))
            print("".join(cells))
        if self.meters:
            print("meters: " + " ".join(str(level) for level in self.meters))
        print("")
