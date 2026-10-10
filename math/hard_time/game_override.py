"""State overrides for Hard Time."""

from game_executables import GameExecutables


class GameStateOverride(GameExecutables):
    """Extend the universal state with searchlight bookkeeping."""

    def reset_book(self):
        """Reset searchlight state at the start of every simulation."""
        super().reset_book()
        self.lit = {}
        self.bonus_tier = None
        self.guaranteed_light = False

    def assign_special_sym_function(self):
        """No per-symbol constructors are needed.

        The searchlight is handled by substitution after the deal rather than by
        a symbol function, because lighting it replaces the cells below it as
        well as itself — and because the multiplier it writes depends on what was
        already lit on that reel, which a per-symbol constructor cannot see.
        """
        self.special_symbol_functions = {}

    def check_repeat(self) -> None:
        """Reject simulations that failed their distribution criteria."""
        if self.repeat is False:
            win_criteria = self.get_current_betmode_distributions().get_win_criteria()
            if win_criteria is not None and self.final_win != win_criteria:
                self.repeat = True

            if self.get_current_distribution_conditions()["force_freegame"] and not self.triggered_freegame:
                self.repeat = True

            if self.win_manager.running_bet_win == 0.0 and self.criteria != "0":
                self.repeat = True
