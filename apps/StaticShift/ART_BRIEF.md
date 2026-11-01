# Static Shift — production art direction

## 0. Medium and palette
Original underground pirate radio booth, independent American graphic novel. Varied black brush ink, two or three flat shadow steps, crosshatching, paper texture. Indigo #363741 / #535e88 / #8294b6, paper #e5e2d6, signal green #b8d080, warm amber #e7aa53. Warm skin only on cast and portraits. No glossy rendering.

Reference: Claude session 3c179dea-89ae-4777-8618-c283d85dfc03 and stream-time-transcript.md. Technique and timings only; no source pixels ship. Style authority delegated by Stone on 2026-10-18.

## 1. Cast
MG: tired rust-shirt sound engineer, FG: lean female host with cream jacket and microphone. Separate people and separate meshes. Feet fixed; head nods on shared two-second clock, body stable. Swap beneath signal wipe only. No cast over board; hide at narrow widths.

## 2. Symbols
H1 moustache DJ, H2 black-bob selector, H3 punk caller, H4 radio matriarch. L1 mug, L2 headphones, L3 microphone, L4 cassette, L5 sneaker. W Relay, P Signal Pack, S Tape Deck. Each silhouette unique. Characters deform internally; props still in idle.

## 3. World and UI
Frameless 5×4 lavender paper cards in studio. Wall sign doubles as mode light. Floor pigeon follows 16.2s independent loop. Controls stay stationary during vertical scene impacts. Buttons clipped-corner mint/cream, amber hover. Painted blank plaques with runtime lettering. Store assets independently exposed, hero-only transparent FG.

## 4. Generation
Built-in imagegen, original prompts archived in design/generation.json. Raw sheets retained in design/source. Extraction is deterministic; no third-party art enters the package.

## Ink revision — 2026-10-19

The first pass was judged too detailed and too warm against the Stream Time technique study. Repainted original background, both cast figures, all twelve symbols and bright store backdrop. Broad indigo masses and irregular brush contours now lead; materials use two or three hard shadow shapes, sparse hatching. Amber pools removed from the room; the transmitter and prize pack retain deliberate mustard/acid-green emphasis. Native paper cells now have fixed rub marks, flecks and irregular 3px ink edges. Character reaction keeps feet planted; small cheek/hair deformation stays inside the figure.

Style-frame checks at180/70px are in design/qa/ink-style-final.png. H1 colors95=127 / soft39.7%; headphones57 /38.9%; Relay46 /39.3%. The metric is a diagnostic, not proof of taste: H1 soft-share did not improve versus v1 (38.9%), while prop color complexity fell strongly. Visual crop/phone checks decide legibility.

## Ink3 redraws — 2026-10-19

Relay and microphone use enamel fills; Selector shows age and asymmetry; Caller has a rounded ear with three hoops. FG host laughs with freckles and hard shadow fills. Sources and prompts in design/source-v3; export/QA in design/integrate_ink3.py and design/qa/INK3_QA.md. All five redraws pass soft-share <=30%.
