import { useState, useCallback, useRef } from 'react';
import { PianoKeyboard } from './components/PianoKeyboard';
import { PianoControls } from './components/PianoControls';
import { useAudio } from './hooks/useAudio';
import { useKeyboard } from './hooks/useKeyboard';
import './App.css';

function App() {
  const [octaveOffset, setOctaveOffset] = useState(0);
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const [volume, setVolume] = useState(0.5);
  const [transpose, setTranspose] = useState(0);
  const [voiceId, setVoiceId] = useState('grand-piano');
  const { playNote, stopNote, setVolume: setAudioVolume, setVoice } = useAudio();

  // Track which transposed MIDI is playing for each original MIDI so we can
  // stop the correct note even if transpose changes while a key is held
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
        <h1 className="app__title">Pianofy</h1>
        <p className="app__subtitle">Play with your keyboard</p>
      </header>

      <PianoControls
        octaveOffset={octaveOffset}
        volume={volume}
        transpose={transpose}
        voiceId={voiceId}
        onOctaveChange={handleOctaveChange}
        onVolumeChange={handleVolumeChange}
        onTransposeChange={handleTransposeChange}
        onVoiceChange={handleVoiceChange}
      />

      <PianoKeyboard
        octaveOffset={octaveOffset}
        activeNotes={activeNotes}
        onNoteOn={handleNoteOn}
        onNoteOff={handleNoteOff}
      />

      <footer className="app__footer">
        <div className="app__hints">
          <span><kbd>A</kbd>–<kbd>'</kbd> play white keys &middot; <kbd>W</kbd> <kbd>E</kbd> <kbd>T</kbd> <kbd>Y</kbd> <kbd>U</kbd> <kbd>O</kbd> <kbd>P</kbd> play black keys</span>
          <span><kbd>←</kbd> <kbd>→</kbd> shift octave</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
