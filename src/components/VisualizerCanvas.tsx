import { useRef } from 'react';
import { useVisualizer } from '../hooks/useVisualizer';
import type { VisualMode } from '../utils/visualModes';
import './VisualizerCanvas.css';

interface VisualizerCanvasProps {
  getAnalyser: () => AnalyserNode | null;
  activeNotes: Set<number>;
  mode: VisualMode;
  intensity: number;
}

export function VisualizerCanvas({ getAnalyser, activeNotes, mode, intensity }: VisualizerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useVisualizer({ canvasRef, getAnalyser, activeNotes, mode, intensity });

  if (mode === 'off') return null;

  return <canvas ref={canvasRef} className="visualizer-canvas" />;
}
