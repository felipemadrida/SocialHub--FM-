"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  Link2,
  Trash2,
  Users,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ConnectNetworksPanel } from "@/components/accounts/connect-networks-panel";
import { PLATFORM_CONFIG } from "@/lib/platforms";
import { formatNumber } from "@/lib/format";
import type { SocialAccount } from "@/types/social";

type Props = {
  accounts: SocialAccount[];
  enabledPlatforms: string[];
  onRefresh: () => void;
  onDelete: (accountId: string) => void;
  toast: (o: {
    title: string;
    description?: string;
    variant?: "default" | "destructive";
  }) => void;
};

export function AccountsHub({
  accounts,
  enabledPlatforms,
  onRefresh,
  onDelete,
  toast,
}: Props) {
  const connected = accounts.filter((a) => a.isActive && a.isConnected);
  const inactive = accounts.filter((a) => a.isActive && !a.isConnected);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Cuentas</h2>
          <p className="text-sm text-muted-foreground">
            Conecta redes con Login real (OAuth / Facebook SDK). Luego publica a
            una o varias a la vez.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            {connected.length} conectada{connected.length === 1 ? "" : "s"}
          </Badge>
          <Badge variant="secondary">{enabledPlatforms.length} plataformas</Badge>
        </div>
      </div>

      <ConnectNetworksPanel
        accounts={accounts}
        enabledPlatforms={enabledPlatforms}
        onRefresh={onRefresh}
        toast={toast}
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Perfiles conectados</h3>
          {connected.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Listos para publicar en Contenido → Publicar Ahora
            </p>
          )}
        </div>

        {connected.length === 0 && inactive.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-14 text-muted-foreground">
              <Users className="mb-4 h-14 w-14 opacity-20" />
              <p className="text-base font-medium text-foreground">
                Ninguna red conectada
              </p>
              <p className="mt-1 max-w-sm text-center text-sm">
                Usa <strong>Login SDK</strong> (Facebook) o{" "}
                <strong>Login OAuth</strong> arriba. No hace falta cuenta manual.
              </p>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-3.5 w-3.5" />
                Meta: dominio socialhub-fm.vercel.app + permisos en el panel
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...connected, ...inactive].map((account) => {
              const config = PLATFORM_CONFIG[account.platform];
              if (!config) return null;
              const Icon = config.icon;
              const ok = Boolean(account.isConnected);

              return (
                <motion.div
                  key={account.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card
                    className={
                      ok
                        ? "border-teal-500/25 shadow-sm"
                        : "border-dashed opacity-80"
                    }
                  >
                    <CardContent className="space-y-4 p-5">
                      <div className="flex items-start gap-3">
                        {account.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={account.avatarUrl}
                            alt=""
                            className="h-11 w-11 rounded-xl object-cover"
                          />
                        ) : (
                          <div className={`rounded-xl p-3 ${config.bg}`}>
                            <Icon className={`h-5 w-5 ${config.color}`} />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">
                            {account.accountName}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px]">
                              {config.label}
                            </Badge>
                            {ok ? (
                              <Badge
                                variant="outline"
                                className="gap-1 text-[10px] text-emerald-600"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                OAuth
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px]">
                                Sin token
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {(account.followers > 0 || account.posts > 0) && (
                        <>
                          <Separator />
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                              <p className="text-sm font-semibold">
                                {formatNumber(account.followers)}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                Seguidores
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-semibold">
                                {account.engagement}%
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                Eng.
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-semibold">
                                {account.posts}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                Posts
                              </p>
                            </div>
                          </div>
                        </>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full gap-1.5 text-destructive hover:text-destructive"
                        onClick={() => onDelete(account.id)}
                      >
                        {ok ? (
                          <>
                            <Link2 className="h-3.5 w-3.5" />
                            Desconectar
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-3.5 w-3.5" />
                            Eliminar
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
