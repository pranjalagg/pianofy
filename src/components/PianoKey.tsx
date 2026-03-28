import type { CSSProperties } from 'react';
import './PianoKey.css';

interface PianoKeyProps {
  note: string;
  isBlack: boolean;
  isActive: boolean;
  keyboardKey: string | null;
  style?: CSSProperties;
  glowIntensity?: number;
  onPlay: () => void;
  onStop: () => void;
}

export function PianoKey({
  note,
  isBlack,
  isActive,
  keyboardKey,
  style,
  glowIntensity,
  onPlay,
  onStop,
}: PianoKeyProps) {
  const className = [
    'piano-key',
    isBlack ? 'piano-key--black' : 'piano-key--white',
    isActive ? 'piano-key--active' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const mergedStyle: CSSProperties = {
    ...style,
    ...(glowIntensity !== undefined ? { '--glow-intensity': glowIntensity } as CSSProperties : {}),
  };

  return (
    <div
      className={className}
      style={mergedStyle}
      onMouseDown={onPlay}
      onMouseUp={onStop}
      onMouseLeave={onStop}
      onTouchStart={(e) => {
        e.preventDefault();
        onPlay();
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        onStop();
      }}
    >
      <div className="piano-key__labels">
        <span className="piano-key__note">{note}</span>
        {keyboardKey && (
          <span className="piano-key__shortcut">{keyboardKey.toUpperCase()}</span>
        )}
      </div>
    </div>
  );
}
