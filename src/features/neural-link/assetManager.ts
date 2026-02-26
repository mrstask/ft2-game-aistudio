import { GoogleGenAI } from '@google/genai';
import { Entity } from '../../game/types';

const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

export function isNeuralLinkConfigured(): boolean {
  return Boolean(ai);
}

export function buildNeuralLinkPrompt(entity: Entity): string {
  return `Isometric 2D character sprite sheet for a post-apocalyptic RPG.
Subject: ${entity.name} - ${entity.basePrompt || entity.subType || 'Unknown subject'}.
Locomotion: ${entity.movementType || 'bipedal'}.
Size: ${entity.size || 'medium'}.
Format: 4 cardinal directions (Front, Back, Left, Right) arranged in a 2x2 grid.
Style: Gritty 90s pixel art, Fallout 1 aesthetic, high contrast, sharp edges.
Background: SOLID PURE WHITE BACKGROUND. NO LANDSCAPE. NO SEA. NO ROCKS. JUST THE CHARACTER ON WHITE.
The character should be centered in each quadrant.`;
}

function normalizeDataUrl(base64Data: string): string {
  return base64Data.startsWith('data:') ? base64Data : `data:image/png;base64,${base64Data}`;
}

async function removeWhiteBackground(base64Data: string): Promise<string> {
  return new Promise((resolve) => {
    const src = normalizeDataUrl(base64Data);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(src);
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const threshold = 240;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (r > threshold && g > threshold && b > threshold) {
          data[i + 3] = 0;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

function extractInlineImageData(response: any): string {
  for (const part of response?.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData?.data) {
      return part.inlineData.data;
    }
  }
  return '';
}

export async function generateNeuralLinkSprite(entity: Entity): Promise<string> {
  if (!ai) {
    throw new Error('Gemini API key not configured');
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [{ parts: [{ text: buildNeuralLinkPrompt(entity) }] }],
    config: {
      imageConfig: {
        aspectRatio: '1:1',
      },
    },
  });

  const base64Image = extractInlineImageData(response);
  if (!base64Image) {
    throw new Error('No image data received from model');
  }

  return removeWhiteBackground(base64Image);
}

