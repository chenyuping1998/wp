"""Set conditions/parameters for optimization program program"""

from optimization_program.optimization_config import (
    ConstructScaling,
    ConstructParameters,
    ConstructConditions,
    ConstructFenceBias,
    verify_optimization_input,
)


class OptimizationSetup:
    """Game specific optimization setup.
    Amends game_config.opt_params, which is required to setup maths configuration file.
    """

    def __init__(self, game_config):
        self.game_config = game_config
        wincaps = {}
        for bm in game_config.bet_modes:
            wincaps[bm.get_name()] = bm.get_wincap()
        params = lambda test_spins, test_weights: ConstructParameters(
            num_show=5000,
            num_per_fence=10000,
            min_m2m=4,
            max_m2m=8,
            pmb_rtp=1.0,
            sim_trials=5000,
            test_spins=test_spins,
            test_weights=test_weights,
            score_type="rtp",
        ).return_dict()

        def buy_mode(name):
            return {
                "conditions": {
                    # 0.005 -> max win about 1 in 20,000 buys (first run: 1 in 10,000)
                    "wincap": ConstructConditions(
                        rtp=0.005, av_win=wincaps[name], search_conditions=wincaps[name]
                    ).return_dict(),
                    "freegame": ConstructConditions(rtp=0.94, hr="x").return_dict(),
                },
                "scaling": ConstructScaling(
                    [
                        {"criteria": "freegame", "scale_factor": 1.3, "win_range": (3000, 9999), "probability": 1.0},
                    ]
                ).return_dict(),
                "parameters": params([10, 20, 50], [0.6, 0.2, 0.2]),
            }

        # RTP 0.945 (2026-10-03): base 0.01 + 0.355 + 0.58, buys 0.005 + 0.94
        self.game_config.opt_params = {
            "base": {
                "conditions": {
                    "wincap": ConstructConditions(
                        rtp=0.01, av_win=wincaps["base"], search_conditions=wincaps["base"]
                    ).return_dict(),
                    "0": ConstructConditions(rtp=0, av_win=0, search_conditions=0).return_dict(),
                    "freegame": ConstructConditions(
                        rtp=0.355, hr=276, search_conditions={"symbol": "scatter"}
                    ).return_dict(),
                    "basegame": ConstructConditions(hr=3.5, rtp=0.58).return_dict(),
                },
                # first run: only 3.8% of base spins returned >= the bet; lift 1x-5x
                "scaling": ConstructScaling(
                    [
                        {"criteria": "basegame", "scale_factor": 1.6, "win_range": (1, 5), "probability": 1.0},
                        {"criteria": "basegame", "scale_factor": 0.8, "win_range": (0.1, 0.9), "probability": 1.0},
                    ]
                ).return_dict(),
                "parameters": params([50, 100, 200], [0.3, 0.4, 0.3]),
                "distribution_bias": ConstructFenceBias(
                    applied_criteria=["basegame"],
                    bias_ranges=[(1.5, 3.5)],
                    bias_weights=[0.4],
                ).return_dict(),
            },
            "bonus": buy_mode("bonus"),
            "superbonus": buy_mode("superbonus"),
        }

        verify_optimization_input(self.game_config, self.game_config.opt_params)
