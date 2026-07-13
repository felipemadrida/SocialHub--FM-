import { db } from "@/lib/db";
import { getOrCreateSettings } from "@/lib/settings";
import { updateSettingsSchema, zodErrorResponse } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const settings = await getOrCreateSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const parsed = updateSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(zodErrorResponse(parsed.error), { status: 400 });
    }

    await getOrCreateSettings();

    const data = parsed.data;
    const updateData: Record<string, unknown> = {};
    if (data.brandName !== undefined) updateData.brandName = data.brandName;
    if (data.brandTagline !== undefined) updateData.brandTagline = data.brandTagline;
    if (data.primaryColor !== undefined) updateData.primaryColor = data.primaryColor;
    if (data.timezone !== undefined) updateData.timezone = data.timezone;
    if (data.defaultPublishTime !== undefined) {
      updateData.defaultPublishTime = data.defaultPublishTime;
    }
    if (data.enabledPlatforms !== undefined) {
      updateData.enabledPlatforms = JSON.stringify(data.enabledPlatforms);
    }
    if (data.automationServiceUrl !== undefined) {
      updateData.automationServiceUrl = data.automationServiceUrl;
    }
    if (data.mockPublish !== undefined) updateData.mockPublish = data.mockPublish;

    const row = await db.appSettings.update({
      where: { id: "default" },
      data: updateData,
    });

    const settings = await getOrCreateSettings();
    // ensure we return fresh DTO (updatedAt from row)
    return NextResponse.json({
      ...settings,
      updatedAt: row.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
