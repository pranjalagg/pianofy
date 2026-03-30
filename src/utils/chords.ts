export type ChordQuality = 'major' | 'minor' | 'dim';

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

export const QUALITY_INTERVALS: Record<ChordQuality, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  dim: [0, 3, 6],
};

export const QUALITY_SUFFIXES: Record<ChordQuality, string> = {
  major: '',
  minor: 'm',
  dim: '°',
};

export const DEFAULT_QUALITIES: ChordQuality[] = ['major', 'minor', 'minor', 'major', 'major', 'minor', 'dim'];

export const QUALITIES_ORDER: ChordQuality[] = ['major', 'minor', 'dim'];

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

export function getChordMidiNotesWithQuality(
  degree: number, transpose: number, baseMidi: number, quality: ChordQuality
): number[] {
  const rootSemitone = MAJOR_SCALE_INTERVALS[degree];
  const rootMidi = baseMidi + transpose + rootSemitone;
  return QUALITY_INTERVALS[quality].map((interval) => rootMidi + interval);
}

export function getChordNameWithQuality(degree: number, transpose: number, quality: ChordQuality): string {
  const rootSemitone = MAJOR_SCALE_INTERVALS[degree] + transpose;
  const noteIndex = ((rootSemitone % 12) + 12) % 12;
  return NOTE_NAMES[noteIndex] + QUALITY_SUFFIXES[quality];
}

export function getChordNamesWithQualities(transpose: number, qualities: ChordQuality[]): string[] {
  return qualities.map((q, i) => getChordNameWithQuality(i, transpose, q));
}

export function cycleQuality(current: ChordQuality): ChordQuality {
  const idx = QUALITIES_ORDER.indexOf(current);
  return QUALITIES_ORDER[(idx + 1) % QUALITIES_ORDER.length];
}
