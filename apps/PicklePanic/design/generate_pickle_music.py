"""Pickle Panic — music: two looping scores in stems, the FS jingle and the win fanfares.

Called from generate_pickle_audio_v2.py (which owns loudness and file output).

  Main game  "Brine Diner Stomp"   E minor surf, 126 BPM, 32 bars (60.95 s)
             stems: bed  (drums, bass, combo-organ skank)        always on
                    lead (surf guitar riffs, theremin, tambourine) while playing
  Free spins "Panic in the Brine"  A phrygian-dominant surf, 150 BPM, 40 bars (64 s)
             stems: bed  (driving drums, galloping bass)          always on
                    l2   (organ stabs, tremolo guitar)            Cook meter >= 1 rung
                    l3   (theremin + brass lead, crashes)         Cook meter >= 2 rungs

All melodies are original. Loops are rendered circularly (notes and reverb
tails that run past the end wrap onto the start), then padded with PAD seconds
of their own wrap on both sides before AAC encoding, so the runtime can loop
[PAD, PAD + L] seamlessly whatever the encoder's priming does.
"""
from __future__ import annotations

import subprocess
from pathlib import Path

import numpy as np

from audio_dsp import (RNG, SR, brass, crash, fade, glide, hat, hp, hz, kick, lp, modal, n_of, nm, midi,
                       organ, pan, pluck, reverb, reverb_circular, sat, snare, st, tamb, tom, tt, env_adsr, noise, bp)

APP = Path(__file__).resolve().parents[1]
OUT = APP / 'static/assets/audio/pickle'
PAD = 0.5

CHORDS = {
    'Em': ('E', ['E', 'G', 'B']), 'C': ('C', ['C', 'E', 'G']), 'B7': ('B', ['B', 'D#', 'F#', 'A']),
    'Am': ('A', ['A', 'C', 'E']), 'D': ('D', ['D', 'F#', 'A']), 'G': ('G', ['G', 'B', 'D']),
    'F': ('F', ['F', 'A', 'C']), 'E': ('E', ['E', 'G#', 'B']), 'E7': ('E', ['E', 'G#', 'B', 'D']),
    'Dm': ('D', ['D', 'F', 'A']), 'Bb': ('Bb', ['Bb', 'D', 'F']), 'A': ('A', ['A', 'C#', 'E']),
}


class Track:
    """A stereo buffer you drop notes into by time; optionally circular."""

    def __init__(self, length_s: float, circular: bool):
        self.L = n_of(length_s)
        self.circ = circular
        self.buf = np.zeros((2, self.L + n_of(4.0)))

    def add(self, sig, t: float, p: float = 0.0, g: float = 1.0):
        sig = pan(sig, p) if sig.ndim == 1 else sig
        i = n_of(t) % self.L if self.circ else n_of(t)
        end = i + sig.shape[1]
        if end > self.buf.shape[1]:
            sig = sig[:, :self.buf.shape[1] - i]
            end = self.buf.shape[1]
        self.buf[:, i:end] += sig * g

    def out(self):
        if not self.circ:
            return self.buf
        o = self.buf[:, :self.L].copy()
        tail = self.buf[:, self.L:]
        o[:, :tail.shape[1]] += tail[:, :self.L] if tail.shape[1] <= self.L else tail[:, :self.L]
        return o


# ── instrument voices (cached where the same note repeats) ───────────────────

_cache: dict = {}


def _c(key, fn):
    if key not in _cache:
        _cache[key] = fn()
    return _cache[key]


def bass_note(name, dur, mute=0.85):
    f = hz(name)
    raw = _c(('bass', name), lambda: lp(pluck(f, 1.6, 0.55, 1.1, 0.22), 2200))
    n = min(len(raw), n_of(dur + 0.06))
    y = raw[:n].copy()
    gate = n_of(dur * mute)
    if gate < n:
        y[gate:] *= np.exp(-np.arange(n - gate) / SR / 0.02)
    return sat(y * 0.9, 1.4)


def gtr_note(name, dur, bright=1.3):
    f = hz(name)
    raw = _c(('gtr', name, bright), lambda: pluck(f, 2.2, bright, 1.3, 0.16))
    n = min(len(raw), n_of(dur + 0.08))
    y = raw[:n].copy()
    gate = n_of(dur)
    if gate < n:
        y[gate:] *= np.exp(-np.arange(n - gate) / SR / 0.03)
    return sat(y * 1.2, 1.8)  # a little amp grit


