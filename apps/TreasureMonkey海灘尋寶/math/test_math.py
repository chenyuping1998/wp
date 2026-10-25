import copy
import random
import unittest
from unittest.mock import patch
from game_config import GameConfig
from gamestate import GameState,evaluate,expand
from verify_books import verify_round,oracle
from game_optimization import integer_weights
from src.calculations.lines import Lines
from src.calculations.symbol import Symbol,SymbolDefinition

class TreasureMathTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.config=GameConfig();cls.game=GameState(cls.config)

    def test_sdk_line_equivalence_without_frames(self):
        rng=random.Random(81)
        names=['W','H1','H2','H3','H4','H5','L1','L2','L3','L4','S']
        defs={name:SymbolDefinition(name,self.config,None) for name in names}
        for _ in range(1500):
            board=[[rng.choice(names) for _ in range(4)] for _ in range(5)]
            source=[[Symbol(defs[s]) for s in col] for col in board]
            expected=Lines.get_lines(source,self.config)['wins']
            actual,_=evaluate(board,[])
            self.assertEqual(sum(w['win'] for w in actual),round(sum(w['win'] for w in expected)*100))
            self.assertEqual([(w['symbol'],w['kind']) for w in actual],[(w['symbol'],w['kind']) for w in expected])

    def test_no_imaginary_premium_from_wild_prefix(self):
        board=[['W']*4,['W']*4,['W']*4,['L1']*4,['L2']*4]
        wins,_=evaluate(board,[])
        self.assertTrue(all(w['symbol']=='L1' and w['kind']==4 and w['win']==100 for w in wins))

    def test_big_frame_counts_each_crossed_winning_cell(self):
        board=[['H1']*4 for _ in range(5)]
        frames=[{'reel':1,'row':0,'size':3,'mult':3}]
        wins,touched=evaluate(board,frames)
        top=next(w for w in wins if w['meta']['lineIndex']==1)
        self.assertEqual(top['meta']['multiplier'],9)
        self.assertEqual(top['win'],400*100*9)
        self.assertEqual(touched,{0})

    def test_frames_add_instead_of_multiplying(self):
        board=[['L1']*4 for _ in range(5)]
        frames=[{'reel':0,'row':0,'size':1,'mult':3},{'reel':1,'row':0,'size':1,'mult':5}]
        wins,_=evaluate(board,frames)
        self.assertEqual(wins[0]['meta']['multiplier'],8)

    def test_sweep_preserves_scatter(self):
        raw=[['L1']*4 for _ in range(5)];raw[2]=['S','SW','L2','H1']
        board,wilds,reels=expand(raw)
        self.assertEqual(board[2],['S','W','W','W'])
        self.assertEqual(wilds,[{'reel':2,'row':2}]);self.assertEqual(reels,[2])
        self.assertEqual(raw[2][1],'SW')

    def test_every_retrigger_including_don_five_scatter_is_reachable(self):
        for count,extra in [(2,2),(3,4),(4,6),(5,8)]:
            original=self.game.draw;first=[True]
            def special(rng,game_type,*args,**kwargs):
                if game_type=='freegame' and first[0]:
                    first[0]=False
                    return original(rng,game_type,scatter_count=count,guaranteed=True)
                return original(rng,game_type,*args,**kwargs)
            with patch.object(self.game,'draw',side_effect=special):
                book=self.game.run('bonus_epic',940+count)
            retrigger=next(e for e in book['events'] if e['type']=='freeSpinRetrigger')
            self.assertEqual(retrigger['totalFs'],10+extra)
            self.assertEqual(len(retrigger['positions']),count)
            verify_round(book,self.config)

    def test_all_modes_replay_and_reachable_cap(self):
        for mode in ('base','bonus','bonus_hits','bonus_epic'):
            for seed in range(150):
                book=self.game.run(mode,seed)
                verify_round(book,self.config)
            book=self.game.run(mode,7,force='cap')
            self.assertEqual(book['payoutMultiplier'],2000000)
            verify_round(book,self.config)

    def test_natural_and_bought_share_feature_path(self):
        for mode in ('bonus','bonus_hits','bonus_epic'):
            for seed in range(30):
                bought=self.game.run(mode,seed,force='cap' if seed==0 else None)
                natural=self.game.natural_from_buy(bought,seed+10000)
                verify_round(natural,self.config)
                self.assertEqual(natural['payoutMultiplier'],min(2000000,natural['basePayout']+bought['featurePayout']))
                if natural['payoutMultiplier']<2000000:
                    a=[e['board'] for e in bought['events'] if e['type']=='reveal' and e['gameType']=='freegame']
                    b=[e['board'] for e in natural['events'] if e['type']=='reveal' and e['gameType']=='freegame']
                    self.assertEqual(a,b)

    def test_oracle_rejects_wrong_award_and_sweep(self):
        good=self.game.run('bonus_epic',19)
        bad=copy.deepcopy(good)
        info=next(e for e in bad['events'] if e['type']=='winInfo')
        info['wins'][0]['win']+=10
        with self.assertRaises(AssertionError):verify_round(bad,self.config)
        bad=copy.deepcopy(good)
        next(e for e in bad['events'] if e['type']=='wildExpand')['reels']=[]
        with self.assertRaises(AssertionError):verify_round(bad,self.config)

    def test_integer_rtp_is_exact_and_keeps_every_book(self):
        p=[0,40,100,500,2000000]
        w=integer_weights(p,[.1,.1,.1,.6999999,.0000001],96)
        self.assertTrue(all(x>0 for x in w));self.assertEqual(sum(w),10**15)
        self.assertEqual(sum(a*b for a,b in zip(p,w)),96*10**15)

if __name__=='__main__':unittest.main()
