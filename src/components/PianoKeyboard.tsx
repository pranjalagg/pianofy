import { PianoKey } from './PianoKey';
import { generatePianoKeys } from '../utils/noteMapping';
import type { PianoKeyData } from '../utils/noteMapping';
import './PianoKeyboard.css';

interface PianoKeyboardProps {
  octaveOffset: number;
  activeNotes: Set<number>;
  glowIntensity?: number;
  hasActiveKeys?: boolean;
  onNoteOn: (midi: number) => void;
  onNoteOff: (midi: number) => void;
}

const WHITE_KEY_WIDTH = 56;
const BLACK_KEY_WIDTH = 36;

// Positions of black keys relative to the white key they sit between (in semitones within an octave)
// Black keys: C#=1, D#=3, F#=6, G#=8, A#=10
// White keys: C=0, D=2, E=4, F=5, G=7, A=9, B=11
// Black key offsets from the left edge of the preceding white key
const BLACK_KEY_OFFSETS: Record<number, number> = {
  1: 0,   // C# after C (white key index 0)
  3: 1,   // D# after D (white key index 1)
  6: 3,   // F# after F (white key index 3)
  8: 4,   // G# after G (white key index 4)
  10: 5,  // A# after A (white key index 5)
};

function getBlackKeyLeft(semitoneInOctave: number, octaveIndex: number): number {
  const whiteKeyIndex = BLACK_KEY_OFFSETS[semitoneInOctave];
  const totalWhiteKeysBefore = octaveIndex * 7 + whiteKeyIndex;
  return totalWhiteKeysBefore * WHITE_KEY_WIDTH + WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2;
}

export function PianoKeyboard({
  octaveOffset,
  activeNotes,
  glowIntensity,
  hasActiveKeys,
  onNoteOn,
  onNoteOff,
}: PianoKeyboardProps) {
  const allKeys = generatePianoKeys(octaveOffset);
  const whiteKeys = allKeys.filter((k) => !k.isBlack);
  const blackKeys = allKeys.filter((k) => k.isBlack);

  const totalWidth = whiteKeys.length * WHITE_KEY_WIDTH;

  return (
    <div
      className={`piano-keyboard${hasActiveKeys ? ' piano-keyboard--active' : ''}`}
      style={{ width: totalWidth }}
    >
      <div className="piano-keyboard__white-keys">
        {whiteKeys.map((key: PianoKeyData) => (
          <PianoKey
            key={key.id}
            note={key.note}
            isBlack={false}
            isActive={activeNotes.has(key.midiNumber)}
            keyboardKey={key.keyboardKey}
            glowIntensity={glowIntensity}
            onPlay={() => onNoteOn(key.midiNumber)}
            onStop={() => onNoteOff(key.midiNumber)}
          />
        ))}
      </div>
      <div className="piano-keyboard__black-keys">
        {blackKeys.map((key: PianoKeyData) => {
          const semitoneInOctave = key.midiNumber % 12;
          const octaveIndex = Math.floor(
            (key.midiNumber - 60 - octaveOffset * 12) / 12,
          );
          const left = getBlackKeyLeft(semitoneInOctave, octaveIndex);
          return (
            <PianoKey
              key={key.id}
              note={key.note}
              isBlack={true}
              isActive={activeNotes.has(key.midiNumber)}
              keyboardKey={key.keyboardKey}
              style={{ left }}
              glowIntensity={glowIntensity}
              onPlay={() => onNoteOn(key.midiNumber)}
              onStop={() => onNoteOff(key.midiNumber)}
            />
          );
        })}
      </div>
    </div>
  );
}
