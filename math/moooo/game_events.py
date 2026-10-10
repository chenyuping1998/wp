"""Moooo specific events.

Declare these to the event validator with:
    --allow-event newCows,expandCows,milkMeterInit,milkMeterUpdate

All monetary amounts follow the book convention of x100 integer scaling. Bell
values are plain integers (a 25x bell is emitted as 25) because they are
multipliers, not amounts.
"""

from copy import deepcopy

NEW_COWS = "newCows"
EXPAND_COWS = "expandCows"
MILK_METER_INIT = "milkMeterInit"
MILK_METER_UPDATE = "milkMeterUpdate"


def _pad_row(row: int, include_padding: bool) -> int:
    """Shift a row index down by one when the board carries padding symbols."""
    return row + 1 if include_padding else row


def new_cows_event(gamestate, cows: list) -> None:
    """Cows that landed on this spin, before any mouth has opened.

    Emitted after the reveal and before `expandCows`, so the frontend can play
    the landing beat - head turns to camera, then the mouth opens - as two
    separate events rather than guessing at the timing from one.
    """
    event = {
        "index": len(gamestate.book.events),
        "type": NEW_COWS,
        "cows": [
            {
                "reel": cow["reel"],
                "row": _pad_row(cow["row"], gamestate.config.include_padding),
                "tier": cow["tier"],
                "mult": cow["mult"],
            }
            for cow in deepcopy(cows)
        ],
    }
    gamestate.book.add_event(event)


def expand_cows_event(gamestate, cows: list) -> None:
    """Cows whose reel crossed a win line, and so filled their reel.

    A cow absent from this event landed and stayed a single symbol. That is the
    reference's conditional-expansion rule and it is visible: the player can see
    which mouths opened and which did not.
    """
    event = {
        "index": len(gamestate.book.events),
        "type": EXPAND_COWS,
        "reels": [
            {"reel": cow["reel"], "tier": cow["tier"], "mult": cow["mult"]} for cow in deepcopy(cows)
        ],
        "totalMultiplier": int(sum(cow["mult"] for cow in cows)),
    }
    gamestate.book.add_event(event)


def milk_meter_init_event(gamestate, levels: list, spins: int) -> None:
    """Starting state of every reel's Milk Meter as the feature opens.

    `superMode` is derived rather than passed: Super Free Spins is exactly the
    entry whose meters start above the first level, so there is no second source
    of truth to drift out of step with the meters themselves.
    """
    event = {
        "index": len(gamestate.book.events),
        "type": MILK_METER_INIT,
        "levels": list(levels),
        "maxLevel": gamestate.config.meter_levels,
        "superMode": min(levels) > 1,
        "spins": spins,
    }
    gamestate.book.add_event(event)


def milk_meter_update_event(gamestate, changed: list, levels: list) -> None:
    """Reels whose meter advanced this spin, plus the full resulting state.

    Both halves matter: `changed` is what to animate, `levels` is what to draw.
    Sending only the delta would make every meter a running total the frontend
    has to reconstruct, and one dropped event would desync the display from the
    maths for the rest of the round.
    """
    event = {
        "index": len(gamestate.book.events),
        "type": MILK_METER_UPDATE,
        "changed": deepcopy(changed),
        "levels": list(levels),
        "maxLevel": gamestate.config.meter_levels,
    }
    gamestate.book.add_event(event)
