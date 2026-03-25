import { NextRequest, NextResponse } from 'next/server';
import { runPipeline } from '@/lib/pipeline';
import { emitProgress } from '../progress/[jobId]/route';
import type { PipelineProgress } from '@/shared/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { story, numScenes, introText, outroText, includeIntro, includeOutro } = body;

    if (!story || !numScenes) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const hasIntro = includeIntro !== false && introText;
    const hasOutro = includeOutro !== false && outroText;

    runPipeline(
      { story, numScenes, introText: hasIntro ? introText : undefined, outroText: hasOutro ? outroText : undefined },
      (progress: PipelineProgress) => {
        emitProgress(jobId, progress);
      }
    ).then(async (videoPath) => {
      const videoUrl = `/api/outputs/${videoPath.split('/').pop()}`;
      emitProgress(jobId, {
        status: 'complete',
        currentScene: numScenes + (hasIntro ? 1 : 0) + (hasOutro ? 1 : 0),
        totalScenes: numScenes + (hasIntro ? 1 : 0) + (hasOutro ? 1 : 0),
        videoUrl,
        error: null,
        message: 'Video generado exitosamente',
      });
    }).catch((error) => {
      emitProgress(jobId, {
        status: 'error',
        currentScene: 0,
        totalScenes: numScenes + (hasIntro ? 1 : 0) + (hasOutro ? 1 : 0),
        videoUrl: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Error en la generación',
      });
    });

    return NextResponse.json({ jobId });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}