import { VideoPlayer } from '@/features/play-download/components/VideoPlayer';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'NARRAVIA - Ver Video',
  description: 'Reproduce y descarga tu video generado',
};

function VideoPlayerWrapper() {
  return <VideoPlayer />;
}

export default function PlayDownloadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">NARRAVIA</h1>
          <p className="text-lg text-muted-foreground">
            Tu video está listo
          </p>
        </div>
        
        <div className="flex justify-center">
          <Suspense fallback={<p>Cargando...</p>}>
            <VideoPlayerWrapper />
          </Suspense>
        </div>
      </main>
    </div>
  );
}