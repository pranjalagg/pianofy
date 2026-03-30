import { useState, useCallback, useRef, useEffect } from 'react';
import { getChordMidiNotesWithQuality, ARPEGGIO_PATTERN } from '../utils/chords';
import type { ChordQuality } from '../utils/chords';

export type ChordMode = 'arpeggio' | 'block';

interface UseChordsOptions {
  transpose: number;
  octaveOffset: number;
  qualities: ChordQuality[];
  mode: ChordMode;
  playNote: (midi: number) => void;
  stopNote: (midi: number) => void;
}

const BPM = 120;
const BEAT_MS = (60 / BPM) * 1000;
const STEP_MS = BEAT_MS / 2;
const NOTE_DURATION_MS = STEP_MS * 0.8;

export function useChords({ transpose, octaveOffset, qualities, mode, playNote, stopNote }: UseChordsOptions) {
  const [activeChord, setActiveChord] = useState<number | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepRef = useRef(0);
  const lastNoteRef = useRef<number | null>(null);
  const blockNotesRef = useRef<number[]>([]);
  const chordNotesRef = useRef<number[]>([]);

  const transposeRef = useRef(transpose);
  const octaveOffsetRef = useRef(octaveOffset);
  const qualitiesRef = useRef(qualities);
  const modeRef = useRef(mode);
  const playNoteRef = useRef(playNote);
  const stopNoteRef = useRef(stopNote);

  useEffect(() => { transposeRef.current = transpose; }, [transpose]);
  useEffect(() => { octaveOffsetRef.current = octaveOffset; }, [octaveOffset]);
  useEffect(() => { qualitiesRef.current = qualities; }, [qualities]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { playNoteRef.current = playNote; }, [playNote]);
  useEffect(() => { stopNoteRef.current = stopNote; }, [stopNote]);

  const stopPlayback = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (lastNoteRef.current !== null) {
      stopNoteRef.current(lastNoteRef.current);
      lastNoteRef.current = null;
    }
    for (const midi of blockNotesRef.current) {
      stopNoteRef.current(midi);
    }
    blockNotesRef.current = [];
    stepRef.current = 0;
  }, []);

  const startBlock = useCallback((degree: number) => {
    stopPlayback();
    const baseMidi = 36 + octaveOffsetRef.current * 12;
    const quality = qualitiesRef.current[degree];
    const notes = getChordMidiNotesWithQuality(degree, transposeRef.current, baseMidi, quality);
    blockNotesRef.current = notes;
    for (const midi of notes) {
      playNoteRef.current(midi);
    }
  }, [stopPlayback]);

  const startArpeggio = useCallback((degree: number) => {
    stopPlayback();
    const baseMidi = 36 + octaveOffsetRef.current * 12;
    const quality = qualitiesRef.current[degree];
    const notes = getChordMidiNotesWithQuality(degree, transposeRef.current, baseMidi, quality);
    chordNotesRef.current = notes;
    stepRef.current = 0;

    const tick = () => {
      if (lastNoteRef.current !== null) {
        stopNoteRef.current(lastNoteRef.current);
      }
      const patternIndex = stepRef.current % ARPEGGIO_PATTERN.length;
      const noteIndex = ARPEGGIO_PATTERN[patternIndex];
      let midi = chordNotesRef.current[noteIndex];
      if (patternIndex === ARPEGGIO_PATTERN.length - 1) {
        midi += 12;
      }
      playNoteRef.current(midi);
      lastNoteRef.current = midi;
      setTimeout(() => {
        if (lastNoteRef.current === midi) {
          stopNoteRef.current(midi);
          lastNoteRef.current = null;
        }
      }, NOTE_DURATION_MS);
      stepRef.current++;
    };

    tick();
    intervalRef.current = setInterval(tick, STEP_MS);
  }, [stopPlayback]);

  const startChord = useCallback((degree: number) => {
    if (modeRef.current === 'block') {
      startBlock(degree);
    } else {
      startArpeggio(degree);
    }
  }, [startBlock, startArpeggio]);

  const toggleChord = useCallback((degree: number) => {
    setActiveChord((prev) => {
      if (prev === degree) {
        stopPlayback();
        return null;
      }
      startChord(degree);
      return degree;
    });
  }, [startChord, stopPlayback]);

  // Re-trigger when mode changes while a chord is active
  useEffect(() => {
    if (activeChord !== null) {
      startChord(activeChord);
    }
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update chord notes when transpose/octave/qualities change
  useEffect(() => {
    if (activeChord !== null) {
      const baseMidi = 36 + octaveOffsetRef.current * 12;
      const quality = qualitiesRef.current[activeChord];
      const notes = getChordMidiNotesWithQuality(activeChord, transposeRef.current, baseMidi, quality);
      chordNotesRef.current = notes;

      if (modeRef.current === 'block') {
        startBlock(activeChord);
      }
    }
  }, [transpose, octaveOffset, qualities, activeChord, startBlock]);

  useEffect(() => {
    return () => stopPlayback();
  }, [stopPlayback]);

  return { activeChord, toggleChord };
}