def gtr_trem(names, dur, rate_hz):
    """Tremolo picking on one or more strings for dur seconds."""
    out = np.zeros(n_of(dur + 0.1))
    step = 1.0 / rate_hz
    k = 0
    tpos = 0.0
    while tpos < dur:
        for nm_ in names:
            s = gtr_note(nm_, step * 1.05) * (0.8 if k % 2 else 1.0)
            i = n_of(tpos)
            out[i:i + len(s)] += s[:len(out[i:i + len(s)])] / len(names) ** 0.5
        tpos += step
        k += 1
    return out


def organ_chord(chord, dur, octave=4, gate_frac=1.0):
    root, tones = CHORDS[chord]
    # close voicing above the root, in the given octave
    ms = []
    base = nm(f'{root}{octave}')
    for tn in tones:
        m = nm(f'{tn}{octave}')
        while m < base:
            m += 12
        ms.append(m)
    key = ('org', chord, octave, round(dur, 3), gate_frac)
    return _c(key, lambda: sum(organ(midi(m), dur + 0.08, dur * gate_frac) for m in ms) / len(ms) ** 0.5)


def brass_chord(chord, dur, octave=3, bright=1.0):
    root, tones = CHORDS[chord]
    base = nm(f'{root}{octave}')
    ms = [base] + [nm(f'{tn}{octave}') + (12 if nm(f'{tn}{octave}') < base else 0) for tn in tones[1:]]
    ms.append(base + 12)
    return sum(brass(midi(m), dur + 0.15, dur, bright) for m in ms) / len(ms) ** 0.5


def theremin_phrase(notes, bpm, total_beats, glide_s=0.09):
    """notes: (start_beat, beats, name | None). Returns one continuous voice."""
    beat = 60 / bpm
    n = n_of(total_beats * beat + 1.0)
    f = np.full(n, np.nan)
    amp = np.zeros(n)
    prev = None
    for sb, nb, name in notes:
        i0, i1 = n_of(sb * beat), n_of((sb + nb) * beat)
        if name is None:
            continue
        target = hz(name)
        seg = np.full(i1 - i0, target)
        if prev is not None:
            g = min(len(seg), n_of(glide_s))
            seg[:g] = prev * (target / prev) ** (np.linspace(0, 1, g) ** 0.7)
        f[i0:i1] = seg
        e = env_adsr(i1 - i0 + n_of(0.25), 0.06, 0.2, 0.85, 0.22, (i1 - i0) / SR)
        amp[i0:i0 + len(e)] = np.maximum(amp[i0:i0 + len(e)], e[:len(amp[i0:i0 + len(e)])])
        prev = target
    # hold pitch through rests so the release tails keep a frequency
    idx = np.where(~np.isnan(f))[0]
    if len(idx):
        f = np.interp(np.arange(n), idx, f[idx])
    else:
        f[:] = 440
    v = glide(f, 0.014, 5.4, ((1, 1), (2, 0.18), (3, 0.06)))
    return lp(v * amp, 3500) * 0.6


# ── drums ────────────────────────────────────────────────────────────────

KIT = {}


def kit():
    if not KIT:
        KIT['k'] = [kick(0.45, 150 + 6 * i, 46) for i in range(3)]
        KIT['s'] = [snare(0.3, 190 + 5 * i, 1.0) for i in range(3)]
        KIT['h'] = [hat(0.05) for _ in range(4)]
        KIT['o'] = [hat(open_=True) for _ in range(2)]
        KIT['t'] = [tamb() for _ in range(3)]
        KIT['tl'] = tom(98)
        KIT['tm'] = tom(132)
        KIT['th'] = tom(176)
        KIT['c'] = crash(2.4)
    return KIT


def rr(name):
    v = kit()[name]
    return v[RNG.integers(len(v))] if isinstance(v, list) else v


# ═══════════════════════════════════════════════════════════════════════════
#  MAIN — "Brine Diner Stomp"
# ═══════════════════════════════════════════════════════════════════════════

MAIN_BPM = 126
MAIN_PROG = (['Em', 'Em', 'C', 'B7', 'Em', 'Em', 'Am', 'B7'] +
             ['C', 'D', 'G', 'B7', 'C', 'D', 'Am', 'B7'] +
             ['Em', 'Em', 'C', 'B7', 'Em', 'Em', 'Am', 'B7'] +
             ['Am', 'Em', 'Am', 'Em', 'C', 'B7', 'Em', 'B7'])

