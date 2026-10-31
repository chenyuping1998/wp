# Five-syllable laugh · 2026-10-31

The ten-pulse formant-synthesized laugh sounded mechanical. Replaced it with
the exact recording already shipped by Putt Monkey, originally from Diner:
`PuttMonkey迷你高爾夫/design/source/putt/audio/voice_laugh_recorded.wav`.
The local source and shipped Putt audio hashes match. WAV: mono, 44.1 kHz,
16-bit, 1.45 seconds including tail. No external samples were downloaded.

`src/game/laughTiming.json` aligns five syllables at 260 + 210*i ms. Audio
starts after the 260 ms inhale. Face, captions and body follow these beats.
`recorded_laugh_motion.mjs` samples this cast's own original Bezier poses,
uses its first five pulses, and settles to rest. The dancer's flex is reduced
for the faster cadence. Only `chestbeat` changes in existing skeleton JSON;
all other animations, mesh weights, atlases and textures are preserved.
`laugh-body-ten-beat.json` is the immutable original motion source.

Reinstall after full audio generation:
`python design/install_laugh_voice.py` (the old `generate_laugh_voice.py`
entry point now installs this source too). Reinstall only the animation with
`node design/install_laugh_motion.mjs`. Full character generation calls the
same recorded-laugh motion module automatically.

Validation: production build and audio references pass; types retain 14
existing baseline errors. Real-runtime mesh flow passes for all animations
and both casts, with no inverted triangles. Focused chestbeat audit reports
zero jerks. Pixel-seam warnings remain: old/new worst excess crack pixels
MG 576/598, FG 505/203; these are not a clean pixel-seam pass. See
`design/jazz-laugh-motion{,-baseline}.log` and `/stake/tmp/jazz-laugh-audit`.
Audio quality was not auditioned through speakers by the agent; the user can
compare the exact shared Golf recording in the preview or attached WAV.
