import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getOAuthProviders, oauthCallbackUrl } from "@/lib/oauth/providers";

/** List OAuth provider readiness + callback URLs for production setup */
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
    meta: {
      appId: process.env.META_APP_ID || null,
      loginConfigId: process.env.META_LOGIN_CONFIG_ID || null,
      sdkVersion: "v21.0",
      jsSdkEnabled: Boolean(process.env.META_APP_ID?.trim()),
    },
    summary: {
      total: providers.length,
      configured: configuredCount,
      ready: configuredCount > 0,
    },
  });
}
