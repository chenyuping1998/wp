from game_calculations import GameCalculations
from game_events import collect_event, bandit_meter_event
from src.calculations.ways import Ways
from src.events.events import set_win_event


class GameExecutables(GameCalculations):
    """Ways wins plus the Bandit's Sack collection."""

    def evaluate_ways_board(self):
        """Populate win-data, record wins, transmit events"""
        self.win_data = Ways.get_ways_data(self.config, self.board)
        if self.win_data["totalWin"] > 0:
            Ways.record_ways_wins(self)
            self.win_manager.update_spinwin(self.win_data["totalWin"])
        Ways.emit_wayswin_events(self)

    def current_collect_mult(self) -> int:
        if self.gametype == self.config.freegame_type:
            return self.config.collect_mults[self.meter_level]
        return 1

    def evaluate_collect(self):
        """Every Bandit on the board takes the sum of every Sack on the board."""
        collectors = [
            {"reel": r, "row": w}
            for r, reel in enumerate(self.board)
            for w, sym in enumerate(reel)
            if sym.name == "W"
        ]
        sacks = [
            {"reel": r, "row": w, "value": sym.get_attribute("prize")}
            for r, reel in enumerate(self.board)
            for w, sym in enumerate(reel)
            if sym.name == "P"
        ]
        if not collectors or not sacks:
            return
        per_collector = sum(s["value"] for s in sacks)
        mult = self.current_collect_mult()
        amount = per_collector * len(collectors) * mult
        # Never let the collection push the round past the cap: the cap event
        # below reports it, and the frontend counts up to the capped figure.
        room = self.config.wincap - self.win_manager.running_bet_win
        amount = min(amount, max(room, 0))
        self.record(
            {
                "kind": len(collectors),
                "symbol": "collect",
                "mult": mult,
                "gametype": self.gametype,
            }
        )
        collect_event(self, collectors, sacks, per_collector, mult, amount)
        self.win_manager.update_spinwin(amount)
        self.evaluate_wincap()
        set_win_event(self)

    def update_bandit_meter(self):
        """Free spins: each Bandit that landed counts toward the next level."""
        added = sum(1 for reel in self.board for sym in reel if sym.name == "W")
        if added == 0:
            return
        self.meter += added
        level_up = 0
        spins_added = 0
        thresholds = self.config.meter_thresholds
        while self.meter_level < len(thresholds) and self.meter >= thresholds[self.meter_level]:
            self.meter_level += 1
            level_up += 1
            spins_added += self.config.meter_spins_added
        self.tot_fs += spins_added
        bandit_meter_event(self, added, level_up, spins_added)
