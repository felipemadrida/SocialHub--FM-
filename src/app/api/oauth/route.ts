import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getOAuthProviders } from "@/lib/oauth/providers";

/** List OAuth provider readiness + start URL hints */
export async function GET() {
  const { error } = await requireSession();
  if (error) return error;

  const providers = getOAuthProviders().map((p) => ({
    platform: p.platform,
    label: p.label,
    configured: p.configured,
    supportsText: p.supportsText,
    supportsImage: p.supportsImage,
    supportsVideo: p.supportsVideo,
    envId: p.envId,
    envSecret: p.envSecret,
  }));

  return NextResponse.json({ providers });
}
