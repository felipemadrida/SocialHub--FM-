import { getOrCreateSettings } from "@/lib/settings";

export async function getAutomationServiceUrl(): Promise<string> {
  try {
    const settings = await getOrCreateSettings();
    return (
      settings.automationServiceUrl ||
      process.env.AUTOMATION_SERVICE_URL ||
      "http://localhost:3031"
    );
  } catch {
    return process.env.AUTOMATION_SERVICE_URL || "http://localhost:3031";
  }
}
