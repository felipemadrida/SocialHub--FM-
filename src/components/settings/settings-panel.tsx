"use client";

import { useEffect, useState } from "react";
import {
  Settings,
  Save,
  Loader2,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PLATFORM_CONFIG,
  PLATFORMS,
  TRIGGER_LABELS,
  ACTION_LABELS,
  TRIGGER_TYPES,
  ACTION_TYPES,
} from "@/lib/platforms";
import { formatDateTime, parseJsonArray } from "@/lib/format";
import { ThemeToggle } from "@/components/theme-toggle";
import type {
  AppSettings,
  AutomationRule,
  ScheduledPost,
  SocialAccount,
} from "@/types/social";

type Props = {
  settings: AppSettings;
  accounts: SocialAccount[];
  posts: ScheduledPost[];
  rules: AutomationRule[];
  onSaveSettings: (patch: Partial<AppSettings>) => Promise<AppSettings>;
  onRefresh: () => Promise<void> | void;
  onEditPost: (post: ScheduledPost) => void;
  onDeletePost: (id: string) => void;
  onToggleRule: (rule: AutomationRule) => void;
  onDeleteRule: (id: string) => void;
  onCreateRule: (payload: {
    name: string;
    description: string;
    triggerType: string;
    actionType: string;
    platforms: string[];
  }) => Promise<void>;
  onUpdateAccount: (payload: {
    id: string;
    accountName?: string;
    accessToken?: string | null;
    refreshToken?: string | null;
    isActive?: boolean;
  }) => Promise<void>;
  onDeleteAccount: (id: string) => void;
  toast: (opts: {
    title: string;
    description?: string;
    variant?: "default" | "destructive";
  }) => void;
};

const TIMEZONES = [
  "America/Santiago",
  "America/Mexico_City",
  "America/Bogota",
  "America/Buenos_Aires",
  "America/Lima",
  "America/New_York",
  "Europe/Madrid",
  "UTC",
];

const PRIMARY_PRESETS = [
  { label: "Auto (tema)", value: "oklch(0.92 0 0)" },
  { label: "Verde", value: "oklch(0.72 0.14 145)" },
  { label: "Azul", value: "oklch(0.7 0.12 250)" },
  { label: "Ámbar", value: "oklch(0.78 0.14 75)" },
];

