import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import fs from 'fs';
import path from 'path';

import {
  SYSTEM_PROMPT,
  USER_PROMPT_TEMPLATE,
  REFERENCE_STYLE_PROMPT,
} from "@/lib/prompts";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy",
});

function loadReferenceStyleImage() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'reference', 'Test-sample.jpeg');
    if (fs.existsSync(filePath)) {
      const fileBuffer = fs.readFileSync(filePath);
      return `data:image/jpeg;base64,${fileBuffer.toString('base64')}`;
    }
    return null;
  } catch (error) {
    console.warn("Could not load reference style image:", error);
    return null;
  }
}

async function generateVisionDescription(
  imageBase64: string,
  style: string,
  preserveStructure: boolean,
  enhanceLabels: boolean,
  instructions: string,
  referenceImageBase64: string | null
) {
  const userPrompt = USER_PROMPT_TEMPLATE(
    style,
    preserveStructure,
    enhanceLabels,
    instructions
  );

  const contentArray: any[] = [
    {
      type: "text",
      text: userPrompt + (referenceImageBase64 ? "\n\nAlso, a reference style image is provided. Please deeply analyze its visual aesthetic (wall colors, line thickness, typography, background color, architectural symbols) and include a strict visual style guide in your description so the final generated image mimics this aesthetic perfectly." : ""),
    },
    {
      type: "image_url",
      image_url: {
        url: imageBase64,
      },
    },
  ];

  if (referenceImageBase64) {
    contentArray.push({
      type: "image_url",
      image_url: {
        url: referenceImageBase64,
      },
    });
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: contentArray,
      },
    ],
    max_tokens: 2500,
  });

  return response.choices[0].message.content || "";
}

async function generateStyledFloorPlan(
  floorPlanDescription: string,
  style: string,
  instructions: string
) {
  const generationPrompt = REFERENCE_STYLE_PROMPT(
    style,
    floorPlanDescription,
    instructions
  );

  const imageResponse = await openai.images.generate({
    model: "gpt-image-1",
    prompt: generationPrompt,
    size: "1536x1024",
    quality: "high",
    n: 1,
  });

  const b64_json = imageResponse?.data?.[0]?.b64_json;
  
  if (!b64_json) {
    throw new Error("gpt-image-1 failed to return base64 image data.");
  }
  
  return b64_json;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      image,
      style,
      instructions,
      preserveStructure,
      enhanceLabels,
    } = body;

    if (!image) {
      return NextResponse.json(
        {
          success: false,
          error: "No image provided",
        },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "OPENAI_API_KEY is not configured.",
        },
        { status: 500 }
      );
    }

    const referenceStyleImage = loadReferenceStyleImage();

    const floorPlanDescription = await generateVisionDescription(
      image,
      style || "Professional CAD Blueprint",
      preserveStructure ?? true,
      enhanceLabels ?? true,
      instructions || "",
      referenceStyleImage
    );

    const generatedImage = await generateStyledFloorPlan(
      floorPlanDescription,
      style || "Professional CAD Blueprint",
      instructions || ""
    );

    return NextResponse.json({
      success: true,
      results: {
        imageUrl: `data:image/png;base64,${generatedImage}`,
        description: floorPlanDescription,
      }
    });
  } catch (error: any) {
    console.error("Generation Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate floor plan",
      },
      { status: 500 }
    );
  }
}