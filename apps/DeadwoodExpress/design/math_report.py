#!/usr/bin/env python3
"""Standard slot maths report for Hot Miami.

Laid out to match the report format used elsewhere in the studio. Everything is
weighted by the lookup table, never counted off the books: the book file is the
simulation pool and its composition is fixed by the distribution quotas in
game_config.py, so counting it reports the quota back rather than the game.

    python design/math_report.py <bundle-dir>

Units: book amounts are in hundredths of the base stake (100 = 1x). Buy modes
quote against the base stake too, so their RTP divides by the mode's cost.

Three figures in the reference layout are NOT reproduced, because their
definitions cannot be recovered from the output alone and a plausible-looking
wrong number is worse than a missing one: `P.I.` and `平均開分`. What appears here instead is stated in the footnotes with its formula.
"""

import csv
import io
import json
import os
import sys
from collections import defaultdict

import zstandard as zstd

UNITS = 100
CAP = 20_000

# The strength groups are bound to the scatter tiers: a group is a tier, and a
# tier is a group. Keyed off the book's own `criteria` rather than the bonusTier
# event, because criteria is what the optimiser weighted against.
TIER_NAME = {
    "freegame_weak": "NeonNights/Weak",
    "freegame_mid": "SunsetHits/Mid",
    "freegame_strong": "OceanDrive/Strong",
}
TIER_ORDER = ["freegame_weak", "freegame_mid", "freegame_strong"]

BANDS = [
    (0, 1),
    (1, 5),
    (5, 10),
    (10, 25),
    (25, 50),
    (50, 75),
    (75, 100),
    (100, 150),
    (150, 200),
    (200, 300),
    (300, 500),
    (500, 800),
    (800, 1_000),
    (1_000, 2_000),
    (2_000, 5_000),
    (5_000, 10_000),
    (10_000, 20_000),
    (20_000, 50_000),
]


def read_books(path):
    with open(path, "rb") as fh:
        with zstd.ZstdDecompressor().stream_reader(fh) as reader:
            for line in io.TextIOWrapper(reader, encoding="utf8"):
                if line.strip():
                    yield json.loads(line)


def freq(p):
    return float("inf") if p <= 0 else 1.0 / p


def fmt_freq(p):
    f = freq(p)
    return "-" if f == float("inf") else f"{f:,.2f}"


