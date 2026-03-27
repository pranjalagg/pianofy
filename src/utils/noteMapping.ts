export interface NoteDefinition {
  note: string;
  isBlack: boolean;
}

const CHROMATIC_SCALE: NoteDefinition[] = [
  { note: 'C',  isBlack: false },
  { note: 'C#', isBlack: true },
  { note: 'D',  isBlack: false },
  { note: 'D#', isBlack: true },
  { note: 'E',  isBlack: false },
  { note: 'F',  isBlack: false },
  { note: 'F#', isBlack: true },
  { note: 'G',  isBlack: false },
  { note: 'G#', isBlack: true },
  { note: 'A',  isBlack: false },
  { note: 'A#', isBlack: true },
  { note: 'B',  isBlack: false },
];

// Adjacent layout: home row (ASDF) = white keys, QWERTY row = black keys.
// This keeps both octaves on physically adjacent keys, like a real piano.
//
//   Black:  W  E     T  Y  U     O  P     [  ]     \
//   White: A  S  D  F  G  H  J  K  L  ;  '  Z  X  C
//   Note:  C  D  E  F  G  A  B  C  D  E  F  G  A  B
//
// The last 3 white keys (G5, A5, B5) use Z, X, C on the bottom row since
// the home row runs out of keys after '.
//
// Semitone offset from the starting C of the 2-octave range:
const KEY_TO_SEMITONE: Record<string, number> = {
  // First octave - white keys (home row)
  'a': 0,   // C
  's': 2,   // D
  'd': 4,   // E
  'f': 5,   // F
  'g': 7,   // G
  'h': 9,   // A
  'j': 11,  // B
  // First octave - black keys (QWERTY row)
  'w': 1,   // C#
  'e': 3,   // D#
  't': 6,   // F#
  'y': 8,   // G#
  'u': 10,  // A#
  // Second octave - white keys (home row continued + bottom row)
  'k': 12,  // C
  'l': 14,  // D
  ';': 16,  // E
  "'": 17,  // F
  'z': 19,  // G
  'x': 21,  // A
  'c': 23,  // B
  // Second octave - black keys (QWERTY row continued)
  'o': 13,  // C#
  'p': 15,  // D#
  '[': 18,  // F#
  ']': 20,  // G#
  '\\': 22, // A#
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

export interface PianoKeyData {
  id: string;
  note: string;
  midiNumber: number;
  isBlack: boolean;
  keyboardKey: string | null;
  frequency: number;
}

// Build a reverse lookup: semitone offset → keyboard key
const SEMITONE_TO_KEY: Record<number, string> = {};
for (const [key, semitone] of Object.entries(KEY_TO_SEMITONE)) {
  SEMITONE_TO_KEY[semitone] = key;
}

const TOTAL_SEMITONES = 24; // 2 full octaves

export function generatePianoKeys(octaveOffset: number): PianoKeyData[] {
  const keys: PianoKeyData[] = [];

  for (let semitone = 0; semitone < TOTAL_SEMITONES; semitone++) {
    const midi = BASE_MIDI + semitone + octaveOffset * 12;
    const noteIndex = midi % 12;
    const octave = Math.floor(midi / 12) - 1;
    const noteDef = CHROMATIC_SCALE[noteIndex];
    keys.push({
      id: `${noteDef.note}${octave}`,
      note: `${noteDef.note}${octave}`,
      midiNumber: midi,
      isBlack: noteDef.isBlack,
      keyboardKey: SEMITONE_TO_KEY[semitone] ?? null,
      frequency: midiToFrequency(midi),
    });
  }

  return keys;
}

export { KEY_TO_SEMITONE };
