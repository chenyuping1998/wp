"""Optimizer fences for Jaguar Sun; achieved rates must be measured."""
from optimization_program.optimization_config import (
    ConstructScaling, ConstructParameters, ConstructConditions, ConstructFenceBias,
    verify_optimization_input,
)

class OptimizationSetup:
    def __init__(self, game_config):
        self.game_config = game_config
        def condition(**kwargs):
            return ConstructConditions(**kwargs).return_dict()
        def parameters(buy=False):
            return ConstructParameters(
                num_show=5000,num_per_fence=10000,min_m2m=4,max_m2m=8,pmb_rtp=1.0,
                sim_trials=5000,test_spins=[10,20,50] if buy else [50,100,200],
                test_weights=[.6,.2,.2] if buy else [.3,.4,.3],score_type="rtp").return_dict()
        def scaling(rows):
            return ConstructScaling([dict(criteria=c,scale_factor=s,win_range=r,probability=1.0)
                                     for c,s,r in rows]).return_dict()
        game_config.opt_params = {
            "base": {
                "conditions": {
                    # 0.0015 / 20000 gives 1 in 13.33 million, above the max-win gate.
                    "wincap":condition(rtp=.0015,av_win=20000,search_conditions=20000),
                    "0":condition(rtp=0,av_win=0,search_conditions=0),
                    "freegame_weak":condition(rtp=.18020,hr=275,search_conditions={"symbol":"scatter","kind":3}),
                    "freegame_mid":condition(rtp=.09254,hr=1375,search_conditions={"symbol":"scatter","kind":4}),
                    "freegame_strong":condition(rtp=.09254,hr=5500,search_conditions={"symbol":"scatter","kind":5}),
                    "basegame":condition(hr=3.6,rtp=.57322),
                },
                "scaling":scaling([("basegame",1.2,(1,2)),("basegame",1.5,(10,20)),
                                   ("freegame_strong",.8,(2000,5000)),("freegame_strong",1.2,(10000,15000))]),
                "parameters":parameters(),
                "distribution_bias":ConstructFenceBias(applied_criteria=["basegame","freegame_weak"],
                    bias_ranges=[(2.5,5.5),(200.,500.)],bias_weights=[.7,.2]).return_dict(),
            }
        }
        buy_scaling = scaling([("freegame_weak",.9,(20,50)),("freegame_mid",.8,(2000,5000)),
                               ("freegame_strong",1.2,(10000,15000))])
        for mode,group in [("bonus","freegame_weak"),("bonus_hits","freegame_mid")]:
            game_config.opt_params[mode] = {
                "conditions":{"wincap":condition(rtp=.001,av_win=20000,search_conditions=20000),
                              group:condition(rtp=round(game_config.rtp-.001,5),hr="x")},
                "scaling":buy_scaling,"parameters":parameters(True),
            }
        verify_optimization_input(game_config,game_config.opt_params)
