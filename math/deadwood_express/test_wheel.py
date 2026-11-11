"""Run with PYTHONPATH=.:games/deadwood_express python -m unittest discover -s games/deadwood_express -p 'test_*.py'."""
import unittest
from unittest.mock import patch
from game_config import GameConfig
from game_optimization import OptimizationSetup
from gamestate import GameState


def assert_book(events):
    held, tier, spin, wheel = 1, None, None, None
    cap = 200
    count = 0
    for index, event in enumerate(events):
        assert event["index"] == index
        kind = event["type"]
        assert kind not in {"newFrames","updateFrames","frameDoubling","collectorWin"}
        if kind == "bonusTier":
            held, tier = 1, event["tier"]
            assert tier in {"midnight_passage","phantom_express"}
        elif kind == "reveal":
            assert wheel is None, "wheel without paying lines"
            spin, wheel = event["gameType"], None
            assert all(s["name"] != "C" for reel in event["board"] for s in reel)
        elif kind == "multiplierWheel":
            assert spin == "freegame" and wheel is None
            assert event["previous"] == held
            assert held <= event["value"] <= cap
            assert all(held <= v <= cap for v in event["eligibleValues"])
            assert event["value"] in event["eligibleValues"]
            if tier == "phantom_express":
                assert all(v % 5 == 0 for v in event["eligibleValues"])
            held, wheel = event["value"], event
            count += 1
        elif kind == "winInfo":
            expected = held if spin == "freegame" else 1
            if spin == "freegame":
                assert wheel is not None, "paying FG spin without wheel"
            for win in event["wins"]:
                assert win["meta"]["globalMult"] == expected
                assert win["meta"]["multiplier"] == expected
                assert win["win"] == min(2000000, win["meta"]["winWithoutMult"] * expected)
            wheel = None
    assert wheel is None
    return count


class WheelTests(unittest.TestCase):
    def setUp(self):
        self.config = GameConfig()
        self.state = GameState(self.config)
        self.state.betmode = "bonus"
        self.state.criteria = "freegame_weak"

    def test_optimizer_contract(self):
        OptimizationSetup(self.config)
        self.assertEqual([(m.get_name(),m.get_cost()) for m in self.config.bet_modes],
                         [("base",1.0),("bonus",100.0),("bonus_hits",250.0)])

    def test_all_retrigger_counts_physically_reachable(self):
        self.assertTrue(all("S" in reel for reel in self.config.reels["FR0"]))

    def test_seed_replays_identically(self):
        self.state.run_spin(1234)
        events = list(self.state.book.events)
        self.state.run_spin(1234)
        self.assertEqual(events,self.state.book.events)

    def test_round_streams(self):
        count = 0
        for mode, criteria in [("base","basegame"),("base","0"),("base","freegame_weak"),
                               ("base","freegame_mid"),("base","freegame_strong"),
                               ("bonus","freegame_weak"),("bonus_hits","freegame_mid"),
                               ("bonus","wincap"),("bonus_hits","wincap")]:
            self.state.betmode, self.state.criteria = mode, criteria
            for seed in range(30):
                self.state.run_spin(seed)
                count += assert_book(self.state.book.events)
                self.assertEqual(self.state.held_multiplier,1)
        self.assertGreater(count,100)

    def test_all_wild_same_spin_and_saturation(self):
        s = self.state
        s.gametype = self.config.freegame_type
        s.bonus_tier = "phantom_express"
        s.held_multiplier = 190
        s.board = [[s.create_symbol("W") for _ in range(4)] for _ in range(5)]
        with patch("game_executables.get_random_outcome", return_value=200):
            s.resolve_spin()
        self.assertEqual(s.book.events[0]["type"],"multiplierWheel")
        self.assertEqual(len(s.win_data["wins"]),14)
        self.assertTrue(all(w["meta"]["globalMult"] == 200 for w in s.win_data["wins"]))
        s.draw_wheel()
        self.assertEqual(s.book.events[-1]["eligibleValues"],[200])

    def test_losing_spin_preserves_multiplier(self):
        s = self.state
        s.gametype = self.config.freegame_type
        s.bonus_tier = "midnight_passage"
        s.held_multiplier = 40
        s.board = [[s.create_symbol(name) for _ in range(4)] for name in ["H1","H2","H3","H4","H5"]]
        s.resolve_spin()
        self.assertEqual(s.held_multiplier,40)
        self.assertNotIn("multiplierWheel",[e["type"] for e in s.book.events])

if __name__ == "__main__":
    unittest.main()
