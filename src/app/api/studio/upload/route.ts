import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { createStudioFromFormData } from "@/lib/studio-server";

/** Multipart file / external URL upload → MediaAsset */
export async function POST(request: Request) {
  const { error } = await requireSession();
  if (error) return error;

  try {
    const form = await request.formData();
    const created = await createStudioFromFormData(form);
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    const status = (e as { status?: number })?.status || 500;
    console.error("studio/upload POST", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo subir" },
      { status }
    );
  }
}
