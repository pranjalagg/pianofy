import { useEffect, useRef, type RefObject } from 'react';
import { RENDERERS, createVisualizerState, type VisualMode, type VisualizerState } from '../utils/visualModes';

interface UseVisualizerOptions {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  getAnalyser: () => AnalyserNode | null;
  activeNotes: Set<number>;
  mode: VisualMode;
  intensity: number;
}

export function useVisualizer({ canvasRef, getAnalyser, activeNotes, mode, intensity }: UseVisualizerOptions) {
  const stateRef = useRef<VisualizerState>(createVisualizerState());
  const activeNotesRef = useRef(activeNotes);
  activeNotesRef.current = activeNotes;

  const modeRef = useRef(mode);
  modeRef.current = mode;

  const intensityRef = useRef(intensity);
  intensityRef.current = intensity;

  useEffect(() => {
    if (mode === 'off') return;

    let animId = 0;

    const frequencyData = new Uint8Array(128);
    const waveformData = new Uint8Array(128);

    const loop = (time: number) => {
      const canvas = canvasRef.current;
      const analyser = getAnalyser();
      const currentMode = modeRef.current;

      if (!canvas || currentMode === 'off') {
        animId = requestAnimationFrame(loop);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animId = requestAnimationFrame(loop);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
      }

      if (analyser) {
        analyser.getByteFrequencyData(frequencyData);
        analyser.getByteTimeDomainData(waveformData);
      } else {
        frequencyData.fill(0);
        waveformData.fill(128);
      }

      ctx.globalAlpha = intensityRef.current;
      ctx.save();

      const renderer = RENDERERS[currentMode];
      renderer(ctx, frequencyData, waveformData, activeNotesRef.current, time, rect.width, rect.height, stateRef.current);

      ctx.restore();
      ctx.globalAlpha = 1;

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animId);
  }, [canvasRef, getAnalyser, mode]);
}
