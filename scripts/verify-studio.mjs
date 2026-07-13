/**
 * End-to-end smoke test for Studio + post media attach (local).
 * Usage: node scripts/verify-studio.mjs
 */
const BASE = process.env.APP_URL || "http://localhost:3001";

async function main() {
  const jar = new Map();

  function storeCookies(res) {
    const raw = res.headers.getSetCookie?.() || [];
    for (const c of raw) {
      const [pair] = c.split(";");
      const i = pair.indexOf("=");
      if (i > 0) jar.set(pair.slice(0, i), pair.slice(i + 1));
    }
  }
  function cookieHeader() {
    return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }
  async function req(path, opts = {}) {
    const headers = { ...(opts.headers || {}), Cookie: cookieHeader() };
    const res = await fetch(`${BASE}${path}`, { ...opts, headers, redirect: "manual" });
    storeCookies(res);
    return res;
  }

  console.log("1) CSRF + login…");
  const csrfRes = await req("/api/auth/csrf");
  const { csrfToken } = await csrfRes.json();
  const loginBody = new URLSearchParams({
    csrfToken,
    email: "admin@socialhub.local",
    password: "Admin123!",
    callbackUrl: `${BASE}/`,
    json: "true",
  });
  const loginRes = await req("/api/auth/callback/credentials", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: loginBody.toString(),
  });
  if (loginRes.status >= 400) {
    throw new Error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
  }
  console.log("   login ok", loginRes.status);

  console.log("2) GET /api/studio/media…");
  const mediaRes = await req("/api/studio/media");
  const media = await mediaRes.json();
  if (!mediaRes.ok) throw new Error(`media failed: ${JSON.stringify(media)}`);
  console.log(`   assets=${media.assets?.length} collections=${media.collections?.length}`);
  if (!media.assets?.length) throw new Error("Expected seeded assets");

  const first = media.assets.find((a) => a.type === "image") || media.assets[0];
  console.log("3) Attach media via create post…");
  const accountsRes = await req("/api/accounts");
  const accounts = await accountsRes.json();
  if (!Array.isArray(accounts) || !accounts.length) {
    console.log("   no accounts — seeding…");
    await req("/api/seed", {
      method: "POST",
      headers: { "x-seed-secret": process.env.SEED_SECRET || "dev-seed-secret" },
    });
  }
  const accounts2 = await (await req("/api/accounts")).json();
  const accountId = accounts2[0]?.id;
  if (!accountId) throw new Error("No accountId after seed");

  const postRes = await req("/api/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: "Smoke test Studio attach " + new Date().toISOString(),
      platforms: [accounts2[0].platform || "instagram"],
      status: "draft",
      accountId,
      mediaUrls: [first.url],
    }),
  });
  const post = await postRes.json();
  if (!postRes.ok) throw new Error(`post failed: ${JSON.stringify(post)}`);
  console.log("   post id", post.id, "mediaUrls", post.mediaUrls);

  console.log("4) Upload URL asset…");
  const form = new FormData();
  form.append("url", "/brand/socialhub_logo.png");
  form.append("name", "Verify Upload URL");
  form.append("category", "marca");
  form.append("collection", "QA");
  form.append("tags", "verify,qa");
  const upRes = await req("/api/studio/upload", { method: "POST", body: form });
  const uploaded = await upRes.json();
  if (!upRes.ok) throw new Error(`upload failed: ${JSON.stringify(uploaded)}`);
  console.log("   uploaded", uploaded.id, uploaded.url);

  console.log("\n✅ Studio + post media flow OK");
}

main().catch((e) => {
  console.error("\n❌", e.message || e);
  process.exit(1);
});
