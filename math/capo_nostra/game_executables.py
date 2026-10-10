"""Vault Frame and Tommy Gun mechanics for Capo Nostra."""

import random

from game_calculations import GameCalculations
from src.calculations.statistics import get_random_outcome

# Frame multipliers never exceed this after doubling, so a single frame can
# never single-handedly overshoot the win cap in an unbounded way.
MAX_FRAME_MULTIPLIER = 1000

EXPAND_WILD = "SW"
WILD = "W"


class GameExecutables(GameCalculations):
    """Executables for the Vault Frame and expanding-wild mechanics."""

    # ------------------------------------------------------------------
    # Frame placement
    # ------------------------------------------------------------------
    def draw_frame_size(self) -> int:
        """Sample how large the next frame is: 1, 2 or 3 cells on a side."""
        conditions = self.get_current_distribution_conditions()
        weights = conditions.get("frame_size_weights", {}).get(self.gametype)
        if not weights:
            return 1
        return int(get_random_outcome(weights))

    def draw_frame_multiplier(self, size: int = 1) -> int:
        """Sample one frame multiplier from the ladder for this frame's size.

        A 2x2 and a 3x3 draw from their own, shorter ladders (config
        `frame_size_ladders`) because their value is multiplied by how many of
        their cells a winning line crosses. Giving them the 1x1 ladder would let
        a 3x3 at 100x add 300x to a single line, which the win cap would simply
        swallow - the size would stop meaning anything above a certain value.
        """
        conditions = self.get_current_distribution_conditions()
        ladder = self.config.frame_size_ladders.get(size)
        if ladder is None:
            ladder = conditions["mult_values"][self.gametype]
        return int(get_random_outcome(ladder))

    def draw_frame_count(self) -> int:
        """Sample how many new frames land this spin."""
        conditions = self.get_current_distribution_conditions()
        counts = conditions["frame_counts"].get(self.gametype)
        if not counts:
            return 0
        return int(get_random_outcome(counts))

    def frame_reel_weights(self) -> list:
        """Relative chance of a new frame anchoring on each reel.

        Position is not cosmetic here. Lines pay left to right from reel 1, so a
        frame on reel 0 is carried by every winning line that exists, while one
        on reel 4 is only ever collected by a five-of-a-kind. Two features with
        identical frame counts and identical multiplier ladders are therefore
        worth very different amounts depending only on where the frames sit —
        which is what the strength groups use to separate themselves without
        touching how often a line wins.

        Absent from a distribution's conditions, every reel is equally likely and
        the behaviour is exactly what it was before this existed.
        """
        conditions = self.get_current_distribution_conditions()
        weights = conditions.get("frame_reel_weights", {}).get(self.gametype)
        if not weights:
            return [1.0] * self.config.num_reels
        return [float(weights.get(reel, weights.get(str(reel), 1.0))) for reel in range(self.config.num_reels)]

    def add_frames(self, count: int) -> list:
        """Place `count` new frames, each at its own sampled size."""
        new_frames = []
        reel_weights = self.frame_reel_weights()
        for _ in range(count):
            size = self.draw_frame_size()
            # A big frame needs a clear block, and late in a spin there may not
            # be one. Shrinking is the right failure: the alternative is to drop
            # the frame entirely, which would silently make frames rarer exactly
            # when the board is busiest — that is, in the strong groups, which
            # are the ones that draw big sizes in the first place.
            while size > 1 and not self.framable_positions(size):
                size -= 1
            eligible = self.framable_positions(size)
            if not eligible:
                break
            # Weighted by anchor reel, uniform within a reel. random.choices
            # needs a non-zero total, so a weighting that excludes every reel
            # still holding a free anchor falls back to uniform rather than
            # raising.
            w = [reel_weights[reel] for reel, _ in eligible]
            reel, row = random.choices(eligible, weights=w, k=1)[0] if sum(w) > 0 else random.choice(eligible)
            frame = {"reel": reel, "row": row, "size": size, "mult": self.draw_frame_multiplier(size)}
            self.frames.append(frame)
            new_frames.append(dict(frame))
        return new_frames

    def seed_tier_frames(self, seed_count: int) -> list:
        """Seed the sticky frames a bonus tier starts with."""
        return self.add_frames(seed_count)

    def apply_frames_to_board(self) -> None:
        """Write frame multipliers onto every symbol they cover.

        `Lines.get_lines` runs with multiplier_method="symbol", which sums the
        `multiplier` attribute across the winning positions - matching the rule
        that multiple frames in one win add together, and giving a big frame its
        value once per cell the line crosses.

        This runs AFTER `expand_special_wilds`, because that replaces symbol
        objects wholesale and would drop any attribute written before it.
        """
        for frame in self.frames:
            for reel, row in self.frame_cells(frame):
                self.board[reel][row].assign_attribute({"multiplier": frame["mult"]})

    def reroll_frame_values(self) -> list:
        """Give every sticky frame a fresh multiplier (Soldier refill)."""
        for frame in self.frames:
            frame["mult"] = self.draw_frame_multiplier(frame.get("size", 1))
        return [dict(f) for f in self.frames]

    def clear_frames(self) -> None:
        """Remove all frames from the grid."""
        self.frames = []

    # ------------------------------------------------------------------
    # Doubling (Capo / Don)
    # ------------------------------------------------------------------
    def double_winning_frames(self) -> list:
        """Double every frame that took part in a win, once per spin.

        A frame doubles once no matter how many of its cells the win crossed —
        a 3x3 is already rewarded for its footprint through the multiplier sum.
        """
        winning_positions = set()
        for win in self.win_data.get("wins", []):
            for position in win["positions"]:
                winning_positions.add((position["reel"], position["row"]))

        doubled = []
        for frame in self.frames:
            if any(cell in winning_positions for cell in self.frame_cells(frame)):
                frame["mult"] = min(frame["mult"] * 2, MAX_FRAME_MULTIPLIER)
                doubled.append(dict(frame))
        return doubled

    # ------------------------------------------------------------------
    # Tommy Gun (expanding wild)
    # ------------------------------------------------------------------
    def expand_special_wilds(self) -> list:
        """Fill the reel of every Tommy Gun with Wilds.

        Returns the list of reels that expanded, each as
        {"reel": int, "row": int} naming where the gun itself landed, so the
        frontend can start the muzzle flash from the right cell.

        Scatters are NOT overwritten. Two reasons, and the second is the one
        that matters: it keeps the Scatter readable (a player watching three
        scatters land does not see one of them erased by an unrelated feature),
        and it keeps `force_freegame` honest — the generator reaches a trigger
        board by rejection sampling on scatter count, so a wild column that
        could delete a scatter would send those books back for a redraw and
        quietly bias which trigger boards survive.
        """
        guns = self.special_wild_positions()
        if not guns:
            return []

        expanded = []
        for gun in guns:
            reel = gun["reel"]
            for row in range(self.config.num_rows[reel]):
                if self.board[reel][row].check_attribute("scatter"):
                    continue
                self.board[reel][row] = self.create_symbol(WILD)
            expanded.append({"reel": reel, "row": gun["row"]})

        # The board changed identity, so the cached special-symbol index is
        # stale: the guns are gone and there are new wilds. Everything
        # downstream (scatter counting for the trigger, the retrigger check)
        # reads that cache.
        self.get_special_symbols_on_board()
        return expanded

    def force_special_wild(self) -> None:
        """Put a Tommy Gun on the board if the deal did not produce one.

        Used by the Don tier, which guarantees at least one wild column per free
        spin. Placed on a cell holding neither a Scatter nor an existing Wild:
        overwriting a Scatter would fight the retrigger, and overwriting a Wild
        would spend the guarantee on a cell that was already wild.
        """
        if self.special_wild_positions():
            return

        candidates = [
            (reel, row)
            for reel in range(self.config.num_reels)
            for row in range(self.config.num_rows[reel])
            if not self.board[reel][row].check_attribute("scatter")
            and not self.board[reel][row].check_attribute("wild")
        ]
        if not candidates:
            return

        reel, row = random.choice(candidates)
        self.board[reel][row] = self.create_symbol(EXPAND_WILD)
        self.get_special_symbols_on_board()
