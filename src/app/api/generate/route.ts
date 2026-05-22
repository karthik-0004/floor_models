import { NextRequest, NextResponse } from "next/server";
import { generateWithProvider } from "@/lib/providers";
import { DIRECT_IMAGE_PROMPT } from "@/lib/prompts";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, style, instructions } = body;

    if (!image) {
      return NextResponse.json(
        { success: false, error: "No image provided" },
        { status: 400 },
      );
    }

    const prompt = DIRECT_IMAGE_PROMPT(style || "CAD Blueprint", instructions || "");

    const result = await generateWithProvider(image, prompt);

    return NextResponse.json({
      success: true,
      results: {
        imageUrl: `data:image/png;base64,${result.imageBase64}`,
      },
      provider: result.provider,
      model: result.model,
    });
  } catch (error: any) {
    console.error("Generation Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate floor plan",
        provider: error.message?.includes("OPENAI_API_KEY")
          ? "openai"
          : error.message?.includes("GEMINI_API_KEY")
            ? "gemini"
            : undefined,
      },
      { status: 500 },
    );
  }
}
