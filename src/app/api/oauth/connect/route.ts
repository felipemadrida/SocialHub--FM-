import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { getProvider, isValidPlatform } from "@/lib/oauth/providers";
import { PLATFORM_CONFIG } from "@/lib/platforms";
import { z } from "zod";

const bodySchema = z.object({
  platform: z.string(),
  accountName: z.string().trim().min(1).max(100).optional(),
  mode: z.enum(["demo", "reconnect"]).optional().default("demo"),
});

/**
 * Demo / local connect when real OAuth credentials are missing.
 * Creates an active account with demo_* token so multi-publish can run.
 */
export async function POST(request: Request) {
  const { error } = await requireSession();
  if (error) return error;

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { platform, accountName } = parsed.data;
  if (!isValidPlatform(platform)) {
    return NextResponse.json({ error: "Unsupported platform" }, { status: 400 });
  }

  const conf = PLATFORM_CONFIG[platform];
  const provider = getProvider(platform);
  const name =
    accountName ||
    `@${platform}_demo_${Math.random().toString(36).slice(2, 6)}`;

  const existing = await db.socialAccount.findFirst({
    where: { platform, isActive: true },
  });

  const data = {
    platform,
    accountName: name,
    avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${conf.avatarBg}&color=fff`,
    accessToken: `demo_${platform}_${Date.now()}`,
    refreshToken: `demo_refresh_${platform}`,
    externalId: `demo_${platform}_id`,
    scopes: provider?.scopes.join(" ") || null,
    connectedAt: new Date(),
    isActive: true,
    metaJson: JSON.stringify({ demo: true, configured: provider?.configured }),
  };

  const account = existing
    ? await db.socialAccount.update({ where: { id: existing.id }, data })
    : await db.socialAccount.create({ data });

  return NextResponse.json({
    ...account,
    accessToken: undefined,
    refreshToken: undefined,
    connected: true,
    mode: "demo",
    oauthConfigured: provider?.configured ?? false,
  });
}
