import { generateFloorPlanImage as openaiGenerate } from "./openai-provider";
import { generateFloorPlanImage as geminiGenerate } from "./gemini-provider";

export type ProviderName = "openai" | "gemini";

export function getActiveProvider(): ProviderName {
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.GEMINI_API_KEY) return "gemini";
  throw new Error(
    "No API provider configured. Please set OPENAI_API_KEY or GEMINI_API_KEY in .env.local",
  );
}

export async function generateWithProvider(
  imageBase64: string,
  prompt: string,
): Promise<{ imageBase64: string; provider: ProviderName; model: string }> {
  const provider = getActiveProvider();

  const result = await (provider === "openai"
    ? openaiGenerate(imageBase64, prompt)
    : geminiGenerate(imageBase64, prompt));

  return { ...result, provider };
}
