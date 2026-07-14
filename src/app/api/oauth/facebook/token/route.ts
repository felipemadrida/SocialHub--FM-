import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { PLATFORM_CONFIG } from "@/lib/platforms";
import { fetchProfile } from "@/lib/oauth/state";

const bodySchema = z.object({
  accessToken: z.string().min(10),
  userID: z.string().optional(),
  expiresIn: z.union([z.number(), z.string()]).optional(),
  signedRequest: z.string().optional(),
  platform: z.enum(["facebook", "instagram"]).default("facebook"),
});

/**
 * Accept a user access token from Facebook JS SDK (FB.login / getLoginStatus)
 * and persist a SocialAccount for live publishing.
 */
export async function POST(request: Request) {
  const { error } = await requireSession();
  if (error) return error;

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { accessToken, expiresIn, platform } = parsed.data;
  const expiresInNum =
    typeof expiresIn === "string" ? Number(expiresIn) : expiresIn;
  const expiresInSafe =
    typeof expiresInNum === "number" && Number.isFinite(expiresInNum)
      ? expiresInNum
      : undefined;

  // Validate token with Graph API
  const debug = await fetch(
    `https://graph.facebook.com/v21.0/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(`${process.env.META_APP_ID}|${process.env.META_APP_SECRET}`)}`
  ).then((r) => r.json());

  if (!debug?.data?.is_valid) {
    return NextResponse.json(
      {
        error: "Token de Facebook inválido",
        detail: debug?.data?.error?.message || debug?.error?.message,
      },
      { status: 400 }
    );
  }

  const profile = await fetchProfile(platform, accessToken);
  const conf = PLATFORM_CONFIG[platform];

  // Attach first managed Page (needed for pages_manage_posts later)
  let meta: Record<string, unknown> = { ...(profile.meta || {}), sdk: "js" };
  try {
    const pages = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token&access_token=${encodeURIComponent(accessToken)}`
    ).then((r) => r.json());
    const first = pages?.data?.[0];
    if (first) {
      meta = {
        ...meta,
        pageId: first.id,
        pageName: first.name,
        pageAccessToken: first.access_token,
      };
    }
  } catch {
    // optional until pages_* permissions are granted
  }

  const existing = await db.socialAccount.findFirst({
    where: {
      platform,
      OR: [
        profile.externalId ? { externalId: profile.externalId } : undefined,
        { accountName: profile.name },
      ].filter(Boolean) as { externalId?: string; accountName?: string }[],
    },
  });

  const data = {
    platform,
    accountName: (meta.pageName as string) || profile.name,
    avatarUrl:
      profile.avatarUrl ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=${conf.avatarBg}&color=fff`,
    accessToken,
    refreshToken: null as string | null,
    externalId: String(meta.pageId || profile.externalId || ""),
    tokenExpiresAt: expiresInSafe
      ? new Date(Date.now() + expiresInSafe * 1000)
      : debug?.data?.expires_at
        ? new Date(Number(debug.data.expires_at) * 1000)
        : null,
    scopes: Array.isArray(debug?.data?.scopes)
      ? debug.data.scopes.join(" ")
      : "public_profile",
    metaJson: JSON.stringify(meta),
    connectedAt: new Date(),
    isActive: true,
  };

  const account = existing
    ? await db.socialAccount.update({ where: { id: existing.id }, data })
    : await db.socialAccount.create({ data });

  return NextResponse.json({
    id: account.id,
    platform: account.platform,
    accountName: account.accountName,
    connected: true,
    mode: "facebook-js-sdk",
    pages: meta.pageId ? [{ id: meta.pageId, name: meta.pageName }] : [],
  });
}
