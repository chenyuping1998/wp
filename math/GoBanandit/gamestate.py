"""Go Banandit round flow: reveal -> ways -> collect, and the Bandit meter in free spins."""

from game_override import GameStateOverride


class GameState(GameStateOverride):
    """Handle basegame and freegame logic."""

    def run_spin(self, sim: int, simulation_seed=None) -> None:
        self.reset_seed(sim)
        self.repeat = True
        while self.repeat:
            self.reset_book()
            self.draw_board(emit_event=True)

            self.evaluate_ways_board()
            if not self.wincap_triggered:
                self.evaluate_collect()

            self.win_manager.update_gametype_wins(self.gametype)
            if self.check_fs_condition() and self.check_freespin_entry():
                self.run_freespin_from_base()

            self.evaluate_finalwin()
            self.check_repeat()

        self.imprint_wins()

    def run_freespin(self) -> None:
        self.reset_fs_spin()
        self.start_meter_for_mode()
        while self.fs < self.tot_fs and not self.wincap_triggered:
            self.update_freespin()
            self.draw_board(emit_event=True)

            self.evaluate_ways_board()
            if not self.wincap_triggered:
                self.evaluate_collect()
            self.update_bandit_meter()

            self.win_manager.update_gametype_wins(self.gametype)
        self.end_freespin()
