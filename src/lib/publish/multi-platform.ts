import { db } from "@/lib/db";
import { isDemoToken } from "@/lib/oauth/providers";
import type { PlatformId } from "@/lib/platforms";

export type PublishTargetResult = {
  platform: string;
  accountId?: string;
  accountName?: string;
  status: "published" | "failed" | "skipped";
  postId?: string;
  publishedAt?: string;
  error?: string;
  mode?: "mock" | "live" | "demo";
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
    reaches: number;
  };
};

type AccountRow = {
  id: string;
  platform: string;
  accountName: string;
  accessToken: string | null;
  refreshToken: string | null;
  externalId: string | null;
  metaJson: string | null;
  isActive: boolean;
};

function parseMeta(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function simulatePublish(
  platform: string,
  account: AccountRow,
  mode: "mock" | "demo"
): Promise<PublishTargetResult> {
  await new Promise((r) => setTimeout(r, 300 + Math.random() * 700));
  const ok = Math.random() > 0.05;
  if (!ok) {
    return {
      platform,
      accountId: account.id,
      accountName: account.accountName,
      status: "failed",
      error: `Rate limit simulado en ${platform}`,
      mode,
    };
  }
  return {
    platform,
    accountId: account.id,
    accountName: account.accountName,
    status: "published",
    postId: `${platform}_${Date.now().toString(36)}`,
    publishedAt: new Date().toISOString(),
    mode,
    engagement: {
      likes: Math.floor(Math.random() * 400),
      comments: Math.floor(Math.random() * 80),
      shares: Math.floor(Math.random() * 40),
      reaches: Math.floor(Math.random() * 4000),
    },
  };
}

/** Facebook Page feed publish via Graph API */
async function publishFacebook(
  account: AccountRow,
  content: string,
  mediaUrls?: string[]
): Promise<PublishTargetResult> {
  const token = account.accessToken!;
  const meta = parseMeta(account.metaJson);
  let pageId = String(meta.pageId || account.externalId || "");
  let pageToken = String(meta.pageAccessToken || token);

  // Resolve first page if needed
  if (!meta.pageId) {
    const pages = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${token}`
    ).then((r) => r.json());
    const first = pages.data?.[0];
    if (first) {
      pageId = first.id;
      pageToken = first.access_token;
      await db.socialAccount.update({
        where: { id: account.id },
        data: {
          externalId: pageId,
          metaJson: JSON.stringify({
            ...meta,
            pageId,
            pageAccessToken: pageToken,
          }),
        },
      });
    }
  }

  if (!pageId) {
    return {
      platform: "facebook",
      accountId: account.id,
      accountName: account.accountName,
      status: "failed",
      error: "No se encontró Facebook Page. Conecta una Page en Meta.",
      mode: "live",
    };
  }

  const body: Record<string, string> = {
    message: content,
    access_token: pageToken,
  };
  if (mediaUrls?.[0] && /^https?:\/\//i.test(mediaUrls[0])) {
    body.link = mediaUrls[0];
  }

  const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    return {
      platform: "facebook",
      accountId: account.id,
      accountName: account.accountName,
      status: "failed",
      error: data.error?.message || "Facebook publish failed",
      mode: "live",
    };
  }
  return {
    platform: "facebook",
    accountId: account.id,
    accountName: account.accountName,
    status: "published",
    postId: data.id,
    publishedAt: new Date().toISOString(),
    mode: "live",
  };
}

/** Instagram content publishing (requires image URL publicly reachable) */
async function publishInstagram(
  account: AccountRow,
  content: string,
  mediaUrls?: string[]
): Promise<PublishTargetResult> {
  const token = account.accessToken!;
  const meta = parseMeta(account.metaJson);
  const igUserId = String(meta.igUserId || account.externalId || "");
  const imageUrl = mediaUrls?.find((u) => /^https?:\/\//i.test(u));

  if (!igUserId) {
    return {
      platform: "instagram",
      accountId: account.id,
      accountName: account.accountName,
      status: "failed",
      error: "Falta Instagram Business ID. Completa OAuth Meta con cuenta IG vinculada.",
      mode: "live",
    };
  }
  if (!imageUrl) {
    return {
      platform: "instagram",
      accountId: account.id,
      accountName: account.accountName,
      status: "failed",
      error: "Instagram requiere una imagen con URL pública https://",
      mode: "live",
    };
  }

  const create = await fetch(
    `https://graph.facebook.com/v19.0/${igUserId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: imageUrl,
        caption: content,
        access_token: token,
      }),
    }
  ).then((r) => r.json());

  if (create.error || !create.id) {
    return {
      platform: "instagram",
      accountId: account.id,
      accountName: account.accountName,
      status: "failed",
      error: create.error?.message || "No se pudo crear contenedor IG",
      mode: "live",
    };
  }

  const publish = await fetch(
    `https://graph.facebook.com/v19.0/${igUserId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: create.id,
        access_token: token,
      }),
    }
  ).then((r) => r.json());

  if (publish.error || !publish.id) {
    return {
      platform: "instagram",
      accountId: account.id,
      accountName: account.accountName,
      status: "failed",
      error: publish.error?.message || "Instagram publish failed",
      mode: "live",
    };
  }

  return {
    platform: "instagram",
    accountId: account.id,
    accountName: account.accountName,
    status: "published",
    postId: publish.id,
    publishedAt: new Date().toISOString(),
    mode: "live",
  };
}

async function publishX(
  account: AccountRow,
  content: string
): Promise<PublishTargetResult> {
  const res = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${account.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: content.slice(0, 280) }),
  });
  const data = await res.json();
  if (!res.ok || data.errors) {
    return {
      platform: "x",
      accountId: account.id,
      accountName: account.accountName,
      status: "failed",
      error: data.detail || data.title || data.errors?.[0]?.message || "X publish failed",
      mode: "live",
    };
  }
  return {
    platform: "x",
    accountId: account.id,
    accountName: account.accountName,
    status: "published",
    postId: data.data?.id,
    publishedAt: new Date().toISOString(),
    mode: "live",
  };
}

async function publishLinkedIn(
  account: AccountRow,
  content: string
): Promise<PublishTargetResult> {
  const author =
    parseMeta(account.metaJson).authorUrn ||
    (account.externalId ? `urn:li:person:${account.externalId}` : null);
  if (!author) {
    return {
      platform: "linkedin",
      accountId: account.id,
      accountName: account.accountName,
      status: "failed",
      error: "Falta URN de autor LinkedIn",
      mode: "live",
    };
  }
  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${account.accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: content },
          shareMediaCategory: "NONE",
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      platform: "linkedin",
      accountId: account.id,
      accountName: account.accountName,
      status: "failed",
      error: data.message || "LinkedIn publish failed",
      mode: "live",
    };
  }
  return {
    platform: "linkedin",
    accountId: account.id,
    accountName: account.accountName,
    status: "published",
    postId: data.id || `li_${Date.now()}`,
    publishedAt: new Date().toISOString(),
    mode: "live",
  };
}

async function publishLive(
  account: AccountRow,
  content: string,
  mediaUrls?: string[]
): Promise<PublishTargetResult> {
  const platform = account.platform as PlatformId;
  try {
    if (platform === "facebook") return publishFacebook(account, content, mediaUrls);
    if (platform === "instagram") return publishInstagram(account, content, mediaUrls);
    if (platform === "x") return publishX(account, content);
    if (platform === "linkedin") return publishLinkedIn(account, content);
    return {
      platform,
      accountId: account.id,
      accountName: account.accountName,
      status: "failed",
      error: `API live de ${platform} aún no implementada. Usa mock o Meta/X/LinkedIn.`,
      mode: "live",
    };
  } catch (e) {
    return {
      platform,
      accountId: account.id,
      accountName: account.accountName,
      status: "failed",
      error: e instanceof Error ? e.message : "Publish error",
      mode: "live",
    };
  }
}

/**
 * Publish content to one or many platforms at once.
 * Resolves the best active connected account per platform.
 */
export async function publishToPlatforms(opts: {
  content: string;
  platforms: string[];
  mediaUrls?: string[];
  mockPublish: boolean;
  accountIds?: string[];
}): Promise<PublishTargetResult[]> {
  const { content, platforms, mediaUrls, mockPublish, accountIds } = opts;

  const accounts = await db.socialAccount.findMany({
    where: {
      isActive: true,
      ...(accountIds?.length
        ? { id: { in: accountIds } }
        : { platform: { in: platforms } }),
    },
  });

  const results: PublishTargetResult[] = [];

  for (const platform of platforms) {
    const account =
      accounts.find((a) => a.platform === platform && a.accessToken) ||
      accounts.find((a) => a.platform === platform);

    if (!account) {
      results.push({
        platform,
        status: "failed",
        error: `No hay cuenta conectada para ${platform}. Conéctala en Cuentas.`,
      });
      continue;
    }

    if (!account.accessToken) {
      results.push({
        platform,
        accountId: account.id,
        accountName: account.accountName,
        status: "failed",
        error: "Cuenta sin token. Inicia sesión OAuth en Cuentas.",
      });
      continue;
    }

    if (mockPublish || isDemoToken(account.accessToken)) {
      results.push(
        await simulatePublish(
          platform,
          account,
          isDemoToken(account.accessToken) ? "demo" : "mock"
        )
      );
      continue;
    }

    results.push(await publishLive(account, content, mediaUrls));
  }

  return results;
}
