import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { ensureDefaultUsers } from "@/lib/ensure-users";

export type AppRole = "admin" | "retail";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await ensureDefaultUsers();

        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password || "";
        if (!email || !password) return null;

        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.isActive) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as AppRole,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: AppRole }).role || "retail";
        token.uid = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = String(token.uid || "");
        (session.user as { role?: AppRole }).role =
          (token.role as AppRole) || "retail";
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export function isAdminRole(role?: string | null) {
  return role === "admin";
}
