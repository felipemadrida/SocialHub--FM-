import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getOAuthProviders, oauthCallbackUrl } from "@/lib/oauth/providers";

/** List OAuth provider readiness + callback URLs (same flow for every network). */
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
    callbackUrl: oauthCallbackUrl(p.platform),
    startPath: `/api/oauth/${p.platform}/start`,
  }));

  const configuredCount = providers.filter((p) => p.configured).length;

  return NextResponse.json({
    providers,
    summary: {
      total: providers.length,
      configured: configuredCount,
      ready: configuredCount > 0,
    },
  });
}
