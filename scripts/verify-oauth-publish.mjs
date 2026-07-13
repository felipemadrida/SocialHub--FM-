/**
 * Smoke: demo connect + multi-platform publish (no real OAuth keys needed).
 * Requires APP running with auth cookies — use NEXTAUTH session via credentials first.
 *
 * Usage (with node):
 *   node scripts/verify-oauth-publish.mjs
 * Env: BASE_URL (default http://localhost:3001), ADMIN_EMAIL, ADMIN_PASSWORD
 */
const BASE = (process.env.BASE_URL || "http://localhost:3001").replace(/\/$/, "");
const email = process.env.ADMIN_EMAIL || "admin@socialhub.local";
const password = process.env.ADMIN_PASSWORD || "Admin123!";

function cookieJar(res, jar) {
  const raw = res.headers.getSetCookie?.() || [];
  for (const c of raw) {
    const [pair] = c.split(";");
    const eq = pair.indexOf("=");
    if (eq > 0) jar.set(pair.slice(0, eq), pair.slice(eq + 1));
  }
  // fallback single set-cookie
  const single = res.headers.get("set-cookie");
  if (single && !raw.length) {
    const [pair] = single.split(";");
    const eq = pair.indexOf("=");
    if (eq > 0) jar.set(pair.slice(0, eq), pair.slice(eq + 1));
  }
}

function cookieHeader(jar) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function main() {
  const jar = new Map();
  console.log("→ CSRF / auth bootstrap via NextAuth credentials");

  // NextAuth credentials: get csrf then sign in
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`, { credentials: "include" });
  cookieJar(csrfRes, jar);
  const { csrfToken } = await csrfRes.json();

  const loginBody = new URLSearchParams({
    csrfToken,
    email,
    password,
    callbackUrl: `${BASE}/`,
    json: "true",
  });
  const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookieHeader(jar),
    },
    body: loginBody,
    redirect: "manual",
  });
  cookieJar(loginRes, jar);

  const sessionRes = await fetch(`${BASE}/api/auth/session`, {
    headers: { Cookie: cookieHeader(jar) },
  });
  const session = await sessionRes.json();
  if (!session?.user) {
    console.error("Login failed — no session", session, "status", loginRes.status);
    process.exit(1);
  }
  console.log("✓ logged in as", session.user.email || session.user.name);

  const platforms = ["facebook", "instagram", "x"];
  for (const platform of platforms) {
    const res = await fetch(`${BASE}/api/oauth/connect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader(jar),
      },
      body: JSON.stringify({ platform, mode: "demo" }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("connect failed", platform, data);
      process.exit(1);
    }
    console.log(`✓ demo connect ${platform}`, data.accountName || data.id);
  }

  const pub = await fetch(`${BASE}/api/publish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader(jar),
    },
    body: JSON.stringify({
      content: `SocialHub multi-publish smoke ${new Date().toISOString()}`,
      platforms,
    }),
  });
  const pubData = await pub.json();
  if (!pub.ok) {
    console.error("publish failed", pubData);
    process.exit(1);
  }
  console.log("✓ multi-publish", JSON.stringify(pubData.summary), pubData.results?.map((r) => `${r.platform}:${r.status}/${r.mode}`).join(", "));

  const oauth = await fetch(`${BASE}/api/oauth`, {
    headers: { Cookie: cookieHeader(jar) },
  });
  const oauthData = await oauth.json();
  console.log(
    "✓ oauth providers",
    (oauthData.providers || []).map((p) => `${p.platform}:${p.configured ? "live-ready" : "demo-only"}`).join(", ")
  );

  console.log("OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
