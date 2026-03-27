import { useCallback, useRef } from 'react';
import { midiToFrequency } from '../utils/noteMapping';

interface ActiveNote {
  oscillator1: OscillatorNode;
  oscillator2: OscillatorNode;
  gainNode: GainNode;
}

export function useAudio() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const activeNotesRef = useRef<Map<number, ActiveNote>>(new Map());

  const ensureContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
      masterGainRef.current = audioContextRef.current.createGain();
      masterGainRef.current.gain.value = 0.5;
      masterGainRef.current.connect(audioContextRef.current.destination);
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return {
      ctx: audioContextRef.current,
      masterGain: masterGainRef.current!,
    };
  }, []);

  const playNote = useCallback((midi: number) => {
    if (activeNotesRef.current.has(midi)) return;

    const { ctx, masterGain } = ensureContext();
    const frequency = midiToFrequency(midi);
    const now = ctx.currentTime;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    // Attack
    gainNode.gain.linearRampToValueAtTime(0.6, now + 0.01);
    // Decay to sustain
    gainNode.gain.exponentialRampToValueAtTime(0.3, now + 0.3);

    // Triangle wave for body
    const osc1 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(frequency, now);

    // Sine wave one octave up for brightness
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(frequency * 2, now);

    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.15, now);

    osc1.connect(gainNode);
    osc2.connect(osc2Gain);
    osc2Gain.connect(gainNode);
    gainNode.connect(masterGain);

    osc1.start(now);
    osc2.start(now);

    activeNotesRef.current.set(midi, {
      oscillator1: osc1,
      oscillator2: osc2,
      gainNode,
    });
  }, [ensureContext]);

  const stopNote = useCallback((midi: number) => {
    const active = activeNotesRef.current.get(midi);
    if (!active) return;

    const ctx = audioContextRef.current!;
    const now = ctx.currentTime;
    const { oscillator1, oscillator2, gainNode } = active;

    // Release envelope
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    oscillator1.stop(now + 0.35);
    oscillator2.stop(now + 0.35);

    activeNotesRef.current.delete(midi);
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = volume;
    }
  }, []);

  return { playNote, stopNote, setVolume };
}
