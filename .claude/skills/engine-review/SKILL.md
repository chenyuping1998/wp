---
name: engine-review
description: >-
  Pre-submission review of a Stake Engine slot against Engine's approval
  guidelines — the self-check a reviewer would run, done before upload. Use
  whenever the user asks to review, audit, self-check or "送審前檢查" a game
  under `wp/apps/*`, asks whether a game will pass review, wants the guideline
  list checked, or is answering a review comment and wants the rest of the
  checklist re-verified. Works read-only through ~45 guidelines (pre-checks,
  compliance, bet levels, currency, RGS requests, front end, rules text,
  responsive, language, social wording, replay), gives every one a verdict
  with file:line evidence, and reports failures first with concrete fixes.
  Use it even when the user only names one area ("check the social wording",
  "is the replay OK") — run that part of the checklist the same way.
---

# Engine game review: self-check

You are checking a game built for the Engine platform against Engine's approval
guidelines before the studio submits it. You have the source in front of you.
Find everything a reviewer would raise, show the evidence, say how to fix it.

Work through the **whole** checklist. Do not stop at the first problem, and do
not skip a guideline because it looks fine at a glance.

## Ground rules

- **Read-only until asked.** Don't edit, commit or push. Report first, then
  offer to fix the failures one guideline at a time.
- **Ask before installing anything** (Playwright, browsers, packages) or
  starting a long-running process. Helper scripts go in the session scratchpad
  or a folder the user approves; say where.
- **Evidence for every verdict.** `file:line` for code findings; quote the exact
  player-facing text for wording findings; if you ran the game, the URL and what
  you saw or what the network showed.
- **Don't guess.** If code can't decide it and you didn't run the game, it is
  AT RISK or NEEDS A HUMAN with exactly what to check. A wrong PASS costs the
  studio a review round.
- **Check every path.** Base game and bonus, desktop and mobile layouts, normal
  play and replay, main UI and menus, `social=false` and `social=true`. A
  guideline fails if any path fails.
- **A green gate is not a PASS.** This repo's `design/check_*.mjs` scripts each
  have blind spots (see the stake-engine-slot skill). Use them as leads, then
  read the code and text yourself.
- Reply to the user in 繁體中文 (their standing preference); keep guideline IDs,
  code identifiers and quoted game text as they are.

## Verdicts

| Verdict | Meaning |
| --- | --- |
| **PASS** | Positive evidence the guideline is met. |
| **FAIL** | Evidence it is not met. A reviewer would raise it. |
| **AT RISK** | Code suggests a problem, or it couldn't be confirmed either way. Say what would settle it. |
| **NEEDS A HUMAN** | Only a person can judge it (artwork, layout looking right, sound fully off). Give a short checklist. |
| **N/A** | The feature isn't in the game. Say how you know. |

## How to work

1. **Load the facts.** Read [references/platform.md](references/platform.md)
   (launch URL, wallet API, replay URL, currency table, math files) and
   [references/checklist.md](references/checklist.md) (every guideline, plus
   where each lives in this monorepo and what has failed before).

2. **Map the game.** Before judging anything, note:
   1. Framework and build, how to run it, dev port (`apps/<Game>/package.json`).
   2. Where URL params are read (`sessionID`, `rgs_url`, `lang`, `currency`,
      `social`, `replay`…).
   3. The RGS client: every URL built and every wallet call. Search for
      `authenticate`, `wallet/play`, `end-round`, `bet/replay`, `fetch(`,
      `axios`, hardcoded `http`/`https` hosts — in the app AND in `packages/`.
   4. Bet state: where amount, levels and default come from.
   5. Every player-facing string: i18n files, rules / info / paytable / help,
      buttons, modals, errors; how text is chosen for `social=true`.
   6. Input: space bar, autoplay, bonus buy / feature modes, sound.
   7. HTML entry: viewport meta, `html`/`body` CSS.
   8. Loading screen and replay screens.
   9. Math files (`math-sdk/games/<game_id>/library/publish_files/`) — the
      source of truth for RTP, max win, modes and costs. Compute per mode;
      don't trust numbers copied into the rules.

3. **Static audit.** Every guideline in the checklist, decided or narrowed from
   code and text.

4. **Run it — optional, ask first.** See
   [references/running.md](references/running.md) for the interceptions that
   reproduce what reviewers test, and the play shell this repo already has.
   Never place more bets than a check needs; never leave autoplay running.

5. **Report** in the format below.

## Report format

1. **Summary.** Verdict counts on one line, e.g.
   "31 PASS · 4 FAIL · 3 AT RISK · 5 NEEDS A HUMAN · 2 N/A", and whether you ran
   the game or only read code.
2. **Failures first.** Each FAIL, then each AT RISK:
   - `[id] Guideline title`: verdict
   - **Found:** the evidence (`file:line`, quoted text, network observation)
   - **Fix:** the concrete change, with the file to change
3. **Full table** in checklist order:

   | ID | Guideline | Verdict | Evidence |
   | --- | --- | --- | --- |

4. **For a person to check:** a short practical list per NEEDS A HUMAN item
   (which screen, which size, what to look for).
5. **Next step:** offer to fix the FAIL items one guideline at a time,
   re-checking each after the change.

One finding per distinct problem (a currency failing in two currencies is two
findings) — except social wording: all restricted words for one guideline in a
single finding, as the words only ("BET", "BUY", "PAYTABLE").

When a finding is in shared code under `packages/`, say so: it applies to every
game that uses it, and the fix must default to the old behaviour for games that
don't opt in (stake-engine-slot skill, "Every shared change must default to the
old behaviour").

Full guideline text and examples: https://studio.engine.io/docs/approval-guidelines
