"""Hard Time specific events.

Declare these to the event validator with:
    --allow-event searchlight,updateLights,bonusTier

All monetary amounts follow the book convention of x100 integer scaling.
Multipliers are plain integers (a 25x cell is emitted as 25) because they are
multipliers, not amounts.

Row indices are padded on the way out (see `_pad`); reel indices are not,
because there is no padding column.
"""

from copy import deepcopy

SEARCHLIGHT = "searchlight"
UPDATE_LIGHTS = "updateLights"
BONUS_TIER = "bonusTier"


def _pad_cells(cells, include_padding):
    """Shift row indices down by one when the board carries padding symbols."""
    shifted = deepcopy(cells)
    if include_padding:
        for cell in shifted:
            cell["row"] += 1
    return shifted


def searchlight_event(gamestate, landed: list) -> None:
    """Searchlights that landed this spin, each with the beam it cast.

    One entry per light, in landing order, so the frontend can play them as
    separate beats rather than one simultaneous flash:

        reel, row   where the light itself landed
        mult        what it carried
        cells       every cell the beam covers, with that cell's RESULTING
                    multiplier and a `doubled` flag

    `doubled` is the difference between "this cell just lit up at 8x" and "this
    cell was already at 8x and the second beam took it to 16x". They are the same
    number on the board and completely different events to watch, so the
    presentation needs to be told which one happened rather than inferring it.
    """
    lights = deepcopy(landed)
    if gamestate.config.include_padding:
        for light in lights:
            light["row"] += 1
    for light in lights:
        light["cells"] = _pad_cells(light["cells"], gamestate.config.include_padding)
    event = {
        "index": len(gamestate.book.events),
        "type": SEARCHLIGHT,
        "lights": lights,
        "reels": sorted({light["reel"] for light in lights}),
    }
    gamestate.book.add_event(event)


def update_lights_event(gamestate, cells: list) -> None:
    """Sticky beams carried into this spin, with their current multipliers.

    Emitted before the new lights land, so the player sees what survived from
    last spin before anything doubles it.
    """
    event = {
        "index": len(gamestate.book.events),
        "type": UPDATE_LIGHTS,
        "cells": _pad_cells(cells, gamestate.config.include_padding),
    }
    gamestate.book.add_event(event)


def bonus_tier_event(gamestate, tier: str, seed_lights: int) -> None:
    """Announce which free-spin tier was entered, and what it opens with."""
    event = {
        "index": len(gamestate.book.events),
        "type": BONUS_TIER,
        "tier": tier,
        "seedLights": seed_lights,
    }
    gamestate.book.add_event(event)
