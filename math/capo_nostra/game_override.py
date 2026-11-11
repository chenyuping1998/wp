"""State overrides for Capo Nostra."""

from game_executables import GameExecutables


class GameStateOverride(GameExecutables):
    """Extend the universal state with Vault Frame bookkeeping."""

    def reset_book(self):
        """Reset frame state at the start of every simulation."""
        super().reset_book()
        self.frames = []
        self.bonus_tier = None
        self.doubling_enabled = False
        self.guaranteed_wild = False

    def assign_special_sym_function(self):
        """No per-symbol constructors are needed.

        Frames are positional overlays rather than symbols, so their multiplier
        is written onto whichever symbols occupy their footprint (see
        `apply_frames_to_board`). The Tommy Gun is handled by substitution at
        draw time rather than by a symbol function, because expanding it
        replaces its neighbours as well as itself.
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
