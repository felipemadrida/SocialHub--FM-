import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/api/auth",
  "/api/health",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/marketing") ||
    pathname === "/favicon.ico" ||
    pathname === "/favicon.png" ||
    pathname === "/logo.png" ||
    pathname.startsWith("/brand") ||
    pathname.startsWith("/uploads") ||
    pathname === "/robots.txt"
  ) {
    return NextResponse.next();
  }

  // OAuth provider callbacks must be reachable without forcing JSON 401
  if (/^\/api\/oauth\/[^/]+\/callback$/.test(pathname)) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (isPublic) return NextResponse.next();

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Allow unauthenticated read of health-ish root API hello
  if (pathname === "/api" && req.method === "GET") {
    return NextResponse.next();
  }

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const login = new URL("/login", req.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  const role = String(token.role || "retail");
  const adminOnlyApi =
    pathname.startsWith("/api/seed") ||
    pathname.startsWith("/api/users") ||
    (pathname.startsWith("/api/settings") && req.method !== "GET") ||
    (pathname.startsWith("/api/accounts") && req.method === "DELETE") ||
    (pathname.startsWith("/api/campaigns") && req.method === "DELETE");

  if (adminOnlyApi && role !== "admin") {
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
