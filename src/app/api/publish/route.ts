import { publishSchema, zodErrorResponse, platformSchema } from "@/lib/validations";
import { publishToPlatforms } from "@/lib/publish/multi-platform";
import { requireSession } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const multiPublishSchema = publishSchema.extend({
  accountIds: z.array(z.string()).optional(),
  platforms: z.array(platformSchema).min(1),
});

/**
 * Publish content to one or many platforms at the same time (live OAuth only).
 */
export async function POST(request: Request) {
  const { error } = await requireSession();
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = multiPublishSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(zodErrorResponse(parsed.error), { status: 400 });
    }

    const results = await publishToPlatforms({
      content: parsed.data.content,
      platforms: parsed.data.platforms,
      mediaUrls: parsed.data.mediaUrls,
      accountIds: parsed.data.accountIds,
    });

    const allSuccess = results.every((r) => r.status === "published");
    const anySuccess = results.some((r) => r.status === "published");

    return NextResponse.json({
      results,
      summary: {
        total: results.length,
        published: results.filter((r) => r.status === "published").length,
        failed: results.filter((r) => r.status === "failed").length,
        allSuccess,
        anySuccess,
      },
    });
  } catch (err) {
    console.error("Error publishing post:", err);
    return NextResponse.json(
      { error: "Failed to publish to platforms" },
      { status: 500 }
    );
  }
}
