"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Copy,
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
import {
  fbGetLoginStatus,
  fbLogin,
  loadFacebookSdk,
} from "@/lib/facebook-sdk";

type ProviderInfo = {
  platform: PlatformId;
  label: string;
  configured: boolean;
  supportsText: boolean;
  supportsImage: boolean;
  supportsVideo: boolean;
  envId: string;
  envSecret: string;
  callbackUrl?: string;
  startPath?: string;
};

type MetaSdkInfo = {
  appId: string | null;
  loginConfigId: string | null;
  sdkVersion: string;
  jsSdkEnabled: boolean;
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
  const [meta, setMeta] = useState<MetaSdkInfo | null>(null);
  const [summary, setSummary] = useState({ total: 0, configured: 0, ready: false });
  const [busy, setBusy] = useState<string | null>(null);
  const [fbReady, setFbReady] = useState(false);

  const loadProviders = useCallback(async () => {
    const res = await fetch("/api/oauth");
    if (res.ok) {
      const data = await res.json();
      setProviders(data.providers || []);
      if (data.summary) setSummary(data.summary);
      if (data.meta) setMeta(data.meta);
    }
  }, []);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  useEffect(() => {
    if (!meta?.appId || !meta.jsSdkEnabled) return;
    let cancelled = false;
    loadFacebookSdk(meta.appId, meta.sdkVersion || "v21.0")
      .then(() => {
        if (!cancelled) setFbReady(true);
      })
      .catch(() => {
        if (!cancelled) setFbReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, [meta?.appId, meta?.jsSdkEnabled, meta?.sdkVersion]);

  const accountFor = (platform: string) =>
    accounts.find((a) => a.platform === platform && a.isActive);

  const connectedCount = accounts.filter((a) => a.isActive && a.isConnected).length;

  const persistFacebookToken = async (authResponse: {
    accessToken: string;
    userID?: string;
    expiresIn?: number | string;
    signedRequest?: string;
  }) => {
    const res = await fetch("/api/oauth/facebook/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accessToken: authResponse.accessToken,
        userID: authResponse.userID,
        expiresIn: authResponse.expiresIn,
        signedRequest: authResponse.signedRequest,
        platform: "facebook",
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.detail || "No se pudo guardar el token");
    return data;
  };

  /** Facebook JS SDK: getLoginStatus → FB.login if needed */
  const connectFacebookSdk = async () => {
    if (!meta?.appId) {
      toast({
        title: "Meta App ID faltante",
        description: "Define META_APP_ID en Vercel",
        variant: "destructive",
      });
      return;
    }
    setBusy("facebook");
    try {
      await loadFacebookSdk(meta.appId, meta.sdkVersion || "v21.0");

      const statusChangeCallback = async (response: {
        status: string;
        authResponse?: {
          accessToken: string;
          userID: string;
          expiresIn?: number | string;
          signedRequest?: string;
        } | null;
      }) => {
        // Meta shape:
        // { status: 'connected', authResponse: { accessToken, expiresIn, signedRequest, userID } }
        if (response.status === "connected" && response.authResponse?.accessToken) {
          await persistFacebookToken(response.authResponse);
          toast({
            title: "Facebook conectado",
            description: `userID ${response.authResponse.userID || ""}`.trim(),
          });
          onRefresh();
          return true;
        }
        return false;
      };

      // FB.getLoginStatus(function(response) { statusChangeCallback(response); });
      const status = await fbGetLoginStatus(true);
      if (await statusChangeCallback(status)) return;

      const login = await fbLogin({
        configId: meta.loginConfigId || undefined,
        scope: meta.loginConfigId ? undefined : "public_profile",
      });
      if (!(await statusChangeCallback(login))) {
        toast({
          title: "Login cancelado o incompleto",
          description:
            login.status === "not_authorized"
              ? "Autoriza la app en Facebook"
              : "Activa public_profile / config_id en Meta",
          variant: "destructive",
        });
      }
    } catch (e) {
      toast({
        title: "Error Facebook SDK",
        description: e instanceof Error ? e.message : "Error",
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

  const connectOAuth = (platform: string) => {
    if (platform === "facebook" && meta?.jsSdkEnabled) {
      void connectFacebookSdk();
      return;
    }
    const provider = providers.find((p) => p.platform === platform);
    if (!provider?.configured) {
      toast({
        title: "OAuth no configurado",
        description: `Define ${provider?.envId || "CLIENT_ID"} y ${provider?.envSecret || "CLIENT_SECRET"} en Vercel / .env.`,
        variant: "destructive",
      });
      return;
    }
    window.location.href = `/api/oauth/${platform}/start`;
  };

  const copyCallback = async (url: string, label: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Callback copiado", description: label });
    } catch {
      toast({ title: "No se pudo copiar", variant: "destructive" });
    }
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
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <LogIn className="h-4 w-4 text-teal-500" />
              Conectar redes (OAuth)
            </CardTitle>
            <CardDescription>
              Facebook usa JS SDK (getLoginStatus / login). Otras redes: OAuth
              redirect.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline">
              APIs: {summary.configured}/{summary.total || providers.length || 7}
            </Badge>
            <Badge variant={connectedCount > 0 ? "default" : "secondary"}>
              Conectadas: {connectedCount}
            </Badge>
            {meta?.jsSdkEnabled && (
              <Badge variant={fbReady ? "default" : "secondary"}>
                FB SDK {fbReady ? "listo" : "…"}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {list.map((platform) => {
          const conf = PLATFORM_CONFIG[platform];
          const Icon = conf.icon;
          const acc = accountFor(platform);
          const provider = providers.find((p) => p.platform === platform);
          const connected = Boolean(acc?.isConnected);
          const configured = Boolean(provider?.configured);
          const callback = provider?.callbackUrl;
          const isFacebook = platform === "facebook";

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
                      {isFacebook
                        ? "Facebook JS SDK — Login en popup"
                        : "OAuth listo — inicia sesión con tu cuenta"}
                    </p>
                  ) : (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Falta {provider?.envId} / {provider?.envSecret}
                    </p>
                  )}
                  {callback && !isFacebook && (
                    <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
                      {callback}
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
                {callback && !isFacebook && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5"
                    title="Copiar URL de callback"
                    onClick={() => copyCallback(callback, conf.label)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
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
                    {isFacebook
                      ? connected
                        ? "Reconectar FB"
                        : "Login Facebook"
                      : connected
                        ? "Reconectar"
                        : "Login OAuth"}
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
        <p className="pt-1 text-[11px] text-muted-foreground">
          Facebook: en Meta agrega el dominio{" "}
          <code className="text-[10px]">socialhub-fm.vercel.app</code> y activa
          permiso <code className="text-[10px]">public_profile</code>. Opcional:{" "}
          <code className="text-[10px]">META_LOGIN_CONFIG_ID</code>.
        </p>
      </CardContent>
    </Card>
  );
}
