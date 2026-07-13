import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions, isAdminRole } from "@/lib/auth";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session, error: null };
}

export async function requireAdmin() {
  const { session, error } = await requireSession();
  if (error) return { session: null, error };
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!isAdminRole(role)) {
    return {
      session,
      error: NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 }),
    };
  }
  return { session, error: null };
}
