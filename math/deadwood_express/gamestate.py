"""Deterministic round events: reveal, wheel (paying FG only), wins, totals."""
from game_override import GameStateOverride
from game_events import bonus_tier_event
from src.calculations.lines import Lines
from src.events.events import reveal_event, set_total_event, set_win_event, win_info_event

class GameState(GameStateOverride):
    def run_spin(self, sim, simulation_seed=None):
        self.reset_seed(sim)
        self.repeat = True
        while self.repeat:
            self.reset_book()
            self.draw_board(emit_event=True)
            self.resolve_spin()
            self.win_manager.update_gametype_wins(self.gametype)
            if self.check_fs_condition() and self.check_freespin_entry():
                self.run_freespin_from_base()
            self.evaluate_finalwin()
            self.check_repeat()
        self.imprint_wins()

    def resolve_spin(self):
        self.win_data = Lines.get_lines(self.board,self.config,multiplier_method="global")
        if self.gametype == self.config.freegame_type and self.win_data["totalWin"] > 0:
            self.draw_wheel()
            self.win_data = Lines.get_lines(self.board,self.config,multiplier_method="global",
                                           global_multiplier=self.held_multiplier)
        Lines.record_lines_wins(self)
        self.win_manager.update_spinwin(self.win_data["totalWin"])
        if self.win_data["totalWin"] > 0:
            win_info_event(self)
        if self.win_manager.spin_win > 0:
            self.evaluate_wincap()
            set_win_event(self)
        set_total_event(self)

    def run_freespin(self):
        count = min(self.count_special_symbols("scatter"),5)
        self.bonus_tier = self.config.bonus_tiers[count]
        self.held_multiplier = 1
        self.reset_fs_spin()
        bonus_tier_event(self,self.bonus_tier)
        while self.fs < self.tot_fs and not self.wincap_triggered:
            self.update_freespin()
            self.draw_board(emit_event=False)
            reveal_event(self)
            self.resolve_spin()
            if self.check_fs_condition():
                self.update_fs_retrigger_amt()
            self.win_manager.update_gametype_wins(self.gametype)
        self.end_freespin()
        self.held_multiplier = 1
