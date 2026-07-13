import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { ensureDefaultUsers } from "@/lib/ensure-users";

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(80),
  password: z.string().min(8).max(100),
  role: z.enum(["admin", "retail"]).default("retail"),
  isActive: z.boolean().optional().default(true),
});

const updateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).max(80).optional(),
  role: z.enum(["admin", "retail"]).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).max(100).optional(),
});

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  await ensureDefaultUsers();
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const exists = await db.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await db.user.create({
    data: {
      email,
      name: parsed.data.name,
      passwordHash,
      role: parsed.data.role,
      isActive: parsed.data.isActive,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
  return NextResponse.json(user, { status: 201 });
}

export async function PATCH(request: Request) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data: {
    name?: string;
    role?: string;
    isActive?: boolean;
    passwordHash?: string;
  } = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.role !== undefined) data.role = parsed.data.role;
  if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;
  if (parsed.data.password) {
    data.passwordHash = await bcrypt.hash(parsed.data.password, 10);
  }

  // Prevent self-lockout
  const selfId = (session?.user as { id?: string } | undefined)?.id;
  if (selfId === parsed.data.id && data.isActive === false) {
    return NextResponse.json({ error: "Cannot deactivate your own account" }, { status: 400 });
  }

  const user = await db.user.update({
    where: { id: parsed.data.id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      updatedAt: true,
    },
  });
  return NextResponse.json(user);
}

export async function DELETE(request: Request) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const selfId = (session?.user as { id?: string } | undefined)?.id;
  if (selfId === id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  await db.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
