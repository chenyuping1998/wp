"""Helper calculations for Capo Nostra."""

from src.executables.executables import Executables


class GameCalculations(Executables):
    """Board inspection helpers specific to the Vault Frame mechanic."""

    @staticmethod
    def frame_cells(frame: dict) -> list:
        """Every (reel, row) a frame covers.

        A frame is stored by its top-left anchor plus a `size`, so a 1x1 covers
        one cell, a 2x2 four and a 3x3 nine. Everything that used to treat a
        frame as a single position goes through here instead, which is what
        keeps "does this frame overlap that one", "which symbols does it
        multiply" and "did it take part in the win" consistent with each other.

        The Big Score (full-board multiplier) is NOT a frame - it is carried
        separately as `self.big_score` and applied straight to every cell, so it
        never passes through here.
        """
        size = frame.get("size", 1)
        return [
            (frame["reel"] + d_reel, frame["row"] + d_row)
            for d_reel in range(size)
            for d_row in range(size)
        ]

    def frame_positions(self) -> set:
        """Set of (reel, row) tuples currently covered by any frame."""
        return {cell for frame in self.frames for cell in self.frame_cells(frame)}

    def framable_positions(self, size: int = 1) -> list:
        """Anchors where a `size` x `size` frame can be placed.

        A frame must fit entirely on the grid and may not overlap an existing
        one. Both constraints are checked against the anchor's full footprint,
        so a 3x3 is only ever offered the nine anchors that fit on a 5x4 board
        (reels 0-2, rows 0-1) and only those with all nine cells free.
        """
        taken = self.frame_positions()
        eligible = []
        for reel in range(self.config.num_reels - size + 1):
            for row in range(self.config.num_rows[reel] - size + 1):
                cells = [(reel + d_r, row + d_c) for d_r in range(size) for d_c in range(size)]
                if any(cell in taken for cell in cells):
                    continue
                eligible.append((reel, row))
        return eligible

    def total_frame_multiplier(self) -> int:
        """Sum of every frame multiplier currently on the board.

        Counted once per frame, not once per covered cell - this is the face
        value on the board, which is what the frontend prints.
        """
        return int(sum(frame["mult"] for frame in self.frames))

    def special_wild_positions(self) -> list:
        """Every Tommy Gun on the board, as {"reel", "row"} dicts."""
        return list(self.special_syms_on_board.get("expandwild", []))

    def print_frames(self) -> None:
        """Terminal view of frame values, for debugging."""
        lookup = {}
        for frame in self.frames:
            for cell in self.frame_cells(frame):
                lookup[cell] = frame["mult"]
        for row in range(self.config.num_rows[0]):
            cells = []
            for reel in range(self.config.num_reels):
                name = self.board[reel][row].name
                mult = lookup.get((reel, row))
                cells.append(f"{name}:{mult}x".ljust(9) if mult else name.ljust(9))
            print("".join(cells))
        print("")
