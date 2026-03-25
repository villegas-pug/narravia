import { create } from 'zustand';
import type { PipelineStatus, PipelineProgress } from '@/shared/types';
import { PIPELINE_MESSAGES } from '@/shared/constants';

const statusToMessageKey = (status: PipelineStatus): string => {
  const mapping: Record<PipelineStatus, string> = {
    idle: 'IDLE',
    analyzing: 'ANALYZING',
    generatingCharacters: 'GENERATING_CHARACTERS',
    generatingIntro: 'GENERATING_INTRO',
    processingScene: 'PROCESSING_SCENE',
    generatingOutro: 'GENERATING_OUTRO',
    assembling: 'ASSEMBLING',
    complete: 'COMPLETE',
    error: 'ERROR',
  };
  return mapping[status] || status.toUpperCase();
};

interface PipelineStore extends PipelineProgress {
  setProgress: (status: PipelineStatus, currentScene?: number, totalScenes?: number) => void;
  setVideo: (url: string) => void;
  setError: (message: string) => void;
  reset: () => void;
}

const initialState: PipelineProgress = {
  status: 'idle',
  currentScene: 0,
  totalScenes: 0,
  videoUrl: null,
  error: null,
  message: PIPELINE_MESSAGES.IDLE,
};

export const usePipelineStore = create<PipelineStore>((set) => ({
  ...initialState,

  setProgress: (status, currentScene, totalScenes) =>
    set((state) => {
      const key = statusToMessageKey(status) as keyof typeof PIPELINE_MESSAGES;
      return {
        status,
        currentScene: currentScene ?? state.currentScene,
        totalScenes: totalScenes ?? state.totalScenes,
        message: PIPELINE_MESSAGES[key] ?? status,
      };
    }),

  setVideo: (videoUrl) =>
    set({
      videoUrl,
      status: 'complete',
      message: PIPELINE_MESSAGES.COMPLETE,
    }),

  setError: (error) =>
    set({
      status: 'error',
      error,
      message: PIPELINE_MESSAGES.ERROR,
    }),

  reset: () => set(initialState),
}));
