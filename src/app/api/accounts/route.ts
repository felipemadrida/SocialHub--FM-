import { db } from "@/lib/db";
import {
  createAccountSchema,
  updateAccountSchema,
  zodErrorResponse,
} from "@/lib/validations";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const accounts = await db.socialAccount.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { scheduledPosts: true, analytics: true } },
      },
    });
    // Don't leak raw tokens to the browser — expose connection status only
    const safe = accounts.map((a) => ({
      ...a,
      accessToken: a.accessToken ? "***" : null,
      refreshToken: a.refreshToken ? "***" : null,
      isConnected: Boolean(a.accessToken),
      isDemo: Boolean(a.accessToken?.startsWith("demo_")),
    }));
    return NextResponse.json(safe);
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(zodErrorResponse(parsed.error), { status: 400 });
    }

    const data = parsed.data;
    const account = await db.socialAccount.create({
      data: {
        platform: data.platform,
        accountName: data.accountName,
        avatarUrl: data.avatarUrl || null,
        accessToken: data.accessToken || null,
        refreshToken: data.refreshToken || null,
        followers: data.followers || 0,
        following: data.following || 0,
        posts: data.posts || 0,
        engagement: data.engagement || 0,
        isActive: data.isActive ?? true,
      },
    });
    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error("Error creating account:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const parsed = updateAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(zodErrorResponse(parsed.error), { status: 400 });
    }

    const { id, ...data } = parsed.data;
    const updateData: Record<string, unknown> = {};
    if (data.accountName !== undefined) updateData.accountName = data.accountName;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
    if (data.accessToken !== undefined) updateData.accessToken = data.accessToken;
    if (data.refreshToken !== undefined) updateData.refreshToken = data.refreshToken;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.followers !== undefined) updateData.followers = data.followers;
    if (data.following !== undefined) updateData.following = data.following;
    if (data.posts !== undefined) updateData.posts = data.posts;
    if (data.engagement !== undefined) updateData.engagement = data.engagement;

    const account = await db.socialAccount.update({
      where: { id },
      data: updateData,
      include: {
        _count: { select: { scheduledPosts: true, analytics: true } },
      },
    });
    return NextResponse.json(account);
  } catch (error) {
    console.error("Error updating account:", error);
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await db.socialAccount.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
