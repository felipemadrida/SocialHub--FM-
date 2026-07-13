import { db } from "@/lib/db";
import { buildMarketingSvg } from "@/lib/ai/image-generator";
import { getOrCreateSettings } from "@/lib/settings";
import { aiImageSchema } from "@/lib/validations-marketing";
import { zodErrorResponse } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const items = await db.aiGeneration.findMany({
      where: { kind: "image" },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Error listing AI images:", error);
    return NextResponse.json({ error: "Failed to list AI images" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = aiImageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(zodErrorResponse(parsed.error), { status: 400 });
    }

    const settings = await getOrCreateSettings();
    const image = buildMarketingSvg({
      template: parsed.data.template,
      size: parsed.data.size,
      brandName: settings.brandName,
      headline: parsed.data.headline,
    });

    const saved = await db.aiGeneration.create({
      data: {
        kind: "image",
        type: parsed.data.template,
        title: parsed.data.headline || parsed.data.template,
        content: image.svg,
        imageUrl: image.dataUrl,
        meta: JSON.stringify({
          size: parsed.data.size,
          width: image.width,
          height: image.height,
        }),
      },
    });

    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error("Error generating AI image:", error);
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
  }
}
