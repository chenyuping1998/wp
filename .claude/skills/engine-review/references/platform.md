# Engine platform facts

The launch URL, wallet API, replay URL, currency formats and math files the checklist is judged against. Source: the studio's engine-review prompt (2026-10-11); full guideline text at https://studio.engine.io/docs/approval-guidelines.


### Launch URL

The game is served as static files and opened with query parameters:

```
https://{team}.live.engine.io/{game}/v{version}/?sessionID=…&rgs_url=…&lang=en&currency=USD&device=desktop&social=false&demo=false
```

| Param | Meaning |
| --- | --- |
| `sessionID` | Player session. Sent in the body of every wallet request. |
| `rgs_url` | The RGS to call. **Must be used for every RGS request; never hardcode a host.** It may arrive as a bare host (`rgs.example.com`) with no `https://`; the game must add the scheme itself when missing. |
| `lang` | ISO 639-1 language code. Unknown codes must fall back to English. |
| `currency` | Currency code (see the table below). |
| `device` | `mobile`, `desktop` or `tablet`. |
| `social` | `true` for social-casino (Stake.US) mode. |
| `demo` | Demo session flag. |

### Wallet API (all `POST`, JSON body, relative to `rgs_url`)

| Endpoint | Body | Response (relevant fields) |
| --- | --- | --- |
| `/wallet/authenticate` | `{ sessionID }` | `balance.{amount,currency}`, `config.{minBet,maxBet,stepBet,defaultBetLevel,betLevels[],jurisdiction.{socialCasino,…}}`, `round` (only present while a round is unfinished) |
| `/wallet/balance` | `{ sessionID }` | `balance.{amount,currency}` |
| `/wallet/play` | `{ sessionID, amount, mode }` | `balance`, `round` (contains `amount`, `payoutMultiplier`, `active`, and the book's events in `state`) |
| `/wallet/end-round` | `{ sessionID }` | `balance` |
| `/bet/event` | `{ sessionID, event }` | Saves progress within a round, for resuming. |

Errors return `{ error, message }` with one of: `ERR_VAL` (400, invalid request, including an unknown or unauthenticated session), `ERR_IPB` (400, insufficient balance), `ERR_GLE` (400, gambling limits exceeded), `ERR_ACT` (429, retry shortly) and `ERR_GEN` (500).

**Money is in micro-units:** `1000000` = 1.00. A $1 bet sends `amount: 1000000`.

### Replay URL

```
…/index.html?replay=true&game={gameId}&version={mathVersion}&mode={mode}&event={eventId}&rgs_url=…&currency=…&amount=…&lang=…&device=…&social=…
```

The game fetches `GET {rgs_url}/bet/replay/{game}/{version}/{mode}/{event}`, which returns `{ payoutMultiplier, costMultiplier, state }`. A replay has **no session**: it must make no wallet calls and offer no way into real play. `amount` is the base bet in micro-units; the real cost is `amount × costMultiplier`.

### Currency display

Test with **USD, EUR, CAD, MXN, JPY**, and **XSC / XGC** for social mode. (GBP is not supported on the platform; don't test it.)

| Code | Shows as | Decimals | Code | Shows as | Decimals |
| --- | --- | --- | --- | --- | --- |
| USD | $10.00 | 2 | JPY | ¥10 | 0 |
| EUR | €10.00 | 2 | XSC | 10.00 SC | 2 |
| CAD | CA$10.00 | 2 | XGC | 10.00 GC | 2 |
| MXN | MX$10.00 | 2 | XEC | 10.00 SC | 2 |

The full list of supported currencies and their formats is in Engine's RGS docs. A game that formats with a fixed `$` or always 2 decimals will fail.

### Math files

If the math publish files are in the repo (or the user can point you to them), use them as the source of truth for the rules checks:

- `index.json` lists every mode: `name`, `cost` (multiplier of the base bet), `events` (books file), `weights` (lookup table).
- A game can have at most **20 modes**. More needs an exception from Engine Support, so flag a game over the limit as AT RISK.
- `lookUpTable_*.csv` rows are `id, weight, payoutMultiplier`, where **payoutMultiplier is ×100** (`1150` = 11.5x).
- Per mode: **RTP = Σ(weight × payout/100) ÷ Σ(weight) ÷ cost**; **max win = max(payout)/100** (×bet).
- `books_*.jsonl.zst` (zstd-compressed JSON lines) hold each round's `events`. These are also what you'd serve from a mock RGS.
