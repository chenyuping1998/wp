# Stake Engine certification

What review keeps asking for, and where each requirement lives in the code. Read
this before answering a review comment, and when adding a new game — most of
these are cheaper to build in than to retrofit.

## Contents

- [Working with review comments](#working-with-review-comments)
- [Social mode terminology](#social-mode-terminology)
- [Replay mode](#replay-mode)
- [Money and currency](#money-and-currency)
- [Game information](#game-information)
- [Presentation notes that came back as issues](#presentation-notes-that-came-back-as-issues)

## Working with review comments

Two habits that save a round trip:

**Fix the class, not the instance.** A screenshot flags two words; the same word
is usually in four other places nobody screenshotted. Grep the whole player-facing
surface before replying. Both terminology rounds so far turned up more occurrences
than the reviewer marked.

**Name the source of truth.** When a requirement is about a displayed value, check
where that value comes from. Mode names, for instance, only exist in the maths as
`base` / `bonus` / `superspin` — there is no display-name field in the published
files, so anything showing a friendly name has to map it in the frontend.

The user relays review comments and replies back. Keep replies short and factual;
they do not need the list of issues repeated back at them.

## Social mode terminology

`?social=true` forbids betting terminology anywhere the player can read, and
forces English.

Keep the vocabulary in **one place per game** (`src/game/socialTerms.ts`) and pull
from it in every panel. Two panels with their own copies drift, and the drift is
what gets flagged.

**The authoritative list is Stake's own**, at
<https://stake-engine.com/docs/approval-guidelines/jurisdiction-requirements>.
That page is client-rendered — `WebFetch` returns "Loading…", so read it in a
browser. Reproduced here because three review rounds were lost guessing at it:

| Restricted | Stake's replacement |
|---|---|
| bet / bets / betting | play / plays / playing |
| total bet | total play |
| place your bets | come and play / join in the game |
| rebet | respin |
| stake | play amount |
| wager | play |
| gamble | play |
| pay / pays / paid | win / wins / won |
| pay out / paid out / pays out | win / won |
| win feature | play feature |
| payer | winner |
| buy / purchase | play |
| bought | instantly triggered |
| buy bonus | get bonus |
| bonus buy | bonus / feature |
| at the cost of | for |
| cost of | can be played for |
| cash / money | coins |
| credit / fund | balance |
| currency | token |
| deposit / withdraw | get coins / redeem |
| be awarded to player's accounts | appear in player's accounts |

The replacement column is a suggestion, not a whitelist — anything that avoids a
restricted word is acceptable. This game used "amount" for bet and
"award/awarded" for pay/paid, which passed.

Stake also suggest a `sweeps_<lang>` language file for the swapped phrases; this
repo instead branches at the string, which keeps the two versions next to each
other where the drift is visible.

Rules learned the hard way:

- **A word swap can produce nonsense.** "pay left to right, starting from the
  leftmost reel" becomes "start from left to right, starting from…". Store the
  whole clause when the surrounding words have to move with it.
- **A replacement can contradict itself.** "Does not award — 4 or 5 Scatters
  award 12 Free Spins" reads as a contradiction; it became "No line win".
- **Match what the UI actually says.** The rules page cannot call it Buy Bonus
  while the button says PLAY BONUS.
- Check the non-obvious surfaces too: the spin ticker, feature-buy dialogs,
  insufficient-funds messages, the replay panel.

`check_social_words.mjs` enforces two mechanical rules — literal template text
must be clean (it shows in both modes), and the social argument of `pick()` must
be clean. It cannot see a word that arrives through a variable.

## Replay mode

Requirements as stated by review:

1. Loads and plays the requested event from a replay URL
2. Supports the optional parameters — `currency`, `lang`, `amount`
3. Can replay the event again after it finishes
4. Clearly displays the play cost and applied multiplier
5. Works in the small popout view

Implementation notes worth carrying to another game:

- Pass `lang` when requesting the replay, or it comes back in the default locale.
- **A replay never authenticates**, so nothing else sets the currency — read it
  from the URL or every amount renders as USD.
- The xstate `resumeGame` actor nulls `stateBet.betToResume` as it starts. Keep
  your own copy if the round must be replayable more than once.
- `resumeGame` does not pass through `onNewGameStart`, which is where sticky
  symbols normally get swept. Clear them yourself before a re-run or the second
  play starts with the first one's leftovers.
- The machine sits in `resumeBet` for the entire presentation and returns to
  `idle` when it is genuinely finished — use that transition rather than inventing
  an "ended" event.
- **Gate the auto-start on replay mode only.** Normal play also passes through
  `resumeBet` on every launch (it asks to resume, finds nothing, drops back to
  `idle`), so an ungated watcher reads that as "the replay just ended".
- Wrap the replay request in try/catch. Without it a failed request rejects out of
  `onMount`, `authenticated` never flips, and the game renders nothing at all —
  a black screen with no error.
- Small-screen layouts need the same treatment as the wide one; a live spin button
  in replay mode leads straight to an error, since there is no session to bet with.

Stake.us wording for the replay panel: `Base Bet` → `Base Play`,
`Cost Multiplier` → `Feature Multiplier`, `Payout Multiplier` → `Final Multiplier`.
Mode names must match what the game itself calls them ("Free Spins", not the raw
`bonus` key and not the buy-button caption "BUY FREE SPINS").

## Money and currency

- Format against a **fixed locale**, never the interface language. Switching to
  French must not turn `$1,000.00` into `1 000,00 $US` — same money, and a moved
  currency symbol reads as a changed balance.
- Social currencies bypass `Intl` entirely so they get no `$`:
  `XGC → GC`, `XSC → SC`, `XEC → SC`.
- Stakes and balances show 2 decimals. **Wins allow up to 4** — a payout of 2000
  book units on a $0.01 stake is $0.002, which at 2 decimals renders as `$0.00`
  and no longer matches the JSON the server sent. Use a minimum of 2 and trim
  trailing zeros by numeric comparison, not by regex on the string.
- Bet levels come from `authenticate`'s `config.betLevels`. Present all of them;
  a hardcoded index whitelist silently produces values unrelated to what the
  server allows once the ladder is a different length.

## Game information

The rules panel is expected to carry, at minimum:

- how to play, including line direction and how wins combine
- **a controls guide** — each on-screen control with its actual button art, so the
  player matches what they read to what they see
- **RTP and max win per mode**, read from the maths config rather than written
  into the prose, so they cannot drift from what the game pays
- every feature the maths implements, retriggers included
- the max-win cap and what happens when a round reaches it

Validate a claimed language against the catalogue before using it. An unknown
`?lang=` used to be passed straight through, and any `Intl` call made with it
throws — a typo is not a reason to break the game.

## Presentation notes that came back as issues

Recurring, and all cheaper to get right at the start:

- **Bet bar** — reviewers expect the conventional arrangement: menu and readouts
  left, bet/stepper/spin/autoplay/turbo right. Unusual layouts get flagged as
  "unclear, hard to use". Keep occasional, expensive actions (feature buy) away
  from the control pressed every few seconds.
- **Assets** — generic art, standard fonts, emoji icons and flat gradient fills
  get flagged as low quality. Emoji in particular render as the viewer's system
  font and ignore canvas fill, so they cannot be themed. Draw icons instead.
- **Spacebar** should be bound to the bet button.
- **Small screens** — the feature-buy menu and modals need explicit testing at
  the smallest supported size; percentage `max-height` against an auto-height
  parent silently resolves to `auto`, and `transform: scale()` shrinks text
  regardless of any `font-size` floor you set.
- **The Stake Engine splash must be removed.** Your own studio logo stays — they
  are different things, and it is easy to delete both by accident.
