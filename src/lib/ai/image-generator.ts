import {
  IMAGE_SIZE_DIMS,
  type IMAGE_SIZES,
  type IMAGE_TEMPLATES,
} from "@/lib/marketing";

type Size = (typeof IMAGE_SIZES)[number];
type Template = (typeof IMAGE_TEMPLATES)[number];

export function buildMarketingSvg(opts: {
  template: Template;
  size: Size;
  brandName?: string;
  headline?: string;
}): { svg: string; dataUrl: string; width: number; height: number } {
  const { w, h } = IMAGE_SIZE_DIMS[opts.size];
  const brand = opts.brandName || "SocialHub -FM-";
  const headline =
    opts.headline ||
    (opts.template === "banner_app"
      ? "Marketing Hub + IA Studio"
      : opts.template === "post_promo"
        ? "Publica más. Esfuérzate menos."
        : opts.template === "stories_ad"
          ? "Tu campaña en 1 clic"
          : "Crece en redes con IA");

  const accent =
    opts.template === "stories_ad"
      ? "#22c55e"
      : opts.template === "thumbnail"
        ? "#38bdf8"
        : "#f8fafc";

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a0a0a"/>
      <stop offset="55%" stop-color="#171717"/>
      <stop offset="100%" stop-color="#262626"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <circle cx="${w * 0.85}" cy="${h * 0.15}" r="${Math.min(w, h) * 0.22}" fill="${accent}" opacity="0.12"/>
  <circle cx="${w * 0.1}" cy="${h * 0.8}" r="${Math.min(w, h) * 0.18}" fill="${accent}" opacity="0.08"/>
  <text x="${w * 0.06}" y="${h * 0.18}" fill="#a3a3a3" font-family="Arial, sans-serif" font-size="${Math.max(22, Math.round(w * 0.028))}" letter-spacing="2">${brand.toUpperCase()}</text>
  <text x="${w * 0.06}" y="${h * 0.42}" fill="#fafafa" font-family="Arial, sans-serif" font-size="${Math.max(36, Math.round(w * 0.055))}" font-weight="700">${escapeXml(headline)}</text>
  <text x="${w * 0.06}" y="${h * 0.55}" fill="#d4d4d4" font-family="Arial, sans-serif" font-size="${Math.max(20, Math.round(w * 0.028))}">Agenda · Automatiza · Campañas · IA</text>
  <rect x="${w * 0.06}" y="${h * 0.72}" width="${Math.min(280, w * 0.35)}" height="${Math.max(48, h * 0.06)}" rx="10" fill="${accent}"/>
  <text x="${w * 0.06 + 24}" y="${h * 0.72 + Math.max(48, h * 0.06) * 0.65}" fill="#111" font-family="Arial, sans-serif" font-size="${Math.max(18, Math.round(w * 0.022))}" font-weight="700">Empezar ahora</text>
</svg>`;

  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  return { svg, dataUrl, width: w, height: h };
}

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
