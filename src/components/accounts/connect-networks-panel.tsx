"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Link2,
  Loader2,
  LogIn,
  Unplug,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLATFORMS, PLATFORM_CONFIG, type PlatformId } from "@/lib/platforms";
import type { SocialAccount } from "@/types/social";

type ProviderInfo = {
  platform: PlatformId;
  label: string;
  configured: boolean;
  supportsText: boolean;
  supportsImage: boolean;
  supportsVideo: boolean;
  envId: string;
  envSecret: string;
};

type Props = {
  accounts: SocialAccount[];
  enabledPlatforms: string[];
  onRefresh: () => void;
  toast: (o: {
    title: string;
    description?: string;
    variant?: "default" | "destructive";
  }) => void;
};

export function ConnectNetworksPanel({
  accounts,
  enabledPlatforms,
  onRefresh,
  toast,
}: Props) {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const loadProviders = useCallback(async () => {
    const res = await fetch("/api/oauth");
    if (res.ok) {
      const data = await res.json();
      setProviders(data.providers || []);
    }
  }, []);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  const accountFor = (platform: string) =>
    accounts.find((a) => a.platform === platform && a.isActive);

  const connectOAuth = (platform: string) => {
    const provider = providers.find((p) => p.platform === platform);
    if (!provider?.configured) {
      toast({
        title: "OAuth no configurado",
        description: `Define ${provider?.envId || "CLIENT_ID"} y ${provider?.envSecret || "CLIENT_SECRET"} en el entorno.`,
        variant: "destructive",
      });
      return;
    }
    window.location.href = `/api/oauth/${platform}/start`;
  };

  const disconnect = async (accountId: string, platform: string) => {
    setBusy(platform);
    try {
      const res = await fetch(`/api/accounts?id=${encodeURIComponent(accountId)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("delete failed");
      toast({ title: "Cuenta desconectada" });
      onRefresh();
    } catch {
      toast({ title: "Error al desconectar", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const list = PLATFORMS.filter(
    (p) => enabledPlatforms.includes(p) || accountFor(p)
  );

  return (
    <Card className="border-teal-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <LogIn className="h-4 w-4 text-teal-500" />
          Conectar redes (OAuth)
        </CardTitle>
        <CardDescription>
          Inicia sesión real en cada red. Luego publica a una o varias al mismo
          tiempo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {list.map((platform) => {
          const conf = PLATFORM_CONFIG[platform];
          const Icon = conf.icon;
          const acc = accountFor(platform);
          const provider = providers.find((p) => p.platform === platform);
          const connected = Boolean(acc?.isConnected);
          const configured = Boolean(provider?.configured);

          return (
            <div
              key={platform}
              className="flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`rounded-lg p-2 ${conf.bg}`}>
                  <Icon className={`h-5 w-5 ${conf.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm">{conf.label}</p>
                  {acc && connected ? (
                    <p className="truncate text-xs text-muted-foreground">
                      {acc.accountName} · conectada
                    </p>
                  ) : configured ? (
                    <p className="text-xs text-muted-foreground">
                      OAuth listo — inicia sesión con tu cuenta
                    </p>
                  ) : (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Falta configurar {provider?.envId} / {provider?.envSecret}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {connected ? (
                  <Badge variant="outline" className="gap-1 text-emerald-600">
                    <CheckCircle2 className="h-3 w-3" /> Conectada
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <AlertCircle className="h-3 w-3" /> Sin conectar
                  </Badge>
                )}
                {configured && (
                  <Button
                    size="sm"
                    className="brand-gradient-btn gap-1.5"
                    disabled={busy === platform}
                    onClick={() => connectOAuth(platform)}
                  >
                    {busy === platform ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Link2 className="h-3.5 w-3.5" />
                    )}
                    {connected ? "Reconectar" : "Login OAuth"}
                  </Button>
                )}
                {acc && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 text-destructive"
                    disabled={busy === platform}
                    onClick={() => disconnect(acc.id, platform)}
                  >
                    <Unplug className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        <p className="text-[11px] text-muted-foreground pt-1">
          Producción: configura META_*, X_*, LINKEDIN_*, TIKTOK_*, GOOGLE_* y
          PINTEREST_* en el entorno, con callbacks{" "}
          <code className="text-[10px]">/api/oauth/&#123;red&#125;/callback</code>.
        </p>
      </CardContent>
    </Card>
  );
}
