import { GoogleGenAI } from '@google/genai';
import type { StoryAnalysis, Character } from '@/shared/types';
import { MODELS, VISUAL_STYLE, AUDIO_SETTINGS } from '@/shared/constants';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000
): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const status = (error as any)?.metadata?.errorCode || (error as any)?.status;
      if (status && status >= 500 || (error as any).message?.includes('503')) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        console.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export async function analyzeStory(story: string, numScenes: number): Promise<StoryAnalysis> {
  const prompt = `Analiza la siguiente historia y divídela en exactamente ${numScenes} escenas.
  
Historia:
${story}

Requisitos:
1. Extrae TODOS los personajes mencionados con descripciones visuales ULTRA DETALLADAS de su apariencia física (color de cabello, ojos, piel, ropa, complexión, edad aproximada, rasgos distintivos)
2. Divide la historia en ${numScenes} escenas de duración similar
3. Para cada escena proporciona:
   - Un prompt de imagen que incluya LA DESCRIPCIÓN VISUAL COMPLETA de cada personaje presente
   - El texto de narración para esa escena
   - Qué personajes aparecen en esa escena

Responde SOLO con JSON válido siguiendo este esquema exacto:
{
  "titulo": "string",
  "personajes": [{"id": "string", "nombre": "string", "descripcionVisual": "string - apariencia física ultra detallada"}],
  "escenas": [{"numero": 1, "duracionSegundos": 18, "personajesPresentes": ["personaje_id"], "promptImagen": "string con descripcionVisual completa", "textoNarracion": "string"}]
}`;

  const response = await ai.models.generateContent({
    model: MODELS.ORCHESTRATOR,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    },
  });

  const jsonText = response.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
  return JSON.parse(jsonText) as StoryAnalysis;
}

export async function generateCharacterRefImage(character: Character): Promise<Uint8Array> {
  const prompt = `${character.descripcionVisual}

Frontal view, white neutral background, centered composition. ${VISUAL_STYLE}`;

  return withRetry(async () => {
    const response = await ai.models.generateImages({
      model: MODELS.IMAGE,
      prompt,
    });

    const base64 = response.generatedImages?.[0]?.image?.imageBytes ?? '';
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  });
}

export async function generateSceneImage(prompt: string): Promise<Uint8Array> {
  const fullPrompt = `${prompt}. ${VISUAL_STYLE}`;

  return withRetry(async () => {
    const response = await ai.models.generateImages({
      model: MODELS.IMAGE,
      prompt: fullPrompt,
    });

    const base64 = response.generatedImages?.[0]?.image?.imageBytes ?? '';
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  });
}

export async function generateIntroImage(story: string): Promise<Uint8Array> {
  const introText = story.slice(0, 500);
  const prompt = `A beautiful opening scene in classical watercolor style depicting: ${introText}. 
Atmospheric and evocative visual, mood of anticipation and wonder. No text visible. ${VISUAL_STYLE}`;

  return withRetry(async () => {
    const response = await ai.models.generateImages({
      model: MODELS.IMAGE,
      prompt,
    });

    const base64 = response.generatedImages?.[0]?.image?.imageBytes ?? '';
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  });
}

export async function generateOutroImage(): Promise<Uint8Array> {
  const prompt = `A peaceful, serene landscape scene - a tranquil nature setting with soft lighting, representing a peaceful ending. Gentle sunset or golden hour atmosphere, calm and contemplative mood.

${VISUAL_STYLE}`;

  return withRetry(async () => {
    const response = await ai.models.generateImages({
      model: MODELS.IMAGE,
      prompt,
    });

    const base64 = response.generatedImages?.[0]?.image?.imageBytes ?? '';
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  });
}

export async function generateNarration(text: string): Promise<Uint8Array> {
  const response = await ai.models.generateContent({
    model: MODELS.TTS,
    contents: text,
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Orus' }
        }
      }
    },
  });

  const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data ?? '';
  if (!audioData) {
    throw new Error('No audio data received from TTS');
  }

  const binaryString = atob(audioData);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
