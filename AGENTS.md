# AGENTS.md — NARRAVIA

**NARRAVIA** — **NARR**ative **A**I **V**ideo **I**ntelligence **A**utomation

Aplicación web que convierte una historia de texto en un video narrado (.mp4). El usuario escribe una historia, configura escenas y duración, y la app genera un video con imágenes sincronizadas con narración de voz.

---

## Stack
- **Framework:** Next.js 15 (App Router) — frontend + backend (Route Handlers)
- **SDK de IA:** `@google/genai` — una sola API key para todos los modelos
- **Ensamblaje de video:** ffmpeg (lado del servidor)
- **BD:** SQLite + Prisma (opcional — para seguimiento de trabajos)
- **Lenguaje:** TypeScript

## Librerías
- **tailwindcss** — estilos
- **shadcn/ui** — componentes UI
- **react-player** — reproducción de video
- **uuid** — generación de IDs únicas para trabajos y personajes
- **zustand** — manejo de estado global en frontend (progreso del pipeline)

## Modelos de IA (Gemini API)
| Rol | ID del Modelo |
|-----|---------------|
| Orquestador | `gemini-2.5-flash-lite` |
| Generación de imágenes | `imagen-4.0-fast-generate-001` |
| Narración TTS | `gemini-2.5-flash-preview-tts` |


## Arquitectura: 
Modular basada en features. Pages y Route Handlers son delegadores puros.
```
src/
├── app/                          
│   ├── api/[feature]/route.ts
│   ├── [feature]/
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   └── error.tsx
│   └── layout.tsx
│
├── features/[feature]/           
│   ├── components/
│   ├── hooks/                    
│   ├── services/
│   ├── store/                  
│   ├── types/
│
├── shared/                       
│   ├── components/
│   │   ├── ui/                   
│   │   ├── icons/
│   │   └── layouts/              
│   ├── hooks/                    
│   ├── utils/                    
│   ├── types/                    
│   └── constants/                
│
├── lib/                          
├── config/                       
├── providers/                    
├── store/                        
├── styles/                       
└── middleware.ts
```

## Features

### **Feature 1:** create-video
El usuario ingresa una historia en texto libre, configura la cantidad de escenas y la duración total del video. Al iniciar, el sistema ejecuta el pipeline completo y muestra el progreso en tiempo real. Al finalizar, el usuario puede previsualizar y descargar el video generado.
Durante la generación, el usuario debe ver el estado actual del pipeline (ej: analizando historia, generando personajes, procesando escena N de N, ensamblando video). La comunicación debe ser unidireccional del servidor al cliente.

### **Feature 2:** play-download
Al finalizar la generación, el usuario puede reproducir el video directamente en la interfaz y descargarlo en formato .mp4.

## Pipeline
```
1. historia + parámetros
2. analizar historia → extraer personajes + dividir en N escenas
3. generar imagen de referencia frontal por personaje
4. generar imagen de INTRO (prompt basado en inicio de historia) + audio
5. por escena (concurrente):
   - generar imagen usando referencia del personaje
   - generar audio de narración (salida WAV a 24,000 Hz, estéreo)
6. generar imagen de OUTRO (paisaje tranquilo) + audio
7. ensamblar con crossfade de 1s entre todos los segmentos → .mp4 final
8. retornar video al usuario
```

## Esquema JSON de Escenas (contrato entre pasos 2 → 5)
```json
{
  "titulo": "string",
  "personajes": [
    {
      "id": "string",
      "nombre": "string",
      "descripcionVisual": "string — apariencia física ultra detallada"
    }
  ],
  "escenas": [
    {
      "numero": 1,
      "duracionSegundos": 18,
      "personajesPresentes": ["personaje_id"],
      "promptImagen": "string — descripción de escena + descripcionVisual completa de cada personaje presente",
      "textoNarracion": "string"
    }
  ]
}
```

## Consistencia de Personajes
El mayor desafío técnico del pipeline. El orquestador genera una `descripcionVisual` ultra detallada por personaje. Antes de procesar escenas, se genera una imagen de referencia frontal por personaje que se pasa como input visual en cada escena donde aparece. Además, cada `promptImagen` debe incluir siempre la `descripcionVisual` completa del personaje.

## Estilo Visual
Fijo para toda la aplicación — no configurable por el usuario. Agregar al final de **todos** los prompts de imagen:
```
classical watercolor painting style, soft brush strokes, warm tones, traditional art techniques, paper texture, artistic hand-painted look, elegant composition
```

## Convenciones Técnicas
- **Concurrencia:** el paso 4 del pipeline debe ejecutarse de forma concurrente para minimizar el tiempo total de generación
- **Archivos temporales:** almacenar por trabajo en `/tmp/{jobId}/` y eliminar tras ensamblar el video
- **Variables de entorno:** `GEMINI_API_KEY`, `OUTPUT_DIR=./outputs`

## Especificaciones de Ensamblaje de Video
### Formato de Salida
- **Resolución:** 1920x1080 (16:9)
- **FPS:** 25
- **Audio:** estéreo (2 canales), 24,000 Hz de entrada, AAC 192kbps en salida
- **Codec de video:** H.264 (libx264)
- **Pixel format:** yuv420p

### Imágenes
- Las imágenes generadas (1024x1024) se escalan con **crop centrado con zoom** para llenar el frame sin barras negras
- Filter: `crop=min(iw\,ih*16/9):min(ih\,iw*9/16):(iw-min(iw\,ih*16/9))/2:(ih-min(ih\,iw*9/16))/2,scale=1920:1080`

### Transiciones
- **Crossfade de 1 segundo** entre todas las escenas y segmentos (intro, escenas, outro)
- Sin cortes abruptos ni pantallas negras intermedias
- El pipeline compensa automáticamente la duración agregando tiempo extra a cada escena

### Intro/Outro
- **Intro:** imagen generada automáticamente basada en el inicio de la historia + audio de narración
- **Outro:** imagen de paisaje tranquilo genérico + audio de narración
- Sin texto visible en intro/outro
- Duración fija: 5 segundos cada uno

### Audio
- Solo narración, sin música
- Estéreo, sincronizado con cada escena
- Sin subtítulos en ningún momento

