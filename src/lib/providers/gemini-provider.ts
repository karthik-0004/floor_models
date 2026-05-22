import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateFloorPlanImage(
  imageBase64: string,
  prompt: string,
): Promise<{ imageBase64: string; model: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const model = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image-preview";

  const genAI = new GoogleGenerativeAI(apiKey);

  const genModel = genAI.getGenerativeModel({
    model,
    generationConfig: {
      responseModalities: ["Text", "Image"],
    } as any,
  });

  const raw = imageBase64.includes("base64,") ? imageBase64.split("base64,")[1] : imageBase64;

  const mimeType = imageBase64.startsWith("data:image/png") ? "image/png"
    : imageBase64.startsWith("data:image/webp") ? "image/webp"
    : "image/jpeg";

  const result = await genModel.generateContent([
    { text: prompt },
    {
      inlineData: {
        mimeType,
        data: raw,
      },
    },
  ]);

  const response = result.response;
  const candidates = response.candidates;

  if (!candidates || candidates.length === 0) {
    throw new Error("Gemini did not return any candidates.");
  }

  const parts = candidates[0]?.content?.parts || [];
  const imagePart = parts.find((p: any) => p.inlineData?.data);

  if (!imagePart || !imagePart.inlineData?.data) {
    const texts = parts.filter((p: any) => p.text).map((p: any) => p.text).join(" ");
    throw new Error(
      `Gemini did not return an image. Model may not support image generation. Response: ${texts || "no content"}`,
    );
  }

  return { imageBase64: imagePart.inlineData.data, model };
}
