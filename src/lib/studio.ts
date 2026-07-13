export const STUDIO_TYPES = ["image", "video", "design", "document"] as const;
export type StudioType = (typeof STUDIO_TYPES)[number];

export const STUDIO_TYPE_LABELS: Record<StudioType, string> = {
  image: "Imágenes",
  video: "Videos",
  design: "Diseños",
  document: "Docs",
};

export const STUDIO_CATEGORIES = [
  "marca",
  "campana",
  "producto",
  "redes",
  "docs",
  "otro",
] as const;
export type StudioCategory = (typeof STUDIO_CATEGORIES)[number];

export const STUDIO_CATEGORY_LABELS: Record<StudioCategory, string> = {
  marca: "Marca",
  campana: "Campaña",
  producto: "Producto",
  redes: "Redes",
  docs: "Documentos",
  otro: "Otro",
};

export const IMAGE_EXT = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".avif",
]);
export const VIDEO_EXT = new Set([
  ".mp4",
  ".webm",
  ".mov",
  ".m4v",
  ".avi",
]);
export const DESIGN_EXT = new Set([
  ".psd",
  ".ai",
  ".sketch",
  ".fig",
  ".xd",
]);
export const DOC_EXT = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".txt",
  ".csv",
]);

export function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

export function detectStudioType(
  filename: string,
  mime?: string | null
): StudioType {
  const ext = extOf(filename);
  if (mime?.startsWith("image/") || IMAGE_EXT.has(ext)) return "image";
  if (mime?.startsWith("video/") || VIDEO_EXT.has(ext)) return "video";
  if (DESIGN_EXT.has(ext)) return "design";
  if (
    mime?.includes("pdf") ||
    mime?.includes("document") ||
    mime?.includes("sheet") ||
    mime?.includes("presentation") ||
    DOC_EXT.has(ext)
  ) {
    return "document";
  }
  if (DESIGN_EXT.has(ext)) return "design";
  return "document";
}

export function parseTags(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map(String).map((t) => t.trim()).filter(Boolean)
      : [];
  } catch {
    return String(raw)
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
}

export function serializeTags(tags: string[]): string {
  return JSON.stringify(
    tags.map((t) => t.trim()).filter(Boolean).slice(0, 30)
  );
}

export type StudioAssetDTO = {
  id: string;
  name: string;
  type: StudioType;
  category: StudioCategory | string;
  collection: string | null;
  tags: string[];
  altText: string | null;
  url: string;
  filePath: string | null;
  mimeType: string | null;
  sizeBytes: number;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
};

/** 9 assets de marca / campaña pre-cargados */
export const STUDIO_SEED_ASSETS = [
  {
    name: "Logo Principal",
    type: "image" as const,
    category: "marca" as const,
    collection: "Identidad de Marca",
    tags: ["logo", "identidad", "marca"],
    altText: "Logo SocialHub -FM- con nodos teal→violet",
    url: "/brand/socialhub_logo.png",
    filePath: "brand/socialhub_logo.png",
    mimeType: "image/png",
    isFavorite: true,
  },
  {
    name: "Banner Web",
    type: "image" as const,
    category: "marca" as const,
    collection: "Identidad de Marca",
    tags: ["banner", "web", "identidad"],
    altText: "Banner horizontal SocialHub para web y redes",
    url: "/brand/socialhub_banner.png",
    filePath: "brand/socialhub_banner.png",
    mimeType: "image/png",
    isFavorite: true,
  },
  {
    name: "Hero Background",
    type: "image" as const,
    category: "marca" as const,
    collection: "Identidad de Marca",
    tags: ["hero", "fondo", "branding"],
    altText: "Fondo hero oscuro con nodos brillantes",
    url: "/brand/socialhub_hero_bg.png",
    filePath: "brand/socialhub_hero_bg.png",
    mimeType: "image/png",
    isFavorite: false,
  },
  {
    name: "Favicon",
    type: "image" as const,
    category: "marca" as const,
    collection: "Identidad de Marca",
    tags: ["favicon", "icono"],
    altText: "Favicon minimalista SocialHub",
    url: "/brand/socialhub_favicon.png",
    filePath: "brand/socialhub_favicon.png",
    mimeType: "image/png",
    isFavorite: false,
  },
  {
    name: "Promo Dashboard",
    type: "design" as const,
    category: "campana" as const,
    collection: "Campaña Lanzamiento",
    tags: ["promo", "dashboard", "analytics"],
    altText: "Imagen promo con métricas y dashboards",
    url: "/brand/socialhub_promo.png",
    filePath: "brand/socialhub_promo.png",
    mimeType: "image/png",
    isFavorite: true,
  },
  {
    name: "Post FB/X",
    type: "image" as const,
    category: "campana" as const,
    collection: "Campaña Lanzamiento",
    tags: ["facebook", "x", "post"],
    altText: "Creativo para Facebook y X",
    url: "/brand/socialhub_banner.png",
    filePath: "brand/socialhub_banner.png",
    mimeType: "image/png",
    isFavorite: false,
  },
  {
    name: "Post Instagram",
    type: "image" as const,
    category: "campana" as const,
    collection: "Campaña Lanzamiento",
    tags: ["instagram", "cuadrado", "feed"],
    altText: "Creativo cuadrado para Instagram",
    url: "/brand/socialhub_logo.png",
    filePath: "brand/socialhub_logo.png",
    mimeType: "image/png",
    isFavorite: false,
  },
  {
    name: "TikTok Story",
    type: "image" as const,
    category: "campana" as const,
    collection: "Campaña Lanzamiento",
    tags: ["tiktok", "stories", "vertical"],
    altText: "Creativo estilo story / TikTok",
    url: "/brand/socialhub_hero_bg.png",
    filePath: "brand/socialhub_hero_bg.png",
    mimeType: "image/png",
    isFavorite: false,
  },
  {
    name: "AI Feature",
    type: "design" as const,
    category: "producto" as const,
    collection: "Producto",
    tags: ["ia", "producto", "feature"],
    altText: "Diseño destacado feature IA Studio",
    url: "/brand/socialhub_promo.png",
    filePath: "brand/socialhub_promo.png",
    mimeType: "image/png",
    isFavorite: true,
  },
] as const;
