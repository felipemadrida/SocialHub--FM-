import { db } from "@/lib/db";
import { getAutomationServiceUrl } from "@/lib/automation";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform") || "all";
    const days = Math.min(Math.max(Number(searchParams.get("days") || "7"), 1), 90);

    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const rows = await db.analytics.findMany({
      where: {
        date: { gte: since },
        ...(platform !== "all" ? { platform } : {}),
      },
      orderBy: { date: "asc" },
    });

    if (rows.length > 0) {
      return NextResponse.json({
        source: "database",
        data: rows.map((row) => ({
          date: row.date.toISOString(),
          platform: row.platform,
          followers: row.followers,
          likes: row.likes,
          comments: row.comments,
          shares: row.shares,
          reaches: row.reaches,
          impressions: row.impressions,
          engagement: row.engagement,
        })),
      });
    }

    // Fallback to mock automation service when DB has no analytics
    try {
      const automationUrl = await getAutomationServiceUrl();
      const response = await fetch(
        `${automationUrl}/api/analytics?platform=${platform}&days=${days}`
      );
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({ source: "mock", ...data });
      }
    } catch {
      // ignore mock service failures
    }

    return NextResponse.json({ source: "empty", data: [] });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
