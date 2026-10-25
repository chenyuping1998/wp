"""Render a reviewable report only from completed generation and verification."""
import json
from pathlib import Path
from game_config import GameConfig,RULES

def main():
    c=GameConfig();root=Path(c.library_path);reports=root/'reports'
    metrics=json.loads((reports/'metrics.json').read_text(encoding='utf-8'))
    verified=json.loads((reports/'verification.json').read_text(encoding='utf-8'))
    labels={'base':'一般模式','bonus':'BEACH SWEEP','bonus_hits':'HIDDEN COVE','bonus_epic':'LOST LAGOON'}
    text=['# 海灘尋寶｜數學驗證報告','',
          '版本：2026-10-23；重建種子：'+str(metrics['seed'])+'。',
          '四種模式依正式整數權重精確計算，RTP 均為 **24/25 = 96%**。Buy Bonus 沿用模板的 100×／500×／1,000× 售價。','',
          '| 模式 | 價格 | 局數 | RTP | 平均回收（基礎押注倍數） | 有獎機率 | 回收大於成本 | 標準差／成本 |',
          '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |']
    for mode,d in metrics['modes'].items():
        v=verified[mode]
        assert d['books']==v['books'] and v['exactRtp']=='24/25' and v['hashesVerified']
        cost=RULES['modes'][mode]['cost']
        text.append(f"| {labels[mode]} | {cost:,}× | {d['books']:,} | 96% | {d['meanBaseBetX']:.2f}× | {d['hitRate']:.4%} | {d['profitProbability']:.4%} | {d['stdDevCostUnits']:.4f} |")
    text+=['','「有獎」包括低於購買成本的回收；不等於獲利。每次購買的 RTP 以實際購買成本為分母。',
           '20,000× 上限一律相對基礎押注：三階購買分別等於購買成本的 200×／40×／20×。',
           '','## 分布與功能入口','',
           '| 模式 | 中位回收／成本 | P90／成本 | P99／成本 | 20,000× 機率 | 平均實際免費轉數／功能 |',
           '| --- | ---: | ---: | ---: | ---: | ---: |']
    for mode,d in metrics['modes'].items():
        v=verified[mode]
        text.append(f"| {labels[mode]} | {d['medianCostUnits']:.4f}× | {d['p90CostUnits']:.4f}× | {d['p99CostUnits']:.4f}× | 1 / {1/d['maxWinProbability']:,.0f} | {v['meanFreeSpinsPerFeature']:.4f} |")
    v=verified['base']
    text+=['',f"一般模式自然功能入口機率 {v['featureProbability']:.8%}，約每 {1/v['featureProbability']:.2f} 局一次。",
           '入口三階相對配置為 94%／5%／1%；逐局整數化造成的差異以 verification.json 為準。',
           '自然入口重用對應購買功能的所有路徑與相對權重；入場轉輪自身獎金另外計算，整局共同套用上限。',
           '', '## 規則與驗證','',
           '- 5×4、14 條固定線；探測器只在中間三輪，擴展為 Wild 時保留 Scatter。',
           '- 1×1／2×2／3×3 探測區不重疊；按每個覆蓋的中獎位置加總倍率。',
           '- 三階均起始 10 次免費轉；2／3／4／5 Scatter 再加 2／4／6／8 次。',
           '- BEACH SWEEP 固定區域位置、每轉重抽倍率；高兩階中獎區每轉至多翻倍一次；LOST LAGOON 每轉保證探測器。',
           '- 達 20,000× 立即結束；沒有隱藏加轉或為校準 RTP 而縮放獎金。',
           f"- 全量獨立回算 {sum(v['books'] for v in verified.values()):,} 局／{sum(v['events'] for v in verified.values()):,} 個事件，檢查實際轉輪窗、全部線獎、倍率區、再觸發、計數與封頂。",
           '- 全部 book ID 與 LUT 一一相符，SDK lookup 格式、前後端配置與 SHA-256 均通過；四模式 RTP 使用整數有理數核對。',
           '- 10 項單元測試涵蓋 SDK 對照、Wild 替代、區域累加、Scatter 保留、完整功能、封頂與損毀資料拒絕。',
           '', '## 檔案與重建','',
           'publish_files/ 是平台數學輸入：index.json、4 個壓縮事件檔、4 個整數權重表。configs/ 保存前後端配置、雜湊及經驗證的預覽局。',
           'reports/metrics.json 與 reports/verification.json 為機器可讀結果；sources/ 為可重建原始碼與實際 CSV 轉輪。',
           '生成與驗證命令見 README.md。正式抽樣依有限加權局庫執行，並非對 CSV 停點均勻抽樣。',
           '', '本報告是本機數學與檔案驗證結果；尚未上傳 Stake 平台，未宣稱 RGS 連線或平台審核通過。','']
    target=reports/'MATH_REPORT.md';target.write_text('\n'.join(text),encoding='utf-8');print(target)

if __name__=='__main__':main()