# guitar riff for an A section: per bar, (eighth index, note, eighths long)
RIFF_A = [
    [(0, 'E4', 1), (2, 'G4', 1), (3, 'B4', 1), (4, 'A4', 1), (5, 'G4', 1), (6, 'E4', 2)],
    [(0, 'E4', 1), (2, 'G4', 1), (3, 'B4', 1), (4, 'D5', 2), (6, 'B4', 2)],
    [(0, 'C5', 1), (2, 'B4', 1), (3, 'G4', 1), (4, 'E4', 2), (6, 'G4', 2)],
    [(0, 'F#4', 1), (2, 'A4', 1), (3, 'B4', 1), (4, 'D#5', 2), (6, 'B4', 2)],
    [(0, 'E4', 1), (2, 'G4', 1), (3, 'B4', 1), (4, 'A4', 1), (5, 'G4', 1), (6, 'E4', 2)],
    [(0, 'G4', 1), (2, 'B4', 1), (3, 'E5', 1), (4, 'D5', 2), (6, 'B4', 2)],
    [(0, 'A4', 1), (2, 'C5', 1), (3, 'E5', 1), (4, 'D5', 1), (5, 'C5', 1), (6, 'A4', 2)],
    [(0, 'B4', 1), (1, 'A4', 1), (2, 'F#4', 1), (3, 'D#4', 1), (4, 'B3', 4)],
]

# theremin over the B section: (start beat within the section, beats, note)
THEREMIN_B = [(0, 2, 'E5'), (2, 2, 'G5'), (4, 3, 'F#5'), (7, 1, 'A5'), (8, 4, 'B5'),
              (12, 2, 'A5'), (14, 1, 'F#5'), (15, 1, 'D#5'), (16, 2, 'E5'), (18, 1, 'G5'), (19, 1, 'E5'),
              (20, 2, 'D5'), (22, 2, 'F#5'), (24, 2, 'E5'), (26, 2, 'C5'), (28, 4, 'B4')]
# and its call over the bridge
THEREMIN_C = [(0, 3, 'A5'), (3, 1, 'E5'), (4, 4, 'G5'), (8, 3, 'C6'), (11, 1, 'A5'), (12, 4, 'B5'),
              (16, 2, 'G5'), (18, 2, 'E5'), (20, 4, 'F#5'), (24, 4, 'E5'), (28, 2, 'D#5'), (30, 2, 'F#5')]


def bass_bar(tr, t0, chord, nxt, beat):
    root = CHORDS[chord][0]
    r2 = f'{root}2' if nm(f'{root}2') >= nm('E2') else f'{root}3'
    r = nm(r2)
    fifth = midi(r + 7)
    e = beat / 2
    pattern = [(0, r), (2, r), (3, r + 7), (4, r + 12), (6, r + 7)]
    for idx, m in pattern:
        name = _name(m)
        tr.add(bass_note(name, e * 0.9), t0 + idx * e, 0, 0.9)
    # approach note into the next bar's root, a semitone below
    nr = nm(f'{CHORDS[nxt][0]}2')
    if nr < nm('E2'):
        nr += 12
    tr.add(bass_note(_name(nr - 1), e * 0.8), t0 + 7 * e, 0, 0.75)
    del fifth


def _name(m):
    names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    return f'{names[m % 12]}{m // 12 - 1}'


