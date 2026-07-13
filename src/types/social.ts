export type Platform =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "x"
  | "linkedin"
  | "youtube"
  | "pinterest";

export type PostStatus = "draft" | "scheduled" | "published" | "failed";

export interface SocialAccount {
  id: string;
  platform: string;
  accountName: string;
  avatarUrl: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  isActive: boolean;
  followers: number;
  following: number;
  posts: number;
  engagement: number;
  createdAt: string;
  _count?: { scheduledPosts: number; analytics: number };
}

export interface ScheduledPost {
  id: string;
  content: string;
  mediaUrls: string | null;
  platforms: string;
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  accountId: string;
  likes: number;
  comments: number;
  shares: number;
  reaches: number;
  createdAt: string;
  account?: SocialAccount;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string | null;
  triggerType: string;
  triggerConfig: string | null;
  actionType: string;
  actionConfig: string | null;
  platforms: string;
  isActive: boolean;
  lastRunAt: string | null;
  runCount: number;
  createdAt: string;
}

export interface AnalyticsData {
  date: string;
  platform: string;
  followers: number;
  likes: number;
  comments: number;
  shares: number;
  reaches: number;
  impressions: number;
  engagement: number;
}

export interface AppSettings {
  id: string;
  brandName: string;
  brandTagline: string;
  primaryColor: string;
  timezone: string;
  defaultPublishTime: string;
  enabledPlatforms: string[];
  automationServiceUrl: string;
  mockPublish: boolean;
  updatedAt: string;
}
