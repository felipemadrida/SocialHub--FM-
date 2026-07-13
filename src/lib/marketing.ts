export const CONTENT_TYPES = [
  "post",
  "caption",
  "ad",
  "hashtags",
  "calendar",
  "email",
  "bio",
] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];

export const CONTENT_TYPE_LABELS: Record<ContentType, { label: string; emoji: string }> = {
  post: { label: "Post para Redes", emoji: "📝" },
  caption: { label: "Caption Instagram", emoji: "🎨" },
  ad: { label: "Anuncio Publicitario", emoji: "📢" },
  hashtags: { label: "Estrategia de Hashtags", emoji: "#️⃣" },
  calendar: { label: "Calendario Editorial", emoji: "📅" },
  email: { label: "Email Marketing", emoji: "✉️" },
  bio: { label: "Bio de Perfil", emoji: "⭐" },
};

export const TONES = [
  "profesional",
  "casual",
  "humoristico",
  "inspirador",
  "urgente",
] as const;

export type Tone = (typeof TONES)[number];

export const TONE_LABELS: Record<Tone, string> = {
  profesional: "Profesional",
  casual: "Casual",
  humoristico: "Humorístico",
  inspirador: "Inspirador",
  urgente: "Urgente",
};

export const CAMPAIGN_OBJECTIVES = [
  "awareness",
  "engagement",
  "conversion",
  "traffic",
] as const;

export const CAMPAIGN_OBJECTIVE_LABELS: Record<
  (typeof CAMPAIGN_OBJECTIVES)[number],
  string
> = {
  awareness: "Reconocimiento",
  engagement: "Engagement",
  conversion: "Conversión",
  traffic: "Tráfico",
};

export const CAMPAIGN_STATUSES = [
  "planning",
  "active",
  "paused",
  "completed",
] as const;

export const CAMPAIGN_STATUS_LABELS: Record<
  (typeof CAMPAIGN_STATUSES)[number],
  string
> = {
  planning: "Planificación",
  active: "Activa",
  paused: "Pausada",
  completed: "Completada",
};

export const IMAGE_TEMPLATES = [
  "banner_app",
  "post_promo",
  "stories_ad",
  "thumbnail",
] as const;

export const IMAGE_TEMPLATE_LABELS: Record<
  (typeof IMAGE_TEMPLATES)[number],
  string
> = {
  banner_app: "Banner App",
  post_promo: "Post Promo",
  stories_ad: "Stories Ad",
  thumbnail: "Thumbnail",
};

export const IMAGE_SIZES = [
  "square",
  "horizontal",
  "vertical",
  "banner",
] as const;

export const IMAGE_SIZE_LABELS: Record<(typeof IMAGE_SIZES)[number], string> = {
  square: "Cuadrado (1:1)",
  horizontal: "Horizontal (16:9)",
  vertical: "Vertical / Stories (9:16)",
  banner: "Banner (3:1)",
};

export const IMAGE_SIZE_DIMS: Record<
  (typeof IMAGE_SIZES)[number],
  { w: number; h: number }
> = {
  square: { w: 1080, h: 1080 },
  horizontal: { w: 1920, h: 1080 },
  vertical: { w: 1080, h: 1920 },
  banner: { w: 1500, h: 500 },
};

export const MARKETING_ASSETS = [
  {
    id: "hero-banner",
    file: "/marketing/hero-banner.svg",
    title: "Hero Banner",
    description: "Banner principal SocialHub -FM-",
  },
  {
    id: "scheduler-preview",
    file: "/marketing/scheduler-preview.svg",
    title: "Scheduler Preview",
    description: "Vista previa de agenda",
  },
  {
    id: "automation-preview",
    file: "/marketing/automation-preview.svg",
    title: "Automation Preview",
    description: "Automatización de redes",
  },
  {
    id: "campaign-launch",
    file: "/marketing/campaign-launch.svg",
    title: "Campaign Launch",
    description: "Lanzamiento de campaña",
  },
  {
    id: "app-logo",
    file: "/marketing/app-logo.svg",
    title: "App Logo",
    description: "Logo SocialHub -FM-",
  },
] as const;
