"""Turf War specific events.

Declare these to the event validator with:
    --allow-event newFrames,updateFrames,frameDoubling,wildExpand,bonusTier,bigScore,stickyWilds

All monetary amounts follow the book convention of x100 integer scaling.
Frame multipliers are plain integers (a 25x frame is emitted as 25) because
they are multipliers, not amounts.

Frames carry a `size` (1, 2 or 3) alongside their anchor `reel`/`row`. The
anchor is the TOP-LEFT cell, so a size-3 frame at reel 1 row 0 covers reels
1-3 and rows 0-2. Row indices are padded on the way out (see `_pad`); reel
indices are not, because there is no padding column.
"""

from copy import deepcopy

NEW_FRAMES = "newFrames"
UPDATE_FRAMES = "updateFrames"
FRAME_DOUBLING = "frameDoubling"
WILD_EXPAND = "wildExpand"
BONUS_TIER = "bonusTier"
BIG_SCORE = "bigScore"
STICKY_WILDS = "stickyWilds"


def _pad(frames, include_padding):
    """Shift row indices down by one when the board carries padding symbols.

    Applies to frames and to expanded-wild entries alike - both are addressed by
    a `row` that the frontend reads against a padded board. A frame's `size` is
    a footprint, not a coordinate, so it is left alone.
    """
    shifted = deepcopy(frames)
    if include_padding:
        for frame in shifted:
            frame["row"] += 1
    return shifted


def new_frames_event(gamestate, frames: list) -> None:
    """Vault Frames that landed on this spin."""
    event = {
        "index": len(gamestate.book.events),
        "type": NEW_FRAMES,
        "frames": _pad(frames, gamestate.config.include_padding),
    }
    gamestate.book.add_event(event)


def update_frames_event(gamestate, frames: list) -> None:
    """Sticky frames carried into this spin, with their current multiplier."""
    event = {
        "index": len(gamestate.book.events),
        "type": UPDATE_FRAMES,
        "frames": _pad(frames, gamestate.config.include_padding),
    }
    gamestate.book.add_event(event)


def frame_doubling_event(gamestate, frames: list) -> None:
    """Frames whose multiplier doubled after taking part in a win."""
    event = {
        "index": len(gamestate.book.events),
        "type": FRAME_DOUBLING,
        "frames": _pad(frames, gamestate.config.include_padding),
    }
    gamestate.book.add_event(event)


def wild_expand_event(gamestate, expanded: list) -> None:
    """Tommy Guns landed and filled their reels with Wilds.

    `expanded` is one entry per gun: the reel that filled, and the row the gun
    itself landed on so the frontend can start its muzzle flash there. Emitted
    before any win event for the spin, because the expansion is what the wins
    are evaluated against.
    """
    event = {
        "index": len(gamestate.book.events),
        "type": WILD_EXPAND,
        "wilds": _pad(expanded, gamestate.config.include_padding),
        "reels": sorted({entry["reel"] for entry in expanded}),
    }
    gamestate.book.add_event(event)


def bonus_tier_event(gamestate, tier: str, seed_frames: int) -> None:
    """Announce which free-spin tier was entered."""
    event = {
        "index": len(gamestate.book.events),
        "type": BONUS_TIER,
        "tier": tier,
        "seedFrames": seed_frames,
    }
    gamestate.book.add_event(event)


def big_score_event(gamestate, mult: int) -> None:
    """The Big Score landed: the whole board is one multiplier this spin.

    Emitted in the newFrames slot of the ordering so the frontend can play its
    build-up before the win is shown. Single-spin: there is no matching
    'cleared' event, the next spin simply has no bigScore.
    """
    event = {
        "index": len(gamestate.book.events),
        "type": BIG_SCORE,
        "mult": int(mult),
    }
    gamestate.book.add_event(event)


def sticky_wilds_event(gamestate, cells: list) -> None:
    """Every cell currently held as a sticky Wild (Kingpin tier).

    `cells` is the full held set as [{"reel", "row"}], row padded like frames.
    Emitted each free spin after wildExpand so the frontend can mark held cells
    distinctly from the column that just expanded this spin.
    """
    event = {
        "index": len(gamestate.book.events),
        "type": STICKY_WILDS,
        "cells": _pad(cells, gamestate.config.include_padding),
    }
    gamestate.book.add_event(event)
