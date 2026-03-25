import { mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { StoryAnalysis, PipelineProgress } from '@/shared/types';
import { analyzeStory, generateCharacterRefImage, generateSceneImage, generateNarration, generateIntroImage, generateOutroImage } from './gemini';
import { assembleScene, concatenateWithCrossfade, cleanupTempDir, CROSSFADE_DURATION } from './ffmpeg';

type ProgressCallback = (progress: PipelineProgress) => void;

interface PipelineParams {
  story: string;
  numScenes: number;
  introText?: string;
  outroText?: string;
}

function calculateAudioDuration(audioBuffer: Uint8Array): number {
  const sampleRate = 24000;
  const bytesPerSample = 2;
  const channels = 1;
  const totalSamples = audioBuffer.length / bytesPerSample;
  return totalSamples / sampleRate;
}

export async function runPipeline(
  params: PipelineParams,
  onProgress: ProgressCallback
): Promise<string> {
  const { story, numScenes, introText, outroText } = params;
  const jobId = uuidv4();
  const tempDir = `/tmp/${jobId}`;
  const outputDir = process.env.OUTPUT_DIR || './outputs';
  const outputPath = path.join(outputDir, `${jobId}.mp4`);

  await mkdir(tempDir, { recursive: true });
  await mkdir(outputDir, { recursive: true });

  const emit = (status: PipelineProgress['status'], currentScene = 0, message?: string) => {
    onProgress({
      status,
      currentScene,
      totalScenes: 0,
      videoUrl: null,
      error: null,
      message: message || status,
    });
  };

  try {
    emit('analyzing');
    const analysis: StoryAnalysis = await analyzeStory(story, numScenes);

    emit('generatingCharacters');
    await Promise.all(
      analysis.personajes.map(async (char) => {
        await generateCharacterRefImage(char);
      })
    );

    const scenePaths: string[] = [];
    const audioDurations: number[] = [];
    let sceneCounter = 0;

    if (introText) {
      emit('generatingIntro', ++sceneCounter);
      
      const introImage = await generateIntroImage(story);
      const introAudio = await generateNarration(introText);
      const introDuration = calculateAudioDuration(introAudio);
      
      const introPath = path.join(tempDir, 'intro.mp4');
      await assembleScene(introImage, introAudio, introDuration, introPath, tempDir);
      scenePaths.push(introPath);
      audioDurations.push(introDuration);
    }

    const scenesToProcess = analysis.escenas.slice(0, numScenes);
    
    if (analysis.escenas.length < numScenes) {
      console.warn(`El modelo devolvió ${analysis.escenas.length} escenas pero se solicitaron ${numScenes}. Usando las primeras ${scenesToProcess.length}.`);
    }

    for (let i = 0; i < scenesToProcess.length; i++) {
      const scene = scenesToProcess[i];
      emit('processingScene', ++sceneCounter);

      const [sceneImage, audio] = await Promise.all([
        generateSceneImage(scene.promptImagen),
        generateNarration(scene.textoNarracion),
      ]);

      const sceneDuration = calculateAudioDuration(audio);
      const scenePath = path.join(tempDir, `scene_${i + 1}.mp4`);
      await assembleScene(sceneImage, audio, sceneDuration, scenePath, tempDir);
      scenePaths.push(scenePath);
      audioDurations.push(sceneDuration);
    }

    if (outroText) {
      emit('generatingOutro', ++sceneCounter);
      
      const outroImage = await generateOutroImage();
      const outroAudio = await generateNarration(outroText);
      const outroDuration = calculateAudioDuration(outroAudio);
      
      const outroPath = path.join(tempDir, 'outro.mp4');
      await assembleScene(outroImage, outroAudio, outroDuration, outroPath, tempDir);
      scenePaths.push(outroPath);
      audioDurations.push(outroDuration);
    }

    emit('assembling');
    await concatenateWithCrossfade(scenePaths, audioDurations, outputPath);

    await cleanupTempDir(tempDir);

    return outputPath;
  } catch (error) {
    await cleanupTempDir(tempDir);
    throw error;
  }
}