def render_main():
    bpm = MAIN_BPM
    beat = 60 / bpm
    bar = 4 * beat
    nbars = len(MAIN_PROG)
    L = nbars * bar
    drums = Track(L, True)
    bass = Track(L, True)
    org = Track(L, True)
    gtr = Track(L, True)
    ther = Track(L, True)
    perc = Track(L, True)

    for b, chord in enumerate(MAIN_PROG):
        t0 = b * bar
        sect = b // 8  # 0 A, 1 B, 2 A2, 3 C
        nxt = MAIN_PROG[(b + 1) % nbars]
        # drums (bed): surf stomp
        drums.add(rr('k'), t0, 0, 1.0)
        drums.add(rr('k'), t0 + 2 * beat, 0, 0.95)
        if b % 2 == 1:
            drums.add(rr('k'), t0 + 2.5 * beat, 0, 0.7)
        drums.add(rr('s'), t0 + beat, 0.05, 0.8)
        drums.add(rr('s'), t0 + 3 * beat, 0.05, 0.85)
        for e8 in range(8):
            g = 0.5 if e8 % 2 == 0 else 0.32
            drums.add(rr('h'), t0 + e8 * beat / 2, 0.25, g)
        if b % 8 == 7:  # fill into the next section
            for k, (tn, tb) in enumerate([('th', 3.0), ('tm', 3.25), ('tm', 3.5), ('tl', 3.75)]):
                drums.add(kit()[tn], t0 + tb * beat, -0.2 + 0.15 * k, 0.6)
        if b % 8 == 0:
            drums.add(kit()['c'], t0, -0.3, 0.45)
        # bass
        bass_bar(bass, t0, chord, nxt, beat)
        # organ: off-beat skank in A sections, long chords in B and the bridge
        if sect in (0, 2):
            for k in range(4):
                org.add(organ_chord(chord, beat * 0.22, 4, 1.0), t0 + (k + 0.5) * beat, 0.35, 0.55)
        else:
            org.add(organ_chord(chord, bar * 0.98, 4, 1.0), t0, 0.35, 0.42)
        # lead: guitar riff in A sections (octave up the second time), tremolo chords in the bridge
        if sect in (0, 2):
            for idx, name, ln in RIFF_A[b % 8]:
                nn = name if sect == 0 else _name(nm(name) + 12) if nm(name) + 12 <= nm('E6') else name
                gtr.add(gtr_note(nn, ln * beat / 2 * 0.95), t0 + idx * beat / 2, -0.3, 0.55)
        if sect == 3:
            root = CHORDS[chord][0]
            names = [f'{root}3', _name(nm(f'{root}3') + 7)]
            gtr.add(gtr_trem(names, bar * 0.96, 16 / beat / 4 * 2), t0, -0.3, 0.35)
        # tambourine on the off-16th of 2 and 4 (lead stem)
        perc.add(rr('t'), t0 + 1.5 * beat, 0.4, 0.35)
        perc.add(rr('t'), t0 + 3.5 * beat, 0.4, 0.35)

    tb = theremin_phrase(THEREMIN_B, bpm, 32)
    ther.add(tb, 8 * bar, 0.15, 0.55)
    tc = theremin_phrase(THEREMIN_C, bpm, 32)
    ther.add(tc, 24 * bar, 0.15, 0.5)
    # a ghost of the B line under A2, very soft, so the second A is not a copy
    ther.add(theremin_phrase([(s, d, _name(nm(n_) - 12)) for s, d, n_ in THEREMIN_B[:8]], bpm, 16), 20 * bar, 0.2, 0.18)

    d = drums.out()
    bed = bass.out() + reverb_circular(org.out(), 'room', 0.2, 1.2)
    percussion = reverb_circular(d, 'room', 0.16, 1.0) + reverb_circular(perc.out(), 'room', 0.12, 0.8)
    lead = (reverb_circular(gtr.out(), 'spring', 0.38, 2.2) + reverb_circular(ther.out(), 'room', 0.35, 1.8)
            )
    return L, {'bed': bed, 'percussion': percussion, 'lead': lead}


# ═══════════════════════════════════════════════════════════════════════════
#  FREE SPINS — "Panic in the Brine"
# ═══════════════════════════════════════════════════════════════════════════

FS_BPM = 150
FS_PROG = (['Am', 'Am', 'F', 'E', 'Am', 'Am', 'F', 'E'] +
           ['Dm', 'Am', 'E', 'Am', 'Dm', 'Am', 'F', 'E'] +
           ['F', 'G', 'Am', 'Am', 'F', 'G', 'E', 'E'] +
           ['Am', 'Am', 'F', 'E', 'Dm', 'Dm', 'E', 'E'] +
           ['Am', 'F', 'Dm', 'E', 'Am', 'F', 'E', 'E'])

# theremin/brass hook, 8-bar phrase (beats), A phrygian dominant colour (G#, Bb)
FS_HOOK = [(0, 1.5, 'E5'), (1.5, 0.5, 'F5'), (2, 1, 'E5'), (3, 1, 'C5'), (4, 2, 'A4'), (6, 1, 'C5'), (7, 1, 'E5'),
           (8, 1.5, 'F5'), (9.5, 0.5, 'E5'), (10, 1, 'D5'), (11, 1, 'C5'), (12, 4, 'B4'),
           (16, 1.5, 'E5'), (17.5, 0.5, 'F5'), (18, 1, 'G#5'), (19, 1, 'A5'), (20, 2, 'E5'), (22, 1, 'C5'), (23, 1, 'A4'),
           (24, 1, 'D5'), (25, 1, 'C5'), (26, 1, 'B4'), (27, 1, 'G#4'), (28, 4, 'A4')]
FS_HOOK_B = [(0, 2, 'A5'), (2, 1, 'G#5'), (3, 1, 'F5'), (4, 2, 'E5'), (6, 2, 'C5'),
             (8, 2, 'D5'), (10, 1, 'F5'), (11, 1, 'A5'), (12, 4, 'G#5'),
             (16, 2, 'A5'), (18, 1, 'B5'), (19, 1, 'C6'), (20, 2, 'B5'), (22, 2, 'G#5'),
             (24, 2, 'A5'), (26, 1, 'E5'), (27, 1, 'C5'), (28, 4, 'E5')]


