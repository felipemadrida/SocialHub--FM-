export const BRAND = {
  name: "SocialHub -FM-",
  tagline: "Marketing Hub + IA Studio",
  gradient: {
    from: "#14b8a6", // teal
    to: "#8b5cf6", // violet
    angle: "135deg",
  },
  colors: {
    teal: "#14b8a6",
    violet: "#8b5cf6",
    navy: "#0f172a",
    emerald: "#10b981",
    amber: "#f59e0b",
  },
  typography: {
    family: "Geist Sans",
    titles: "Bold",
    subtitles: "SemiBold",
    body: "Regular",
  },
  style:
    "Minimalista, tech, profesional con toques de color vibrante (teal → violet).",
} as const;

export const BRAND_ASSETS = [
  {
    id: "logo",
    file: "/brand/socialhub_logo.png",
    title: "Logo principal",
    description: "Nodos interconectados, gradiente teal→violet",
    size: "1024×1024",
    platform: "App / avatar / splash",
    kind: "marca" as const,
  },
  {
    id: "favicon",
    file: "/brand/socialhub_favicon.png",
    title: "Favicon",
    description: "Ícono minimalista para pestaña y miniaturas",
    size: "1024×1024",
    platform: "Browser / PWA",
    kind: "marca" as const,
  },
  {
    id: "banner",
    file: "/brand/socialhub_banner.png",
    title: "Banner horizontal",
    description: "Banner para web y redes",
    size: "1344×768",
    platform: "LinkedIn / X / web",
    kind: "marca" as const,
  },
  {
    id: "hero",
    file: "/brand/socialhub_hero_bg.png",
    title: "Hero background",
    description: "Fondo oscuro con nodos brillantes",
    size: "1344×768",
    platform: "Landing / Marketing",
    kind: "marca" as const,
  },
  {
    id: "promo",
    file: "/brand/socialhub_promo.png",
    title: "Promo analytics",
    description: "Imagen promo con métricas y dashboards",
    size: "1344×768",
    platform: "Ads / Instagram / Meta",
    kind: "promo" as const,
  },
  {
    id: "scheduler",
    file: "/marketing/scheduler-preview.svg",
    title: "Scheduler Preview",
    description: "Vista previa de agenda",
    size: "SVG",
    platform: "Docs / onboarding",
    kind: "promo" as const,
  },
  {
    id: "automation",
    file: "/marketing/automation-preview.svg",
    title: "Automation Preview",
    description: "Automatización de redes",
    size: "SVG",
    platform: "Docs / onboarding",
    kind: "promo" as const,
  },
  {
    id: "campaign",
    file: "/marketing/campaign-launch.svg",
    title: "Campaign Launch",
    description: "Lanzamiento de campaña",
    size: "SVG",
    platform: "Docs / onboarding",
    kind: "promo" as const,
  },
] as const;

export const BRAND_USAGE_RULES = [
  "Usar el gradiente teal→violet solo en CTAs, títulos de marca y acentos (no en fondos completos de UI).",
  "Fondo principal: navy #0f172a en hero; UI de app en tema claro/oscuro existente.",
  "Logo con espacio libre ≥ 10% del lado del asset; no distorsionar ni recolorear fuera de la paleta.",
  "Títulos: Geist Bold; subtítulos SemiBold; cuerpo Regular.",
  "Emerald y Amber solo para estados (éxito / alerta), no como color primario de marca.",
] as const;
