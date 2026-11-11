"""Sushi Monkey book events. Every event carries full state, never a delta, so a
resumed round can be rebuilt from the last event of each kind alone."""


def collect_event(gamestate, collectors, sacks, per_collector, mult, amount):
    """The Bandits on the board take every Banana Sack's value."""
    gamestate.book.add_event(
        {
            "index": len(gamestate.book.events),
            "type": "collect",
            "collectors": collectors,
            "sacks": sacks,
            "perCollector": int(round(per_collector * 100)),
            "mult": mult,
            "amount": int(round(amount * 100)),
            "gameType": gamestate.gametype,
        }
    )


def bandit_meter_event(gamestate, added, level_up, spins_added):
    """Free spins only: meter after this spin's Bandits were counted."""
    gamestate.book.add_event(
        {
            "index": len(gamestate.book.events),
            "type": "banditMeter",
            "count": gamestate.meter,
            "added": added,
            "level": gamestate.meter_level,
            "removedSymbols": gamestate.config.plate_replacements[:gamestate.meter_level],
            "mult": gamestate.config.collect_mults[gamestate.meter_level],
            "nextAt": (
                gamestate.config.meter_thresholds[gamestate.meter_level]
                if gamestate.meter_level < len(gamestate.config.meter_thresholds)
                else None
            ),
            "levelUp": level_up,
            "spinsAdded": spins_added,
            "totalFs": gamestate.tot_fs,
        }
    )
