"""Deadwood Express feature entry event."""
def bonus_tier_event(state, tier):
    state.book.add_event({"index":len(state.book.events),"type":"bonusTier","tier":tier,"seedFrames":0})
