"""Persistent multiplier wheel."""
from game_calculations import GameCalculations
from src.calculations.statistics import get_random_outcome
class GameExecutables(GameCalculations):
    def draw_wheel(self):
        weights = {v:w for v,w in self.config.wheel_weights[self.bonus_tier].items() if v >= self.held_multiplier}
        previous = self.held_multiplier
        self.held_multiplier = int(get_random_outcome(weights))
        self.book.add_event({"index":len(self.book.events),"type":"multiplierWheel",
                             "previous":previous,"value":self.held_multiplier,"eligibleValues":list(weights)})
        return self.held_multiplier
