import {stateUrlDerived} from 'state-shared';
const TEXTS={
 clusterTitle:['CONNECTED CLUSTERS','相鄰中獎'],
 cluster:['Match 5+ symbols connected up, down, left or right. Diagonals do not connect. Winners clear and new symbols tumble in.','同圖案上下左右連接 5 個以上中獎，斜角不算。收走中獎群組後掉落補位，再次判獎。'],
 boxesTitle:['MYSTERY BOXES','神秘紙箱'],
 boxes:['Before each evaluation all boxes open into the same regular symbol. Rings and boxes do not form paying clusters.','每次判獎前，全盤紙箱一起開成同一種一般圖案。家族戒指和紙箱不計入一般中獎群組。'],
 territoryTitle:['TERRITORY & STAMPS','地盤與老大印章'],
 territory:['A cleared cell is marked. Every later clear doubles its multiplier, up to ×128. Cells reset each base round and persist throughout free spins. Stamp wilds substitute for adjacent regular symbols. A cluster adds all cell values of ×2 or more and its stamp values; if none apply its multiplier is ×1. Award uses the previous cell values, before upgrades. Used stamps clear with winners.','收走的格子留下記號，之後每次再收走倍數翻倍，最高 ×128。主遊戲每轉歸零，免費遊戲整場保留。印章百搭可代替相鄰一般圖案。群組中的 ×2 以上地盤倍數與印章倍數相加；都沒有則 ×1。先按舊倍數付分，再升級格子。用過的印章跟著群組收走。'],
 freeTitle:['FREE SPINS','免費遊戲'],
 free:['3 / 4 / 5+ rings award 10 / 12 / 15 free spins. During free spins, 3+ rings add 5 spins. Boxes open into stamp wilds. Standard stamps: ×2, ×3, ×5, ×10, ×25; super stamps: ×5, ×10, ×25, ×50. Cap rounds can include ×100 stamps.','3／4／5 個以上家族戒指觸發 10／12／15 轉；免費遊戲中 3 個以上再加 5 轉。紙箱開成老大印章百搭。一般印章 ×2、×3、×5、×10、×25；超級印章 ×5、×10、×25、×50；觸頂局可出現 ×100。'],
 buyTitle:['FEATURE ENTRY','功能入場'],
 bonus:['10 free spins with standard stamps.','10 轉免費遊戲，使用一般印章。'],
 super:['10 free spins; all 49 cells start marked, and stamps start at ×5.','10 轉免費遊戲，49 格開場全部有記號，印章至少 ×5。'],
 max:['Maximum round result: 10,000×. RTP: 96.00% in every mode.','每局最高 10,000 倍，所有模式 RTP 均為 96.00%。'],
 controls:['Spin or Space starts a round; Stop speeds up arrival. − / + changes the amount one step. Auto plays the selected number of rounds. Turbo cycles through two speeds. Menu opens rules, table, audio and settings.','Spin 或空白鍵開始一轉；Stop 加快落定。−／＋每按一次調整一級。Auto 依選定次數連續遊戲。Turbo 切換兩段速度。選單可開啟玩法、賠率表、音效與設定。'],
} as const;
export const purrfiaText=(key:keyof typeof TEXTS)=>TEXTS[key][stateUrlDerived.lang()==='zh'?1:0];
