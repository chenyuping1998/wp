# Deadwood Express｜亡木列車

Status: approved concept; implementation scaffold, not a playable reskin yet.

## Confirmed by the user

- Source: Hot Miami.
- Theme: Deadwood Express, a haunted steam train.
- Remove the gold/frame multiplier mechanic.
- During free spins, each spin with one or more paying lines triggers exactly one multiplier-wheel draw.
- The selected multiplier applies immediately to ALL paying lines on that same spin, including all-Wild wins.
- The selected value replaces the previous multiplier; values are not multiplied together.
- Each result is greater than or equal to the current value and persists until the feature ends.
- A spin without a line win neither draws the wheel nor resets its value.
- Buy Bonus costs: 100x and 250x the base stake. No third buy mode.
- Both wheels have a maximum multiplier of 100x.
- The 250x wheel contains only positive multiples of five.
- IMG_0982.PNG is a visual wheel reference ONLY. Its cap, retriggers, Wild exceptions and feature limits are not specifications.

## Initial implementation decisions (not additional user requirements)

- Retain the source's 5x4 board and 14 fixed paylines.
- Retain 10 initial free spins and the existing retrigger awards (2/3/4/5 Scatters add 2/4/6/8 spins), pending mathematical validation.
- Natural 3-Scatter entry uses the standard wheel; 4 or 5 Scatters use the premium wheel. Both start at 1x before the first paying spin; the premium wheel's first selection is at least 5x.
- Standard wheel candidate ladder: 1, 2, 3, 4, 5, 6, 8, 10, 15, 20, 25, 30, 40, 50, 75, 100.
- Premium wheel candidate ladder: 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100.
- Draw from the eligible values >= the held multiplier, using configured weights. At 100x, a paying spin still presents a draw resolving to 100x.
- Remove Collector together with frames: its source behavior only collects frame values.
- Retain the source's 94% RTP and 20,000x total round win cap as targets, not verified results.
- New assets, weights, paytable tuning and the distribution of returns require implementation and verification.

## Event contract

Feature entry resets heldMultiplier to 1. A feature spin resolves as:

1. Reveal the board and evaluate unmultiplied lines.
2. If there is no line win, emit no wheel event and preserve heldMultiplier.
3. Otherwise choose a value >= heldMultiplier, emit multiplierWheel with previous/value/eligibleValues, and store the new value.
4. Evaluate/emit winInfo with that new GLOBAL multiplier on every paying line.
5. Apply the round cap and normal win accounting; handle retriggers without resetting heldMultiplier.
6. Feature exit clears the held value for the next round.

The generated book determines the result. The visual wheel only animates that recorded result. Resume and replay must reconstruct the same held multiplier without drawing again.

## Theme direction

Charcoal iron, aged brass, bone ivory and ghostly teal. One spectral conductor as the cast identity. The wheel is a locomotive pressure dial with a fixed top pointer and a central held-multiplier display. A tunnel/steam transition hides the base-to-feature board change.

Working feature names: Midnight Passage (100x) and Phantom Express (250x). Checked against the source project's restricted-word list; these are working names, not independently verified platform approval.

## Acceptance checks

- No frame/Collector mechanics, events or player-facing explanations remain in the new game.
- Exactly one wheel event for each paying FG spin; none for losing FG spins or base spins.
- Wheel precedes winInfo and its value matches every line's global multiplier.
- No decreasing multipliers; premium selections are divisible by five; every result <=100.
- Multiplier persists through losses and retriggers, and resets between features.
- Multiple simultaneous lines and five-Wild wins receive the same newly selected multiplier.
- 100x saturation, turbo, interruption/resume and replay have deterministic outcomes.
- Only base/100x/250x modes are selectable; displayed prices agree with math.
- Generated books, lookup weights, measured RTP and cap reachability are verified before packaging.