def render_fs():
    bpm = FS_BPM
    beat = 60 / bpm
    bar = 4 * beat
    nbars = len(FS_PROG)
    L = nbars * bar
    drums = Track(L, True)
    bass = Track(L, True)
    org = Track(L, True)
    gtr = Track(L, True)
    lead = Track(L, True)
    hits = Track(L, True)

    for b, chord in enumerate(FS_PROG):
        t0 = b * bar
        sect = b // 8
        # drums: driving surf beat, 16th hats, kick on every beat in the last two sections
        four = sect >= 3
        for q in range(4):
            if q in (0, 2) or four:
                drums.add(rr('k'), t0 + q * beat, 0, 1.0 if q in (0, 2) else 0.8)
        drums.add(rr('k'), t0 + 2.75 * beat, 0, 0.6)
        drums.add(rr('s'), t0 + beat, 0.05, 0.9)
        drums.add(rr('s'), t0 + 3 * beat, 0.05, 0.95)
        for s16 in range(16):
            g = (0.45, 0.22, 0.32, 0.22)[s16 % 4]
            drums.add(rr('h'), t0 + s16 * beat / 4, 0.25, g)
        if b % 4 == 3:
            drums.add(rr('o'), t0 + 3.5 * beat, 0.25, 0.4)
        if b % 8 == 7:
            for k, tb in enumerate([2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75]):
                drums.add(kit()[('th', 'th', 'tm', 'tm', 'tl', 'tl', 'tl', 'tl')[k]], t0 + tb * beat, -0.3 + 0.08 * k, 0.55)
        # gallop bass: R . R R | R . R R ...
        root = CHORDS[chord][0]
        r = nm(f'{root}2')
        if r < nm('E2'):
            r += 12
        for q in range(4):
            for off, m in ((0, r), (0.5, r), (0.75, r + (7 if q == 3 else 0))):
                bass.add(bass_note(_name(m), beat / 4 * 0.85), t0 + (q + off) * beat, 0, 0.85)
        # l2: organ stabs on the & of every beat + tremolo guitar on the chord
        for q in range(4):
            org.add(organ_chord(chord, beat * 0.18, 4, 1.0), t0 + (q + 0.5) * beat, 0.4, 0.5)
        names = [f'{root}3', _name(nm(f'{root}3') + 7), f'{root}4']
        gtr.add(gtr_trem(names, bar * 0.97, 8 / beat * 1.0 / 2 * 1.5), t0, -0.35, 0.3)
        # l3: brass hits on section downbeats and the crash
        if b % 8 == 0:
            hits.add(brass_chord(chord, beat * 0.9, 3), t0, 0, 0.5)
            hits.add(kit()['c'], t0, 0.3, 0.5)
        if b % 8 == 6:
            hits.add(brass_chord(FS_PROG[b + 1] if b + 1 < nbars else 'E', beat * 0.5, 3), t0 + 3.5 * beat, 0, 0.4)

    # lead line: hook in sections 0 and 3, answer in 2, both octave-doubled in 4
    for sect, phrase, vol in ((0, FS_HOOK, 0.55), (1, FS_HOOK_B, 0.5), (3, FS_HOOK, 0.6), (4, FS_HOOK_B, 0.65)):
        v = theremin_phrase(phrase, bpm, 32)
        lead.add(v, sect * 8 * bar, 0.12, vol)
    # brass doubles the hook an octave down in the climax
    for sb, nb, name in FS_HOOK_B:
        lead.add(brass(hz(_name(nm(name) - 12)), nb * beat + 0.12, nb * beat * 0.9, 0.8), 32 * bar + sb * beat, -0.1, 0.22)
    # section 2 gets a call-and-response from the guitar instead of the theremin
    for i, (sb, nb, name) in enumerate(FS_HOOK):
        lead.add(gtr_note(name, nb * beat * 0.95), 16 * bar + sb * beat, -0.25, 0.45)

    bed = reverb_circular(drums.out(), 'room', 0.15, 0.9) + bass.out()
    l2 = reverb_circular(org.out(), 'room', 0.2, 1.0) + reverb_circular(gtr.out(), 'spring', 0.35, 2.0)
    l3 = reverb_circular(lead.out(), 'room', 0.3, 1.6) + reverb_circular(hits.out(), 'room', 0.25, 1.6)
    return L, {'bed': bed, 'l2': l2, 'l3': l3}


# ═══════════════════════════════════════════════════════════════════════════
#  JINGLES & FANFARES (one-shots, written to their presentation lengths)
# ═══════════════════════════════════════════════════════════════════════════

