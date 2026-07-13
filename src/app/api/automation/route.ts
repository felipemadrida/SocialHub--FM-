import { db } from "@/lib/db";
import {
  createAutomationSchema,
  updateAutomationSchema,
  zodErrorResponse,
} from "@/lib/validations";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const rules = await db.automationRule.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(rules);
  } catch (error) {
    console.error("Error fetching automation rules:", error);
    return NextResponse.json({ error: "Failed to fetch automation rules" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createAutomationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(zodErrorResponse(parsed.error), { status: 400 });
    }

    const data = parsed.data;
    const rule = await db.automationRule.create({
      data: {
        name: data.name,
        description: data.description || null,
        triggerType: data.triggerType,
        triggerConfig: data.triggerConfig ? JSON.stringify(data.triggerConfig) : null,
        actionType: data.actionType,
        actionConfig: data.actionConfig ? JSON.stringify(data.actionConfig) : null,
        platforms: JSON.stringify(data.platforms),
        isActive: data.isActive ?? true,
      },
    });
    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error("Error creating automation rule:", error);
    return NextResponse.json({ error: "Failed to create automation rule" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const parsed = updateAutomationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(zodErrorResponse(parsed.error), { status: 400 });
    }

    const { id, ...data } = parsed.data;
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.triggerType !== undefined) updateData.triggerType = data.triggerType;
    if (data.triggerConfig !== undefined) {
      updateData.triggerConfig = JSON.stringify(data.triggerConfig);
    }
    if (data.actionType !== undefined) updateData.actionType = data.actionType;
    if (data.actionConfig !== undefined) {
      updateData.actionConfig = JSON.stringify(data.actionConfig);
    }
    if (data.platforms !== undefined) {
      updateData.platforms = JSON.stringify(data.platforms);
    }
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.lastRunAt !== undefined) {
      updateData.lastRunAt = data.lastRunAt ? new Date(data.lastRunAt) : null;
    }
    if (data.runCount !== undefined) updateData.runCount = data.runCount;

    const rule = await db.automationRule.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json(rule);
  } catch (error) {
    console.error("Error updating automation rule:", error);
    return NextResponse.json({ error: "Failed to update automation rule" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }
    await db.automationRule.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting automation rule:", error);
    return NextResponse.json({ error: "Failed to delete automation rule" }, { status: 500 });
  }
}
