import { useCallback, useEffect, useRef } from 'react';
import { keyToMidi, KEY_TO_SEMITONE } from '../utils/noteMapping';

interface UseKeyboardOptions {
  octaveOffset: number;
  onNoteOn: (midi: number) => void;
  onNoteOff: (midi: number) => void;
  onOctaveChange: (delta: number) => void;
}

export function useKeyboard({
  octaveOffset,
  onNoteOn,
  onNoteOff,
  onOctaveChange,
}: UseKeyboardOptions) {
  // Track which keyboard keys are currently held to map them to the correct MIDI
  // note even if octave changes while a key is held
  const heldKeysRef = useRef<Map<string, number>>(new Map());

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.repeat) return;
      const key = e.key.toLowerCase();

      if (key === 'arrowleft') {
        onOctaveChange(-1);
        return;
      }
      if (key === 'arrowright') {
        onOctaveChange(1);
        return;
      }

      if (key in KEY_TO_SEMITONE && !heldKeysRef.current.has(key)) {
        const midi = keyToMidi(key, octaveOffset);
        if (midi !== null) {
          heldKeysRef.current.set(key, midi);
          onNoteOn(midi);
        }
      }
    },
    [octaveOffset, onNoteOn, onOctaveChange],
  );

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const midi = heldKeysRef.current.get(key);
      if (midi !== undefined) {
        heldKeysRef.current.delete(key);
        onNoteOff(midi);
      }
    },
    [onNoteOff],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);
}