def fanfare(bars, bpm, chords, melody, hits_at, final, kit_density=1.0, extra=None, ring=0.8):
    """The band plays len(chords) bars under a brass+guitar melody, then the
    final chord lands on the next downbeat and is held to the end: `bars` bars
    in total, so the fanfare fits its presentation exactly."""
    beat = 60 / bpm
    bar = 4 * beat
    total = bars * bar + ring
    tr = Track(total + 1, False)
    for b, chord in enumerate(chords):
        t0 = b * bar
        tr.add(organ_chord(chord, bar * 0.95, 4), t0, 0.35, 0.35)
        root = CHORDS[chord][0]
        r = nm(f'{root}2') + (12 if nm(f'{root}2') < nm('E2') else 0)
        for e8 in range(8):
            tr.add(bass_note(_name(r + (12 if e8 % 4 == 2 else 0)), beat / 2 * 0.8), t0 + e8 * beat / 2, 0, 0.75)
        for q in range(4):
            tr.add(rr('k'), t0 + q * beat, 0, 0.9 if q % 2 == 0 else 0.6)
            if q % 2 == 1:
                tr.add(rr('s'), t0 + q * beat, 0.05, 0.85)
        hats = int(8 * kit_density)
        for k in range(hats):
            tr.add(rr('h'), t0 + k * bar / hats, 0.25, 0.35)
    for sb, nb, note in melody:
        tr.add(brass(hz(note), nb * beat + 0.15, nb * beat * 0.92, 1.1), sb * beat, -0.05, 0.5)
        tr.add(gtr_note(note, nb * beat * 0.9), sb * beat, -0.35, 0.25)
    for tb in hits_at:
        tr.add(kit()['c'], tb * beat, 0.3, 0.5)
    tf = len(chords) * bar
    hold = (bars - len(chords)) * bar + ring * 0.5
    tr.add(brass_chord(final, hold, 3, 1.25), tf, 0, 0.8)
    tr.add(organ_chord(final, hold, 4), tf, 0.35, 0.45)
    tr.add(gtr_trem([f'{CHORDS[final][0]}3', _name(nm(f'{CHORDS[final][0]}3') + 7), f'{CHORDS[final][0]}4'], hold * 0.9, 13), tf, -0.35, 0.3)
    tr.add(rr('k'), tf, 0, 1.0)
    tr.add(kit()['c'], tf, 0.2, 0.75)
    if extra:
        extra(tr, beat, bar)
    y = fade(tr.out()[:, :n_of(total)], 0.0, 0.4)
    return reverb(y, 'room', 0.25, 1.8)[:, :n_of(total + 0.5)]


