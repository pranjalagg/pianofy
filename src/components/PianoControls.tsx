import { VOICES } from '../utils/voices';
import './PianoControls.css';

interface PianoControlsProps {
  octaveOffset: number;
  volume: number;
  transpose: number;
  voiceId: string;
  onOctaveChange: (delta: number) => void;
  onVolumeChange: (volume: number) => void;
  onTransposeChange: (value: number) => void;
  onVoiceChange: (voiceId: string) => void;
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
  voiceId,
  onOctaveChange,
  onVolumeChange,
  onTransposeChange,
  onVoiceChange,
}: PianoControlsProps) {
  const currentOctave = 4 + octaveOffset;

  return (
    <div className="piano-controls">
      <div className="piano-controls__row">
        <div className="piano-controls__group">
          <span className="piano-controls__label">Octave</span>
          <div className="piano-controls__stepper">
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
          <span className="piano-controls__label">Transpose</span>
          <div className="piano-controls__stepper">
            <button
              className="piano-controls__btn"
              onClick={() => onTransposeChange(transpose - 1)}
              disabled={transpose <= -6}
            >
              −
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

      <div className="piano-controls__row">
        <div className="piano-controls__group">
          <span className="piano-controls__label">Voice</span>
          <div className="piano-controls__voices">
            {VOICES.map((voice) => (
              <button
                key={voice.id}
                className={
                  'piano-controls__voice-btn' +
                  (voice.id === voiceId ? ' piano-controls__voice-btn--active' : '')
                }
                onClick={() => onVoiceChange(voice.id)}
              >
                {voice.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
