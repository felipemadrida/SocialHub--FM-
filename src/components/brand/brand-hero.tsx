"use client";

import Image from "next/image";
import { BRAND } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { Wand2, Megaphone } from "lucide-react";

type Props = {
  brandName: string;
  onOpenAiStudio: () => void;
  onScrollCampaigns?: () => void;
};

export function BrandHero({ brandName, onOpenAiStudio, onScrollCampaigns }: Props) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 min-h-[220px] sm:min-h-[280px]">
      <Image
        src="/brand/socialhub_hero_bg.png"
        alt=""
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a]/95 via-[#0f172a]/75 to-[#0f172a]/40" />
      <div className="relative z-10 flex h-full flex-col justify-end gap-4 p-6 sm:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-300/90">
            Identidad · Marketing Hub
          </p>
          <h2 className="mt-2 max-w-xl text-2xl font-bold tracking-tight text-white sm:text-3xl">
            <span className="brand-gradient-text">{brandName || BRAND.name}</span>
          </h2>
          <p className="mt-2 max-w-lg text-sm text-slate-300 sm:text-base">
            Campañas, assets de marca y generación con IA — misma paleta teal→violet en toda la
            experiencia.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" className="brand-gradient-btn gap-2" onClick={onOpenAiStudio}>
            <Wand2 className="h-4 w-4" />
            Abrir IA Studio
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2 border-white/20 bg-white/5 text-white hover:bg-white/10"
            onClick={onScrollCampaigns}
          >
            <Megaphone className="h-4 w-4" />
            Nueva campaña
          </Button>
        </div>
      </div>
    </section>
  );
}
