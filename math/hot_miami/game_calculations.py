"""Helper calculations for Hot Miami."""

from src.executables.executables import Executables


class GameCalculations(Executables):
    """Board inspection helpers specific to the Neon Frame mechanic."""

    def frame_positions(self) -> set:
        """Set of (reel, row) tuples currently carrying a frame."""
        return {(frame["reel"], frame["row"]) for frame in self.frames}

    def framable_positions(self) -> list:
        """Positions eligible to receive a new frame.

        The Collector may never land inside a frame, and a position can only
        hold one frame at a time.
        """
        taken = self.frame_positions()
        eligible = []
        for reel in range(self.config.num_reels):
            for row in range(self.config.num_rows[reel]):
                if (reel, row) in taken:
                    continue
                if self.board[reel][row].check_attribute("collector"):
                    continue
                eligible.append((reel, row))
        return eligible

    def total_frame_multiplier(self) -> int:
        """Sum of every frame multiplier currently on the board."""
        return int(sum(frame["mult"] for frame in self.frames))

    def collector_position(self):
        """Return the Collector position for this spin, or None."""
        collectors = self.special_syms_on_board.get("collector", [])
        if not collectors:
            return None
        return collectors[0]

    def print_frames(self) -> None:
        """Terminal view of frame values, for debugging."""
        lookup = {(f["reel"], f["row"]): f["mult"] for f in self.frames}
        for row in range(self.config.num_rows[0]):
            cells = []
            for reel in range(self.config.num_reels):
                name = self.board[reel][row].name
                mult = lookup.get((reel, row))
                cells.append(f"{name}:{mult}x".ljust(9) if mult else name.ljust(9))
            print("".join(cells))
        print("")
