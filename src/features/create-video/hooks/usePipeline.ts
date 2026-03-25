import { useEffect, useState } from 'react';
import { usePipelineStore } from '@/lib/store';
import type { PipelineProgress } from '@/shared/types';

export function usePipeline(jobId: string) {
  const store = usePipelineStore();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!jobId) return;

    const eventSource = new EventSource(`/api/progress/${jobId}`);

    eventSource.onopen = () => setConnected(true);

    eventSource.onmessage = (event) => {
      try {
        const data: PipelineProgress = JSON.parse(event.data);
        
        if (data.status === 'complete') {
          store.setVideo(data.videoUrl!);
        } else if (data.status === 'error') {
          store.setError(data.error || 'Unknown error');
        } else {
          store.setProgress(data.status, data.currentScene, data.totalScenes);
        }
      } catch (e) {
        console.error('Failed to parse SSE message:', e);
      }
    };

    eventSource.onerror = () => {
      setConnected(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [jobId]);

  return { ...store, connected };
}