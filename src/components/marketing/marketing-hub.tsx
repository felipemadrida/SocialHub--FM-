"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CAMPAIGN_OBJECTIVES,
  CAMPAIGN_OBJECTIVE_LABELS,
  CAMPAIGN_STATUSES,
  CAMPAIGN_STATUS_LABELS,
} from "@/lib/marketing";
import { parseJsonArray } from "@/lib/format";
import { PLATFORM_CONFIG } from "@/lib/platforms";
import { BrandHero } from "@/components/brand/brand-hero";
import { BrandGallery } from "@/components/brand/brand-gallery";
import { BrandIdentityCard } from "@/components/brand/brand-identity-card";

type Campaign = {
  id: string;
  name: string;
  description: string | null;
  objective: string;
  budget: number;
  status: string;
  platforms: string;
  startDate: string | null;
  endDate: string | null;
};

type Props = {
  enabledPlatforms: string[];
  brandName: string;
  toast: (o: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
  onOpenAiStudio: () => void;
};

export function MarketingHub({
  enabledPlatforms,
  brandName,
  toast,
  onOpenAiStudio,
}: Props) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [objective, setObjective] = useState<string>("awareness");
  const [budget, setBudget] = useState("500");
  const [status, setStatus] = useState<string>("planning");
  const [platforms, setPlatforms] = useState<string[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/campaigns");
      if (res.ok) setCampaigns(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const togglePlatform = (p: string) => {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const createCampaign = async () => {
    if (!name.trim() || platforms.length === 0) {
      toast({
        title: "Completa nombre y plataformas",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          objective,
          budget: Number(budget) || 0,
          status,
          platforms,
        }),
      });
      if (!res.ok) throw new Error("fail");
      toast({ title: "Campaña creada" });
      setName("");
      setDescription("");
      setPlatforms([]);
      await load();
    } catch {
      toast({ title: "No se pudo crear la campaña", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, next: string) => {
    const res = await fetch("/api/campaigns", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: next }),
    });
    if (res.ok) {
      toast({ title: "Estado actualizado" });
      await load();
    }
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/campaigns?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Campaña eliminada" });
      await load();
    }
  };

  return (
    <div className="space-y-6">
      <BrandHero
        brandName={brandName}
        onOpenAiStudio={onOpenAiStudio}
        onScrollCampaigns={() => {
          document.getElementById("nueva-campana")?.scrollIntoView({ behavior: "smooth" });
        }}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <BrandIdentityCard />
        <div id="nueva-campana">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Nueva campaña</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Lanzamiento Q3" />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Objetivo</Label>
                <Select value={objective} onValueChange={setObjective}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CAMPAIGN_OBJECTIVES.map((o) => (
                      <SelectItem key={o} value={o}>{CAMPAIGN_OBJECTIVE_LABELS[o]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Presupuesto (USD)</Label>
                <Input type="number" min={0} value={budget} onChange={(e) => setBudget(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CAMPAIGN_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{CAMPAIGN_STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
              {enabledPlatforms.map((p) => {
                const cfg = PLATFORM_CONFIG[p as keyof typeof PLATFORM_CONFIG];
                const on = platforms.includes(p);
                return (
                  <Button key={p} size="sm" type="button" variant={on ? "default" : "outline"} onClick={() => togglePlatform(p)}>
                    {cfg?.label || p}
                  </Button>
                );
              })}
            </div>
            <Button onClick={createCampaign} disabled={saving} className="brand-gradient-btn gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Crear campaña
            </Button>
          </CardContent>
        </Card>
        </div>
      </div>

      <BrandGallery />

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Campañas</h3>
        {loading && <p className="text-sm text-muted-foreground">Cargando…</p>}
        {!loading && campaigns.length === 0 && (
          <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Sin campañas aún</CardContent></Card>
        )}
        {campaigns.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-sm">{c.name}</p>
                  <Badge variant="secondary">{CAMPAIGN_STATUS_LABELS[c.status as keyof typeof CAMPAIGN_STATUS_LABELS] || c.status}</Badge>
                  <Badge variant="outline">{CAMPAIGN_OBJECTIVE_LABELS[c.objective as keyof typeof CAMPAIGN_OBJECTIVE_LABELS] || c.objective}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ${c.budget.toLocaleString()} · {parseJsonArray(c.platforms).join(", ")}
                </p>
              </div>
              <Select value={c.status} onValueChange={(v) => updateStatus(c.id, v)}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CAMPAIGN_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{CAMPAIGN_STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => remove(c.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
