import { db } from "@/lib/db";
import { generateContent } from "@/lib/ai/content-generator";
import { getOrCreateSettings } from "@/lib/settings";
import { aiContentSchema } from "@/lib/validations-marketing";
import { zodErrorResponse } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const items = await db.aiGeneration.findMany({
      where: { kind: "content" },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Error listing AI content:", error);
    return NextResponse.json({ error: "Failed to list AI content" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = aiContentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(zodErrorResponse(parsed.error), { status: 400 });
    }

    const settings = await getOrCreateSettings();
    const generated = await generateContent({
      ...parsed.data,
      brandName: settings.brandName,
    });

    const saved = await db.aiGeneration.create({
      data: {
        kind: "content",
        type: parsed.data.type,
        platform: parsed.data.platform,
        tone: parsed.data.tone,
        prompt: parsed.data.topic || null,
        title: generated.title,
        content: generated.content,
        meta: JSON.stringify({
          hashtags: generated.hashtags,
          cta: generated.cta,
          source: generated.source,
        }),
      },
    });

    return NextResponse.json(
      {
        ...saved,
        hashtags: generated.hashtags,
        cta: generated.cta,
        source: generated.source,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error generating AI content:", error);
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
  }
}
