import { db } from "@/lib/db";
import { DEFAULT_ENABLED_PLATFORMS } from "@/lib/platforms";
import { parseJsonArray } from "@/lib/format";

export type AppSettingsDTO = {
  id: string;
  brandName: string;
  brandTagline: string;
  primaryColor: string;
  timezone: string;
  defaultPublishTime: string;
  enabledPlatforms: string[];
  automationServiceUrl: string;
  mockPublish: boolean;
  updatedAt: string;
};

function toDTO(row: {
  id: string;
  brandName: string;
  brandTagline: string;
  primaryColor: string;
  timezone: string;
  defaultPublishTime: string;
  enabledPlatforms: string;
  automationServiceUrl: string;
  mockPublish: boolean;
  updatedAt: Date;
}): AppSettingsDTO {
  const platforms = parseJsonArray(row.enabledPlatforms);
  return {
    id: row.id,
    brandName: row.brandName,
    brandTagline: row.brandTagline,
    primaryColor: row.primaryColor,
    timezone: row.timezone,
    defaultPublishTime: row.defaultPublishTime,
    enabledPlatforms:
      platforms.length > 0 ? platforms : [...DEFAULT_ENABLED_PLATFORMS],
    automationServiceUrl: row.automationServiceUrl,
    mockPublish: false,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getOrCreateSettings(): Promise<AppSettingsDTO> {
  let row = await db.appSettings.findUnique({ where: { id: "default" } });
  if (!row) {
    row = await db.appSettings.create({
      data: {
        id: "default",
        enabledPlatforms: JSON.stringify(DEFAULT_ENABLED_PLATFORMS),
        mockPublish: false,
      },
    });
  } else if (row.mockPublish) {
    row = await db.appSettings.update({
      where: { id: "default" },
      data: { mockPublish: false },
    });
  }
  return toDTO(row);
}
