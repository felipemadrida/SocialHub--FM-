import { getAutomationServiceUrl } from "@/lib/automation";
import { getOrCreateSettings } from "@/lib/settings";
import { publishSchema, zodErrorResponse } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = publishSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(zodErrorResponse(parsed.error), { status: 400 });
    }

    const settings = await getOrCreateSettings();
    if (!settings.mockPublish) {
      return NextResponse.json(
        {
          error: "Live publish mode is not implemented yet",
          hint: "Enable mock publish in Configuración, or connect real platform APIs",
        },
        { status: 501 }
      );
    }

    const automationUrl = await getAutomationServiceUrl();
    const response = await fetch(`${automationUrl}/api/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...parsed.data, mockPublish: true }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Automation service unavailable" },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error publishing post:", error);
    return NextResponse.json(
      {
        error: "Failed to publish post",
        hint: "Start mini-services/social-automation on port 3031",
      },
      { status: 500 }
    );
  }
}
