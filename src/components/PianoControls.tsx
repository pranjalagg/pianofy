import './PianoControls.css';

interface PianoControlsProps {
  octaveOffset: number;
  volume: number;
  onOctaveChange: (delta: number) => void;
  onVolumeChange: (volume: number) => void;
}

export function PianoControls({
  octaveOffset,
  volume,
  onOctaveChange,
  onVolumeChange,
}: PianoControlsProps) {
  const currentOctave = 4 + octaveOffset;

  return (
    <div className="piano-controls">
      <div className="piano-controls__group">
        <span className="piano-controls__label">Octave</span>
        <div className="piano-controls__octave">
          <button
            className="piano-controls__btn"
            onClick={() => onOctaveChange(-1)}
            disabled={octaveOffset <= -3}
            title="Shift down (← arrow key)"
          >
            ◀
          </button>
          <span className="piano-controls__value">C{currentOctave} – B{currentOctave + 1}</span>
          <button
            className="piano-controls__btn"
            onClick={() => onOctaveChange(1)}
            disabled={octaveOffset >= 3}
            title="Shift up (→ arrow key)"
          >
            ▶
          </button>
        </div>
      </div>

      <div className="piano-controls__group">
        <span className="piano-controls__label">Volume</span>
        <input
          type="range"
          className="piano-controls__slider"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
        />
      </div>
    </div>
  );
}
