"""Round logic for Turf War.

Event ordering per spin:
    reveal -> [wildExpand] -> [stickyWilds] -> [updateFrames] -> [newFrames]
           -> [bigScore] -> [winInfo (lines)] -> [frameDoubling]
           -> setWin -> setTotalWin

`reveal` shows the board as dealt, Bruisers and all, and `wildExpand` is what
turns their reels into Wilds. Splitting it that way is what lets the frontend
play the bat landing and the column filling as two beats; the alternative -
revealing a board that is already all wilds - would make the feature invisible.

`stickyWilds` (Kingpin tier only) reports every cell currently held as a Wild,
so held columns read differently from the one that just expanded this spin.

`bigScore` (the full-board multiplier) is emitted in the newFrames slot so the
frontend can play its build-up before the win. It is single-spin: no matching
'cleared' event, the next spin simply has none.

Frames are applied after the expansion, never before: expansion replaces symbol
objects, so a multiplier written first would be discarded with them.
"""

from game_override import GameStateOverride
from game_events import (
    big_score_event,
    bonus_tier_event,
    frame_doubling_event,
    new_frames_event,
    sticky_wilds_event,
    update_frames_event,
    wild_expand_event,
)
from src.calculations.lines import Lines
from src.events.events import (
    reveal_event,
    set_total_event,
    set_win_event,
    win_info_event,
)

SOLDIER = "soldier"


class GameState(GameStateOverride):
    """Handle all game logic and event emission for one simulation."""

    # ------------------------------------------------------------------
    # Entry point
    # ------------------------------------------------------------------
    def run_spin(self, sim, simulation_seed=None):
        """Play one base-game round, including any free-spin feature."""
        self.reset_seed(sim)
        self.repeat = True
        while self.repeat:
            self.reset_book()

            # Draw, then cap Bruisers at one, THEN reveal - so the extra guns
            # are already collapsed to Wilds before the player sees the board.
            self.draw_board(emit_event=False)
            self.dedupe_special_wilds()
            reveal_event(self)

            expanded = self.expand_special_wilds()
            if expanded:
                wild_expand_event(self, expanded)

            # The Big Score takes the spin's frame slot: when it lands, no
            # ordinary frames are added (its multiplier covers the whole board).
            big = self.draw_fullboard_frame()
            new_frames = [] if big else self.add_frames(self.draw_frame_count())
            if new_frames:
                new_frames_event(self, new_frames)
            if big:
                big_score_event(self, big["mult"])
            self.apply_frames_to_board()

            self.resolve_spin()

            self.win_manager.update_gametype_wins(self.gametype)

            if self.check_fs_condition() and self.check_freespin_entry():
                self.run_freespin_from_base()

            self.evaluate_finalwin()
            self.check_repeat()

        self.imprint_wins()

    # ------------------------------------------------------------------
    # Shared win resolution
    # ------------------------------------------------------------------
    def resolve_spin(self) -> None:
        """Evaluate line wins and emit the spin totals."""
        self.win_data = Lines.get_lines(
            self.board,
            self.config,
            multiplier_method="symbol",
        )
        Lines.record_lines_wins(self)
        self.win_manager.update_spinwin(self.win_data["totalWin"])
        if self.win_data["totalWin"] > 0:
            win_info_event(self)

        if self.win_manager.spin_win > 0:
            self.evaluate_wincap()
            set_win_event(self)
        set_total_event(self)

    # ------------------------------------------------------------------
    # Free spins
    # ------------------------------------------------------------------
    def run_freespin(self):
        """Play the free-spin tier selected by the triggering scatter count."""
        scatter_count = min(self.count_special_symbols("scatter"), 5)
        tier = self.config.bonus_tiers.get(scatter_count, SOLDIER)
        seed_count = self.config.tier_seed_frames[tier]

        self.bonus_tier = tier
        self.doubling_enabled = self.config.tier_doubling[tier]
        self.guaranteed_wild = self.config.tier_guaranteed_wild[tier]
        self.sticky_wilds_enabled = self.config.tier_sticky_wilds.get(tier, False)

        self.reset_fs_spin()
        self.clear_frames()
        self.sticky_wild_cells = set()
        bonus_tier_event(self, tier, seed_count)

        seeded = False
        while self.fs < self.tot_fs and not self.wincap_triggered:
            self.update_freespin()
            self.clear_big_score()
            self.draw_board(emit_event=False)

            # Kingpin: held wild columns are written back onto the fresh board
            # before anything else reads it.
            if self.sticky_wilds_enabled and self.sticky_wild_cells:
                self.restore_sticky_wilds()

            if self.guaranteed_wild:
                self.force_special_wild()

            # One Bruiser expands per free spin too - in Kingpin this also paces
            # how fast held columns pile up (at most one new one per spin).
            self.dedupe_special_wilds()

            if not seeded:
                # Seeded frames are new to the player, so they are announced via
                # newFrames rather than being reported as carried-over stickies.
                carried = []
                new_frames = self.seed_tier_frames(seed_count)
                seeded = True
            else:
                if tier == SOLDIER:
                    # The single sticky frame is refilled with a fresh
                    # multiplier each spin.
                    self.reroll_frame_values()
                carried = [dict(f) for f in self.frames]
                new_frames = []

            # As in the base game, a Big Score takes the spin's frame slot: no
            # ordinary frames are added this spin, though carried stickies still
            # exist and resume next spin (its multiplier just overrides them for
            # the one spin it lands on).
            big = self.draw_fullboard_frame()
            if not big:
                new_frames = new_frames + self.add_frames(self.draw_frame_count())

            reveal_event(self)

            expanded = self.expand_special_wilds()
            if expanded:
                wild_expand_event(self, expanded)

            if self.sticky_wilds_enabled:
                self.record_sticky_wild_columns(expanded)
                if self.sticky_wild_cells:
                    sticky_wilds_event(
                        self,
                        [{"reel": r, "row": w} for r, w in sorted(self.sticky_wild_cells)],
                    )

            if carried:
                update_frames_event(self, carried)
            if new_frames:
                new_frames_event(self, new_frames)
            if big:
                big_score_event(self, big["mult"])

            self.apply_frames_to_board()

            self.resolve_spin()

            if self.doubling_enabled:
                doubled = self.double_winning_frames()
                if doubled:
                    frame_doubling_event(self, doubled)

            if self.check_fs_condition():
                self.update_fs_retrigger_amt()

            self.win_manager.update_gametype_wins(self.gametype)

        self.end_freespin()
