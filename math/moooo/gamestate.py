"""Round logic for Moooo.

Event ordering per spin:
    reveal -> [milkMeterUpdate] -> [newCows] -> [expandCows]
           -> [winInfo] -> setWin -> setTotalWin

The reveal carries the cow as a landed symbol; expansion happens after it, so
the client can play "cow lands" and "mouth opens" as two beats. The Milk Meter
update comes first because the churn is already on the revealed board - the
meter fills, then the cows arrive.
"""

from game_override import GameStateOverride
from game_events import (
    expand_cows_event,
    milk_meter_init_event,
    milk_meter_update_event,
    new_cows_event,
)
from src.calculations.lines import Lines
from src.events.events import reveal_event


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

            self.draw_board(emit_event=False)
            self.play_reveal()
            self.resolve_spin()

            self.win_manager.update_gametype_wins(self.gametype)

            if self.check_fs_condition() and self.check_freespin_entry():
                self.run_freespin_from_base()

            self.evaluate_finalwin()
            self.check_repeat()

        self.imprint_wins()

    # ------------------------------------------------------------------
    # Shared spin structure
    # ------------------------------------------------------------------
    def play_reveal(self, meter_changes: list = None) -> None:
        """Draw is already done: land cows, reveal, then resolve expansion.

        `drawn` is taken after the cows are placed and before anything expands,
        so it is the board the player was shown. Every pass of the expansion
        fixed point repaints from it.
        """
        landed = self.place_cows(self.draw_cow_count())
        drawn = self.snapshot_board()

        reveal_event(self)
        if meter_changes:
            milk_meter_update_event(self, meter_changes, self.meters)
        if landed:
            new_cows_event(self, landed)

        expanded = self.resolve_cows(drawn)
        if expanded:
            expand_cows_event(self, expanded)

    def resolve_spin(self) -> None:
        """Evaluate line wins on the resolved board and emit the totals."""
        self.win_data = Lines.get_lines(self.board, self.config, multiplier_method="symbol")
        Lines.record_lines_wins(self)
        self.win_manager.update_spinwin(self.win_data["totalWin"])
        Lines.emit_linewin_events(self)

    # ------------------------------------------------------------------
    # Free spins
    # ------------------------------------------------------------------
    def run_freespin(self):
        """Play the feature, with a Milk Meter running on every reel.

        The triggering scatter count picks the starting level and nothing else:
        3 scatters is Free Spins and starts at level 1, 4 is Super Free Spins
        and starts at level 2. Both award the same 10 spins. The expensive entry
        buys a higher floor, not a longer round - which is what makes Super the
        steadier ride rather than simply the bigger one.
        """
        scatters = min(self.count_special_symbols("scatter"), max(self.config.meter_start_levels))
        start_level = self.config.meter_start_levels.get(scatters, 1)

        self.reset_fs_spin()
        self.init_meters(start_level)
        milk_meter_init_event(self, self.meters, self.tot_fs)

        while self.fs < self.tot_fs and not self.wincap_triggered:
            self.update_freespin()
            self.draw_board(emit_event=False)

            # Churns are read off the drawn board, before cows land. A cow can
            # never share a reel with a churn (see `cow_eligible_reels`), so the
            # ordering costs nothing on this spin and reads correctly: the churn
            # fills the meter, and the meter is what the NEXT cow on that reel
            # rolls against.
            meter_changes = self.advance_meters()

            self.play_reveal(meter_changes)
            self.resolve_spin()

            if self.check_fs_condition():
                self.update_fs_retrigger_amt()

            self.win_manager.update_gametype_wins(self.gametype)

        self.end_freespin()