export function SettingsPanel({
  settings,
  accounts,
  posts,
  rules,
  onSaveSettings,
  onRefresh,
  onEditPost,
  onDeletePost,
  onToggleRule,
  onDeleteRule,
  onCreateRule,
  onUpdateAccount,
  onDeleteAccount,
  toast,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(settings);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [accountName, setAccountName] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");

  const [ruleName, setRuleName] = useState("");
  const [ruleDesc, setRuleDesc] = useState("");
  const [ruleTrigger, setRuleTrigger] = useState<string>("time_based");
  const [ruleAction, setRuleAction] = useState<string>("post");
  const [rulePlatforms, setRulePlatforms] = useState<string[]>([]);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const scheduledPosts = posts.filter((p) => p.status === "scheduled");

  const togglePlatform = (platform: string) => {
    setDraft((prev) => {
      const current = prev.enabledPlatforms;
      const next = current.includes(platform)
        ? current.filter((p) => p !== platform)
        : [...current, platform];
      return { ...prev, enabledPlatforms: next.length ? next : current };
    });
  };

  const toggleRulePlatform = (platform: string) => {
    setRulePlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const handleSaveGeneral = async () => {
    if (draft.enabledPlatforms.length === 0) {
      toast({
        title: "Error",
        description: "Debes habilitar al menos una plataforma",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      await onSaveSettings({
        brandName: draft.brandName,
        brandTagline: draft.brandTagline,
        primaryColor: draft.primaryColor,
        timezone: draft.timezone,
        defaultPublishTime: draft.defaultPublishTime,
        enabledPlatforms: draft.enabledPlatforms,
        automationServiceUrl: draft.automationServiceUrl,
        mockPublish: false,
      });
      toast({ title: "Configuración guardada", description: "Los cambios se aplicaron correctamente" });
      await onRefresh();
    } catch {
      toast({ title: "Error", description: "No se pudo guardar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const startEditAccount = (account: SocialAccount) => {
    setEditingAccountId(account.id);
    setAccountName(account.accountName);
    setAccessToken(account.accessToken || "");
    setRefreshToken(account.refreshToken || "");
  };

  const saveAccount = async () => {
    if (!editingAccountId || !accountName.trim()) return;
    try {
      await onUpdateAccount({
        id: editingAccountId,
        accountName: accountName.trim(),
        accessToken: accessToken || null,
        refreshToken: refreshToken || null,
      });
      toast({ title: "Cuenta actualizada" });
      setEditingAccountId(null);
      await onRefresh();
    } catch {
      toast({ title: "Error", description: "No se pudo actualizar la cuenta", variant: "destructive" });
    }
  };

  const handleCreateRule = async () => {
    if (!ruleName.trim() || rulePlatforms.length === 0) {
      toast({
        title: "Error",
        description: "Nombre y al menos una plataforma son requeridos",
        variant: "destructive",
      });
      return;
    }
    try {
      await onCreateRule({
        name: ruleName.trim(),
        description: ruleDesc,
        triggerType: ruleTrigger,
        actionType: ruleAction,
        platforms: rulePlatforms,
      });
      setRuleName("");
      setRuleDesc("");
      setRulePlatforms([]);
      toast({ title: "Regla creada" });
      await onRefresh();
    } catch {
      toast({ title: "Error", description: "No se pudo crear la regla", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuración de la App
        </h2>
        <p className="text-sm text-muted-foreground">
          Marca, plataformas, agenda y automatización — sin editar código
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1 p-1">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="accounts">Cuentas</TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
          <TabsTrigger value="automation">Automatización</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Marca y tema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre de la marca</Label>
                  <Input
                    value={draft.brandName}
                    onChange={(e) => setDraft({ ...draft, brandName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Eslogan</Label>
                  <Input
                    value={draft.brandTagline}
                    onChange={(e) => setDraft({ ...draft, brandTagline: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Diseño de la interfaz</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  También puedes cambiarlo con el botón Blanco / Negro del encabezado.
                </p>
                <ThemeToggle />
              </div>
              <div className="space-y-2">
                <Label>Color de acento (opcional)</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {PRIMARY_PRESETS.map((p) => (
                    <Button
                      key={p.value}
                      type="button"
                      size="sm"
                      variant={draft.primaryColor === p.value ? "default" : "outline"}
                      onClick={() => setDraft({ ...draft, primaryColor: p.value })}
                    >
                      {p.label}
                    </Button>
                  ))}
                </div>
                <Input
                  value={draft.primaryColor}
                  onChange={(e) => setDraft({ ...draft, primaryColor: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Agenda y servicio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Zona horaria</Label>
                  <Select
                    value={draft.timezone}
                    onValueChange={(v) => setDraft({ ...draft, timezone: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Hora de publicación por defecto</Label>
                  <Input
                    type="time"
                    value={draft.defaultPublishTime}
                    onChange={(e) =>
                      setDraft({ ...draft, defaultPublishTime: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>URL del servicio de automatización</Label>
                <Input
                  value={draft.automationServiceUrl}
                  onChange={(e) =>
                    setDraft({ ...draft, automationServiceUrl: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Plataformas habilitadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {PLATFORMS.map((id) => {
                  const cfg = PLATFORM_CONFIG[id];
                  const Icon = cfg.icon;
                  const enabled = draft.enabledPlatforms.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => togglePlatform(id)}
                      className={`flex items-center gap-2 rounded-lg border p-3 text-left transition-colors ${
                        enabled ? "border-primary bg-primary/5" : "opacity-60"
                      }`}
                    >
                      <div className={`p-2 rounded-md ${cfg.bg}`}>
                        <Icon className={`h-4 w-4 ${cfg.color}`} />
                      </div>
                      <span className="text-sm font-medium">{cfg.label}</span>
                      <Badge variant={enabled ? "default" : "secondary"} className="ml-auto text-xs">
                        {enabled ? "On" : "Off"}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSaveGeneral} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar configuración general
          </Button>
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          {accounts.map((account) => {
            const cfg = PLATFORM_CONFIG[account.platform as keyof typeof PLATFORM_CONFIG];
            const Icon = cfg?.icon;
            const isEditing = editingAccountId === account.id;
            return (
              <Card key={account.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    {Icon && (
                      <div className={`p-2 rounded-lg ${cfg.bg}`}>
                        <Icon className={`h-5 w-5 ${cfg.color}`} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{account.accountName}</p>
                      <p className="text-xs text-muted-foreground">{cfg?.label || account.platform}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        onUpdateAccount({ id: account.id, isActive: !account.isActive })
                      }
                    >
                      {account.isActive ? (
                        <ToggleRight className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                      )}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => startEditAccount(account)}>
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => onDeleteAccount(account.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {isEditing && (
                    <div className="space-y-3 border-t pt-3">
                      <div className="space-y-2">
                        <Label>Nombre</Label>
                        <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Access token (mock / futuro OAuth)</Label>
                        <Input
                          value={accessToken}
                          onChange={(e) => setAccessToken(e.target.value)}
                          placeholder="opcional"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Refresh token</Label>
                        <Input
                          value={refreshToken}
                          onChange={(e) => setRefreshToken(e.target.value)}
                          placeholder="opcional"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveAccount}>
                          Guardar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingAccountId(null)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {accounts.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground text-sm">
                No hay cuentas. Conéctalas desde la pestaña Cuentas.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="agenda" className="space-y-4">
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              Zona horaria: <strong className="text-foreground">{settings.timezone}</strong>
              {" · "}
              Hora por defecto:{" "}
              <strong className="text-foreground">{settings.defaultPublishTime}</strong>
              {" "}
              (se usa al programar un post sin fecha)
            </CardContent>
          </Card>
          {scheduledPosts.map((post) => (
            <Card key={post.id}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-clamp-2">{post.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDateTime(post.scheduledAt)} · {parseJsonArray(post.platforms).join(", ")}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => onEditPost(post)}>
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => onDeletePost(post.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
          {scheduledPosts.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground text-sm">
                No hay posts programados.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Nueva regla</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={ruleName} onChange={(e) => setRuleName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={ruleDesc}
                  onChange={(e) => setRuleDesc(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Trigger</Label>
                  <Select value={ruleTrigger} onValueChange={setRuleTrigger}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRIGGER_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {TRIGGER_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Acción</Label>
                  <Select value={ruleAction} onValueChange={setRuleAction}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_TYPES.map((a) => (
                        <SelectItem key={a} value={a}>
                          {ACTION_LABELS[a]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {settings.enabledPlatforms.map((id) => {
                  const cfg = PLATFORM_CONFIG[id as keyof typeof PLATFORM_CONFIG];
                  if (!cfg) return null;
                  const active = rulePlatforms.includes(id);
                  return (
                    <Button
                      key={id}
                      type="button"
                      size="sm"
                      variant={active ? "default" : "outline"}
                      onClick={() => toggleRulePlatform(id)}
                    >
                      {cfg.label}
                    </Button>
                  );
                })}
              </div>
              <Button onClick={handleCreateRule}>Crear regla</Button>
            </CardContent>
          </Card>

          <Separator />

          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{rule.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {TRIGGER_LABELS[rule.triggerType as keyof typeof TRIGGER_LABELS] || rule.triggerType}
                    {" → "}
                    {ACTION_LABELS[rule.actionType as keyof typeof ACTION_LABELS] || rule.actionType}
                  </p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => onToggleRule(rule)}>
                  {rule.isActive ? (
                    <ToggleRight className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => onDeleteRule(rule.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
