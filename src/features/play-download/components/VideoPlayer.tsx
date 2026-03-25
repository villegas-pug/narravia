'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function VideoPlayer() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get('video');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (videoId) {
      const url = `${window.location.origin}/api/outputs/${videoId}`;
      setVideoUrl(url);
    }
  }, [videoId]);

  if (!videoId) {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No hay video para mostrar</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="pt-6">
          <p className="text-center text-red-500">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Tu Video</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          {videoUrl && (
            <video
              controls
              className="w-full h-full"
              onError={(e) => setError('Error al cargar el video')}
            >
              <source src={videoUrl} type="video/mp4" />
              Tu navegador no soporta la reproducción de video.
            </video>
          )}
        </div>
        
        <div className="flex justify-center gap-4">
          <a href={videoUrl || `#`} download={`video-${videoId}.mp4`}>
            <Button>Descargar Video</Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}