export interface NoteDefinition {
  note: string;
  midiNumber: number;
  isBlack: boolean;
}

// Two octaves starting at C4 (middle C, MIDI 60)
const BASE_OCTAVE_NOTES: NoteDefinition[] = [
  { note: 'C',  midiNumber: 0,  isBlack: false },
  { note: 'C#', midiNumber: 1,  isBlack: true },
  { note: 'D',  midiNumber: 2,  isBlack: false },
  { note: 'D#', midiNumber: 3,  isBlack: true },
  { note: 'E',  midiNumber: 4,  isBlack: false },
  { note: 'F',  midiNumber: 5,  isBlack: false },
  { note: 'F#', midiNumber: 6,  isBlack: true },
  { note: 'G',  midiNumber: 7,  isBlack: false },
  { note: 'G#', midiNumber: 8,  isBlack: true },
  { note: 'A',  midiNumber: 9,  isBlack: false },
  { note: 'A#', midiNumber: 10, isBlack: true },
  { note: 'B',  midiNumber: 11, isBlack: false },
];

// Lower octave: white keys on Z-M row, black keys on A-J row
// Upper octave: white keys on Q-U row, black keys on 1-7 row
const KEY_TO_SEMITONE: Record<string, number> = {
  // Lower octave - white keys
  'z': 0,   // C
  'x': 2,   // D
  'c': 4,   // E
  'v': 5,   // F
  'b': 7,   // G
  'n': 9,   // A
  'm': 11,  // B
  // Lower octave - black keys
  's': 1,   // C#
  'd': 3,   // D#
  'g': 6,   // F#
  'h': 8,   // G#
  'j': 10,  // A#
  // Upper octave - white keys
  'q': 12,  // C
  'w': 14,  // D
  'e': 16,  // E
  'r': 17,  // F
  't': 19,  // G
  'y': 21,  // A
  'u': 23,  // B
  // Upper octave - black keys
  '2': 13,  // C#
  '3': 15,  // D#
  '5': 18,  // F#
  '6': 20,  // G#
  '7': 22,  // A#
};

const BASE_MIDI = 60; // C4

export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function keyToMidi(key: string, octaveOffset: number): number | null {
  const semitone = KEY_TO_SEMITONE[key.toLowerCase()];
  if (semitone === undefined) return null;
  return BASE_MIDI + semitone + octaveOffset * 12;
}

export function getNoteLabel(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  const noteName = BASE_OCTAVE_NOTES[noteIndex].note;
  return `${noteName}${octave}`;
}

export function getKeyboardLabel(key: string): string {
  return key.toUpperCase();
}

export interface PianoKeyData {
  id: string;
  note: string;
  midiNumber: number;
  isBlack: boolean;
  keyboardKey: string;
  frequency: number;
}

export function generatePianoKeys(octaveOffset: number): PianoKeyData[] {
  const keys: PianoKeyData[] = [];
  const entries = Object.entries(KEY_TO_SEMITONE).sort((a, b) => a[1] - b[1]);

  for (const [key, semitone] of entries) {
    const midi = BASE_MIDI + semitone + octaveOffset * 12;
    const noteIndex = midi % 12;
    const octave = Math.floor(midi / 12) - 1;
    const noteDef = BASE_OCTAVE_NOTES[noteIndex];
    keys.push({
      id: `${noteDef.note}${octave}`,
      note: `${noteDef.note}${octave}`,
      midiNumber: midi,
      isBlack: noteDef.isBlack,
      keyboardKey: key,
      frequency: midiToFrequency(midi),
    });
  }

  return keys;
}

export { KEY_TO_SEMITONE };
