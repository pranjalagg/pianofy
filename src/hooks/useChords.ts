import { useState, useCallback, useRef, useEffect } from 'react';
import { getChordMidiNotes, ARPEGGIO_PATTERN } from '../utils/chords';

interface UseChordsOptions {
  transpose: number;
  octaveOffset: number;
  playNote: (midi: number) => void;
  stopNote: (midi: number) => void;
}

const BPM = 120;
const BEAT_MS = (60 / BPM) * 1000;
const STEP_MS = BEAT_MS / 2;
const NOTE_DURATION_MS = STEP_MS * 0.8;

export function useChords({ transpose, octaveOffset, playNote, stopNote }: UseChordsOptions) {
  const [activeChord, setActiveChord] = useState<number | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepRef = useRef(0);
  const lastNoteRef = useRef<number | null>(null);
  const chordNotesRef = useRef<number[]>([]);

  const transposeRef = useRef(transpose);
  const octaveOffsetRef = useRef(octaveOffset);
  const playNoteRef = useRef(playNote);
  const stopNoteRef = useRef(stopNote);

  useEffect(() => { transposeRef.current = transpose; }, [transpose]);
  useEffect(() => { octaveOffsetRef.current = octaveOffset; }, [octaveOffset]);
  useEffect(() => { playNoteRef.current = playNote; }, [playNote]);
  useEffect(() => { stopNoteRef.current = stopNote; }, [stopNote]);

  const stopArpeggio = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (lastNoteRef.current !== null) {
      stopNoteRef.current(lastNoteRef.current);
      lastNoteRef.current = null;
    }
    stepRef.current = 0;
  }, []);

  const startArpeggio = useCallback((degree: number) => {
    stopArpeggio();

    const baseMidi = 36 + octaveOffsetRef.current * 12;
    const notes = getChordMidiNotes(degree, transposeRef.current, baseMidi);
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
  }, [stopArpeggio]);

  const toggleChord = useCallback((degree: number) => {
    setActiveChord((prev) => {
      if (prev === degree) {
        stopArpeggio();
        return null;
      }
      startArpeggio(degree);
      return degree;
    });
  }, [startArpeggio, stopArpeggio]);

  useEffect(() => {
    if (activeChord !== null) {
      const baseMidi = 36 + octaveOffsetRef.current * 12;
      chordNotesRef.current = getChordMidiNotes(activeChord, transposeRef.current, baseMidi);
    }
  }, [transpose, octaveOffset, activeChord]);

  useEffect(() => {
    return () => stopArpeggio();
  }, [stopArpeggio]);

  return { activeChord, toggleChord };
}
