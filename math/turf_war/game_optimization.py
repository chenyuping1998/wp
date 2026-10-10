"""Optimization targets for Turf War.

Modes are tuned to 93.58 / 93.63 / 93.67 / 93.78, a 0.20% spread, so the Stake
requirement "all modes must have an RTP within 0.5% of each other" holds while
the price ladder still improves as it climbs. (Taken down one full point from
Capo Nostra's 94.58/94.63/94.67/94.78 ladder on 2026-09-06 — every mode moved
by the same amount, so the spread is untouched.)

On top of the level drop, Turf War moves return OUT of the base game and INTO
the feature: the base slice's share is cut and every tier's hit-rate lowered
(1 in 220 -> 1 in ~155 combined) so features are seen more often. See the base
`conditions` block.

The freegame_strong scaling buckets below are still Capo Nostra's, tuned for
its bonus_epic tail. Turf War's Kingpin adds sticky wild columns and the game
adds the full-board Big Score, both of which reshape the top-tier tail - so the
FIRST optimizer pass is run with this scaling unchanged, the 5,000x/10,000x
tail measured, and the buckets adjusted from that measurement rather than
guessed here.

bonus_epic's tail (Capo Nostra, 2026-09-03): Stake's own volatility dashboard
failed bonus_epic on BOTH "Tail Probability (5,000x)" and "(10,000x)",
against every star tier it was checked at (2-star and 3-star both showed
"CAPS REDUCED — due to: TAIL PROBABILITY", Max Exposure cut 15M->10M and
50M->25M). Measured raw values before the fix: p(>=5000x) 0.0496, p(>=10000x)
0.0249 — roughly 5x over the tightest limit shown (0.0100 and 0.0050). The
tool's own instruction was literally "make payouts of 5,000x/10,000x or more
happen less often", so the fix is `buy_scaling`'s freegame_strong bucket
below, not the RTP target — bonus_epic's RTP stays 0.9478.
"""

from optimization_program.optimization_config import (
    ConstructScaling,
    ConstructParameters,
    ConstructConditions,
    ConstructFenceBias,
    verify_optimization_input,
)


