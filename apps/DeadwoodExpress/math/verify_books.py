"""Audit every published book and compute exact weighted gate measurements."""
import io
import json
from pathlib import Path
import zstandard
from game_config import GameConfig
from test_wheel import assert_book
from utils.analysis.distribution_functions import make_win_distribution, get_etl_cvar_p5k_10k_vales

def main():
    root = Path(__file__).parent / "library/publish_files"
    report = {}
    for mode in GameConfig().bet_modes:
        name, cost = mode.get_name(), mode.get_cost()
        count = wheels = 0
        path = root / f"books_{name}.jsonl.zst"
        with path.open("rb") as raw:
            with zstandard.ZstdDecompressor().stream_reader(raw) as stream:
                for line in io.TextIOWrapper(stream):
                    book = json.loads(line)
                    wheels += assert_book(book["events"])
                    assert book["payoutMultiplier"] <= 2000000
                    terminal = [e["amount"] for e in book["events"] if e["type"] == "finalWin"][-1]
                    assert terminal == book["payoutMultiplier"]
                    count += 1
        d = make_win_distribution(str(root / f"lookUpTable_{name}_0.csv"))
        etl = get_etl_cvar_p5k_10k_vales(d,cost)[2]
        report[name] = {
            "books":count, "wheel_events":wheels,
            "rtp":sum(w*p for w,p in d.items())/cost,
            "maxwin":max(d), "maxwin_1_in":1/d[20000],
            "nonzero_1_in":1/(1-d.get(0,0)), "zero_probability":d.get(0,0),
            "etl10k":etl, "compressed_book_bytes":path.stat().st_size,
        }
    spread = max(r["rtp"] for r in report.values()) - min(r["rtp"] for r in report.values())
    report["spread"] = spread
    print(json.dumps(report,indent=2))
    assert spread <= .005
    for name,r in report.items():
        if name != "spread":
            assert .90 <= r["rtp"] <= .98
            assert r["maxwin_1_in"] <= 20_000_000
    assert 3 <= report["base"]["nonzero_1_in"] <= 8
    return report

if __name__ == "__main__":
    main()
