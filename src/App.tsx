import { useState, useCallback, useRef } from 'react';
import { PianoKeyboard } from './components/PianoKeyboard';
import { PianoControls } from './components/PianoControls';
import { VoiceSelector } from './components/VoiceSelector';
import { useAudio } from './hooks/useAudio';
import { useKeyboard } from './hooks/useKeyboard';
import { useTheme } from './hooks/useTheme';
import './App.css';

function App() {
  const [octaveOffset, setOctaveOffset] = useState(0);
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const [volume, setVolume] = useState(0.5);
  const [transpose, setTranspose] = useState(0);
  const [voiceId, setVoiceId] = useState('grand-piano');
  const [reverb, setReverb] = useState(0.3);
  const [chorusOn, setChorusOn] = useState(true);
  const [delayOn, setDelayOn] = useState(false);
  const { playNote, stopNote, setVolume: setAudioVolume, setVoice, setReverb: setAudioReverb, setChorus: setAudioChorus, setDelay: setAudioDelay } = useAudio();
  const { theme, toggleTheme } = useTheme();

  const transposedMapRef = useRef<Map<number, number>>(new Map());

  const handleNoteOn = useCallback(
    (midi: number) => {
      const transposedMidi = midi + transpose;
      transposedMapRef.current.set(midi, transposedMidi);
      playNote(transposedMidi);
      setActiveNotes((prev) => new Set(prev).add(midi));
    },
    [playNote, transpose],
  );

  const handleNoteOff = useCallback(
    (midi: number) => {
      const transposedMidi = transposedMapRef.current.get(midi);
      if (transposedMidi !== undefined) {
        stopNote(transposedMidi);
        transposedMapRef.current.delete(midi);
      }
      setActiveNotes((prev) => {
        const next = new Set(prev);
        next.delete(midi);
        return next;
      });
    },
    [stopNote],
  );

  const handleOctaveChange = useCallback((delta: number) => {
    setOctaveOffset((prev) => Math.max(-3, Math.min(3, prev + delta)));
  }, []);

  const handleVolumeChange = useCallback(
    (v: number) => {
      setVolume(v);
      setAudioVolume(v);
    },
    [setAudioVolume],
  );

  const handleTransposeChange = useCallback((value: number) => {
    setTranspose(Math.max(-6, Math.min(6, value)));
  }, []);

  const handleReverbChange = useCallback(
    (amount: number) => {
      setReverb(amount);
      setAudioReverb(amount);
    },
    [setAudioReverb],
  );

  const handleChorusToggle = useCallback(() => {
    setChorusOn((prev) => {
      const next = !prev;
      setAudioChorus(next);
      return next;
    });
  }, [setAudioChorus]);

  const handleDelayToggle = useCallback(() => {
    setDelayOn((prev) => {
      const next = !prev;
      setAudioDelay(next);
      return next;
    });
  }, [setAudioDelay]);

  const handleVoiceChange = useCallback(
    (id: string) => {
      setVoiceId(id);
      setVoice(id);
    },
    [setVoice],
  );

  useKeyboard({
    octaveOffset,
    onNoteOn: handleNoteOn,
    onNoteOff: handleNoteOff,
    onOctaveChange: handleOctaveChange,
  });

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__title-row">
          <h1 className="app__title">pianofy</h1>
          <button
            className="app__theme-toggle"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? '\u263E' : '\u2600'}
          </button>
        </div>
        <p className="app__subtitle">Play with your keyboard</p>
      </header>

      <PianoControls
        octaveOffset={octaveOffset}
        volume={volume}
        transpose={transpose}
        reverb={reverb}
        chorusOn={chorusOn}
        delayOn={delayOn}
        onOctaveChange={handleOctaveChange}
        onVolumeChange={handleVolumeChange}
        onTransposeChange={handleTransposeChange}
        onReverbChange={handleReverbChange}
        onChorusToggle={handleChorusToggle}
        onDelayToggle={handleDelayToggle}
      />

      <PianoKeyboard
        octaveOffset={octaveOffset}
        activeNotes={activeNotes}
        onNoteOn={handleNoteOn}
        onNoteOff={handleNoteOff}
      />

      <VoiceSelector voiceId={voiceId} onVoiceChange={handleVoiceChange} />

      <footer className="app__footer">
        <div className="app__hints">
          <span><kbd>A</kbd>–<kbd>'</kbd> white keys</span>
          <span><kbd>W</kbd> <kbd>E</kbd> <kbd>T</kbd> <kbd>Y</kbd> <kbd>U</kbd> black keys</span>
          <span><kbd>←</kbd> <kbd>→</kbd> octave</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
