# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (Vite with HMR)
npm run build    # TypeScript check + Vite production build
npm run lint     # Run ESLint
npm test         # Run Vitest
npm run preview  # Preview production build locally
```

CI: Pushes to `main` auto-deploy to GitHub Pages via `.github/workflows/deploy.yml`.

## Architecture

Pianofy is a browser-based piano using the Web Audio API for real-time sound synthesis.

### Audio Pipeline

`useAudio` hook creates an AudioContext with:
- Multiple oscillators per voice (configurable type, ratio, detune, gain)
- ADSR envelope (attack/decay/sustain/release) per note
- Effects bus between per-note gain nodes and master gain: parallel sends to reverb (`ConvolverNode` with generated IR), chorus (LFO-modulated delay), and delay (with feedback loop). Controls: reverb amount (0–1), chorus on/off, delay on/off.
- Master gain node for volume control
- Grand Piano can use `type: 'multi-sample'`: six samples per octave, pitch-shifted playback, with oscillator fallback when samples are unavailable

Notes are tracked by MIDI number. The hook exposes `playNote(midi)` / `stopNote(midi)`.

### Keyboard Mapping

`useKeyboard` hook maps physical keys to MIDI notes via `noteMapping.ts`:
- Home row (A-') = white keys, QWERTY row (W,E,T,Y,U,O,P,[,],\) = black keys
- Layout spans 2 octaves with adjacent key positioning like a real piano
- Arrow keys shift the visible octave range (±3 octaves from C4)
- Number keys 1–7 toggle diatonic chord accompaniment (same key again stops that chord)

Transpose is applied at play time in `App.tsx`, with a ref tracking which transposed MIDI is playing for each key so note-off works correctly even if transpose changes mid-note.

### Voice System

`voices.ts` defines presets (Grand Piano, Electric Piano, Harmonium, Synth Pad, Music Box). Each voice specifies oscillator configs (or multi-sample + `fallbackOscillators` for Grand Piano), envelope parameters, and a `glowIntensity` field for UI. Adding a voice = adding an entry to the `VOICES` array.

### Chord Accompaniment

- `chords.ts`: scale intervals, triad builder, chord naming
- `useChords`: arpeggiator at 120 BPM, eighth notes cycling root → 3rd → 5th → root + octave
- `ChordBar`: seven diatonic chord buttons
- Chords follow transpose (key) and octave offset; number keys 1–7 toggle chords; pressing the same chord again stops it

### Visual Feedback

- Key press: slight `translateY` depression and reduced box shadow
- Active keys: warm orange glow; intensity from voice `glowIntensity` via CSS `--glow-intensity`
- Keyboard rail glow when any key is active
- Theme-aware glow: golden in light mode, amber in dark mode
