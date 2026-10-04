"""Round state and distribution constraints."""
from game_executables import GameExecutables
class GameStateOverride(GameExecutables):
    def reset_book(self):
        super().reset_book()
        self.held_multiplier = 1
        self.bonus_tier = None

    def assign_special_sym_function(self):
        self.special_symbol_functions = {}

    def check_repeat(self):
        if self.repeat is False:
            target = self.get_current_betmode_distributions().get_win_criteria()
            if target is not None and self.final_win != target:
                self.repeat = True
            if self.get_current_distribution_conditions()["force_freegame"] and not self.triggered_freegame:
                self.repeat = True
            if self.win_manager.running_bet_win == 0.0 and self.criteria != "0":
                self.repeat = True
