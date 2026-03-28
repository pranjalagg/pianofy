import { describe, it, expect } from 'vitest';
import {
  getChordMidiNotes,
  getChordName,
  getDiatonicChordNames,
  ARPEGGIO_PATTERN,
} from '../chords';

describe('getChordMidiNotes', () => {
  it('returns C major triad (I) with no transpose at bass octave 36', () => {
    const notes = getChordMidiNotes(0, 0, 36);
    expect(notes).toEqual([36, 40, 43]);
  });

  it('returns D minor triad (ii) in C major', () => {
    const notes = getChordMidiNotes(1, 0, 36);
    expect(notes).toEqual([38, 41, 45]);
  });

  it('returns E minor triad (iii) in C major', () => {
    const notes = getChordMidiNotes(2, 0, 36);
    expect(notes).toEqual([40, 43, 47]);
  });

  it('returns F major triad (IV) in C major', () => {
    const notes = getChordMidiNotes(3, 0, 36);
    expect(notes).toEqual([41, 45, 48]);
  });

  it('returns G major triad (V) in C major', () => {
    const notes = getChordMidiNotes(4, 0, 36);
    expect(notes).toEqual([43, 47, 50]);
  });

  it('returns A minor triad (vi) in C major', () => {
    const notes = getChordMidiNotes(5, 0, 36);
    expect(notes).toEqual([45, 48, 52]);
  });

  it('returns B diminished triad (vii°) in C major', () => {
    const notes = getChordMidiNotes(6, 0, 36);
    expect(notes).toEqual([47, 50, 53]);
  });

  it('transposes correctly — degree I with transpose +2 gives D major', () => {
    const notes = getChordMidiNotes(0, 2, 36);
    expect(notes).toEqual([38, 42, 45]);
  });

  it('transposes correctly — degree I with transpose -1 gives B major', () => {
    const notes = getChordMidiNotes(0, -1, 36);
    expect(notes).toEqual([35, 39, 42]);
  });

  it('uses the provided baseMidi for octave placement', () => {
    const notes = getChordMidiNotes(0, 0, 48);
    expect(notes).toEqual([48, 52, 55]);
  });
});

describe('getChordName', () => {
  it('returns "C" for degree 0 with no transpose', () => {
    expect(getChordName(0, 0)).toBe('C');
  });

  it('returns "Dm" for degree 1 with no transpose', () => {
    expect(getChordName(1, 0)).toBe('Dm');
  });

  it('returns "Em" for degree 2 with no transpose', () => {
    expect(getChordName(2, 0)).toBe('Em');
  });

  it('returns "B°" for degree 6 with no transpose', () => {
    expect(getChordName(6, 0)).toBe('B°');
  });

  it('transposes — degree 0 with +2 gives "D"', () => {
    expect(getChordName(0, 2)).toBe('D');
  });

  it('transposes — degree 1 with +2 gives "Em"', () => {
    expect(getChordName(1, 2)).toBe('Em');
  });

  it('handles negative transpose — degree 0 with -1 gives "B"', () => {
    expect(getChordName(0, -1)).toBe('B');
  });

  it('handles wrap-around — degree 4 with +7 gives "D"', () => {
    expect(getChordName(4, 7)).toBe('D');
  });
});

describe('getDiatonicChordNames', () => {
  it('returns all 7 chord names for C major', () => {
    expect(getDiatonicChordNames(0)).toEqual(['C', 'Dm', 'Em', 'F', 'G', 'Am', 'B°']);
  });

  it('returns all 7 chord names for D major (transpose +2)', () => {
    expect(getDiatonicChordNames(2)).toEqual(['D', 'Em', 'F#m', 'G', 'A', 'Bm', 'C#°']);
  });
});

describe('ARPEGGIO_PATTERN', () => {
  it('is an array of 4 indices cycling through chord tones', () => {
    expect(ARPEGGIO_PATTERN).toEqual([0, 1, 2, 0]);
  });
});
