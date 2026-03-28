import { getDiatonicChordNames } from '../utils/chords';
import './ChordBar.css';

interface ChordBarProps {
  transpose: number;
  activeChord: number | null;
  onChordToggle: (degree: number) => void;
}

export function ChordBar({ transpose, activeChord, onChordToggle }: ChordBarProps) {
  const chordNames = getDiatonicChordNames(transpose);

  return (
    <div className="chord-bar">
      <span className="chord-bar__label">Chords (1-7)</span>
      <div className="chord-bar__buttons">
        {chordNames.map((name, i) => (
          <button
            key={i}
            className={
              'chord-bar__btn' +
              (activeChord === i ? ' chord-bar__btn--active' : '')
            }
            onClick={() => onChordToggle(i)}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
