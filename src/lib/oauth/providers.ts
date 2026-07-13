import type { PlatformId } from "@/lib/platforms";
import { PLATFORMS } from "@/lib/platforms";

export type OAuthProviderConfig = {
  platform: PlatformId;
  label: string;
  envId: string;
  envSecret: string;
  /** true if client id + secret present */
  configured: boolean;
  authUrl?: string;
  tokenUrl?: string;
  scopes: string[];
  supportsText: boolean;
  supportsImage: boolean;
  supportsVideo: boolean;
};

function hasEnv(idKey: string, secretKey: string) {
  return Boolean(process.env[idKey]?.trim() && process.env[secretKey]?.trim());
}

export function getOAuthProviders(): OAuthProviderConfig[] {
  return [
    {
      platform: "facebook",
      label: "Facebook",
      envId: "META_APP_ID",
      envSecret: "META_APP_SECRET",
      configured: hasEnv("META_APP_ID", "META_APP_SECRET"),
      authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
      tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
      scopes: ["pages_show_list", "pages_manage_posts", "pages_read_engagement", "public_profile"],
      supportsText: true,
      supportsImage: true,
      supportsVideo: true,
    },
    {
      platform: "instagram",
      label: "Instagram",
      envId: "META_APP_ID",
      envSecret: "META_APP_SECRET",
      configured: hasEnv("META_APP_ID", "META_APP_SECRET"),
      authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
      tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
      scopes: [
        "instagram_basic",
        "instagram_content_publish",
        "pages_show_list",
        "pages_read_engagement",
      ],
      supportsText: true,
      supportsImage: true,
      supportsVideo: true,
    },
    {
      platform: "tiktok",
      label: "TikTok",
      envId: "TIKTOK_CLIENT_KEY",
      envSecret: "TIKTOK_CLIENT_SECRET",
      configured: hasEnv("TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"),
      authUrl: "https://www.tiktok.com/v2/auth/authorize/",
      tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/",
      scopes: ["user.info.basic", "video.publish", "video.upload"],
      supportsText: false,
      supportsImage: false,
      supportsVideo: true,
    },
    {
      platform: "x",
      label: "X (Twitter)",
      envId: "X_CLIENT_ID",
      envSecret: "X_CLIENT_SECRET",
      configured: hasEnv("X_CLIENT_ID", "X_CLIENT_SECRET"),
      authUrl: "https://twitter.com/i/oauth2/authorize",
      tokenUrl: "https://api.twitter.com/2/oauth2/token",
      scopes: ["tweet.read", "tweet.write", "users.read", "offline.access"],
      supportsText: true,
      supportsImage: true,
      supportsVideo: true,
    },
    {
      platform: "linkedin",
      label: "LinkedIn",
      envId: "LINKEDIN_CLIENT_ID",
      envSecret: "LINKEDIN_CLIENT_SECRET",
      configured: hasEnv("LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET"),
      authUrl: "https://www.linkedin.com/oauth/v2/authorization",
      tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
      scopes: ["openid", "profile", "w_member_social"],
      supportsText: true,
      supportsImage: true,
      supportsVideo: true,
    },
    {
      platform: "youtube",
      label: "YouTube",
      envId: "GOOGLE_CLIENT_ID",
      envSecret: "GOOGLE_CLIENT_SECRET",
      configured: hasEnv("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"),
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      scopes: [
        "https://www.googleapis.com/auth/youtube.upload",
        "https://www.googleapis.com/auth/youtube.readonly",
      ],
      supportsText: false,
      supportsImage: false,
      supportsVideo: true,
    },
    {
      platform: "pinterest",
      label: "Pinterest",
      envId: "PINTEREST_APP_ID",
      envSecret: "PINTEREST_APP_SECRET",
      configured: hasEnv("PINTEREST_APP_ID", "PINTEREST_APP_SECRET"),
      authUrl: "https://www.pinterest.com/oauth/",
      tokenUrl: "https://api.pinterest.com/v5/oauth/token",
      scopes: ["boards:read", "pins:read", "pins:write"],
      supportsText: true,
      supportsImage: true,
      supportsVideo: false,
    },
  ];
}

export function getProvider(platform: string) {
  return getOAuthProviders().find((p) => p.platform === platform);
}

export function isValidPlatform(p: string): p is PlatformId {
  return (PLATFORMS as readonly string[]).includes(p);
}

export function appBaseUrl() {
  return (
    process.env.APP_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3001"
  ).replace(/\/$/, "");
}

export function oauthCallbackUrl(platform: string) {
  return `${appBaseUrl()}/api/oauth/${platform}/callback`;
}
