import { useCallback, useRef } from 'react';
import { midiToFrequency } from '../utils/noteMapping';
import { getVoiceById, findNearestSample } from '../utils/voices';
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

function createReverbIR(ctx: AudioContext, duration = 1.5, decay = 2): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const buffer = ctx.createBuffer(2, length, sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return buffer;
}

export function useAudio() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const activeNotesRef = useRef<Map<number, ActiveNote>>(new Map());
  const voiceRef = useRef<VoiceConfig>(getVoiceById('grand-piano'));
  const bufferCacheRef = useRef<Map<string, AudioBuffer>>(new Map());
  const effectsBusRef = useRef<GainNode | null>(null);
  const reverbWetRef = useRef<GainNode | null>(null);
  const chorusWetRef = useRef<GainNode | null>(null);
  const chorusDelayRef = useRef<DelayNode | null>(null);
  const chorusLFORef = useRef<OscillatorNode | null>(null);
  const delayNodeRef = useRef<DelayNode | null>(null);
  const delayWetRef = useRef<GainNode | null>(null);
  const delayFeedbackRef = useRef<GainNode | null>(null);

  const ensureContext = useCallback(() => {
    if (!audioContextRef.current) {
      const ctx = new AudioContext();
      audioContextRef.current = ctx;

      masterGainRef.current = ctx.createGain();
      masterGainRef.current.gain.value = 0.5;
      masterGainRef.current.connect(ctx.destination);

      const masterGain = masterGainRef.current;

      effectsBusRef.current = ctx.createGain();
      effectsBusRef.current.connect(masterGain);

      const convolver = ctx.createConvolver();
      convolver.buffer = createReverbIR(ctx);
      const reverbWet = ctx.createGain();
      reverbWet.gain.value = 0.3;
      effectsBusRef.current.connect(convolver);
      convolver.connect(reverbWet);
      reverbWet.connect(masterGain);
      reverbWetRef.current = reverbWet;

      const chorusDelay = ctx.createDelay();
      chorusDelay.delayTime.value = 0.015;
      const chorusLFO = ctx.createOscillator();
      chorusLFO.frequency.value = 0.5;
      const chorusDepth = ctx.createGain();
      chorusDepth.gain.value = 0.002;
      chorusLFO.connect(chorusDepth);
      chorusDepth.connect(chorusDelay.delayTime);
      chorusLFO.start();
      const chorusWet = ctx.createGain();
      chorusWet.gain.value = 0.3;
      effectsBusRef.current.connect(chorusDelay);
      chorusDelay.connect(chorusWet);
      chorusWet.connect(masterGain);
      chorusWetRef.current = chorusWet;
      chorusDelayRef.current = chorusDelay;
      chorusLFORef.current = chorusLFO;

      const delayNode = ctx.createDelay();
      delayNode.delayTime.value = 0.35;
      const delayFeedback = ctx.createGain();
      delayFeedback.gain.value = 0.35;
      const delayWet = ctx.createGain();
      delayWet.gain.value = 0;
      effectsBusRef.current.connect(delayNode);
      delayNode.connect(delayFeedback);
      delayFeedback.connect(delayNode);
      delayNode.connect(delayWet);
      delayWet.connect(masterGain);
      delayNodeRef.current = delayNode;
      delayWetRef.current = delayWet;
      delayFeedbackRef.current = delayFeedback;
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return {
      ctx: audioContextRef.current,
      masterGain: masterGainRef.current!,
      effectsBus: effectsBusRef.current!,
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

    const { ctx, effectsBus } = ensureContext();
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
    gainNode.connect(effectsBus);

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
    } else if (voice.type === 'multi-sample') {
      const nearest = findNearestSample(voice.samples, midi);
      const buffer = bufferCacheRef.current.get(nearest.url);
      if (buffer) {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = Math.pow(2, (midi - nearest.midi) / 12);
        source.connect(gainNode);
        source.start(now);
        activeNotesRef.current.set(midi, { kind: 'sample', source, gainNode });
      } else {
        const frequency = midiToFrequency(midi);
        const oscillators: OscillatorNode[] = [];
        for (const oscConfig of voice.fallbackOscillators) {
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
    } else if (voice.type === 'multi-sample') {
      for (const sample of voice.samples) {
        loadSample(sample.url);
      }
    }
  }, [loadSample]);

  const setReverb = useCallback((amount: number) => {
    if (reverbWetRef.current) {
      reverbWetRef.current.gain.value = amount;
    }
  }, []);

  const setChorus = useCallback((enabled: boolean) => {
    if (chorusWetRef.current) {
      chorusWetRef.current.gain.value = enabled ? 0.3 : 0;
    }
  }, []);

  const setDelay = useCallback((enabled: boolean) => {
    if (delayWetRef.current) {
      delayWetRef.current.gain.value = enabled ? 0.4 : 0;
    }
  }, []);

  return { playNote, stopNote, setVolume, setVoice, setReverb, setChorus, setDelay };
}