def render_jingles():
    J = {}
    # win_small 0.9 s: a surf double-stop slide + the till's ting
    t = Track(1.2, False)
    t.add(gtr_note('B4', 0.12), 0, -0.2, 0.6)
    t.add(gtr_note('E5', 0.5), 0.1, -0.2, 0.7)
    t.add(gtr_note('G#5', 0.5), 0.1, 0.1, 0.5)
    t.add(modal([4186, 8372], [0.5, 0.15], [0.25, 0.1], 0.5), 0.12, 0.25, 0.5)
    J['win_small'] = reverb(fade(t.out()[:, :n_of(1.0)], 0.0, 0.35), 'spring', 0.3, 1.4)
    # win_mid 1.4 s: organ arpeggio up an E major chord, tambourine, ting
    t = Track(1.8, False)
    for k, n_ in enumerate(['E4', 'G#4', 'B4', 'E5', 'G#5']):
        t.add(organ(hz(n_), 0.5, 0.18), k * 0.09, 0.3, 0.45)
        t.add(gtr_note(n_, 0.2), k * 0.09, -0.3, 0.35)
    t.add(rr('t'), 0.36, 0.4, 0.4)
    t.add(modal([3520, 5274, 7040], [0.5, 0.25, 0.1], [0.4, 0.2, 0.1], 0.7), 0.45, 0.2, 0.45)
    J['win_mid'] = reverb(fade(t.out()[:, :n_of(1.5)], 0.0, 0.35), 'room', 0.25, 1.2)
    # win_big 1.8 s: brass hit, snare roll, second bigger hit, guitar drip
    t = Track(2.4, False)
    t.add(brass_chord('E', 0.35, 3, 1.1), 0, 0, 0.7)
    t.add(rr('k'), 0, 0, 1.0)
    for k in range(10):
        t.add(rr('s'), 0.4 + k * 0.06, 0.05, 0.3 + 0.05 * k)
    t.add(brass_chord('E', 0.7, 3, 1.3), 1.0, 0, 0.85)
    t.add(kit()['c'], 1.0, 0.3, 0.6)
    t.add(rr('k'), 1.0, 0, 1.0)
    for k, n_ in enumerate(['E6', 'D#6', 'B5', 'G#5', 'E5', 'B4', 'G#4', 'E4']):
        t.add(gtr_note(n_, 0.06), 1.0 + k * 0.035, -0.3, 0.35)
    J['win_big'] = reverb(fade(t.out()[:, :n_of(2.0)], 0.0, 0.35), 'room', 0.25, 1.4)
    # win_super 3.6 s = 2 bars at 133.3 bpm: a rising line, then the E chord held
    J['win_super'] = fanfare(2, 133.333, ['E'],
                             [(0, 1, 'B4'), (1, 1, 'E5'), (2, 1, 'G#5'), (3, 0.5, 'B5'), (3.5, 0.5, 'C#6')],
                             [0], 'E')

    # win_mega 3.6 s: same length, a bigger room — theremin swoops over it, tom run
    def mega_extra(tr, beat, bar):
        f = np.concatenate([np.geomspace(hz('E4'), hz('E6'), n_of(1.0)), np.full(n_of(1.6), hz('E6')),
                            np.geomspace(hz('E6'), hz('B5'), n_of(0.4))])
        tr.add(glide(f, 0.02, 6.0) * env_adsr(len(f), 0.1, 0.3, 0.8, 0.4, 2.6) * 0.35, 0, 0.15, 1.0)
        for k, tn in enumerate(['th', 'th', 'tm', 'tl']):
            tr.add(kit()[tn], 0.5 * bar + k * beat / 2, -0.2 + 0.13 * k, 0.6)
    J['win_mega'] = fanfare(2, 133.333, ['A'],
                            [(0, 0.5, 'E5'), (0.5, 0.5, 'F#5'), (1, 1, 'A5'), (2, 1, 'G#5'), (3, 1, 'F#5')],
                            [0], 'E', 1.5, mega_extra)
    # win_epic 7 s = 4 bars at 137.14 bpm
    J['win_epic'] = fanfare(4, 137.143, ['E', 'C', 'B7'],
                            [(0, 1, 'B4'), (1, 1, 'E5'), (2, 2, 'G#5'), (4, 1, 'G5'), (5, 1, 'E5'), (6, 2, 'C5'),
                             (8, 1, 'B4'), (9, 1, 'D#5'), (10, 1, 'F#5'), (11, 1, 'A5')],
                            [0, 8], 'E', 1.5)

    # win_max 9 s = 5 bars at 133.3 bpm: the whole band, theremin on top, snare run
    def max_extra(tr, beat, bar):
        f = np.concatenate([np.geomspace(hz('B4'), hz('B5'), n_of(0.8)), np.full(n_of(1.9), hz('B5')),
                            np.geomspace(hz('B5'), hz('E6'), n_of(0.5)), np.full(n_of(2.6), hz('E6'))])
        tr.add(glide(f, 0.022, 6.2) * env_adsr(len(f), 0.2, 0.3, 0.85, 0.6, len(f) / SR - 0.6) * 0.3, 2 * bar, 0.15, 1.0)
        for k in range(16):
            tr.add(rr('s'), 4 * bar - beat + k * beat / 16, 0.05, 0.25 + 0.04 * k)
    J['win_max'] = fanfare(5, 133.333, ['E', 'C', 'A', 'B7'],
                           [(0, 1, 'B4'), (1, 1, 'E5'), (2, 2, 'G#5'), (4, 1, 'G5'), (5, 1, 'E5'), (6, 2, 'C5'),
                            (8, 1, 'C#5'), (9, 1, 'E5'), (10, 2, 'A5'), (12, 1, 'B5'), (13, 1, 'D#6'), (14, 2, 'F#6')],
                           [0, 8], 'E', 2.0, max_extra, ring=1.2)
    # the closing chords of the fanfares above are written by fanfare() itself
    # win_cap 2.5 s: the 10,000x cadence — B7 to E, gong-like crash, held
    t = Track(3.2, False)
    t.add(brass_chord('B7', 0.5, 3, 1.1), 0, 0, 0.7)
    t.add(organ_chord('B7', 0.5, 4), 0, 0.35, 0.4)
    for k in range(6):
        t.add(rr('s'), 0.3 + k * 0.04, 0.05, 0.4 + 0.08 * k)
    t.add(brass_chord('E', 1.8, 3, 1.4), 0.55, 0, 0.9)
    t.add(organ_chord('E', 1.8, 4), 0.55, 0.35, 0.5)
    t.add(rr('k'), 0.55, 0, 1.0)
    t.add(kit()['c'], 0.55, 0.25, 0.8)
    t.add(modal(np.array([1, 2.0, 2.76, 3.9, 5.4]) * 98, [1, 0.6, 0.5, 0.3, 0.2], [2.0, 1.5, 1.1, 0.8, 0.6], 2.5) * 0.5, 0.55, -0.2, 0.6)
    J['win_cap'] = reverb(fade(t.out()[:, :n_of(2.7)], 0.0, 0.35), 'room', 0.3, 2.0)
    # fs_intro 2.8 s: guitar drip down, theremin rises, tom fill, brass A chord
    t = Track(3.4, False)
    for k, n_ in enumerate(['A5', 'G#5', 'E5', 'C5', 'A4', 'E4', 'C4', 'A3']):
        t.add(gtr_note(n_, 0.09), k * 0.055, -0.3, 0.45)
    f = np.geomspace(hz('A3'), hz('A5'), n_of(1.3))
    t.add(glide(f, 0.018, 6.5) * env_adsr(len(f), 0.2, 0.2, 0.9, 0.3, 1.1) * 0.35, 0.3, 0.2, 1.0)
    for k, tn in enumerate(['th', 'th', 'tm', 'tm', 'tl', 'tl']):
        t.add(kit()[tn], 1.2 + k * 0.1, -0.3 + 0.12 * k, 0.6)
    t.add(brass_chord('A', 1.2, 3, 1.3), 1.8, 0, 0.85)
    t.add(rr('k'), 1.8, 0, 1.0)
    t.add(kit()['c'], 1.8, 0.3, 0.7)
    t.add(organ_chord('A', 1.0, 4), 1.8, 0.35, 0.45)
    J['fs_intro'] = reverb(fade(t.out()[:, :n_of(3.0)], 0.0, 0.35), 'room', 0.28, 1.6)
    return J


