export interface OscillatorConfig {
  type: OscillatorType;
  /** Frequency multiplier relative to the base note (1 = unison, 2 = octave up) */
  ratio: number;
  /** Detune in cents (100 cents = 1 semitone) */
  detune: number;
  /** Gain level for this oscillator (0-1) */
  gain: number;
}

export interface EnvelopeConfig {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export interface OscillatorVoice {
  id: string;
  name: string;
  type: 'oscillator';
  oscillators: OscillatorConfig[];
  envelope: EnvelopeConfig;
  glowIntensity: number;
}

export interface SampleVoice {
  id: string;
  name: string;
  type: 'sample';
  sampleUrl: string;
  baseMidi: number;
  loop: boolean;
  envelope: EnvelopeConfig;
  glowIntensity: number;
}

export type VoiceConfig = OscillatorVoice | SampleVoice;

export const VOICES: VoiceConfig[] = [
  {
    id: 'grand-piano',
    name: 'Grand Piano',
    type: 'oscillator',
    oscillators: [
      { type: 'triangle', ratio: 1, detune: 0, gain: 1.0 },
      { type: 'sine', ratio: 2, detune: 0, gain: 0.15 },
    ],
    envelope: { attack: 0.01, decay: 0.3, sustain: 0.3, release: 0.3 },
    glowIntensity: 1.0,
  },
  {
    id: 'electric-piano',
    name: 'Electric Piano',
    type: 'oscillator',
    oscillators: [
      { type: 'sine', ratio: 1, detune: 0, gain: 1.0 },
      { type: 'sine', ratio: 3, detune: 7, gain: 0.25 },
      { type: 'sine', ratio: 1, detune: -6, gain: 0.3 },
    ],
    envelope: { attack: 0.005, decay: 0.6, sustain: 0.4, release: 0.4 },
    glowIntensity: 0.7,
  },
  {
    id: 'harmonium',
    name: 'Harmonium',
    type: 'sample',
    sampleUrl: '/samples/harmonium.wav',
    baseMidi: 48,
    loop: true,
    envelope: { attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.15 },
    glowIntensity: 0.4,
  },
  {
    id: 'synth-pad',
    name: 'Synth Pad',
    type: 'oscillator',
    oscillators: [
      { type: 'sawtooth', ratio: 1, detune: -8, gain: 0.5 },
      { type: 'sawtooth', ratio: 1, detune: 8, gain: 0.5 },
    ],
    envelope: { attack: 0.3, decay: 0.5, sustain: 0.6, release: 0.8 },
    glowIntensity: 0.4,
  },
  {
    id: 'music-box',
    name: 'Music Box',
    type: 'oscillator',
    oscillators: [
      { type: 'sine', ratio: 1, detune: 0, gain: 1.0 },
    ],
    envelope: { attack: 0.001, decay: 0.15, sustain: 0.05, release: 0.5 },
    glowIntensity: 1.0,
  },
];

export function getVoiceById(id: string): VoiceConfig {
  return VOICES.find((v) => v.id === id) ?? VOICES[0];
}
