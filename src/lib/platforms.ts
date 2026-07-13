import {
  Facebook,
  Instagram,
  Video,
  Twitter,
  Linkedin,
  Youtube,
  Pin,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  type LucideIcon,
} from "lucide-react";

export const PLATFORMS = [
  "facebook",
  "instagram",
  "tiktok",
  "x",
  "linkedin",
  "youtube",
  "pinterest",
] as const;

export type PlatformId = (typeof PLATFORMS)[number];

export const PLATFORM_CONFIG: Record<
  PlatformId,
  { icon: LucideIcon; color: string; bg: string; label: string; avatarBg: string }
> = {
  facebook: {
    icon: Facebook,
    color: "text-blue-600",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    label: "Facebook",
    avatarBg: "1877F2",
  },
  instagram: {
    icon: Instagram,
    color: "text-pink-600",
    bg: "bg-pink-100 dark:bg-pink-900/30",
    label: "Instagram",
    avatarBg: "E4405F",
  },
  tiktok: {
    icon: Video,
    color: "text-gray-900 dark:text-white",
    bg: "bg-gray-100 dark:bg-gray-800",
    label: "TikTok",
    avatarBg: "000000",
  },
  x: {
    icon: Twitter,
    color: "text-gray-900 dark:text-white",
    bg: "bg-gray-100 dark:bg-gray-800",
    label: "X (Twitter)",
    avatarBg: "000000",
  },
  linkedin: {
    icon: Linkedin,
    color: "text-blue-700",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    label: "LinkedIn",
    avatarBg: "0A66C2",
  },
  youtube: {
    icon: Youtube,
    color: "text-red-600",
    bg: "bg-red-100 dark:bg-red-900/30",
    label: "YouTube",
    avatarBg: "FF0000",
  },
  pinterest: {
    icon: Pin,
    color: "text-red-700",
    bg: "bg-red-100 dark:bg-red-900/30",
    label: "Pinterest",
    avatarBg: "E60023",
  },
};

export const STATUS_CONFIG: Record<
  string,
  { color: string; bg: string; icon: LucideIcon; label: string }
> = {
  draft: {
    color: "text-gray-600",
    bg: "bg-gray-100 dark:bg-gray-800",
    icon: FileText,
    label: "Borrador",
  },
  scheduled: {
    color: "text-amber-600",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    icon: Clock,
    label: "Programado",
  },
  published: {
    color: "text-emerald-600",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    icon: CheckCircle2,
    label: "Publicado",
  },
  failed: {
    color: "text-red-600",
    bg: "bg-red-100 dark:bg-red-900/30",
    icon: XCircle,
    label: "Fallido",
  },
};

export const TRIGGER_TYPES = [
  "time_based",
  "schedule",
  "engagement_threshold",
  "new_followers",
  "trending",
  "hashtag_mention",
  "competitor_post",
  "api_webhook",
] as const;

export const ACTION_TYPES = [
  "post",
  "repost",
  "dm",
  "follow_back",
  "like",
  "comment",
  "save_post",
  "add_to_list",
  "send_email",
] as const;

export const TRIGGER_LABELS: Record<(typeof TRIGGER_TYPES)[number], string> = {
  time_based: "Basado en tiempo",
  schedule: "Programado",
  engagement_threshold: "Umbral de engagement",
  new_followers: "Nuevos seguidores",
  trending: "Tendencias",
  hashtag_mention: "Mención de hashtag",
  competitor_post: "Post de competidor",
  api_webhook: "Webhook externo",
};

export const ACTION_LABELS: Record<(typeof ACTION_TYPES)[number], string> = {
  post: "Publicar",
  repost: "Repostear",
  dm: "Mensaje directo",
  follow_back: "Seguir de vuelta",
  like: "Dar like",
  comment: "Comentar",
  save_post: "Guardar post",
  add_to_list: "Agregar a lista",
  send_email: "Enviar email",
};

export const DEFAULT_ENABLED_PLATFORMS: PlatformId[] = [
  "facebook",
  "instagram",
  "tiktok",
  "x",
];

export function getEnabledPlatformEntries(enabled: string[]) {
  return PLATFORMS.filter((p) => enabled.includes(p)).map((id) => ({
    id,
    ...PLATFORM_CONFIG[id],
  }));
}
