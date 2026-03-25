import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, rm } from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

function execWithTimeout(cmd: string, timeoutMs = 300000): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Command timed out after ${timeoutMs}ms`)), timeoutMs);
    exec(cmd, (error, stdout, stderr) => {
      clearTimeout(timeout);
      if (error) reject(error);
      else resolve(stdout);
    });
  });
}

const FFMPEG_PATH = process.env.FFMPEG_PATH || '/usr/bin/ffmpeg';

const CROSSFADE_DURATION = 3;

function pcmToWav(pcmData: Uint8Array, sampleRate = 24000, channels = 1): Uint8Array {
  const dataSize = pcmData.length;
  const headerSize = 44;
  const wavFile = new Uint8Array(headerSize + dataSize);

  const view = new DataView(wavFile.buffer);

  view.setUint8(0, 0x52); view.setUint8(1, 0x49); // RIFF
  view.setUint8(2, 0x46); view.setUint8(3, 0x46);
  view.setUint32(4, 36 + dataSize, true);
  view.setUint8(8, 0x57); view.setUint8(9, 0x41); // WAVE
  view.setUint8(10, 0x56); view.setUint8(11, 0x45);
  view.setUint8(12, 0x66); view.setUint8(13, 0x6D); // fmt 
  view.setUint8(14, 0x74); view.setUint8(15, 0x20);
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, channels, true); // channels (1 = mono)
  view.setUint32(24, sampleRate, true); // sample rate
  view.setUint32(28, sampleRate * channels * 2, true); // byte rate
  view.setUint16(32, channels * 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  view.setUint8(36, 0x64); view.setUint8(37, 0x61); // data
  view.setUint8(38, 0x74); view.setUint8(39, 0x61);
  view.setUint32(40, dataSize, true);

  wavFile.set(pcmData, headerSize);
  return wavFile;
}

export async function assembleScene(
  imageBuffer: Uint8Array,
  audioBuffer: Uint8Array,
  duration: number,
  outputPath: string,
  tempDir: string
): Promise<number> {
  console.log('[FFmpeg] assembleScene - INICIO');
  console.log('[FFmpeg] Duración de escena:', duration);
  console.log('[FFmpeg] Output path:', outputPath);
  
  const imagePath = path.join(tempDir, `scene_${Date.now()}.png`);
  const audioPath = path.join(tempDir, `audio_${Date.now()}.wav`);

  await writeFile(imagePath, imageBuffer);
  
  const wavAudio = pcmToWav(audioBuffer, 24000, 1);
  await writeFile(audioPath, wavAudio);

  const cropFilter = 'scale=iw*1.3:ih*1.3:-1:force_original_aspect_ratio=decrease,scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080';
  console.log('[FFmpeg] Filter aplicado:', cropFilter);
  const ffmpegCmd = `${FFMPEG_PATH} -y -loop 1 -i "${imagePath}" -i "${audioPath}" -r 25 -c:v libx264 -t ${duration} -pix_fmt yuv420p -vf "${cropFilter}" -c:a aac -b:a 192k -shortest "${outputPath}"`;
  
  console.log('[FFmpeg] Comando assembleScene:', ffmpegCmd);
  
  await execWithTimeout(ffmpegCmd);
  
  console.log('[FFmpeg] Escena ensamblada:', outputPath);

  await rm(imagePath, { force: true });
  await rm(audioPath, { force: true });

  return duration;
}

export async function concatenateWithCrossfade(
  scenePaths: string[],
  audioDurations: number[],
  outputPath: string
): Promise<string> {
  console.log('[FFmpeg] concatenateWithCrossfade - INICIO');
  console.log('[FFmpeg] scenePaths:', scenePaths);
  console.log('[FFmpeg] audioDurations:', audioDurations);
  console.log('[FFmpeg] CROSSFADE_DURATION:', CROSSFADE_DURATION);
  
  if (scenePaths.length === 0) {
    throw new Error('No scenes to concatenate');
  }

  if (scenePaths.length === 1) {
    console.log('[FFmpeg] Solo 1 escena, retornando directo');
    return scenePaths[0];
  }

  const tempDir = path.dirname(outputPath);
  const listPath = path.join(tempDir, 'concat.txt');
  const listContent = scenePaths.map((p) => `file '${p}'`).join('\n');
  
  await writeFile(listPath, listContent);

  const numTransitions = scenePaths.length - 1;
  
  let lastVideoOutput = '0:v';
  let lastAudioOutput = '0:a';
  let filterParts: string[] = [];
  let audioParts: string[] = [];
  let offset = audioDurations[0];

  for (let i = 0; i < numTransitions; i++) {
    const inputIdx = i + 1;
    const newVideoOutput = `v${i + 1}`;
    const newAudioOutput = `a${i + 1}`;
    
    console.log(`[FFmpeg] Transición ${i + 1}: offset=${offset}, duracion=${CROSSFADE_DURATION}`);
    
    filterParts.push(`[${lastVideoOutput}][${inputIdx}:v]xfade=transition=fade:duration=${CROSSFADE_DURATION}:offset=${offset}[${newVideoOutput}]`);
    audioParts.push(`[${lastAudioOutput}][${inputIdx}:a]acrossfade=d=${CROSSFADE_DURATION}[${newAudioOutput}]`);
    
    lastVideoOutput = newVideoOutput;
    lastAudioOutput = newAudioOutput;
    offset += audioDurations[i + 1];
  }

  const filterComplex = filterParts.join(';') + ';' + audioParts.join(';');
  console.log('[FFmpeg] filterComplex:', filterComplex);

  const cmdParts: string[] = [];
  for (let i = 0; i < scenePaths.length; i++) {
    cmdParts.push(`-i "${scenePaths[i]}"`);
  }
  
  const finalVideoOutput = `v${numTransitions}`;
  const finalAudioOutput = `a${numTransitions}`;
  const fullCmd = `${FFMPEG_PATH} -y ${cmdParts.join(' ')} -filter_complex "${filterComplex}" -map "[${finalVideoOutput}]" -map "[${finalAudioOutput}]" -c:v libx264 -pix_fmt yuv420p -r 25 -c:a aac -b:a 192k "${outputPath}"`;
  
  console.log('[FFmpeg] Comando FFmpeg:', fullCmd);
  
  try {
    await execWithTimeout(fullCmd);
    console.log('[FFmpeg] Ensamblaje completado exitosamente');
  } catch (error) {
    console.error('[FFmpeg] Error en ensamblaje:', error);
    throw error;
  }

  await rm(listPath, { force: true });

  return outputPath;
}

export async function concatenateScenes(scenePaths: string[], outputPath: string): Promise<string> {
  const listPath = path.join(path.dirname(outputPath), 'concat.txt');
  const listContent = scenePaths.map((p) => `file '${p}'`).join('\n');
  
  await writeFile(listPath, listContent);

  const ffmpegCmd = `${FFMPEG_PATH} -y -f concat -safe 0 -i "${listPath}" -c copy "${outputPath}"`;
  await execWithTimeout(ffmpegCmd);

  await rm(listPath, { force: true });

  return outputPath;
}

export async function cleanupTempDir(tempDir: string): Promise<void> {
  try {
    await rm(tempDir, { recursive: true, force: true });
  } catch {
    console.warn(`Failed to cleanup temp dir: ${tempDir}`);
  }
}

export { CROSSFADE_DURATION };
