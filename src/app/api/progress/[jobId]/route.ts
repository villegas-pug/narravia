import { NextRequest, NextResponse } from 'next/server';
import { runPipeline } from '@/lib/pipeline';
import type { CreateVideoRequest, PipelineProgress } from '@/shared/types';

const pipelines = new Map<string, ReadableStreamDefaultController>();

export function emitProgress(jobId: string, progress: PipelineProgress) {
  const controller = pipelines.get(jobId);
  if (controller) {
    const data = `data: ${JSON.stringify(progress)}\n\n`;
    controller.enqueue(new TextEncoder().encode(data));
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  const stream = new ReadableStream({
    start(controller) {
      pipelines.set(jobId, controller);
      
      controller.enqueue(
        new TextEncoder().encode(
          `data: ${JSON.stringify({ status: 'idle', message: 'Conectado' })}\n\n`
        )
      );
    },
    cancel() {
      pipelines.delete(jobId);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
