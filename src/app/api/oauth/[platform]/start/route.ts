import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { isValidPlatform } from "@/lib/oauth/providers";
import {
  buildAuthorizeUrl,
  requireProvider,
  signOAuthState,
} from "@/lib/oauth/state";
import crypto from "crypto";

type Ctx = { params: Promise<{ platform: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { error, session } = await requireSession();
  if (error) return error;

  const { platform } = await ctx.params;
  if (!isValidPlatform(platform)) {
    return NextResponse.json({ error: "Unsupported platform" }, { status: 400 });
  }

  try {
    const provider = requireProvider(platform);
    if (!provider.configured) {
      return NextResponse.json(
        {
          error: "OAuth no configurado",
          hint: `Define ${provider.envId} y ${provider.envSecret} en el entorno`,
        },
        { status: 400 }
      );
    }

    const state = signOAuthState({
      platform,
      uid: String((session?.user as { id?: string })?.id || ""),
      nonce: crypto.randomBytes(8).toString("hex"),
      ts: String(Date.now()),
    });

    const codeChallenge = crypto.randomBytes(32).toString("base64url");
    const url = buildAuthorizeUrl(provider, state, codeChallenge);

    const res = NextResponse.redirect(url);
    res.cookies.set(`oauth_pkce_${platform}`, codeChallenge, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
    return res;
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "OAuth start failed" },
      { status: 500 }
    );
  }
}
