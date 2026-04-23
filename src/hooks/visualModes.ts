export type VisualMode = 'off' | 'particles' | 'waveform' | 'bars' | 'ripples';

export interface VisualModeOption {
  id: VisualMode;
  label: string;
}

export const VISUAL_MODES: VisualModeOption[] = [
  { id: 'off', label: 'Off' },
  { id: 'particles', label: 'Particles' },
  { id: 'waveform', label: 'Waveform' },
  { id: 'bars', label: 'Bars' },
  { id: 'ripples', label: 'Ripples' },
];

export type RenderFn = (
  ctx: CanvasRenderingContext2D,
  frequencyData: Uint8Array,
  waveformData: Uint8Array,
  activeNotes: Set<number>,
  time: number,
  width: number,
  height: number,
  state: VisualizerState,
) => void;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  hue: number;
  size: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  hue: number;
  life: number;
}

export interface VisualizerState {
  particles: Particle[];
  ripples: Ripple[];
  prevNoteCount: number;
}

export function createVisualizerState(): VisualizerState {
  return { particles: [], ripples: [], prevNoteCount: 0 };
}

function midiToHue(midi: number): number {
  return ((midi - 36) % 12) * 30;
}

function averageAmplitude(frequencyData: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < frequencyData.length; i++) {
    sum += frequencyData[i];
  }
  return sum / frequencyData.length / 255;
}

// --- Particles mode ---

function spawnParticles(state: VisualizerState, activeNotes: Set<number>, width: number, height: number) {
  for (const midi of activeNotes) {
    if (Math.random() > 0.3) continue;
    const hue = midiToHue(midi);
    state.particles.push({
      x: width * 0.2 + Math.random() * width * 0.6,
      y: height * 0.6 + Math.random() * height * 0.3,
      vx: (Math.random() - 0.5) * 3,
      vy: -(1.5 + Math.random() * 3),
      life: 1,
      maxLife: 60 + Math.random() * 90,
      hue,
      size: 2 + Math.random() * 4,
    });
  }
}

const renderParticles: RenderFn = (ctx, frequencyData, _waveform, activeNotes, _time, width, height, state) => {
  const amp = averageAmplitude(frequencyData);

  spawnParticles(state, activeNotes, width, height);

  ctx.clearRect(0, 0, width, height);

  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.x += p.vx;
    p.vy -= 0.02;
    p.y += p.vy;
    p.life++;

    const progress = p.life / p.maxLife;
    if (progress >= 1) {
      state.particles.splice(i, 1);
      continue;
    }

    const alpha = 1 - progress;
    const scale = 1 + amp * 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * scale, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${p.hue}, 80%, 60%, ${alpha})`;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * scale * 2, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${p.hue}, 80%, 60%, ${alpha * 0.15})`;
    ctx.fill();
  }

  if (state.particles.length > 500) {
    state.particles.splice(0, state.particles.length - 500);
  }
};

// --- Waveform mode ---

