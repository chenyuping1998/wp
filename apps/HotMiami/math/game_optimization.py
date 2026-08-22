"""Optimization targets for Hot Miami.

Each mode is tuned to the same 96.5% RTP so that the Stake requirement
"all modes must have an RTP within 0.5% of each other" holds.
"""

from optimization_program.optimization_config import (
    ConstructScaling,
    ConstructParameters,
    ConstructConditions,
    ConstructFenceBias,
    verify_optimization_input,
)


class OptimizationSetup:
    """Optimization parameters for every Hot Miami bet mode."""

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
                {"criteria": "freegame_strong", "scale_factor": 1.2, "win_range": (10000, 15000), "probability": 1.0},
            ]
        ).return_dict()

        self.game_config.opt_params = {
            "base": {
                "conditions": {
                    # Rescaled for the 0.94 target: every slice below shrank by
                    # 0.974053 EXCEPT this one, which is deliberately held at
                    # 0.0015. It is not a share of the return so much as a dial on
                    # how often the cap is reached, and moving the headline RTP is
                    # no reason to make the advertised max win rarer.
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
                    # Entry rates still combine to 1 in 220 and the RTP still sums
                    # to 0.375, so the brief "do not move the line rate" holds.
                    # What changes is the ladder underneath:
                    #   weak   (3 sc) 1 in 275   rtp 0.185  ->  ~51x average
                    #   mid    (4 sc) 1 in 1375  rtp 0.095  -> ~131x
                    #   strong (5 sc) 1 in 5500  rtp 0.095  -> ~522x
                    "freegame_weak": ConstructConditions(
                        rtp=0.18020, hr=275, search_conditions={"symbol": "scatter", "kind": 3}
                    ).return_dict(),
                    "freegame_mid": ConstructConditions(
                        rtp=0.09254, hr=1375, search_conditions={"symbol": "scatter", "kind": 4}
                    ).return_dict(),
                    "freegame_strong": ConstructConditions(
                        rtp=0.09254, hr=5500, search_conditions={"symbol": "scatter", "kind": 5}
                    ).return_dict(),
                    "basegame": ConstructConditions(hr=3.6, rtp=0.57322).return_dict(),
                },
                "scaling": ConstructScaling(
                    [
                        {"criteria": "basegame", "scale_factor": 1.2, "win_range": (1, 2), "probability": 1.0},
                        {"criteria": "basegame", "scale_factor": 1.5, "win_range": (10, 20), "probability": 1.0},
                        {"criteria": "freegame_strong", "scale_factor": 0.8, "win_range": (2000, 5000), "probability": 1.0},
                        {"criteria": "freegame_strong", "scale_factor": 1.2, "win_range": (10000, 15000), "probability": 1.0},
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
        # 0.001 the wincap fence holds. bonus_epic sits at 94.17% rather than
        # 94.00% (game_config.py: the Ocean Drive strips no longer carry the
        # Scatter or the Collector), so it is read off the bet mode rather than
        # written out flat - the assert in verify_optimization_input compares
        # these two numbers and a hard-coded 0.939 would be wrong for that mode.
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
