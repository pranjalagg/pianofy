import { getChordNamesWithQualities, cycleQuality } from '../utils/chords';
import type { ChordQuality } from '../utils/chords';
import type { ChordMode } from '../hooks/useChords';
import './ChordBar.css';

interface ChordBarProps {
  transpose: number;
  activeChord: number | null;
  mode: ChordMode;
  qualities: ChordQuality[];
  onChordToggle: (degree: number) => void;
  onModeChange: (mode: ChordMode) => void;
  onQualityChange: (degree: number, quality: ChordQuality) => void;
}

export function ChordBar({
  transpose,
  activeChord,
  mode,
  qualities,
  onChordToggle,
  onModeChange,
  onQualityChange,
}: ChordBarProps) {
  const chordNames = getChordNamesWithQualities(transpose, qualities);

  return (
    <div className="chord-bar">
      <span className="chord-bar__label">Chords</span>
      <div className="chord-bar__buttons">
        {chordNames.map((name, i) => (
          <button
            key={i}
            className={
              'chord-bar__btn' +
              (activeChord === i ? ' chord-bar__btn--active' : '')
            }
            onClick={() => onChordToggle(i)}
            onContextMenu={(e) => {
              e.preventDefault();
              onQualityChange(i, cycleQuality(qualities[i]));
            }}
            title="Click to play, right-click to change quality"
          >
            <span className="chord-bar__btn-key">{i + 1}</span>
            <span className="chord-bar__btn-name">{name}</span>
          </button>
        ))}
      </div>
      <div className="chord-bar__mode">
        <button
          className={`chord-bar__mode-btn ${mode === 'block' ? 'chord-bar__mode-btn--active' : ''}`}
          onClick={() => onModeChange('block')}
        >
          Block
        </button>
        <button
          className={`chord-bar__mode-btn ${mode === 'arpeggio' ? 'chord-bar__mode-btn--active' : ''}`}
          onClick={() => onModeChange('arpeggio')}
        >
          Arp
        </button>
      </div>
    </div>
  );
}
