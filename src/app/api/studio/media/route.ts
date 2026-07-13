import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/api-auth";
import { detectStudioType, serializeTags } from "@/lib/studio";
import {
  createStudioFromFormData,
  deleteStudioAsset,
  ensureSeedAssets,
  listStudioAssets,
  normalizeTags,
  studioMetaSchema,
  toStudioDTO,
} from "@/lib/studio-server";

export async function GET(request: Request) {
  const { error } = await requireSession();
  if (error) return error;

  try {
    const data = await listStudioAssets(new URL(request.url).searchParams);
    return NextResponse.json(data);
  } catch (e) {
    console.error("studio/media GET", e);
    return NextResponse.json({ error: "Failed to list media" }, { status: 500 });
  }
}

/** Create asset from JSON metadata + URL (no multipart). */
export async function POST(request: Request) {
  const { error } = await requireSession();
  if (error) return error;

  try {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      // Convenience: allow upload via media POST too
      const form = await request.formData();
      const created = await createStudioFromFormData(form);
      return NextResponse.json(created, { status: 201 });
    }

    await ensureSeedAssets();
    const body = await request.json();
    const parsed = studioMetaSchema.safeParse(body);
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
    return NextResponse.json(toStudioDTO(created), { status: 201 });
  } catch (e) {
    const status = (e as { status?: number })?.status || 500;
    console.error("studio/media POST", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo crear" },
      { status }
    );
  }
}

export async function PATCH(request: Request) {
  const { error } = await requireSession();
  if (error) return error;

  try {
    const body = await request.json();
    const id = String(body.id || "");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const parsed = studioMetaSchema.safeParse(body);
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
    if (data.tags !== undefined) {
      update.tags = serializeTags(normalizeTags(data.tags));
    }

    const updated = await db.mediaAsset.update({
      where: { id },
      data: update,
    });
    return NextResponse.json(toStudioDTO(updated));
  } catch (e) {
    console.error("studio/media PATCH", e);
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { error } = await requireSession();
  if (error) return error;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  try {
    const existing = await deleteStudioAsset(id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("studio/media DELETE", e);
    return NextResponse.json({ error: "No se pudo eliminar" }, { status: 500 });
  }
}
