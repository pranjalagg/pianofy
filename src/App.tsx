import { useState, useCallback } from 'react';
import { PianoKeyboard } from './components/PianoKeyboard';
import { PianoControls } from './components/PianoControls';
import { useAudio } from './hooks/useAudio';
import { useKeyboard } from './hooks/useKeyboard';
import './App.css';

function App() {
  const [octaveOffset, setOctaveOffset] = useState(0);
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const [volume, setVolume] = useState(0.5);
  const { playNote, stopNote, setVolume: setAudioVolume } = useAudio();

  const handleNoteOn = useCallback(
    (midi: number) => {
      playNote(midi);
      setActiveNotes((prev) => new Set(prev).add(midi));
    },
    [playNote],
  );

  const handleNoteOff = useCallback(
    (midi: number) => {
      stopNote(midi);
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

  useKeyboard({
    octaveOffset,
    onNoteOn: handleNoteOn,
    onNoteOff: handleNoteOff,
    onOctaveChange: handleOctaveChange,
  });

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Pianofy</h1>
        <p className="app__subtitle">Play with your keyboard</p>
      </header>

      <PianoControls
        octaveOffset={octaveOffset}
        volume={volume}
        onOctaveChange={handleOctaveChange}
        onVolumeChange={handleVolumeChange}
      />

      <PianoKeyboard
        octaveOffset={octaveOffset}
        activeNotes={activeNotes}
        onNoteOn={handleNoteOn}
        onNoteOff={handleNoteOff}
      />

      <footer className="app__footer">
        <div className="app__hints">
          <span><kbd>Z</kbd>–<kbd>M</kbd> &amp; <kbd>Q</kbd>–<kbd>U</kbd> play notes</span>
          <span><kbd>←</kbd> <kbd>→</kbd> shift octave</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
