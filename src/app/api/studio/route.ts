import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/api-auth";
import {
  STUDIO_CATEGORIES,
  STUDIO_SEED_ASSETS,
  STUDIO_TYPES,
  detectStudioType,
  parseTags,
  serializeTags,
  type StudioAssetDTO,
} from "@/lib/studio";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "studio");

function toDTO(row: {
  id: string;
  name: string;
  type: string;
  category: string;
  collection: string | null;
  tags: string;
  altText: string | null;
  url: string;
  filePath: string | null;
  mimeType: string | null;
  sizeBytes: number;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}): StudioAssetDTO {
  return {
    id: row.id,
    name: row.name,
    type: row.type as StudioAssetDTO["type"],
    category: row.category,
    collection: row.collection,
    tags: parseTags(row.tags),
    altText: row.altText,
    url: row.url,
    filePath: row.filePath,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    isFavorite: row.isFavorite,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function ensureSeedAssets() {
  const count = await db.mediaAsset.count();
  if (count > 0) return;
  await db.mediaAsset.createMany({
    data: STUDIO_SEED_ASSETS.map((a) => ({
      name: a.name,
      type: a.type,
      category: a.category,
      collection: a.collection,
      tags: serializeTags([...a.tags]),
      altText: a.altText,
      url: a.url,
      filePath: a.filePath,
      mimeType: a.mimeType,
      sizeBytes: 0,
      isFavorite: a.isFavorite,
    })),
  });
}

const metaSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  type: z.enum(STUDIO_TYPES).optional(),
  category: z.enum(STUDIO_CATEGORIES).optional(),
  collection: z.string().trim().max(120).nullable().optional(),
  tags: z.union([z.array(z.string()), z.string()]).optional(),
  altText: z.string().trim().max(300).nullable().optional(),
  url: z.string().trim().min(1).max(2000).optional(),
  isFavorite: z.boolean().optional(),
});

function normalizeTags(input: unknown): string[] {
  if (Array.isArray(input)) return input.map(String);
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      /* comma list */
    }
    return input.split(",").map((t) => t.trim()).filter(Boolean);
  }
  return [];
}

export async function GET(request: Request) {
  const { error } = await requireSession();
  if (error) return error;

  await ensureSeedAssets();

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const category = searchParams.get("category");
  const collection = searchParams.get("collection");
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const favorites = searchParams.get("favorites") === "1";

  const rows = await db.mediaAsset.findMany({
    orderBy: [{ isFavorite: "desc" }, { createdAt: "desc" }],
  });

  let filtered = rows.map(toDTO);
  if (type && type !== "all") {
    if (type === "favorites") {
      filtered = filtered.filter((a) => a.isFavorite);
    } else {
      filtered = filtered.filter((a) => a.type === type);
    }
  }
  if (favorites) filtered = filtered.filter((a) => a.isFavorite);
  if (category && category !== "all") {
    filtered = filtered.filter((a) => a.category === category);
  }
  if (collection && collection !== "all") {
    filtered = filtered.filter((a) => a.collection === collection);
  }
  if (q) {
    filtered = filtered.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.altText || "").toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q)) ||
        (a.collection || "").toLowerCase().includes(q)
    );
  }

  const collections = [
    ...new Set(
      rows.map((r) => r.collection).filter((c): c is string => Boolean(c))
    ),
  ].sort();

  return NextResponse.json({
    assets: filtered,
    collections,
    total: rows.length,
  });
}