const renderWaveform: RenderFn = (ctx, _frequencyData, waveformData, activeNotes, time, width, height) => {
  ctx.clearRect(0, 0, width, height);

  const hasNotes = activeNotes.size > 0;
  const centerY = height / 2;
  const amplitude = hasNotes ? height * 0.35 : height * 0.05;
  const sliceWidth = width / waveformData.length;

  let dominantHue = 200;
  if (activeNotes.size > 0) {
    const midis = Array.from(activeNotes);
    dominantHue = midiToHue(midis[midis.length - 1]);
  }

  for (let layer = 2; layer >= 0; layer--) {
    const layerAlpha = 0.15 + layer * 0.25;
    const layerOffset = (2 - layer) * 4;

    ctx.beginPath();
    ctx.moveTo(0, centerY);

    for (let i = 0; i < waveformData.length; i++) {
      const v = (waveformData[i] / 128.0) - 1;
      const y = centerY + v * amplitude + Math.sin(time * 0.001 + i * 0.02) * layerOffset;
      if (i === 0) ctx.moveTo(0, y);
      else ctx.lineTo(i * sliceWidth, y);
    }

    ctx.strokeStyle = `hsla(${dominantHue + layer * 20}, 80%, 55%, ${layerAlpha})`;
    ctx.lineWidth = 2 + layer;
    ctx.stroke();
  }

  if (hasNotes) {
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    for (let i = 0; i < waveformData.length; i++) {
      const v = (waveformData[i] / 128.0) - 1;
      const y = centerY + v * amplitude;
      if (i === 0) ctx.moveTo(0, y);
      else ctx.lineTo(i * sliceWidth, y);
    }
    ctx.strokeStyle = `hsla(${dominantHue}, 90%, 65%, 0.9)`;
    ctx.lineWidth = 2;
    ctx.shadowColor = `hsla(${dominantHue}, 90%, 65%, 0.6)`;
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
};

// --- Frequency bars mode ---

const renderBars: RenderFn = (ctx, frequencyData, _waveform, activeNotes, _time, width, height) => {
  ctx.clearRect(0, 0, width, height);

  const barCount = frequencyData.length / 2;
  const barWidth = width / barCount;
  const gap = 1;

  let dominantHue = 20;
  if (activeNotes.size > 0) {
    const midis = Array.from(activeNotes);
    dominantHue = midiToHue(midis[midis.length - 1]);
  }

  for (let i = 0; i < barCount; i++) {
    const value = frequencyData[i] / 255;
    const barHeight = value * height * 0.8;
    const x = i * barWidth + gap / 2;
    const hue = dominantHue + (i / barCount) * 60;

    const gradient = ctx.createLinearGradient(x, height, x, height - barHeight);
    gradient.addColorStop(0, `hsla(${hue}, 70%, 40%, 0.8)`);
    gradient.addColorStop(1, `hsla(${hue + 30}, 85%, 60%, 0.9)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(x, height - barHeight, barWidth - gap, barHeight);

    if (value > 0.5) {
      ctx.fillStyle = `hsla(${hue + 30}, 90%, 70%, ${(value - 0.5) * 0.6})`;
      ctx.fillRect(x, height - barHeight - 4, barWidth - gap, 4);
    }
  }

  if (activeNotes.size > 0) {
    const amp = averageAmplitude(frequencyData);
    const mirrorHeight = height * 0.15 * amp;
    for (let i = 0; i < barCount; i++) {
      const value = frequencyData[i] / 255;
      const barHeight = value * mirrorHeight;
      const x = i * barWidth + gap / 2;
      const hue = dominantHue + (i / barCount) * 60;
      ctx.fillStyle = `hsla(${hue}, 70%, 50%, 0.15)`;
      ctx.fillRect(x, height, barWidth - gap, barHeight);
    }
  }
};

// --- Ripples mode ---

function spawnRipples(state: VisualizerState, activeNotes: Set<number>, width: number, height: number) {
  const currentCount = activeNotes.size;
  if (currentCount > state.prevNoteCount) {
    for (const midi of activeNotes) {
      state.ripples.push({
        x: width * 0.3 + ((midi - 36) % 48) / 48 * width * 0.4,
        y: height * 0.4 + Math.random() * height * 0.2,
        radius: 0,
        maxRadius: 150 + Math.random() * 200,
        hue: midiToHue(midi),
        life: 1,
      });
    }
  }
  state.prevNoteCount = currentCount;
}

const renderRipples: RenderFn = (ctx, frequencyData, _waveform, activeNotes, _time, width, height, state) => {
  ctx.clearRect(0, 0, width, height);

  const amp = averageAmplitude(frequencyData);
  spawnRipples(state, activeNotes, width, height);

  for (let i = state.ripples.length - 1; i >= 0; i--) {
    const r = state.ripples[i];
    const speed = 2 + amp * 3;
    r.radius += speed;
    r.life = r.radius / r.maxRadius;

    if (r.life >= 1) {
      state.ripples.splice(i, 1);
      continue;
    }

    const alpha = (1 - r.life) * 0.6;

    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(${r.hue}, 75%, 55%, ${alpha})`;
    ctx.lineWidth = 2 + (1 - r.life) * 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(${r.hue}, 75%, 55%, ${alpha * 0.3})`;
    ctx.lineWidth = 8 + (1 - r.life) * 6;
    ctx.stroke();
  }

  if (state.ripples.length > 100) {
    state.ripples.splice(0, state.ripples.length - 100);
  }
};

export const RENDERERS: Record<Exclude<VisualMode, 'off'>, RenderFn> = {
  particles: renderParticles,
  waveform: renderWaveform,
  bars: renderBars,
  ripples: renderRipples,
};
