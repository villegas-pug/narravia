'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { usePipeline } from '@/features/create-video/hooks/usePipeline';
import { useRouter } from 'next/navigation';
import { usePipelineStore } from '@/lib/store';
import { DEFAULT_SCENES } from '@/shared/constants';

export function StoryForm() {
  const [story, setStory] = useState('');
  const [numScenes, setNumScenes] = useState(DEFAULT_SCENES);
  const [introText, setIntroText] = useState('');
  const [outroText, setOutroText] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { status, currentScene, totalScenes, message, videoUrl, error } = usePipeline(jobId || '');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!story.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/create-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          story, 
          numScenes, 
          introText: introText.trim() || undefined,
          outroText: outroText.trim() || undefined,
        }),
      });
      
      const data = await res.json();
      setJobId(data.jobId);
    } catch (err) {
      console.error('Failed to start pipeline:', err);
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    if (videoUrl) {
      const videoId = videoUrl.split('/').pop();
      router.push(`/play-download?video=${videoId}`);
    }
  };

  const progress = totalScenes > 0 ? (currentScene / totalScenes) * 100 : 0;

  if (status === 'complete' && videoUrl) {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <p className="text-green-600 font-medium">¡Video generado exitosamente!</p>
            <Button onClick={handleComplete} className="w-full">
              Ver y Descargar Video
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === 'error') {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <p className="text-red-600 font-medium">Error: {error}</p>
            <Button onClick={() => { usePipelineStore.getState().reset(); setJobId(null); }} variant="outline">
              Intentar de nuevo
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (jobId) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Generando Video</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progress} />
          <p className="text-sm text-muted-foreground text-center">
            {currentScene} de {totalScenes} escenas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Crear Video Narrado</CardTitle>
        <CardDescription>
          Escribe una historia y déjala convertir en un video con narración de voz e imágenes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="story">Tu Historia</Label>
            <Textarea
              id="story"
              placeholder="Escribe tu historia aquí..."
              value={story}
              onChange={(e) => setStory(e.target.value)}
              className="min-h-[200px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="numScenes">Número de Escenas</Label>
            <Input
              id="numScenes"
              type="number"
              min={1}
              max={10}
              value={numScenes}
              onChange={(e) => setNumScenes(parseInt(e.target.value) || 3)}
            />
            <p className="text-sm text-muted-foreground">
              La duración del video se calculará automáticamente según la longitud del texto narrado.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="introText">Narración Introductoria (opcional)</Label>
            <Textarea
              id="introText"
              placeholder="Texto que se narrará al inicio con una imagen representativa..."
              value={introText}
              onChange={(e) => setIntroText(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="outroText">Narración Final (opcional)</Label>
            <Textarea
              id="outroText"
              placeholder="Texto que se narrará al final con imagen de paisaje tranquilo..."
              value={outroText}
              onChange={(e) => setOutroText(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || !story.trim()}>
            {isLoading ? 'Iniciando...' : 'Generar Video'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}