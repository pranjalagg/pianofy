import { VOICES } from '../utils/voices';
import './VoiceSelector.css';

interface VoiceSelectorProps {
  voiceId: string;
  onVoiceChange: (voiceId: string) => void;
}

export function VoiceSelector({ voiceId, onVoiceChange }: VoiceSelectorProps) {
  return (
    <div className="voice-selector">
      {VOICES.map((voice) => (
        <button
          key={voice.id}
          className={
            'voice-selector__btn' +
            (voice.id === voiceId ? ' voice-selector__btn--active' : '')
          }
          onClick={() => onVoiceChange(voice.id)}
        >
          {voice.name}
        </button>
      ))}
    </div>
  );
}
