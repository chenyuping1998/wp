"""Deadwood Express: fourteen lines and a persistent free-spin wheel."""
import os
from src.config.config import Config
from src.config.distributions import Distribution
from src.config.betmode import BetMode

class GameConfig(Config):
    def __init__(self):
        super().__init__()
        self.game_id = "deadwood_express"
        self.provider_number = 0
        self.working_name = "Deadwood Express"
        self.wincap = 20000.0
        self.win_type = "lines"
        self.rtp = 0.963
        self.construct_paths()
        self.num_reels = 5
        self.num_rows = [4] * 5
        self.paytable = {
            (5, "W"): 200,
            (5, "H1"): 200,
            (4, "H1"): 50,
            (3, "H1"): 20,
            (5, "H2"): 100,
            (4, "H2"): 30,
            (3, "H2"): 10,
            (5, "H3"): 25,
            (4, "H3"): 10,
            (3, "H3"): 2,
            (5, "H4"): 15,
            (4, "H4"): 5,
            (3, "H4"): 1,
            (5, "H5"): 5,
            (4, "H5"): 2,
            (3, "H5"): 0.5,
            (5, "L1"): 1.0,
            (4, "L1"): 0.5,
            (3, "L1"): 0.2,
            (5, "L2"): 1.0,
            (4, "L2"): 0.5,
            (3, "L2"): 0.2,
            (5, "L3"): 1.0,
            (4, "L3"): 0.5,
            (3, "L3"): 0.2,
            (5, "L4"): 1.0,
            (4, "L4"): 0.5,
            (3, "L4"): 0.2,
        }

        # ------------------------------------------------------------------
        # 14 paylines over a 4-row grid (row index 0 == top)
        # ------------------------------------------------------------------
        self.paylines = {
            1: [0, 0, 0, 0, 0],
            2: [1, 1, 1, 1, 1],
            3: [2, 2, 2, 2, 2],
            4: [3, 3, 3, 3, 3],
            5: [0, 1, 2, 1, 0],
            6: [1, 2, 3, 2, 1],
            7: [3, 2, 1, 2, 3],
            8: [2, 1, 0, 1, 2],
            9: [0, 1, 1, 1, 0],
            10: [1, 2, 2, 2, 1],
            11: [2, 1, 1, 1, 2],
            12: [3, 2, 2, 2, 3],
            13: [0, 1, 0, 1, 0],
            14: [3, 2, 3, 2, 3],
        }


        self.include_padding = True
        self.special_symbols = {"wild": ["W"], "scatter": ["S"]}
        self.freespin_triggers = {self.basegame_type: {3:10,4:10,5:10}, self.freegame_type: {2:2,3:4,4:6,5:8}}
        self.anticipation_triggers = {self.basegame_type:2, self.freegame_type:1}
        self.bonus_tiers = {3:"midnight_passage",4:"phantom_express",5:"phantom_express"}
        self.wheel_weights = {
            "midnight_passage": dict(zip([2,4,6,8,10,12,16,20,30,40,50,60,80,100,150,200],
                                        [1200,650,360,220,150,100,65,45,25,16,10,7,4,3,2,1])),
            "phantom_express": {v:max(1,int(1500/((v/10)**2.7))) for v in range(10,201,10)},
        }
        self.feature_rules = {
            "initialSpins": self.freespin_triggers[self.basegame_type][3],
            "triggerScatters": {"midnight_passage": 3, "phantom_express": 4},
            "retriggerAwards": self.freespin_triggers[self.freegame_type],
            "maxMultiplier": max(self.wheel_weights["midnight_passage"]),
            "premiumStep": 5,
            "wheelValues": {tier:list(weights) for tier,weights in self.wheel_weights.items()},
        }
        self.reels = {n:self.read_reels_csv(os.path.join(self.reels_path,n+".csv")) for n in ("BR0","BR1","FR0","WCAP")}
        self.padding_reels = {self.basegame_type:self.reels["BR0"], self.freegame_type:self.reels["FR0"]}
        self.bet_modes = [
            BetMode(name="base",cost=1.0,rtp=self.rtp,max_win=self.wincap,
                    auto_close_disabled=False,is_feature=True,is_buybonus=False,distributions=[
                        self.distribution("wincap",.001,{4:1,5:1},cap=True),
                        self.distribution("freegame_weak",.06,{3:1}),
                        self.distribution("freegame_mid",.03,{4:1}),
                        self.distribution("freegame_strong",.01,{5:1}),
                        self.distribution("0",.4,win=0),
                        self.distribution("basegame",.499)]),
            self.buy_mode("bonus",100,3), self.buy_mode("bonus_hits",250,4)]

    def distribution(self, criteria, quota, scatters=None, cap=False, win=None):
        conditions = {
            "reel_weights": {self.basegame_type:{"BR1" if scatters else "BR0":1},
                             self.freegame_type:{"WCAP" if cap else "FR0":1}},
            "force_wincap":cap, "force_freegame":bool(scatters)}
        if scatters:
            conditions["scatter_triggers"] = scatters
        return Distribution(criteria=criteria,quota=quota,win_criteria=self.wincap if cap else win,conditions=conditions)

    def buy_mode(self,name,cost,scatters):
        return BetMode(name=name,cost=float(cost),rtp=self.rtp,max_win=self.wincap,
                       auto_close_disabled=False,is_feature=False,is_buybonus=True,distributions=[
                           self.distribution("wincap",.001,{scatters:1},cap=True),
                           self.distribution("freegame_weak" if scatters==3 else "freegame_mid",.999,{scatters:1})])
