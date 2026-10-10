"""Round logic for Hard Time.

Event ordering per spin:
    [updateLights] -> reveal -> [searchlight] -> [winInfo (lines)]
                   -> setWin -> setTotalWin

`reveal` shows the board as dealt — searchlight symbols sitting where they
landed, and, in a feature, the sticky beams that survived the last spin already
wild. `searchlight` is the sweep: the beam travels down the reel, the cells
become Wilds and their multipliers appear (or double). Splitting it that way is
what lets the frontend play the landing and the sweep as two beats; revealing a
board that is already lit would make the mechanic invisible.

`apply_lights_to_board` runs TWICE per spin, and the order matters:

    * before the reveal, so a feature's sticky beams are part of the board the
      player is shown rather than appearing out of nowhere afterwards
    * after the new lights land, so their values — and anything they doubled —
      are on the board the lines are actually evaluated against

It is idempotent, so the second call is free where the first did the work.
"""

from game_override import GameStateOverride
from game_events import (
    bonus_tier_event,
    searchlight_event,
    update_lights_event,
)
from src.calculations.lines import Lines
from src.events.events import (
    reveal_event,
    set_total_event,
    set_win_event,
    win_info_event,
)


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

            self.draw_board(emit_event=False)

            # Base game only ever shows the lights that land on this spin, so
            # there is nothing sticky to restore and nothing to double against.
            self.place_extra_searchlights(self.draw_light_count())
            reveal_event(self)

            landed = self.expand_searchlights()
            if landed:
                searchlight_event(self, landed)
            self.apply_lights_to_board()

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
        tier = self.config.bonus_tiers.get(scatter_count, self.config.lowest_tier)
        seed_count = self.config.tier_seed_lights[tier]

        self.bonus_tier = tier
        self.guaranteed_light = self.config.tier_guaranteed_light[tier]

        self.reset_fs_spin()
        # A feature starts in the dark regardless of what the triggering base
        # spin lit up. Carrying base-game beams in would make the trigger spin's
        # luck part of the feature's strength, which is not what the tier is
        # supposed to measure.
        self.clear_lights()
        bonus_tier_event(self, tier, seed_count)

        seeded = False
        while self.fs < self.tot_fs and not self.wincap_triggered:
            self.update_freespin()
            self.draw_board(emit_event=False)

            # Sticky beams from previous spins, restored onto the fresh board
            # before anything else looks at it.
            self.apply_lights_to_board()
            carried = self.lit_cells_payload()

            if not seeded:
                self.place_extra_searchlights(seed_count)
                seeded = True

            # The top tier's guarantee is applied before the reveal, so the
            # player sees the light land as part of the board rather than
            # appearing afterwards.
            if self.guaranteed_light:
                self.force_searchlight()

            self.place_extra_searchlights(self.draw_light_count())

            if carried:
                update_lights_event(self, carried)
            reveal_event(self)

            landed = self.expand_searchlights()
            if landed:
                searchlight_event(self, landed)
            self.apply_lights_to_board()

            self.resolve_spin()

            if self.check_fs_condition():
                self.update_fs_retrigger_amt()

            self.win_manager.update_gametype_wins(self.gametype)

        self.end_freespin()
