"""Optimization targets for Moooo.

Three modes, three targets, all inside Stake's 0.5% spread rule:

    base    94.50%
    bonus   94.83%    Free Spins buy,       100x
    super   94.89%    Super Free Spins buy, 250x

The base-mode split:

    wincap            0.0015
    freegame          0.2000   Free Spins,       1 in 474
    freegame_super    0.0800   Super Free Spins, 1 in 2965
    basegame          0.6635   hit rate 3.6
                      ------
                      0.9450

The two feature slices are not free parameters. A buy has to return its own
mode's RTP on its own cost, so

    bonus   0.9483 x 100 =  94.83x average
    super   0.9489 x 250 = 237.23x average

and the base game must pay the SAME feature for the same money, or entering it
on scatters and buying it are two different games wearing one name. Entry rate
therefore follows from the slice:

    freegame        0.2000 /  94.83 = 1 in 474
    freegame_super  0.0800 / 237.23 = 1 in 2965

Change a buy price or a mode's RTP and the matching hit rate here moves with it.
That equality between a buy's average win and a base-mode fence's `av_win` is
written down in exactly two files - this one and game_config.py - so it is worth
saying out loud: they are the same number.
"""

from optimization_program.optimization_config import (
    ConstructScaling,
    ConstructParameters,
    ConstructConditions,
    ConstructFenceBias,
    verify_optimization_input,
)


class OptimizationSetup:
    """Optimization parameters for every Moooo bet mode."""

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

        # Super is meant to be the STEADIER buy, not simply the bigger one -
        # that is the design idea taken from the reference's own menu, where the
        # expensive entry is labelled lower volatility than the cheap one. So
        # the scaling pulls Free Spins toward its tail and pulls Super toward
        # its middle, which is what a raised floor should do to the spread.
        buy_scaling = ConstructScaling(
            [
                {"criteria": "freegame", "scale_factor": 1.2, "win_range": (500, 2000), "probability": 1.0},
                {"criteria": "freegame_super", "scale_factor": 1.3, "win_range": (100, 400), "probability": 1.0},
                {"criteria": "freegame_super", "scale_factor": 0.8, "win_range": (2000, 5000), "probability": 1.0},
            ]
        ).return_dict()

        self.game_config.opt_params = {
            "base": {
                "conditions": {
                    # The wincap RTP slice sets the max-win probability
                    # directly: p(maxwin) = rtp_slice / wincap. Stake requires
                    # the advertised max win to hit at 1-in-20,000,000 or more
                    # often, so this slice must stay above 0.0005 at a 10000x
                    # cap. Held at 0.0015 (1 in 6.7M) with margin, and NOT
                    # rescaled when the headline RTP moves - how often the cap
                    # is reached is a separate decision from what the game pays.
                    "wincap": ConstructConditions(
                        rtp=0.0015, av_win=wincaps["base"], search_conditions=wincaps["base"]
                    ).return_dict(),
                    "0": ConstructConditions(rtp=0, av_win=0, search_conditions=0).return_dict(),
                    # One fence per entry, separated by scatter count. The
                    # optimiser matches a fence by its search conditions, not by
                    # the criteria label, so two fences both searching for "has
                    # a scatter" would not be mutually exclusive - the first
                    # would consume every matching book and the second would
                    # match zero, which the Rust optimiser refuses to run.
                    # Payout range cannot separate them either: Free Spins and
                    # Super Free Spins overlap by design, since the meter moves
                    # the floor and not the ceiling. Scatter count is searchable
                    # (`kind`) and already IS the distinction.
                    "freegame": ConstructConditions(
                        rtp=0.20, hr=474, search_conditions={"symbol": "scatter", "kind": 3}
                    ).return_dict(),
                    "freegame_super": ConstructConditions(
                        rtp=0.08, hr=2965, search_conditions={"symbol": "scatter", "kind": 4}
                    ).return_dict(),
                    "basegame": ConstructConditions(hr=3.6, rtp=0.6635).return_dict(),
                },
                "scaling": ConstructScaling(
                    [
                        {"criteria": "basegame", "scale_factor": 1.2, "win_range": (1, 2), "probability": 1.0},
                        {"criteria": "basegame", "scale_factor": 1.5, "win_range": (10, 20), "probability": 1.0},
                        {"criteria": "freegame_super", "scale_factor": 0.8, "win_range": (2000, 5000), "probability": 1.0},
                        {"criteria": "freegame_super", "scale_factor": 1.2, "win_range": (5000, 9000), "probability": 1.0},
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
                    applied_criteria=["basegame", "freegame"],
                    bias_ranges=[(2.5, 5.5), (200.0, 500.0)],
                    bias_weights=[0.7, 0.2],
                ).return_dict(),
            },
        }

        # Each buy's slices sum to that buy's own RTP, not to a shared figure.
        for mode, group in (("bonus", "freegame"), ("super", "freegame_super")):
            target = game_config.mode_rtp[mode]
            self.game_config.opt_params[mode] = {
                "conditions": {
                    "wincap": ConstructConditions(
                        rtp=0.001, av_win=wincaps[mode], search_conditions=wincaps[mode]
                    ).return_dict(),
                    group: ConstructConditions(rtp=round(target - 0.001, 6), hr="x").return_dict(),
                },
                "scaling": buy_scaling,
                "parameters": buy_parameters,
            }

        verify_optimization_input(self.game_config, self.game_config.opt_params)
