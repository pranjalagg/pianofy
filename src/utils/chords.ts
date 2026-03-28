const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11];

const TRIAD_INTERVALS: number[][] = [
  [0, 4, 7], // I   — major
  [0, 3, 7], // ii  — minor
  [0, 3, 7], // iii — minor
  [0, 4, 7], // IV  — major
  [0, 4, 7], // V   — major
  [0, 3, 7], // vi  — minor
  [0, 3, 6], // vii°— diminished
];

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const CHORD_SUFFIXES = ['', 'm', 'm', '', '', 'm', '°'];

export const ARPEGGIO_PATTERN = [0, 1, 2, 0];

export function getChordMidiNotes(degree: number, transpose: number, baseMidi: number): number[] {
  const rootSemitone = MAJOR_SCALE_INTERVALS[degree];
  const rootMidi = baseMidi + transpose + rootSemitone;
  return TRIAD_INTERVALS[degree].map((interval) => rootMidi + interval);
}

export function getChordName(degree: number, transpose: number): string {
  const rootSemitone = MAJOR_SCALE_INTERVALS[degree] + transpose;
  const noteIndex = ((rootSemitone % 12) + 12) % 12;
  return NOTE_NAMES[noteIndex] + CHORD_SUFFIXES[degree];
}

export function getDiatonicChordNames(transpose: number): string[] {
  return Array.from({ length: 7 }, (_, i) => getChordName(i, transpose));
}
