# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (Vite with HMR)
npm run build    # TypeScript check + Vite production build
npm run lint     # Run ESLint
npm run preview  # Preview production build locally
```

CI: Pushes to `main` auto-deploy to GitHub Pages via `.github/workflows/deploy.yml`.

## Architecture

Pianofy is a browser-based piano using the Web Audio API for real-time sound synthesis.

### Audio Pipeline

`useAudio` hook creates an AudioContext with:
- Multiple oscillators per voice (configurable type, ratio, detune, gain)
- ADSR envelope (attack/decay/sustain/release) per note
- Master gain node for volume control

Notes are tracked by MIDI number. The hook exposes `playNote(midi)` / `stopNote(midi)`.

### Keyboard Mapping

`useKeyboard` hook maps physical keys to MIDI notes via `noteMapping.ts`:
- Home row (A-') = white keys, QWERTY row (W,E,T,Y,U,O,P,[,],\) = black keys
- Layout spans 2 octaves with adjacent key positioning like a real piano
- Arrow keys shift the visible octave range (±3 octaves from C4)

Transpose is applied at play time in `App.tsx`, with a ref tracking which transposed MIDI is playing for each key so note-off works correctly even if transpose changes mid-note.

### Voice System

`voices.ts` defines presets (Grand Piano, Electric Piano, Harmonium, Synth Pad, Music Box). Each voice specifies oscillator configs and envelope parameters. Adding a voice = adding an entry to the `VOICES` array.
