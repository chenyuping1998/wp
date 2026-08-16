"""Round logic for Hot Miami.

Event ordering per spin:
    reveal -> [updateFrames] -> [newFrames] -> [winInfo (lines)]
           -> [collectorWin + winInfo (sweep)] -> [frameDoubling]
           -> setWin -> setTotalWin

The Collector's award is emitted as its own `winInfo` event rather than being
folded into the line-win event. That keeps the RGS contract invariant
`sum(winInfo totals) == terminal amount` true, while still paying the sweep
after line wins as the rules describe.
"""

from game_override import GameStateOverride
from game_events import (
    bonus_tier_event,
    collector_win_event,
    frame_doubling_event,
    new_frames_event,
    update_frames_event,
)
from src.calculations.lines import Lines
from src.events.events import (
    reveal_event,
    set_total_event,
    set_win_event,
    win_info_event,
)

OCEAN_DRIVE = "ocean_drive"
NEON_NIGHTS = "neon_nights"


class GameState(GameStateOverride):
    """Handle all game logic and event emission for one simulation."""

    # ------------------------------------------------------------------
    # Entry point
    # ------------------------------------------------------------------
    def run_spin(self, sim, simulation_seed=None):
        """Play one base-game round, including any free-spin feature."""
        self.reset_seed(sim)
        self.repeat = True
        while self.repeat:
            self.reset_book()

            self.draw_board(emit_event=True)

            new_frames = self.add_frames(self.draw_frame_count())
            if new_frames:
                new_frames_event(self, new_frames)
            self.apply_frames_to_board()

            self.resolve_spin(allow_collector=True)

            self.win_manager.update_gametype_wins(self.gametype)

            if self.check_fs_condition() and self.check_freespin_entry():
                self.run_freespin_from_base()

            self.evaluate_finalwin()
            self.check_repeat()

        self.imprint_wins()

    # ------------------------------------------------------------------
    # Shared win resolution
    # ------------------------------------------------------------------
    def resolve_spin(self, allow_collector: bool) -> None:
        """Evaluate line wins, then the Collector sweep, then emit totals."""
        self.win_data = Lines.get_lines(
            self.board,
            self.config,
            multiplier_method="symbol",
        )
        Lines.record_lines_wins(self)
        self.win_manager.update_spinwin(self.win_data["totalWin"])
        if self.win_data["totalWin"] > 0:
            win_info_event(self)

        if allow_collector:
            self.resolve_collector()

        if self.win_manager.spin_win > 0:
            self.evaluate_wincap()
            set_win_event(self)
        set_total_event(self)

    def resolve_collector(self) -> None:
        """Pay the Collector sweep after line wins have been awarded."""
        position, collected, amount = self.evaluate_collector()
        if position is None or amount <= 0:
            return

        collector_win_event(self, position, collected, amount)

        # Re-point win_data at the sweep so the standard winInfo event carries it.
        self.win_data = {
            "totalWin": amount,
            "wins": [
                {
                    "symbol": "C",
                    "kind": 1,
                    "win": amount,
                    "positions": [{"reel": position["reel"], "row": position["row"]}],
                    "meta": {
                        "lineIndex": 0,
                        "multiplier": int(amount),
                        "winWithoutMult": 1.0,
                        "globalMult": 1,
                        "lineMultiplier": int(amount),
                        "collector": True,
                    },
                }
            ],
        }
        self.win_manager.update_spinwin(amount)
        win_info_event(self)

    # ------------------------------------------------------------------
    # Free spins
    # ------------------------------------------------------------------
    def run_freespin(self):
        """Play the free-spin tier selected by the triggering scatter count."""
        scatter_count = min(self.count_special_symbols("scatter"), 5)
        tier = self.config.bonus_tiers.get(scatter_count, NEON_NIGHTS)
        seed_count = self.config.tier_seed_frames[tier]

        self.bonus_tier = tier
        self.doubling_enabled = self.config.tier_doubling[tier]

        self.reset_fs_spin()
        self.clear_frames()
        bonus_tier_event(self, tier, seed_count)

        seeded = False
        while self.fs < self.tot_fs and not self.wincap_triggered:
            self.update_freespin()
            self.draw_board(emit_event=False)

            if not seeded:
                # Seeded frames are new to the player, so they are announced via
                # newFrames rather than being reported as carried-over stickies.
                carried = []
                new_frames = self.seed_tier_frames(seed_count)
                seeded = True
            else:
                if tier == NEON_NIGHTS:
                    # Sticky frames are refilled with a fresh multiplier each spin.
                    self.reroll_frame_values()
                carried = [dict(f) for f in self.frames]
                new_frames = []

            if tier != OCEAN_DRIVE:
                new_frames = new_frames + self.add_frames(self.draw_frame_count())

            reveal_event(self)
            if carried:
                update_frames_event(self, carried)
            if new_frames:
                new_frames_event(self, new_frames)

            self.apply_frames_to_board()

            # Ocean Drive has no Collector or scatter symbols in play.
            self.resolve_spin(allow_collector=tier != OCEAN_DRIVE)

            if self.doubling_enabled:
                doubled = self.double_winning_frames()
                if doubled:
                    frame_doubling_event(self, doubled)

            if tier != OCEAN_DRIVE and self.check_fs_condition():
                self.update_fs_retrigger_amt()

            self.win_manager.update_gametype_wins(self.gametype)

        self.end_freespin()