export async function POST(request: Request) {
  const { error } = await requireSession();
  if (error) return error;

  const contentType = request.headers.get("content-type") || "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      const externalUrl = String(form.get("url") || "").trim();
      const name =
        String(form.get("name") || "").trim() ||
        (file instanceof File ? file.name : "Asset sin nombre");
      const category = String(form.get("category") || "otro");
      const collection = String(form.get("collection") || "").trim() || null;
      const altText = String(form.get("altText") || "").trim() || null;
      const tags = normalizeTags(form.get("tags"));
      let typeHint = String(form.get("type") || "").trim();

      let url = "";
      let filePath: string | null = null;
      let mimeType: string | null = null;
      let sizeBytes = 0;

      if (file instanceof File && file.size > 0) {
        if (file.size > 25 * 1024 * 1024) {
          return NextResponse.json(
            { error: "Archivo demasiado grande (máx. 25MB)" },
            { status: 400 }
          );
        }
        mimeType = file.type || null;
        sizeBytes = file.size;
        if (!typeHint) typeHint = detectStudioType(file.name, file.type);

        // On Vercel the filesystem is ephemeral — persist small images as data URLs
        if (process.env.VERCEL) {
          if (sizeBytes > 1.5 * 1024 * 1024) {
            return NextResponse.json(
              {
                error:
                  "En producción el archivo debe ser ≤1.5MB o usa una URL externa",
              },
              { status: 400 }
            );
          }
          const buffer = Buffer.from(await file.arrayBuffer());
          const mime = mimeType || "application/octet-stream";
          url = `data:${mime};base64,${buffer.toString("base64")}`;
          filePath = null;
        } else {
          await mkdir(UPLOAD_DIR, { recursive: true });
          const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const filename = `${Date.now()}-${safe}`;
          const abs = path.join(UPLOAD_DIR, filename);
          const buffer = Buffer.from(await file.arrayBuffer());
          await writeFile(abs, buffer);
          filePath = `uploads/studio/${filename}`;
          url = `/${filePath}`;
        }
      } else if (externalUrl) {
        if (!externalUrl.startsWith("/") && !/^https?:\/\//i.test(externalUrl)) {
          return NextResponse.json({ error: "URL inválida" }, { status: 400 });
        }
        url = externalUrl;
        if (!typeHint) typeHint = detectStudioType(externalUrl);
      } else {
        return NextResponse.json(
          { error: "Adjunta un archivo o una URL" },
          { status: 400 }
        );
      }

      const type = (STUDIO_TYPES as readonly string[]).includes(typeHint)
        ? typeHint
        : "document";
      const cat = (STUDIO_CATEGORIES as readonly string[]).includes(category)
        ? category
        : "otro";

      const created = await db.mediaAsset.create({
        data: {
          name,
          type,
          category: cat,
          collection,
          tags: serializeTags(tags),
          altText,
          url,
          filePath,
          mimeType,
          sizeBytes,
        },
      });
      return NextResponse.json(toDTO(created), { status: 201 });
    }

    const body = await request.json();
    const parsed = metaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;
    if (!data.url) {
      return NextResponse.json({ error: "url requerida" }, { status: 400 });
    }
    const type = data.type || detectStudioType(data.url);
    const created = await db.mediaAsset.create({
      data: {
        name: data.name || "Asset",
        type,
        category: data.category || "otro",
        collection: data.collection ?? null,
        tags: serializeTags(normalizeTags(data.tags)),
        altText: data.altText ?? null,
        url: data.url,
        isFavorite: data.isFavorite ?? false,
      },
    });
    return NextResponse.json(toDTO(created), { status: 201 });
  } catch (e) {
    console.error("studio POST", e);
    return NextResponse.json({ error: "No se pudo crear el asset" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const { error } = await requireSession();
  if (error) return error;

  try {
    const body = await request.json();
    const id = String(body.id || "");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const parsed = metaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const update: Record<string, unknown> = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.type !== undefined) update.type = data.type;
    if (data.category !== undefined) update.category = data.category;
    if (data.collection !== undefined) update.collection = data.collection;
    if (data.altText !== undefined) update.altText = data.altText;
    if (data.url !== undefined) update.url = data.url;
    if (data.isFavorite !== undefined) update.isFavorite = data.isFavorite;
    if (data.tags !== undefined) update.tags = serializeTags(normalizeTags(data.tags));

    const updated = await db.mediaAsset.update({
      where: { id },
      data: update,
    });
    return NextResponse.json(toDTO(updated));
  } catch (e) {
    console.error("studio PATCH", e);
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { error } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  try {
    const existing = await db.mediaAsset.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db.mediaAsset.delete({ where: { id } });

    // Only delete uploaded files under uploads/studio — never brand pack
    if (
      existing.filePath &&
      existing.filePath.startsWith("uploads/studio/")
    ) {
      try {
        await unlink(path.join(process.cwd(), "public", existing.filePath));
      } catch {
        // ignore missing file
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("studio DELETE", e);
    return NextResponse.json({ error: "No se pudo eliminar" }, { status: 500 });
  }
}
