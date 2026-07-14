"use client";

import Image from "next/image";
import { BRAND_ASSETS } from "@/lib/brand";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function BrandGallery() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Galería de marca</CardTitle>
        <CardDescription>
          {BRAND_ASSETS.length} assets · marca + promocionales (PNG / SVG)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BRAND_ASSETS.map((asset) => (
            <div
              key={asset.id}
              className="group overflow-hidden rounded-xl border bg-muted/20 transition hover:border-teal-500/40"
            >
              <div className="relative aspect-video bg-[#0f172a]">
                <Image
                  src={asset.file}
                  alt={asset.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 25vw"
                  unoptimized={asset.file.endsWith(".svg")}
                />
              </div>
              <div className="space-y-1.5 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold leading-tight">{asset.title}</p>
                  <Badge variant={asset.kind === "marca" ? "default" : "secondary"} className="shrink-0 text-[10px]">
                    {asset.kind}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{asset.description}</p>
                <p className="text-[11px] text-muted-foreground">
                  {asset.size} · {asset.platform}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
