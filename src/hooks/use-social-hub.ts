"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  AnalyticsData,
  AppSettings,
  AutomationRule,
  ScheduledPost,
  SocialAccount,
} from "@/types/social";
import { DEFAULT_ENABLED_PLATFORMS } from "@/lib/platforms";

const SEED_SECRET =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_SEED_SECRET || "dev-seed-secret"
    : "dev-seed-secret";

const DEFAULT_SETTINGS: AppSettings = {
  id: "default",
  brandName: "SocialHub -FM-",
  brandTagline: "Marketing Hub + IA Studio",
  primaryColor: "oklch(0.92 0 0)",
  timezone: "America/Santiago",
  defaultPublishTime: "10:00",
  enabledPlatforms: [...DEFAULT_ENABLED_PLATFORMS],
  automationServiceUrl: "http://localhost:3031",
  mockPublish: false,
  updatedAt: new Date().toISOString(),
};

export function useSocialHubData() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [accRes, postsRes, rulesRes, anRes, settingsRes] = await Promise.all([
        fetch("/api/accounts"),
        fetch("/api/posts"),
        fetch("/api/automation"),
        fetch("/api/analytics?platform=all&days=7"),
        fetch("/api/settings"),
      ]);

      if (accRes.ok) setAccounts(await accRes.json());
      if (postsRes.ok) setPosts(await postsRes.json());
      if (rulesRes.ok) setRules(await rulesRes.json());
      if (anRes.ok) {
        const anData = await anRes.json();
        setAnalytics(anData.data || []);
      } else {
        setAnalytics([]);
      }
      if (settingsRes.ok) {
        setSettings(await settingsRes.json());
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSettings = useCallback(async (patch: Partial<AppSettings>) => {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      throw new Error("Failed to save settings");
    }
    const updated = (await res.json()) as AppSettings;
    setSettings(updated);
    return updated;
  }, []);

  useEffect(() => {
    const seedAndFetch = async () => {
      try {
        const res = await fetch("/api/accounts");
        if (res.ok) {
          const data = await res.json();
          if (data.length === 0) {
            await fetch("/api/seed", {
              method: "POST",
              headers: { "x-seed-secret": SEED_SECRET },
            });
          }
        }
      } catch (e) {
        console.error(e);
      }
      await fetchAllData();
    };
    seedAndFetch();
  }, [fetchAllData]);

  useEffect(() => {
    if (settings.brandName) {
      document.title = `${settings.brandName} - ${settings.brandTagline}`;
    }
  }, [settings.brandName, settings.brandTagline]);

  useEffect(() => {
    if (!settings.primaryColor) return;
    // Only apply custom brand accents (not the B/W theme defaults)
    const themeDefaults = ["oklch(0.92 0 0)", "oklch(0.18 0 0)", "oklch(0.205 0 0)"];
    if (themeDefaults.includes(settings.primaryColor)) return;
    document.documentElement.style.setProperty("--primary", settings.primaryColor);
  }, [settings.primaryColor]);

  return {
    accounts,
    posts,
    rules,
    analytics,
    settings,
    loading,
    fetchAllData,
    saveSettings,
  };
}