class OptimizationSetup:
    """Optimization parameters for every Turf War bet mode."""

    def __init__(self, game_config):
        self.game_config = game_config
        wincaps = {bm.get_name(): bm.get_wincap() for bm in game_config.bet_modes}

        buy_parameters = ConstructParameters(
            num_show=5000,
            num_per_fence=10000,
            min_m2m=4,
            max_m2m=8,
            pmb_rtp=1.0,
            sim_trials=5000,
            test_spins=[10, 20, 50],
            test_weights=[0.6, 0.2, 0.2],
            score_type="rtp",
        ).return_dict()

        buy_scaling = ConstructScaling(
            [
                {"criteria": "freegame_weak", "scale_factor": 0.9, "win_range": (20, 50), "probability": 1.0},
                {"criteria": "freegame_mid", "scale_factor": 0.8, "win_range": (2000, 5000), "probability": 1.0},
                # Was an AMPLIFIER: 1.2x on (10000, 15000), which is exactly the
                # bucket Stake's volatility dashboard flagged bonus_epic for
                # (see the module docstring). Reversed into a suppressor and
                # widened to the full 5000-19999 span — the 5,000x check and the
                # 10,000x check both measured about the same 5x overshoot, which
                # means the mass isn't concentrated in the old 10-15k window
                # alone; it runs the whole way up to the wincap fence's own
                # 20,000x. 0.12 targets roughly a 1/5 reduction with margin,
                # since a local bucket's scale_factor and the resulting overall
                # tail probability aren't a clean 1:1 relationship once the
                # optimizer rebalances the rest of the fence to hold its RTP.
                # freegame_strong is bonus_epic's OWN criteria only — bonus and
                # bonus_hits use freegame_weak/freegame_mid above and are
                # untouched by this change.
                {"criteria": "freegame_strong", "scale_factor": 0.12, "win_range": (5000, 19999), "probability": 1.0},
                # 2026-09-03, same day: bonus_epic's Probability of Payout <
                # Bet was 75.6% (measured after the tail fix above); asked to
                # bring it under 70% and nudge the 2000-5000x tier down a bit
                # while doing it. There was no existing scaling on 2000-5000 for
                # freegame_strong at all (the (2000,5000)@0.8 above is
                # freegame_mid — bonus_hits' own bucket, not this one), so
                # "slightly down" is a NEW mild suppressor rather than an edit
                # to something that already existed.
                #
                # The other half is what actually moves prob_less_bet: money
                # freed from 2000-5000 (and the already-suppressed 5000+ tail)
                # has to land somewhere to hold the fence's RTP, and unless
                # something pulls it toward 1000-2000 the optimizer is just as
                # likely to push it down into sub-1000 territory, which would
                # move prob_less_bet the WRONG way.
                #
                # 3.0 (first pass) measured at 70.85% — under the old 75.6% but
                # not under the 70% asked for. 4.5 is the second pass; the
                # relationship isn't linear (2000-5000's actual post-fence
                # share came in above the naive 0.7x-of-19.68% estimate too,
                # for the same reason: the optimizer is holding the fence's
                # RTP target, not obeying either scale_factor literally), so
                # this was sized off the measured gap rather than derived.
                {"criteria": "freegame_strong", "scale_factor": 0.7, "win_range": (2000, 5000), "probability": 1.0},
                {"criteria": "freegame_strong", "scale_factor": 6.0, "win_range": (1000, 2000), "probability": 1.0},
                # 2026-09-03, same day again: raise 20-200x, and raise
                # 1000-2000x further still — bumped its own scale_factor from
                # 4.5 to 6.0 above, on top of adding these two. Measured shares
                # going in: 20-200x sat at 18.3% (almost all of that in
                # 100-200x; 20-100x itself is under 1%), while 200-999.999x
                # alone — the one range nobody had asked to touch across any of
                # today's earlier passes — was sitting on very nearly HALF the
                # mode's total weight (49.5%: 25.9% in 200-500x, 23.6% in
                # 500-1000x). Raising two different tiers without anything
                # giving way holds nothing that isn't equally the fence's own
                # RTP target, so 200-999 — the one large untouched block — is
                # where both asks draw from. 0.75 is a mild pull: "raise
                # 20-200x" was not "gut the middle."
                {"criteria": "freegame_strong", "scale_factor": 0.75, "win_range": (200, 999), "probability": 1.0},
                {"criteria": "freegame_strong", "scale_factor": 2.2, "win_range": (20, 200), "probability": 1.0},
            ]
        ).return_dict()

        self.game_config.opt_params = {
            "base": {
                "conditions": {
                    # Held at 0.0015 across every retarget. It is not a share of
                    # the return so much as a dial on how often the cap is
                    # reached, and moving the headline RTP is no reason to make
                    # the advertised max win rarer or commoner.
                    #
                    # The wincap RTP slice sets the max-win probability directly:
                    # p(maxwin) = rtp_slice / wincap. Stake requires the advertised
                    # max win to hit at 1-in-20,000,000 *or more often*, so this
                    # slice must stay above 0.001 (which lands exactly on the
                    # limit and rounds the wrong side of it).
                    "wincap": ConstructConditions(
                        rtp=0.0015, av_win=wincaps["base"], search_conditions=wincaps["base"]
                    ).return_dict(),
                    "0": ConstructConditions(rtp=0, av_win=0, search_conditions=0).return_dict(),
                    # One fence per strength group, separated by scatter count.
                    # The optimiser matches a fence by its search conditions, not
                    # by the criteria label, so three fences all searching for
                    # "has a scatter" are not mutually exclusive — the first
                    # consumes every matching book and the rest match zero, which
                    # is what the Rust optimiser refused to run. Payout ranges
                    # cannot separate them either: the groups overlap by design.
                    # Scatter count is searchable (`kind`) and already defines the
                    # tiers, so the groups are bound to it.
                    #
                    # Turf War slices. Round 5 (2026-09-06) CORRECTS course: the
                    # user's "trade odds for more feature" means more BRUISER and
                    # more BIG SCORE (both handled elsewhere - reel SW density and
                    # fullboard_frame_chance), NOT a higher free-spin trigger
                    # rate. Earlier rounds wrongly inflated the trigger rate to
                    # ~1 in 130; this puts it back on the Capo Nostra baseline
                    # (combined ~1 in 229), scaled from Capo's 0.9458 split to
                    # 0.9358 (factor 0.98941 on the non-wincap slices):
                    #   soldier (3 sc) 1 in 275   rtp 0.17940
                    #   capo    (4 sc) 1 in 1375  rtp 0.09210
                    #   don     (5 sc) 1 in 5500  rtp 0.09210
                    #   basegame       1 in 3.6   rtp 0.57070
                    # The paytable cut and the extra Bruiser/Big Score frequency
                    # do their work WITHIN the basegame slice (line wins are
                    # smaller, the mechanics carry more of it) - the split back
                    # to base is deliberate. Slices sum to exactly 0.93580.
                    "freegame_weak": ConstructConditions(
                        rtp=0.17940, hr=275, search_conditions={"symbol": "scatter", "kind": 3}
                    ).return_dict(),
                    "freegame_mid": ConstructConditions(
                        rtp=0.09210, hr=1375, search_conditions={"symbol": "scatter", "kind": 4}
                    ).return_dict(),
                    "freegame_strong": ConstructConditions(
                        rtp=0.09210, hr=5500, search_conditions={"symbol": "scatter", "kind": 5}
                    ).return_dict(),
                    "basegame": ConstructConditions(hr=3.6, rtp=0.57070).return_dict(),
                },
                "scaling": ConstructScaling(
                    [
                        {"criteria": "basegame", "scale_factor": 1.2, "win_range": (1, 2), "probability": 1.0},
                        {"criteria": "basegame", "scale_factor": 1.5, "win_range": (10, 20), "probability": 1.0},
                        # Matches buy_scaling's own freegame_strong buckets
                        # below (same reasoning is written out there in full).
                        # Entering Don by landing 5 Scatters naturally goes
                        # through the same feature as buying it, so a player
                        # who triggers it for free should see the same payout
                        # shape as one who paid for it — leaving these amplified
                        # or unmoved while the bought entries got retuned would
                        # have made "free Don" a different (and, before the tail
                        # fix, spicier) version of "bought Don", backwards from
                        # what a shared feature should look like.
                        # 0.8 -> 0.7: matches the buy-side "slightly down" nudge
                        # on 2000-5000x (2026-09-03).
                        {"criteria": "freegame_strong", "scale_factor": 0.7, "win_range": (2000, 5000), "probability": 1.0},
                        {"criteria": "freegame_strong", "scale_factor": 0.12, "win_range": (5000, 19999), "probability": 1.0},
                        {"criteria": "freegame_strong", "scale_factor": 6.0, "win_range": (1000, 2000), "probability": 1.0},
                        # Matches buy_scaling's newest pair too (same day,
                        # same reasoning): raise 20-200x and 1000-2000x,
                        # sourced from 200-999x — the one block nothing had
                        # touched yet.
                        {"criteria": "freegame_strong", "scale_factor": 0.75, "win_range": (200, 999), "probability": 1.0},
                        {"criteria": "freegame_strong", "scale_factor": 2.2, "win_range": (20, 200), "probability": 1.0},
                    ]
                ).return_dict(),
                "parameters": ConstructParameters(
                    num_show=5000,
                    num_per_fence=10000,
                    min_m2m=4,
                    max_m2m=8,
                    pmb_rtp=1.0,
                    sim_trials=5000,
                    test_spins=[50, 100, 200],
                    test_weights=[0.3, 0.4, 0.3],
                    score_type="rtp",
                ).return_dict(),
                "distribution_bias": ConstructFenceBias(
                    applied_criteria=["basegame", "freegame_weak"],
                    bias_ranges=[(2.5, 5.5), (200.0, 500.0)],
                    bias_weights=[0.7, 0.2],
                ).return_dict(),
            },
        }

        # The feature slice is whatever the mode's headline RTP is, less the
        # 0.001 the wincap fence holds. The three buy modes sit at 93.63 / 93.67
        # / 93.78, so this is read off the bet mode rather than written out flat
        # - the assert in verify_optimization_input compares these two numbers
        # and any single hard-coded figure would be wrong for two of the three.
        mode_rtps = {bm.get_name(): bm.get_rtp() for bm in game_config.bet_modes}
        for mode in ("bonus", "bonus_hits", "bonus_epic"):
            self.game_config.opt_params[mode] = {
                "conditions": {
                    "wincap": ConstructConditions(
                        rtp=0.001, av_win=wincaps[mode], search_conditions=wincaps[mode]
                    ).return_dict(),
                    {"bonus": "freegame_weak", "bonus_hits": "freegame_mid", "bonus_epic": "freegame_strong"}[mode]:
                        ConstructConditions(rtp=round(mode_rtps[mode] - 0.001, 5), hr="x").return_dict(),
                },
                "scaling": buy_scaling,
                "parameters": buy_parameters,
            }

        verify_optimization_input(self.game_config, self.game_config.opt_params)
