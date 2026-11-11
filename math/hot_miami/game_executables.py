"""Neon Frame and Collector mechanics for Hot Miami."""

import random

from game_calculations import GameCalculations
from src.calculations.statistics import get_random_outcome

# Frame multipliers never exceed this after doubling, so a single frame can
# never single-handedly overshoot the win cap in an unbounded way.
MAX_FRAME_MULTIPLIER = 1000


class GameExecutables(GameCalculations):
    """Executables for the Neon Frame mechanic."""

    # ------------------------------------------------------------------
    # Frame placement
    # ------------------------------------------------------------------
    def draw_frame_multiplier(self) -> int:
        """Sample one frame multiplier from the active distribution."""
        conditions = self.get_current_distribution_conditions()
        return int(get_random_outcome(conditions["mult_values"][self.gametype]))

    def draw_frame_count(self) -> int:
        """Sample how many new frames land this spin."""
        conditions = self.get_current_distribution_conditions()
        counts = conditions["frame_counts"].get(self.gametype)
        if not counts:
            return 0
        return int(get_random_outcome(counts))

    def draw_frame_count_for_spin(self) -> int:
        """Frame count for this spin, with the cosmetic-frame guard applied.

        A distribution that declares `cosmetic_frames` is one whose books cannot
        win (`win_criteria=0.0`), so the Frames it lands are decoration: there is
        no line win for them to multiply. The one thing that would still turn
        them into money is the Collector, which sweeps every Frame on the board
        whether or not it took part in a win — so on those spins, a Collector on
        the board means no Frames.

        Without this guard the books would not be wrong, they would be
        *rejected*: a swept Frame produces a win, the book fails its zero-win
        criteria, and `check_repeat` redraws. The result would be the same RTP
        and a slower run — but it would also silently bias which boards survive,
        because every board carrying a Collector would be redrawn until its
        Frames happened to be zero. Suppressing the Frames directly is the same
        outcome, stated on purpose.
        """
        conditions = self.get_current_distribution_conditions()
        count = self.draw_frame_count()
        if count and conditions.get("cosmetic_frames") and self.collector_position() is not None:
            return 0
        return count

    def frame_reel_weights(self) -> list:
        """Relative chance of a new frame landing on each reel.

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
        """Place `count` new frames on eligible positions."""
        new_frames = []
        eligible = self.framable_positions()
        reel_weights = self.frame_reel_weights()
        for _ in range(count):
            if not eligible:
                break
            # Weighted by reel, uniform within a reel. random.choices needs a
            # non-zero total, so a weighting that excludes every reel still
            # holding a free position falls back to uniform rather than raising.
            w = [reel_weights[reel] for reel, _ in eligible]
            reel, row = random.choices(eligible, weights=w, k=1)[0] if sum(w) > 0 else random.choice(eligible)
            eligible.remove((reel, row))
            frame = {"reel": reel, "row": row, "mult": self.draw_frame_multiplier()}
            self.frames.append(frame)
            new_frames.append(dict(frame))
        return new_frames

    def seed_tier_frames(self, seed_count: int) -> list:
        """Seed the sticky frames a bonus tier starts with."""
        if seed_count >= self.config.num_reels * self.config.num_rows[0]:
            # Ocean Drive: every position is framed from the start.
            self.frames = []
            for reel in range(self.config.num_reels):
                for row in range(self.config.num_rows[reel]):
                    self.frames.append(
                        {"reel": reel, "row": row, "mult": self.draw_frame_multiplier()}
                    )
            return [dict(f) for f in self.frames]
        return self.add_frames(seed_count)

    def apply_frames_to_board(self) -> None:
        """Write frame multipliers onto the symbols they sit on.

        `Lines.get_lines` runs with multiplier_method="symbol", which sums the
        `multiplier` attribute across the winning positions - matching the rule
        that multiple frames in one win add together.
        """
        for frame in self.frames:
            symbol = self.board[frame["reel"]][frame["row"]]
            symbol.assign_attribute({"multiplier": frame["mult"]})

    def reroll_frame_values(self) -> list:
        """Give every sticky frame a fresh multiplier (Neon Nights refill)."""
        for frame in self.frames:
            frame["mult"] = self.draw_frame_multiplier()
        return [dict(f) for f in self.frames]

    def clear_frames(self) -> None:
        """Remove all frames from the grid."""
        self.frames = []

    # ------------------------------------------------------------------
    # Doubling (Sunset Hits / Ocean Drive)
    # ------------------------------------------------------------------
    def double_winning_frames(self) -> list:
        """Double every frame that took part in a win, once per spin.

        Reads `spin_win_positions`, which gamestate fills as each win is
        evaluated. It must NOT read `win_data`: resolve_collector() overwrites
        that with the sweep alone, so on any spin with a Collector the line
        wins would be invisible here. See the note in gamestate.resolve_spin.
        """
        winning_positions = getattr(self, "spin_win_positions", set())

        doubled = []
        for frame in self.frames:
            if (frame["reel"], frame["row"]) in winning_positions:
                frame["mult"] = min(frame["mult"] * 2, MAX_FRAME_MULTIPLIER)
                doubled.append(dict(frame))
        return doubled

    # ------------------------------------------------------------------
    # Collector
    # ------------------------------------------------------------------
    def evaluate_collector(self) -> tuple:
        """Collect every frame value on the board when a Collector lands.

        Returns (position, frames, win_amount) or (None, [], 0.0).
        The Collector sweeps all frames regardless of whether they formed part
        of a winning line.
        """
        position = self.collector_position()
        if position is None or not self.frames:
            return None, [], 0.0

        collected = [dict(f) for f in self.frames]
        win_amount = float(self.total_frame_multiplier())
        return position, collected, win_amount
