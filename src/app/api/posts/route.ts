import { getAutomationServiceUrl } from "@/lib/automation";
import { db } from "@/lib/db";
import { getOrCreateSettings } from "@/lib/settings";
import {
  createPostSchema,
  updatePostSchema,
  zodErrorResponse,
} from "@/lib/validations";
import { NextResponse } from "next/server";

function applyDefaultScheduleTime(
  scheduledAt: string | null | undefined,
  defaultPublishTime: string,
  status: string
): Date | null {
  if (status !== "scheduled") {
    return scheduledAt ? new Date(scheduledAt) : null;
  }
  if (scheduledAt) return new Date(scheduledAt);

  const [hours, minutes] = defaultPublishTime.split(":").map(Number);
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hours || 10, minutes || 0, 0, 0);
  return d;
}

export async function GET() {
  try {
    const posts = await db.scheduledPost.findMany({
      orderBy: { createdAt: "desc" },
      include: { account: true },
    });
    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createPostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(zodErrorResponse(parsed.error), { status: 400 });
    }

    const data = parsed.data;
    const account = await db.socialAccount.findUnique({ where: { id: data.accountId } });
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const settings = await getOrCreateSettings();
    const scheduledAt = applyDefaultScheduleTime(
      data.scheduledAt,
      settings.defaultPublishTime,
      data.status
    );

    const post = await db.scheduledPost.create({
      data: {
        content: data.content,
        mediaUrls: data.mediaUrls ? JSON.stringify(data.mediaUrls) : null,
        platforms: JSON.stringify(data.platforms),
        status: data.status,
        scheduledAt,
        publishedAt: data.status === "published" ? new Date() : null,
        accountId: data.accountId,
      },
      include: { account: true },
    });

    if (data.status === "scheduled" && scheduledAt) {
      try {
        const automationUrl = await getAutomationServiceUrl();
        await fetch(`${automationUrl}/api/schedule`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postId: post.id,
            platforms: data.platforms,
            scheduledAt: scheduledAt.toISOString(),
            content: data.content,
            mediaUrls: data.mediaUrls,
            mockPublish: false,
          }),
        });
      } catch (e) {
        console.error("Failed to schedule with automation service:", e);
      }
    }

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const parsed = updatePostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(zodErrorResponse(parsed.error), { status: 400 });
    }

    const { id, ...data } = parsed.data;
    const updateData: Record<string, unknown> = {};
    if (data.content !== undefined) updateData.content = data.content;
    if (data.mediaUrls !== undefined) {
      updateData.mediaUrls = data.mediaUrls ? JSON.stringify(data.mediaUrls) : null;
    }
    if (data.platforms !== undefined) {
      updateData.platforms = JSON.stringify(data.platforms);
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === "published") updateData.publishedAt = new Date();
    }
    if (data.scheduledAt !== undefined) {
      updateData.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
    }

    const post = await db.scheduledPost.update({
      where: { id },
      data: updateData,
      include: { account: true },
    });
    return NextResponse.json(post);
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await db.scheduledPost.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
