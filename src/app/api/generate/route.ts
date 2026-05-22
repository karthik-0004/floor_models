import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { toFile } from "openai/core/uploads";
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy",
});

const IMAGE_MODEL = process.env.IMAGE_MODEL || "gpt-image-2";

function base64ToBuffer(base64: string): Buffer {
  const raw = base64.includes('base64,') ? base64.split('base64,')[1] : base64;
  return Buffer.from(raw, 'base64');
}

function detectImageSize(buffer: Buffer): { width: number; height: number } | null {
  // PNG
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  // JPEG
  if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xFF) break;
      const marker = buffer[offset + 1];
      if (marker === 0xC0 || marker === 0xC1 || marker === 0xC2) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7),
        };
      }
      const segLen = buffer.readUInt16BE(offset + 2);
      offset += 2 + segLen;
    }
  }
  // WEBP
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    const vp8Offset = 12;
    if (buffer[vp8Offset + 3] === 0x56 && buffer[vp8Offset + 4] === 0x50 && buffer[vp8Offset + 5] === 0x38) {
      // VP8L (lossless)
      return {
        width: (buffer.readUInt16LE(vp8Offset + 6) & 0x3FFF) + 1,
        height: (buffer.readUInt16LE(vp8Offset + 8) >> 2 & 0x3FFF) + 1,
      };
    }
    // VP8 / VP8X would need more parsing, skip for brevity
  }
  return null;
}

function computeOutputSize(width: number, height: number): string {
  const MIN_DIM = 1024;
  let w = width;
  let h = height;

  if (w < MIN_DIM || h < MIN_DIM) {
    const scale = Math.max(MIN_DIM / w, MIN_DIM / h);
    w = Math.round(w * scale / 16) * 16;
    h = Math.round(h * scale / 16) * 16;
  } else {
    w = Math.round(w / 16) * 16;
    h = Math.round(h / 16) * 16;
  }

  w = Math.max(1024, w);
  h = Math.max(1024, h);

  return `${w}x${h}`;
}

function loadReferenceImage(): Buffer | null {
  try {
    const filePath = path.join(process.cwd(), 'public', 'reference', 'Reference.jpeg');
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath);
    }
    console.warn('Reference.jpeg not found at public/reference/Reference.jpeg');
    return null;
  } catch (error) {
    console.warn("Could not load reference style image:", error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, style, instructions } = body;

    if (!image) {
      return NextResponse.json(
        { success: false, error: "No image provided" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: "OPENAI_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const floorPlanBuffer = base64ToBuffer(image);
    const referenceBuffer = loadReferenceImage();

    const inputSize = detectImageSize(floorPlanBuffer);

    const outputSize = inputSize ? computeOutputSize(inputSize.width, inputSize.height) : undefined;

    const floorPlanFile = await toFile(floorPlanBuffer, 'floorplan.png', { type: 'image/png' });
    const referenceFile = referenceBuffer
      ? await toFile(referenceBuffer, 'reference.png', { type: 'image/png' })
      : null;

    const images: any = referenceFile
      ? [floorPlanFile, referenceFile]
      : floorPlanFile;

    const prompt = [
      `Regenerate this floor plan into a professional ${style || "CAD Blueprint"} style.`,
      'Strictly preserve the EXACT geometry of the first image (floor plan):',
      '- room positions, wall layout, doors, windows, labels, annotations must remain identical',
      'The second image (if provided) is a VISUAL STYLE REFERENCE ONLY:',
      '- adopt its colors, line quality, typography, drafting aesthetics',
      '- NEVER copy its layout or geometry',
      'Output a clean, high-contrast CAD schematic with precise architectural styling.',
    ].join('\n');

    const response = await openai.images.edit({
      model: IMAGE_MODEL,
      image: images,
      prompt: prompt + (instructions ? `\n\nAdditional instructions: ${instructions}` : ""),
      quality: 'high',
      n: 1,
      output_format: 'png',
      ...(outputSize ? { size: outputSize } : {}),
    });

    const b64_json = response?.data?.[0]?.b64_json;
    if (!b64_json) {
      throw new Error("gpt-image-2 failed to return base64 image data.");
    }

    return NextResponse.json({
      success: true,
      results: {
        imageUrl: `data:image/png;base64,${b64_json}`,
      }
    });
  } catch (error: any) {
    console.error("Generation Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate floor plan" },
      { status: 500 }
    );
  }
}
