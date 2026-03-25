import { StoryForm } from '@/features/create-video/components/StoryForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NARRAVIA - Crear Video',
  description: 'Convierte tu historia en un video narrado con imágenes generadas por IA',
};

export default function CreateVideoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">NARRAVIA</h1>
          <p className="text-lg text-muted-foreground">
            Transforma tu historia en un video narrado con imágenes generadas por IA
          </p>
        </div>
        
        <div className="flex justify-center">
          <StoryForm />
        </div>
      </main>
    </div>
  );
}