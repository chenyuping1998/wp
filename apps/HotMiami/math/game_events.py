"""Hot Miami specific events.

Declare these to the event validator with:
    --allow-event newFrames,updateFrames,frameDoubling,collectorWin,bonusTier

All monetary amounts follow the book convention of x100 integer scaling.
Frame multipliers are plain integers (a 25x frame is emitted as 25) because
they are multipliers, not amounts.
"""

from copy import deepcopy

NEW_FRAMES = "newFrames"
UPDATE_FRAMES = "updateFrames"
FRAME_DOUBLING = "frameDoubling"
COLLECTOR_WIN = "collectorWin"
BONUS_TIER = "bonusTier"


def _pad(frames, include_padding):
    """Shift row indices down by one when the board carries padding symbols."""
    shifted = deepcopy(frames)
    if include_padding:
        for frame in shifted:
            frame["row"] += 1
    return shifted


def new_frames_event(gamestate, frames: list) -> None:
    """Neon Frames that landed on this spin."""
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


def collector_win_event(gamestate, position: dict, frames: list, amount: float) -> None:
    """Collector swept every frame value on the board."""
    padded_position = deepcopy(position)
    if gamestate.config.include_padding:
        padded_position["row"] += 1

    event = {
        "index": len(gamestate.book.events),
        "type": COLLECTOR_WIN,
        "position": padded_position,
        "frames": _pad(frames, gamestate.config.include_padding),
        "totalMultiplier": int(sum(f["mult"] for f in frames)),
        "amount": int(round(min(amount, gamestate.config.wincap) * 100, 0)),
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
