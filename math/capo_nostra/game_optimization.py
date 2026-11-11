"""Optimization targets for Capo Nostra.

Modes are tuned to 94.58 / 94.63 / 94.67 / 94.78, a 0.20% spread, so the Stake
requirement "all modes must have an RTP within 0.5% of each other" holds while
the price ladder still improves as it climbs. (Retargeted down 0.5 points from
the original 95.08/95.13/95.17/95.28 ladder on 2026-09-03 — every mode moved by
the same amount, so the spread is untouched.)

bonus_epic's tail (2026-09-03, same day): Stake's own volatility dashboard
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
    """Optimization parameters for every Capo Nostra bet mode."""

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
                # 2026-09-13 — 高均率 (share of weight paying above the mode's
                # OWN mean) to 28%, with more weight in the very low multiples.
                #
                # bonus_hits measured 32.50% above its 473.35x mean. Its only
                # lever was the 2000-5000 suppressor, which sits four times the
                # mean and so barely touches that figure — 2000-5000 is just
                # 2.5% of the mode's weight. These act where the mean actually
                # is: pull the band immediately above it, push what is freed
                # into 20-200x (already 39% of weight but only 9% of RTP, so it
                # absorbs weight cheaply).
                #
                # prob_less_bet rises with this BY CONSTRUCTION — the mean sits
                # just under the cost, so the two are near-complements and 28%
                # above-mean forces roughly 72%. The <70% ceiling that shaped
                # the 2026-09-03 pass was a stated preference, and has been
                # explicitly relaxed for this change.
                {"criteria": "freegame_mid", "scale_factor": 1.0, "win_range": (2000, 5000), "probability": 1.0},
                {"criteria": "freegame_mid", "scale_factor": 0.76, "win_range": (500, 1000), "probability": 1.0},
                {"criteria": "freegame_mid", "scale_factor": 1.32, "win_range": (20, 200), "probability": 1.0},
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
                # 0.7 -> 0.9: partially released so the RTP freed by the cut
                # above has somewhere to land that is still above the mean.
                # 5000-19999 stays at 0.12 — that suppressor is what passes
                # Stake's tail checks and must not be loosened to make this
                # target easier.
                {"criteria": "freegame_strong", "scale_factor": 0.9, "win_range": (2000, 5000), "probability": 1.0},
                # 2026-09-13: 6.0 -> 2.2. This amplifier existed ONLY to hold
                # prob_less_bet under 70% (see the 2026-09-03 note above). With
                # that ceiling lifted it is the single largest block of
                # above-mean weight — 26.8% of the mode sitting in 1000-2000x,
                # carrying 48.3% of its RTP — so it is where the 39.74% -> 28%
                # cut has to come from.
                {"criteria": "freegame_strong", "scale_factor": 2.1, "win_range": (1000, 2000), "probability": 1.0},
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
                # 2.2 -> 3.2: 超低倍的多一點, and the cheapest place to park
                # weight (51.6% of the mode already, only 6.4% of its RTP).
                {"criteria": "freegame_strong", "scale_factor": 3.2, "win_range": (20, 200), "probability": 1.0},
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
                    # Retargeted 0.9508 -> 0.9458 (2026-09-03, all modes down 0.5
                    # points). The wincap slice is held at 0.0015 as always, and
                    # the remaining 0.9493 was scaled by 0.994733 to reach 0.9443
                    # - so every slice keeps the same SHARE of the return it had,
                    # and the split between base game and feature is unchanged.
                    # (basegame is 0.57675 rather than the scaled 0.57676 so the
                    # four slices sum to exactly the target instead of one cent
                    # over — verify_optimization_input asserts the sum.)
                    # Entry rates are untouched: they combine to 1 in 220.
                    #   soldier (3 sc) 1 in 275   rtp 0.18131
                    #   capo    (4 sc) 1 in 1375  rtp 0.09312
                    #   don     (5 sc) 1 in 5500  rtp 0.09312
                    # Slices sum to exactly 0.94580.
                    "freegame_weak": ConstructConditions(
                        rtp=0.18131, hr=275, search_conditions={"symbol": "scatter", "kind": 3}
                    ).return_dict(),
                    "freegame_mid": ConstructConditions(
                        rtp=0.09312, hr=1375, search_conditions={"symbol": "scatter", "kind": 4}
                    ).return_dict(),
                    "freegame_strong": ConstructConditions(
                        rtp=0.09312, hr=5500, search_conditions={"symbol": "scatter", "kind": 5}
                    ).return_dict(),
                    "basegame": ConstructConditions(hr=3.6, rtp=0.57675).return_dict(),
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
                        # 0.7 -> 0.9: partially released so the RTP freed by the cut
                        # above has somewhere to land that is still above the mean.
                        # 5000-19999 stays at 0.12 — that suppressor is what passes
                        # Stake's tail checks and must not be loosened to make this
                        # target easier.
                        {"criteria": "freegame_strong", "scale_factor": 0.9, "win_range": (2000, 5000), "probability": 1.0},
                        # Mirrored from buy_scaling (2026-09-13), same rule the
                        # freegame_strong entries already follow: a player who triggers
                        # Capo with 4 Scatters should see the same payout shape as one
                        # who bought it. base had NO freegame_mid scaling before this,
                        # so free-triggered Capo and bought Capo were already diverging.
                        {"criteria": "freegame_mid", "scale_factor": 1.0, "win_range": (2000, 5000), "probability": 1.0},
                        {"criteria": "freegame_mid", "scale_factor": 0.76, "win_range": (500, 1000), "probability": 1.0},
                        {"criteria": "freegame_mid", "scale_factor": 1.32, "win_range": (20, 200), "probability": 1.0},
                        {"criteria": "freegame_strong", "scale_factor": 0.12, "win_range": (5000, 19999), "probability": 1.0},
                        # 2026-09-13: 6.0 -> 2.2. This amplifier existed ONLY to hold
                        # prob_less_bet under 70% (see the 2026-09-03 note above). With
                        # that ceiling lifted it is the single largest block of
                        # above-mean weight — 26.8% of the mode sitting in 1000-2000x,
                        # carrying 48.3% of its RTP — so it is where the 39.74% -> 28%
                        # cut has to come from.
                        {"criteria": "freegame_strong", "scale_factor": 2.1, "win_range": (1000, 2000), "probability": 1.0},
                        # Matches buy_scaling's newest pair too (same day,
                        # same reasoning): raise 20-200x and 1000-2000x,
                        # sourced from 200-999x — the one block nothing had
                        # touched yet.
                        {"criteria": "freegame_strong", "scale_factor": 0.75, "win_range": (200, 999), "probability": 1.0},
                        # 2.2 -> 3.2: 超低倍的多一點, and the cheapest place to park
                        # weight (51.6% of the mode already, only 6.4% of its RTP).
                        {"criteria": "freegame_strong", "scale_factor": 3.2, "win_range": (20, 200), "probability": 1.0},
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
        # 0.001 the wincap fence holds. The three buy modes sit at 95.13 / 95.17
        # / 95.28, so this is read off the bet mode rather than written out flat
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
