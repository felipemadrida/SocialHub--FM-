"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

const STEPS = [
  { id: "accounts", label: "Crear / conectar cuentas", tab: "accounts" },
  { id: "connect", label: "Conectar en SocialHub -FM-", tab: "accounts" },
  { id: "ai", label: "Generar contenido IA", tab: "ai-studio" },
  { id: "campaign", label: "Crear campaña", tab: "marketing" },
  { id: "auto", label: "Automatizar", tab: "automation" },
] as const;

type Props = {
  completed: Record<string, boolean>;
  onGo: (tab: string) => void;
};

export function MarketingGuide({ completed, onGo }: Props) {
  const [extra, setExtra] = useState({ ai: false, campaign: false });

  useEffect(() => {
    (async () => {
      try {
        const [aiRes, campRes] = await Promise.all([
          fetch("/api/ai/content"),
          fetch("/api/campaigns"),
        ]);
        const ai = aiRes.ok ? await aiRes.json() : [];
        const camps = campRes.ok ? await campRes.json() : [];
        setExtra({
          ai: Array.isArray(ai) && ai.length > 0,
          campaign: Array.isArray(camps) && camps.length > 0,
        });
      } catch {
        // ignore
      }
    })();
  }, []);

  const merged = { ...completed, ...extra };
  const done = STEPS.filter((s) => merged[s.id]).length;
  const pct = Math.round((done / STEPS.length) * 100);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card to-muted/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between gap-3">
          <span>Guía de Marketing (5 pasos)</span>
          <span className="text-xs font-normal text-muted-foreground">{pct}%</span>
        </CardTitle>
        <Progress value={pct} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-2">
        {STEPS.map((step, i) => {
          const ok = !!merged[step.id];
          return (
            <div
              key={step.id}
              className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/40 transition-colors"
            >
              {ok ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {i + 1}. {step.label}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => onGo(step.tab)}>
                Ir
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
