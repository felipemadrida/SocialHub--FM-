import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appBaseUrl, isValidPlatform } from "@/lib/oauth/providers";
import {
  exchangeCodeForToken,
  fetchProfile,
  requireProvider,
  verifyOAuthState,
} from "@/lib/oauth/state";
import { PLATFORM_CONFIG } from "@/lib/platforms";

type Ctx = { params: Promise<{ platform: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const { platform } = await ctx.params;
  const base = appBaseUrl();

  if (!isValidPlatform(platform)) {
    return NextResponse.redirect(`${base}/?oauth=error&platform=${platform}`);
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const err = url.searchParams.get("error");

  if (err) {
    return NextResponse.redirect(
      `${base}/?tab=accounts&oauth=denied&platform=${platform}`
    );
  }
  if (!code || !state || !verifyOAuthState(state)) {
    return NextResponse.redirect(
      `${base}/?tab=accounts&oauth=invalid&platform=${platform}`
    );
  }

  try {
    const provider = requireProvider(platform);
    const cookieHeader = request.headers.get("cookie") || "";
    const pkceMatch = cookieHeader.match(
      new RegExp(`oauth_pkce_${platform}=([^;]+)`)
    );
    const codeVerifier = pkceMatch?.[1];

    const tokens = await exchangeCodeForToken(provider, code, codeVerifier);
    const profile = await fetchProfile(platform, tokens.accessToken);
    const conf = PLATFORM_CONFIG[platform];

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
      accountName: profile.name,
      avatarUrl:
        profile.avatarUrl ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=${conf.avatarBg}&color=fff`,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      externalId: profile.externalId || null,
      tokenExpiresAt: tokens.expiresIn
        ? new Date(Date.now() + tokens.expiresIn * 1000)
        : null,
      scopes: provider.scopes.join(" "),
      metaJson: profile.meta ? JSON.stringify(profile.meta) : null,
      connectedAt: new Date(),
      isActive: true,
    };

    if (existing) {
      await db.socialAccount.update({ where: { id: existing.id }, data });
    } else {
      await db.socialAccount.create({ data });
    }

    const res = NextResponse.redirect(
      `${base}/?tab=accounts&oauth=success&platform=${platform}`
    );
    res.cookies.set(`oauth_pkce_${platform}`, "", { path: "/", maxAge: 0 });
    return res;
  } catch (e) {
    console.error("oauth callback", e);
    return NextResponse.redirect(
      `${base}/?tab=accounts&oauth=error&platform=${platform}`
    );
  }
}