def main(bundle):
    weights = {}
    for r in csv.reader(open(os.path.join(bundle, "lookUpTable_base_0.csv"))):
        weights[int(r[0])] = float(r[1])
    total_w = sum(weights.values())

    # ---- one pass over the base books, everything weighted -----------------
    total_win = 0.0
    w_hit = 0.0
    main_win = 0.0            # base-game portion of the return
    free_win = 0.0            # free-game portion
    w_free_rounds = 0.0
    w_free_spins = 0.0
    w_retrigger = 0.0
    payouts = []              # (weight, payout in x) for SD / bands
    free_payouts = []         # (weight, freeGameWins in x) for the 高均率 metric
    tier_w = defaultdict(float)
    tier_win = defaultdict(float)
    tier_spins = defaultdict(float)
    tier_retrig = defaultdict(float)
    tier_max = defaultdict(float)
    band_tot = defaultdict(float)
    band_main = defaultdict(float)
    band_free = defaultdict(float)
    band_rtp_tot = defaultdict(float)
    band_rtp_main = defaultdict(float)
    band_rtp_free = defaultdict(float)
    band_spins = defaultdict(float)
    w_main_rounds = 0.0

    for book in read_books(os.path.join(bundle, "books_base.jsonl.zst")):
        w = weights.get(int(book["id"]), 0.0)
        if w == 0.0:
            continue
        pay = float(book["payoutMultiplier"]) / UNITS
        # NOT divided by UNITS: payoutMultiplier is in hundredths, but
        # baseGameWins/freeGameWins are already in multiples of the stake
        # (payoutMultiplier 40 -> baseGameWins 0.4). Dividing both the same way
        # put the split at 0.97% of the return instead of 100% of it.
        bw = float(book.get("baseGameWins", 0))
        fw = float(book.get("freeGameWins", 0))
        total_win += w * pay
        main_win += w * bw
        free_win += w * fw
        if pay > 0:
            w_hit += w
        payouts.append((w, pay))

        tier = book.get("criteria")
        spins = 0
        retrig = False
        for e in book["events"]:
            t = e["type"]
            if t == "reveal" and e.get("gameType") == "freegame":
                spins += 1
            elif t == "freeSpinRetrigger":
                retrig = True

        if spins:
            free_payouts.append((w, fw))
            w_free_rounds += w
            w_free_spins += w * spins
            if retrig:
                w_retrigger += w
            key = tier if tier in TIER_NAME else "freegame_weak"
            tier_w[key] += w
            tier_win[key] += w * fw
            tier_spins[key] += w * spins
            if retrig:
                tier_retrig[key] += w
            tier_max[key] = max(tier_max[key], pay)
        else:
            w_main_rounds += w

        for lo, hi in [(0, 0)] + BANDS:
            inb = (pay == 0) if hi == 0 else (lo <= pay < hi and pay > 0)
            if not inb:
                continue
            band_tot[(lo, hi)] += w
            band_rtp_tot[(lo, hi)] += w * pay
            if spins:
                band_free[(lo, hi)] += w
                band_rtp_free[(lo, hi)] += w * fw
                band_rtp_main[(lo, hi)] += w * bw
                band_spins[(lo, hi)] += w * spins
            else:
                band_main[(lo, hi)] += w
                band_rtp_main[(lo, hi)] += w * bw
            break

    # The lookup weights ARE the distribution, so every rate below is exact and
    # the raw weight total (~1.1e15) is not a simulation count. Rates are
    # therefore reported against a nominal run of ROUNDS rounds, which is what
    # makes the confidence interval mean anything: it answers "how far can
    # measured RTP drift over this many rounds of real play".
    ROUNDS = 1_000_000_000
    scale = ROUNDS / total_w
    times = total_w
    rtp = total_win / times
    mean = rtp
    var = sum(w * (p - mean) ** 2 for w, p in payouts) / times
    sd = var**0.5
    cap_w = sum(w for w, p in payouts if p >= CAP - 1e-9)
    if cap_w:
        m2 = sum(w * p for w, p in payouts if p < CAP - 1e-9) / (times - cap_w)
        v2 = sum(w * (p - m2) ** 2 for w, p in payouts if p < CAP - 1e-9) / (times - cap_w)
        sd_ex = v2**0.5
        rtp_ex = sum(w * p for w, p in payouts if p < CAP - 1e-9) / times
    else:
        sd_ex, rtp_ex = sd, rtp

    W = 96

    def rule(title):
        pad = (W - len(title) - 2) // 2
        print("*" * pad + f" {title} " + "*" * (W - pad - len(title) - 2))

    print()
    print(
        f"Times:{ROUNDS:,}  TotalWin:{total_win * scale:,.0f}  TotalBet:{ROUNDS:,}"
        f"   (nominal run; rates below are exact from the lookup weights)"
    )

    # ---------------- BASE INFO ----------------
    rule("BASE INFO")
    print(
        f"{'Game -':>20}{'RTP':>12}{'HitRate':>11}{'Freq.':>13}{'Multi':>10}"
        f"{'PlayTimes':>12}{'RetriRate':>11}{'MaxMulti':>11}"
    )
    print(
        f"{'MainGame -':>20}{main_win / times * 100:>11.4f}%{w_hit / times * 100:>10.2f}%"
        f"{'-':>13}{main_win / max(w_hit, 1e-9):>10.2f}{'-':>12}{'-':>11}{CAP:>11,.2f}"
    )
    p_free = w_free_rounds / times
    print(
        f"{'SpecialGameTotal -':>20}{free_win / times * 100:>11.4f}%{'-':>11}"
        f"{fmt_freq(p_free):>13}{free_win / max(w_free_rounds, 1e-9):>10.2f}"
        f"{w_free_spins / max(w_free_rounds, 1e-9):>12.2f}"
        f"{w_retrigger / max(w_free_rounds, 1e-9) * 100:>10.2f}%{CAP:>11,.2f}"
    )
    for key in TIER_ORDER:
        if tier_w[key] == 0:
            continue
        p = tier_w[key] / times
        print(
            f"{TIER_NAME[key] + ' -':>20}{tier_win[key] / times * 100:>11.4f}%{'-':>11}"
            f"{fmt_freq(p):>13}{tier_win[key] / tier_w[key]:>10.2f}"
            f"{tier_spins[key] / tier_w[key]:>12.2f}"
            f"{tier_retrig[key] / tier_w[key] * 100:>10.2f}%{tier_max[key]:>11,.2f}"
        )

    # ---------------- FreeGame Strength Group ----------------
    rule("FreeGame Strength Group")
    print(
        f"{'Game/Group -':>22}{'RTP':>12}{'EnterRate':>11}{'Freq.':>13}{'Multi':>10}"
        f"{'PlayTimes':>12}{'MaxMulti':>12}"
    )
    for key in TIER_ORDER:
        if tier_w[key] == 0:
            continue
        p = tier_w[key] / times
        label = f"{TIER_NAME[key]} -"
        print(
            f"{label:>22}{tier_win[key] / times * 100:>11.4f}%{'100.00%':>11}"
            f"{fmt_freq(p):>13}{tier_win[key] / tier_w[key]:>10.2f}"
            f"{tier_spins[key] / tier_w[key]:>12.2f}{tier_max[key]:>12,.2f}"
        )
    print(
        f"{'JackpotTotal -':>22}{'0.0000%':>12}{'-':>11}{'-':>13}{'-':>10}{'-':>12}{'-':>12}"
    )
    print(
        "  (no jackpots by design — Stake PreChecks prohibit them, and fixed"
        " currency amounts"
    )
    print("   break multi-currency play. Frames award plain bet multipliers only.)")
    print(f"{'Total -':>22}{rtp * 100:>11.4f}%{'':>11}{'':>13}{'':>10}{'':>12}{CAP:>12,.2f}")

    # ---------------- Game Detail ----------------
    rule("Game Detail Information")
    print(f"SD: {sd:.2f}")
    print(
        f"SD (ex MaxWin): {sd_ex:.2f}   (excluding {cap_w * scale:,.0f} capped rounds"
        f" / RTP {rtp_ex * 100:.4f}%)"
    )
    for z, name in ((1.645, "90%"), (1.960, "95%"), (2.576, "99%")):
        half = z * sd / ROUNDS**0.5
        print(f"{name} confidence level: {(rtp - half) * 100:.2f}% ~ {(rtp + half) * 100:.2f}%")
    print(f"Pay Out Rate: {w_hit / times * 100:.4f}%   [defined here as: rounds returning anything]")
    wins = sorted([(w, p) for w, p in payouts if p > 0], key=lambda x: x[1])
    tw = sum(w for w, _ in wins)
    acc = 0.0
    median_win = 0.0
    for w, p in wins:
        acc += w
        if acc >= tw / 2:
            median_win = p
            break
    print(f"中均值: {median_win:.2f}   [median payout of WINNING rounds]")
    # 高均率: of the rounds that reached free spins, the share paying MORE than
    # the free game's own average multiplier. It is a shape measure, not a size
    # one — the lower it runs, the more of the feature's return is carried by a
    # few rounds well above its own mean.
    avg_free = free_win / max(w_free_rounds, 1e-9)
    above = sum(w for w, fw in free_payouts if fw > avg_free)
    print(
        f"高均率: {above / max(w_free_rounds, 1e-9) * 100:.2f}%"
        f"   (free games paying above their own average of {avg_free:.2f}x)"
    )
    print("P.I. / 平均開分: not reproduced — formula not recoverable from the reference")

    # ---------------- Multiple Information ----------------
    rule("Multiple Information")
    for lo, hi in BANDS:
        inb = sum(w for w, p in payouts if lo <= p < hi and p > 0) / times
        ge = sum(w for w, p in payouts if p >= lo and p > 0) / times
        lbl = f"{lo:>8} <= x < {hi:<8}"
        print(
            f"{lbl}- 約 {fmt_freq(inb):>16}局觸發"
            f"( {lo}倍以上 - 約 {fmt_freq(ge):>16}局觸發 )"
        )
    tail = sum(w for w, p in payouts if p >= BANDS[-1][1]) / times
    print(
        f"{BANDS[-1][1]:>8} <= x <       -1 - 約 {fmt_freq(tail):>16}局觸發"
        f"( {BANDS[-1][1]}倍以上 - 約 {fmt_freq(tail):>16}局觸發 )"
    )

    # ---------------- SpecialGame Range ----------------
    rule("SpecialGame Range")
    print(f"{'':>24}{'AppearRate':^30}|{'RTP':^30}|")
    print(
        f"{'Range -':>24}{'Total':>10}{'Main':>10}{'Free':>10} |"
        f"{'Total':>10}{'Main':>10}{'Free':>10} |{'FreeGameAvgSpin':>18}"
    )
    for lo, hi in [(0, 0)] + BANDS:
        k = (lo, hi)
        if band_tot[k] == 0 and band_rtp_tot[k] == 0:
            continue
        lbl = "x = 0" if hi == 0 else f"{lo} <= x < {hi}"
        avg = f"{band_spins[k] / band_free[k]:.2f}" if band_free[k] else "-"
        print(
            f"{lbl + ' -':>24}"
            f"{band_tot[k] / times * 100:>9.2f}%"
            f"{band_main[k] / max(w_main_rounds, 1e-9) * 100:>9.2f}%"
            f"{band_free[k] / max(w_free_rounds, 1e-9) * 100:>9.2f}% |"
            f"{band_rtp_tot[k] / times * 100:>9.2f}%"
            f"{band_rtp_main[k] / times * 100:>9.2f}%"
            f"{band_rtp_free[k] / times * 100:>9.2f}% |"
            f"{avg:>18}"
        )
    print("*" * W)
    print()


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "upload/HotMiami/math")
