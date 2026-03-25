export interface Character {
  id: string;
  nombre: string;
  descripcionVisual: string;
}

export interface Scene {
  numero: number;
  duracionSegundos: number;
  personajesPresentes: string[];
  promptImagen: string;
  textoNarracion: string;
}

export interface StoryAnalysis {
  titulo: string;
  personajes: Character[];
  escenas: Scene[];
}

export type PipelineStatus = 
  | 'idle'
  | 'analyzing'
  | 'generatingCharacters'
  | 'generatingIntro'
  | 'processingScene'
  | 'generatingOutro'
  | 'assembling'
  | 'complete'
  | 'error';

export interface PipelineProgress {
  status: PipelineStatus;
  currentScene: number;
  totalScenes: number;
  videoUrl: string | null;
  error: string | null;
  message: string;
}

export interface CreateVideoRequest {
  story: string;
  numScenes: number;
  introText?: string;
  outroText?: string;
  includeIntro?: boolean;
  includeOutro?: boolean;
}

export interface CreateVideoResponse {
  jobId: string;
}

export type SSEEventType = 'progress' | 'complete' | 'error';

export interface SSEEvent {
  type: SSEEventType;
  data: PipelineProgress;
}

export function parseDurationToSeconds(duration: string): number {
  const parts = duration.split(':').map(Number);
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  }
  return parseInt(duration) || 0;
}

export function formatSecondsToHHMMSS(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}