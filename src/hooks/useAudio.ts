import { useCallback, useRef } from 'react';
import { midiToFrequency } from '../utils/noteMapping';
import { getVoiceById } from '../utils/voices';
import type { VoiceConfig } from '../utils/voices';

interface ActiveOscNote {
  kind: 'oscillator';
  oscillators: OscillatorNode[];
  gainNode: GainNode;
}

interface ActiveSampleNote {
  kind: 'sample';
  source: AudioBufferSourceNode;
  gainNode: GainNode;
}

type ActiveNote = ActiveOscNote | ActiveSampleNote;

export function useAudio() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const activeNotesRef = useRef<Map<number, ActiveNote>>(new Map());
  const voiceRef = useRef<VoiceConfig>(getVoiceById('grand-piano'));
  const bufferCacheRef = useRef<Map<string, AudioBuffer>>(new Map());

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

  const loadSample = useCallback(async (url: string): Promise<AudioBuffer | null> => {
    const cached = bufferCacheRef.current.get(url);
    if (cached) return cached;

    const { ctx } = ensureContext();
    try {
      const fullUrl = import.meta.env.BASE_URL + url.replace(/^\//, '');
      const response = await fetch(fullUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      bufferCacheRef.current.set(url, audioBuffer);
      return audioBuffer;
    } catch {
      return null;
    }
  }, [ensureContext]);

  const playNote = useCallback((midi: number) => {
    if (activeNotesRef.current.has(midi)) return;

    const { ctx, masterGain } = ensureContext();
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
    gainNode.connect(masterGain);

    if (voice.type === 'sample') {
      const buffer = bufferCacheRef.current.get(voice.sampleUrl);
      if (!buffer) return;

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = Math.pow(2, (midi - voice.baseMidi) / 12);
      source.loop = voice.loop;
      source.connect(gainNode);
      source.start(now);

      activeNotesRef.current.set(midi, { kind: 'sample', source, gainNode });
    } else {
      const frequency = midiToFrequency(midi);
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

      activeNotesRef.current.set(midi, { kind: 'oscillator', oscillators, gainNode });
    }
  }, [ensureContext]);

  const stopNote = useCallback((midi: number) => {
    const active = activeNotesRef.current.get(midi);
    if (!active) return;

    const ctx = audioContextRef.current!;
    const now = ctx.currentTime;
    const release = voiceRef.current.envelope.release;

    active.gainNode.gain.cancelScheduledValues(now);
    active.gainNode.gain.setValueAtTime(active.gainNode.gain.value, now);
    active.gainNode.gain.exponentialRampToValueAtTime(0.001, now + release);

    const stopTime = now + release + 0.05;

    if (active.kind === 'oscillator') {
      for (const osc of active.oscillators) {
        osc.stop(stopTime);
      }
    } else {
      active.source.stop(stopTime);
    }

    activeNotesRef.current.delete(midi);
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = volume;
    }
  }, []);

  const setVoice = useCallback((voiceId: string) => {
    const voice = getVoiceById(voiceId);
    voiceRef.current = voice;
    if (voice.type === 'sample') {
      loadSample(voice.sampleUrl);
    }
  }, [loadSample]);

  return { playNote, stopNote, setVolume, setVoice };
}