# ═══════════════════════════════════════════════════════════════════════════

def encode_loop(name: str, x: np.ndarray, write_wav, report, L: float):
    """Pad with the loop's own wrap, write WAV, encode AAC .m4a."""
    p = n_of(PAD)
    padded = np.concatenate([x[:, -p:], x, x[:, :p]], axis=1)
    wav = OUT / f'_{name}.wav'
    write_wav(wav, padded)
    m4a = OUT / f'{name}.m4a'
    subprocess.run(['afconvert', '-f', 'm4af', '-d', 'aac', '-b', '192000', '-q', '127', str(wav), str(m4a)], check=True)
    original = APP / 'design/source/production_v2/audio_stems'
    original.mkdir(parents=True, exist_ok=True)
    wav.replace(original / f'{name}.wav')
    report[m4a.name] = {'loop_seconds': round(L, 4), 'pad_seconds': PAD}
    print(f'  {name:18s} {L:6.2f}s loop  -> {m4a.name} ({m4a.stat().st_size // 1024} KB)')


def music_all(only, save_sfx, master, lufs, true_peak, write_wav, report):
    want = (lambda n: True) if not only else (lambda n: n in only)
    print('MUSIC')
    if want('bgm_main'):
        L, stems = render_main()
        mixd = sum(stems.values())
        g = 10 ** ((-19.0 - lufs(mixd)) / 20)
        peak = 10 ** (true_peak(mixd * g) / 20)
        if peak > 0.89:
            g *= 0.89 / peak
        print(f'  main mix {lufs(mixd * g):.1f} LUFS, tp {true_peak(mixd * g):.1f}')
        for k, v in stems.items():
            encode_loop(f'bgm_main_{k}', v * g, write_wav, report, L)
    if want('bgm_fs'):
        L, stems = render_fs()
        mixd = sum(stems.values())
        g = 10 ** ((-18.0 - lufs(mixd)) / 20)
        peak = 10 ** (true_peak(mixd * g) / 20)
        if peak > 0.89:
            g *= 0.89 / peak
        print(f'  fs mix {lufs(mixd * g):.1f} LUFS, tp {true_peak(mixd * g):.1f}')
        for k, v in stems.items():
            encode_loop(f'bgm_fs_{k}', v * g, write_wav, report, L)
    J = None
    targets = {'win_small': -19, 'win_mid': -18, 'win_big': -16, 'win_super': -15.5, 'win_mega': -15,
               'win_epic': -14.5, 'win_max': -14, 'win_cap': -14, 'fs_intro': -15}
    for name, tgt in targets.items():
        if not want(name):
            continue
        if J is None:
            J = render_jingles()
        save_sfx(name, J[name], tgt, tail_fade=0.15)
        # Long one-shots ship as AAC: they are a third of the set's bytes as WAV,
        # and nothing has to land on their first millisecond. The short cues
        # (reel stops, clicks) stay WAV for exactly that reason.
        wav, m4a = OUT / f'{name}.wav', OUT / f'{name}.m4a'
        subprocess.run(['afconvert', '-f', 'm4af', '-d', 'aac', '-b', '192000', '-q', '127', str(wav), str(m4a)], check=True)
        report[m4a.name] = report.pop(wav.name, {})
        wav.unlink()
