from game_executables import GameExecutables
from src.calculations.statistics import get_random_outcome


class GameStateOverride(GameExecutables):
    """Game-specific resets and symbol attributes."""

    def reset_book(self):
        super().reset_book()
        self.meter = 0
        self.meter_level = 0

    def assign_special_sym_function(self):
        self.special_symbol_functions = {"P": [self.assign_prize]}

    def assign_prize(self, symbol):
        """Banana Sack value, in multiples of the bet."""
        conditions = self.get_current_distribution_conditions()
        key = "fg_prize_values" if self.gametype == self.config.freegame_type else "prize_values"
        table = conditions.get(key) or conditions["prize_values"]
        symbol.assign_attribute({"prize": get_random_outcome(table)})

    def start_meter_for_mode(self):
        """superbonus opens at the first level (meter 4, x2) without its +10 spins."""
        start = self.get_current_distribution_conditions().get("start_meter", 0)
        self.meter = start
        self.meter_level = sum(1 for t in self.config.meter_thresholds if start >= t)

    def check_game_repeat(self):
        """Verify final simulation outcomes satisfied all distribution/criteria conditions."""
        if self.repeat is False:
            win_criteria = self.get_current_betmode_distributions().get_win_criteria()
            if win_criteria is not None and self.final_win != win_criteria:
                self.repeat = True
