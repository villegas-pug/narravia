export const VISUAL_STYLE = `classical watercolor painting style, soft brush strokes, warm tones,
traditional art techniques, paper texture, artistic hand-painted look, elegant composition`;

export const DEFAULT_SCENES = parseInt(process.env.DEFAULT_SCENES || '3', 10);

export const MODELS = {
  ORCHESTRATOR: 'gemini-2.5-flash-lite',
  IMAGE: 'imagen-4.0-fast-generate-001',
  TTS: 'gemini-2.5-flash-preview-tts',
} as const;

export const AUDIO_SETTINGS = {
  SAMPLE_RATE: 24000,
  FORMAT: 'WAV',
} as const;

export const PIPELINE_MESSAGES = {
  IDLE: 'Listo para generar',
  ANALYZING: 'Analizando historia...',
  GENERATING_CHARACTERS: 'Generando personajes...',
  GENERATING_INTRO: 'Generando introducción...',
  PROCESSING_SCENE: 'Procesando escena',
  GENERATING_OUTRO: 'Generando cierre...',
  ASSEMBLING: 'Ensamblando video...',
  COMPLETE: 'Video generado exitosamente',
  ERROR: 'Error en la generación',
} as const;
