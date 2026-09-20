"""State overrides for Hot Miami."""

from game_executables import GameExecutables
from src.events.events import reveal_event

# The tier that plays without the Scatter and the Collector. Defined here rather
# than imported from gamestate, which imports this module.
OCEAN_DRIVE = "ocean_drive"


class GameStateOverride(GameExecutables):
    """Extend the universal state with Neon Frame bookkeeping."""

    def reset_book(self):
        """Reset frame state at the start of every simulation."""
        super().reset_book()
        self.frames = []
        self.bonus_tier = None
        self.doubling_enabled = False

    def assign_special_sym_function(self):
        """No per-symbol constructors are needed.

        Frames are positional overlays rather than symbols, so their
        multiplier is written onto whichever symbol occupies the position
        (see `apply_frames_to_board`).
        """
        self.special_symbol_functions = {}

    def create_board_reelstrips(self) -> None:
        """Deal Ocean Drive from its own Scatter-free, Collector-free strips.

        The tier already ignored both symbols - `run_freespin` passes
        `allow_collector=False` and skips the retrigger check - but they were
        still being dealt, so the player watched a Scatter land and nothing
        happen (6.1% of Ocean Drive spins showed two or more of them), and sat
        through an anticipation tease that could not pay off on 17.2% of them.
        The rules panel says neither symbol appears in this tier; now that is
        true.

        Done as a strip substitution at draw time rather than as its own
        distribution because the tier is reached from several distributions -
        the natural 5-scatter trigger in `base`, the whole of `bonus_epic`, and
        both of those modes' wincap fences - and they do not all deal from the
        same strip. `ocean_drive_reels` maps each one to its twin.

        The conditions dict belongs to the config and is restored immediately;
        the swap only has to survive the one `super()` call that reads it.
        Books are generated one simulation at a time per process, so nothing
        else can observe the window.
        """
        weights = self.get_current_distribution_conditions()["reel_weights"]
        substitutions = self.config.ocean_drive_reels
        if (
            self.gametype == self.config.freegame_type
            and self.bonus_tier == OCEAN_DRIVE
            and any(strip in substitutions for strip in weights[self.gametype])
        ):
            original = weights[self.gametype]
            weights[self.gametype] = {
                substitutions.get(strip, strip): weight for strip, weight in original.items()
            }
            try:
                super().create_board_reelstrips()
            finally:
                weights[self.gametype] = original
        else:
            super().create_board_reelstrips()

    def draw_board(self, emit_event: bool = True, trigger_symbol: str = "scatter") -> None:
        """Draw a board carrying at most one Collector.

        Two Collectors on one grid never meant anything: `collector_position`
        takes `collectors[0]` and the rules panel had to carry a sentence saying
        the extras are ignored. So the player was shown a symbol that did nothing,
        twice, and told about it in the rules.

        Rejection sampling rather than post-hoc substitution, which is the same
        thing the base implementation already does to keep a non-triggering base
        board from landing enough scatters. Redrawing keeps every other
        distribution intact; swapping the extra for another symbol would quietly
        raise that symbol's frequency instead.

        Bounded, because a rejection loop with no ceiling is a hang waiting for a
        reel change. The Collector sits on two reels at one position each, so the
        double is rare and the cap is never expected to be reached; if it ever is,
        the board is accepted as drawn and the old `collectors[0]` behaviour still
        applies, which is strictly no worse than before.
        """
        attempts = 0
        while True:
            super().draw_board(emit_event=False, trigger_symbol=trigger_symbol)
            # count_symbols_on_board walks the board; count_special_symbols reads
            # self.special_syms_on_board, which create_board_reelstrips APPENDS to
            # with += and never clears. Across a redraw loop that cache is the
            # running total of every board attempted, so the first version of this
            # check was permanently >1 after the second attempt, ran to the cap and
            # accepted whatever it had — the constraint did nothing, and the books
            # still showed 327 double-Collector boards in 47,139.
            if self.count_symbols_on_board("C") <= 1:
                break
            attempts += 1
            if attempts >= 50:
                break
        if emit_event:
            reveal_event(self)

    def check_repeat(self) -> None:
        """Reject simulations that failed their distribution criteria."""
        if self.repeat is False:
            win_criteria = self.get_current_betmode_distributions().get_win_criteria()
            if win_criteria is not None and self.final_win != win_criteria:
                self.repeat = True

            if self.get_current_distribution_conditions()["force_freegame"] and not self.triggered_freegame:
                self.repeat = True

            if self.win_manager.running_bet_win == 0.0 and self.criteria != "0":
                self.repeat = True
