import { db } from "@/lib/db";
import {
  createCampaignSchema,
  updateCampaignSchema,
} from "@/lib/validations-marketing";
import { zodErrorResponse } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const campaigns = await db.marketingCampaign.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(campaigns);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createCampaignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(zodErrorResponse(parsed.error), { status: 400 });
    }
    const data = parsed.data;
    const campaign = await db.marketingCampaign.create({
      data: {
        name: data.name,
        description: data.description || null,
        objective: data.objective,
        budget: data.budget ?? 0,
        status: data.status ?? "planning",
        platforms: JSON.stringify(data.platforms),
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });
    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const parsed = updateCampaignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(zodErrorResponse(parsed.error), { status: 400 });
    }
    const { id, ...data } = parsed.data;
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.objective !== undefined) updateData.objective = data.objective;
    if (data.budget !== undefined) updateData.budget = data.budget;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.platforms !== undefined) {
      updateData.platforms = JSON.stringify(data.platforms);
    }
    if (data.startDate !== undefined) {
      updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    }
    if (data.endDate !== undefined) {
      updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    }

    const campaign = await db.marketingCampaign.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Error updating campaign:", error);
    return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }
    await db.marketingCampaign.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return NextResponse.json({ error: "Failed to delete campaign" }, { status: 500 });
  }
}
