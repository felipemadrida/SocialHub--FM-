"use client";

import Image from "next/image";
import { BRAND, BRAND_USAGE_RULES } from "@/lib/brand";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SWATCHES = [
  { name: "Teal", hex: BRAND.colors.teal },
  { name: "Violet", hex: BRAND.colors.violet },
  { name: "Navy", hex: BRAND.colors.navy },
  { name: "Emerald", hex: BRAND.colors.emerald },
  { name: "Amber", hex: BRAND.colors.amber },
] as const;

export function BrandIdentityCard() {
  return (
    <Card className="overflow-hidden border-white/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Identidad de Marca</CardTitle>
        <CardDescription>{BRAND.style}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Gradiente principal · {BRAND.gradient.angle}
          </p>
          <div
            className="h-10 w-full rounded-lg shadow-inner"
            style={{
              background: `linear-gradient(${BRAND.gradient.angle}, ${BRAND.gradient.from}, ${BRAND.gradient.to})`,
            }}
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            {BRAND.gradient.from} → {BRAND.gradient.to}
          </p>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Paleta
          </p>
          <div className="flex flex-wrap gap-3">
            {SWATCHES.map((s) => (
              <div key={s.hex} className="flex items-center gap-2">
                <span
                  className="h-8 w-8 rounded-md border border-white/10 shadow-sm"
                  style={{ backgroundColor: s.hex }}
                />
                <div className="text-xs">
                  <p className="font-medium">{s.name}</p>
                  <p className="text-muted-foreground">{s.hex}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Tipografía · {BRAND.typography.family}
          </p>
          <div className="space-y-1 rounded-lg border bg-muted/30 p-3 text-sm">
            <p className="text-xl font-bold tracking-tight">Títulos — Bold</p>
            <p className="font-semibold text-muted-foreground">Subtítulos — SemiBold</p>
            <p className="font-normal text-muted-foreground">Body — Regular</p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Reglas de uso
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {BRAND_USAGE_RULES.map((rule) => (
              <li key={rule} className="flex gap-2">
                <Badge variant="outline" className="mt-0.5 h-5 shrink-0 px-1.5 text-[10px]">
                  OK
                </Badge>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#0f172a] p-3">
          <Image
            src="/brand/socialhub_logo.png"
            alt="SocialHub logo"
            width={48}
            height={48}
            className="rounded-lg"
          />
          <div>
            <p className="brand-gradient-text text-sm font-bold">{BRAND.name}</p>
            <p className="text-xs text-slate-400">{BRAND.tagline}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
