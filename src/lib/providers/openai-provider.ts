import OpenAI from "openai";
import { toFile } from "openai/core/uploads";

export async function generateFloorPlanImage(
  imageBase64: string,
  prompt: string,
): Promise<{ imageBase64: string; model: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";

  const openai = new OpenAI({ apiKey });

  const raw = imageBase64.includes('base64,') ? imageBase64.split('base64,')[1] : imageBase64;
  const floorPlanBuffer = Buffer.from(raw, 'base64');
  const floorPlanFile = await toFile(floorPlanBuffer, 'floorplan.png', { type: 'image/png' });

  const response = await openai.images.edit({
    model,
    image: floorPlanFile,
    prompt,
    quality: 'medium',
    n: 1,
    output_format: 'png',
  });

  const b64_json = response?.data?.[0]?.b64_json;
  if (!b64_json) {
    throw new Error("OpenAI did not return image data.");
  }

  return { imageBase64: b64_json, model };
}
