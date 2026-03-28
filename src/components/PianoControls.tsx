import './PianoControls.css';

interface PianoControlsProps {
  octaveOffset: number;
  volume: number;
  transpose: number;
  reverb: number;
  chorusOn: boolean;
  delayOn: boolean;
  onOctaveChange: (delta: number) => void;
  onVolumeChange: (volume: number) => void;
  onTransposeChange: (value: number) => void;
  onReverbChange: (amount: number) => void;
  onChorusToggle: () => void;
  onDelayToggle: () => void;
}

const SEMITONE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function formatTranspose(t: number): string {
  if (t === 0) return '0';
  return t > 0 ? `+${t}` : `${t}`;
}

function transposedKeyName(transpose: number): string {
  const index = ((transpose % 12) + 12) % 12;
  return SEMITONE_NAMES[index];
}

export function PianoControls({
  octaveOffset,
  volume,
  transpose,
  reverb,
  chorusOn,
  delayOn,
  onOctaveChange,
  onVolumeChange,
  onTransposeChange,
  onReverbChange,
  onChorusToggle,
  onDelayToggle,
}: PianoControlsProps) {
  const currentOctave = 4 + octaveOffset;

  return (
    <div className="piano-controls">
      <div className="piano-controls__group">
        <span className="piano-controls__label">Octave</span>
        <div className="piano-controls__stepper">
          <button
            className="piano-controls__btn"
            onClick={() => onOctaveChange(-1)}
            disabled={octaveOffset <= -3}
            title="Shift down (← arrow key)"
          >
            &#8722;
          </button>
          <span className="piano-controls__value">C{currentOctave}–B{currentOctave + 1}</span>
          <button
            className="piano-controls__btn"
            onClick={() => onOctaveChange(1)}
            disabled={octaveOffset >= 3}
            title="Shift up (→ arrow key)"
          >
            +
          </button>
        </div>
      </div>

      <div className="piano-controls__sep" />

      <div className="piano-controls__group">
        <span className="piano-controls__label">Transpose</span>
        <div className="piano-controls__stepper">
          <button
            className="piano-controls__btn"
            onClick={() => onTransposeChange(transpose - 1)}
            disabled={transpose <= -6}
          >
            &#8722;
          </button>
          <span className="piano-controls__value piano-controls__value--narrow">
            {formatTranspose(transpose)} ({transposedKeyName(transpose)})
          </span>
          <button
            className="piano-controls__btn"
            onClick={() => onTransposeChange(transpose + 1)}
            disabled={transpose >= 6}
          >
            +
          </button>
        </div>
      </div>

      <div className="piano-controls__sep" />

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

      <div className="piano-controls__sep" />

      <div className="piano-controls__group">
        <span className="piano-controls__label">Reverb</span>
        <input
          type="range"
          className="piano-controls__slider"
          min="0"
          max="1"
          step="0.01"
          value={reverb}
          onChange={(e) => onReverbChange(parseFloat(e.target.value))}
        />
      </div>

      <div className="piano-controls__sep" />

      <div className="piano-controls__group">
        <span className="piano-controls__label">FX</span>
        <div className="piano-controls__toggles">
          <button
            className={`piano-controls__toggle ${chorusOn ? 'piano-controls__toggle--active' : ''}`}
            onClick={onChorusToggle}
          >
            Chorus
          </button>
          <button
            className={`piano-controls__toggle ${delayOn ? 'piano-controls__toggle--active' : ''}`}
            onClick={onDelayToggle}
          >
            Delay
          </button>
        </div>
      </div>
    </div>
  );
}
