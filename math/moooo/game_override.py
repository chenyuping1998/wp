"""State overrides for Moooo."""

from game_executables import GameExecutables


class GameStateOverride(GameExecutables):
    """Extend the universal state with cow and Milk Meter bookkeeping."""

    def reset_book(self):
        """Reset cow and meter state at the start of every simulation."""
        super().reset_book()
        self.cows = []
        self.expanded_reels = set()
        # Empty outside the free game. `meter_level` reads this to decide
        # whether a floor applies at all, so "no feature running" and "every
        # meter at level 1" stay distinguishable.
        self.meters = []

    def assign_special_sym_function(self):
        """No per-symbol constructors are needed.

        A cow's bell is rolled when the cow is placed and written onto the reel
        by `paint_cows`, so there is nothing to attach at symbol-creation time.
        Attaching it there would also be wrong: `create_symbol` runs for every
        position on every draw, including the wilds painted during the
        expansion fixed point, and would reroll the bell mid-resolution.
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
