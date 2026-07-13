import crypto from "crypto";
import {
  getProvider,
  oauthCallbackUrl,
  type OAuthProviderConfig,
} from "@/lib/oauth/providers";

const STATE_SECRET =
  process.env.NEXTAUTH_SECRET || process.env.OAUTH_STATE_SECRET || "dev-oauth-state";

export function signOAuthState(payload: Record<string, string>) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", STATE_SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyOAuthState(state: string): Record<string, string> | null {
  const [body, sig] = state.split(".");
  if (!body || !sig) return null;
  const expected = crypto.createHmac("sha256", STATE_SECRET).update(body).digest("base64url");
  if (expected !== sig) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export function buildAuthorizeUrl(
  provider: OAuthProviderConfig,
  state: string,
  codeChallenge?: string
) {
  if (!provider.authUrl) throw new Error("Provider authUrl missing");
  const clientId = process.env[provider.envId]!;
  const redirectUri = oauthCallbackUrl(provider.platform);
  const url = new URL(provider.authUrl);

  if (provider.platform === "tiktok") {
    url.searchParams.set("client_key", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", provider.scopes.join(","));
    url.searchParams.set("state", state);
    return url.toString();
  }

  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  url.searchParams.set("scope", provider.scopes.join(" "));

  if (provider.platform === "x" || provider.platform === "youtube") {
    url.searchParams.set("code_challenge", codeChallenge || "challenge");
    url.searchParams.set("code_challenge_method", "plain");
  }
  if (provider.platform === "youtube") {
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
  }
  if (provider.platform === "facebook" || provider.platform === "instagram") {
    // Meta uses same dialog
  }

  return url.toString();
}

export async function exchangeCodeForToken(
  provider: OAuthProviderConfig,
  code: string,
  codeVerifier?: string
) {
  if (!provider.tokenUrl) throw new Error("Provider tokenUrl missing");
  const clientId = process.env[provider.envId]!;
  const clientSecret = process.env[provider.envSecret]!;
  const redirectUri = oauthCallbackUrl(provider.platform);

  if (provider.platform === "facebook" || provider.platform === "instagram") {
    const url = new URL(provider.tokenUrl);
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("client_secret", clientSecret);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("code", code);
    const res = await fetch(url.toString());
    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error?.message || "Meta token exchange failed");
    }
    return {
      accessToken: data.access_token as string,
      refreshToken: null as string | null,
      expiresIn: data.expires_in as number | undefined,
    };
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code,
    grant_type: "authorization_code",
  });
  if (codeVerifier) body.set("code_verifier", codeVerifier);

  const res = await fetch(provider.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(
      data.error_description || data.error || data.message || "Token exchange failed"
    );
  }
  return {
    accessToken: (data.access_token || data.accessToken) as string,
    refreshToken: (data.refresh_token || null) as string | null,
    expiresIn: data.expires_in as number | undefined,
  };
}

export async function fetchProfile(
  platform: string,
  accessToken: string
): Promise<{ name: string; avatarUrl?: string; externalId?: string; meta?: Record<string, unknown> }> {
  try {
    if (platform === "facebook" || platform === "instagram") {
      const me = await fetch(
        `https://graph.facebook.com/v19.0/me?fields=id,name,picture&access_token=${accessToken}`
      ).then((r) => r.json());
      return {
        name: me.name || `${platform}_user`,
        avatarUrl: me.picture?.data?.url,
        externalId: me.id,
        meta: { userId: me.id },
      };
    }
    if (platform === "x") {
      const me = await fetch("https://api.twitter.com/2/users/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then((r) => r.json());
      return {
        name: me.data?.username ? `@${me.data.username}` : "x_user",
        externalId: me.data?.id,
      };
    }
    if (platform === "linkedin") {
      const me = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then((r) => r.json());
      return {
        name: me.name || me.email || "linkedin_user",
        avatarUrl: me.picture,
        externalId: me.sub,
      };
    }
  } catch {
    // fall through
  }
  return { name: `${platform}_account` };
}

export function requireProvider(platform: string) {
  const p = getProvider(platform);
  if (!p) throw new Error("Unsupported platform");
  return p;
}
