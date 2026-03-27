import { useCallback, useRef } from 'react';
import { midiToFrequency } from '../utils/noteMapping';
import { getVoiceById } from '../utils/voices';
import type { VoiceConfig } from '../utils/voices';

interface ActiveNote {
  oscillators: OscillatorNode[];
  gainNode: GainNode;
}

export function useAudio() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const activeNotesRef = useRef<Map<number, ActiveNote>>(new Map());
  const voiceRef = useRef<VoiceConfig>(getVoiceById('grand-piano'));

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
    const voice = voiceRef.current;
    const { envelope } = voice;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.6, now + envelope.attack);
    gainNode.gain.exponentialRampToValueAtTime(
      Math.max(envelope.sustain * 0.6, 0.001),
      now + envelope.attack + envelope.decay,
    );

    const oscillators: OscillatorNode[] = [];

    for (const oscConfig of voice.oscillators) {
      const osc = ctx.createOscillator();
      osc.type = oscConfig.type;
      osc.frequency.setValueAtTime(frequency * oscConfig.ratio, now);
      if (oscConfig.detune !== 0) {
        osc.detune.setValueAtTime(oscConfig.detune, now);
      }

      if (oscConfig.gain < 1) {
        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(oscConfig.gain, now);
        osc.connect(oscGain);
        oscGain.connect(gainNode);
      } else {
        osc.connect(gainNode);
      }

      osc.start(now);
      oscillators.push(osc);
    }

    gainNode.connect(masterGain);

    activeNotesRef.current.set(midi, { oscillators, gainNode });
  }, [ensureContext]);

  const stopNote = useCallback((midi: number) => {
    const active = activeNotesRef.current.get(midi);
    if (!active) return;

    const ctx = audioContextRef.current!;
    const now = ctx.currentTime;
    const release = voiceRef.current.envelope.release;
    const { oscillators, gainNode } = active;

    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + release);

    const stopTime = now + release + 0.05;
    for (const osc of oscillators) {
      osc.stop(stopTime);
    }

    activeNotesRef.current.delete(midi);
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = volume;
    }
  }, []);

  const setVoice = useCallback((voiceId: string) => {
    voiceRef.current = getVoiceById(voiceId);
  }, []);

  return { playNote, stopNote, setVolume, setVoice };
}
