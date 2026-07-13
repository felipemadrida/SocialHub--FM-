import { z } from "zod";
import { ACTION_TYPES, PLATFORMS, TRIGGER_TYPES } from "@/lib/platforms";

export const platformSchema = z.enum(PLATFORMS);
export const postStatusSchema = z.enum(["draft", "scheduled", "published", "failed"]);
export const triggerTypeSchema = z.enum(TRIGGER_TYPES);
export const actionTypeSchema = z.enum(ACTION_TYPES);

export const createAccountSchema = z.object({
  platform: platformSchema,
  accountName: z.string().trim().min(1).max(100),
  avatarUrl: z.string().nullable().optional(),
  accessToken: z.string().max(2000).nullable().optional(),
  refreshToken: z.string().max(2000).nullable().optional(),
  followers: z.number().int().min(0).max(1_000_000_000).optional(),
  following: z.number().int().min(0).max(1_000_000_000).optional(),
  posts: z.number().int().min(0).max(1_000_000_000).optional(),
  engagement: z.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
});

export const updateAccountSchema = z.object({
  id: z.string().min(1),
  accountName: z.string().trim().min(1).max(100).optional(),
  avatarUrl: z.string().nullable().optional(),
  accessToken: z.string().max(2000).nullable().optional(),
  refreshToken: z.string().max(2000).nullable().optional(),
  isActive: z.boolean().optional(),
  followers: z.number().int().min(0).max(1_000_000_000).optional(),
  following: z.number().int().min(0).max(1_000_000_000).optional(),
  posts: z.number().int().min(0).max(1_000_000_000).optional(),
  engagement: z.number().min(0).max(100).optional(),
});

const dateStringSchema = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: "Invalid date" });

const mediaUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(2_000_000)
  .refine(
    (v) =>
      v.startsWith("/") ||
      v.startsWith("data:") ||
      /^https?:\/\//i.test(v),
    { message: "Invalid media URL" }
  );

export const createPostSchema = z.object({
  content: z.string().trim().min(1).max(5000),
  mediaUrls: z.array(mediaUrlSchema).optional(),
  platforms: z.array(platformSchema).min(1),
  status: postStatusSchema.optional().default("draft"),
  scheduledAt: dateStringSchema.nullable().optional(),
  accountId: z.string().min(1),
});

export const updatePostSchema = z.object({
  id: z.string().min(1),
  content: z.string().trim().min(1).max(5000).optional(),
  mediaUrls: z.array(mediaUrlSchema).nullable().optional(),
  platforms: z.array(platformSchema).min(1).optional(),
  status: postStatusSchema.optional(),
  scheduledAt: dateStringSchema.nullable().optional(),
});

export const createAutomationSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().max(500).nullable().optional(),
  triggerType: triggerTypeSchema,
  triggerConfig: z.record(z.string(), z.unknown()).optional(),
  actionType: actionTypeSchema,
  actionConfig: z.record(z.string(), z.unknown()).optional(),
  platforms: z.array(platformSchema).min(1),
  isActive: z.boolean().optional().default(true),
});

export const updateAutomationSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().max(500).nullable().optional(),
  triggerType: triggerTypeSchema.optional(),
  triggerConfig: z.record(z.string(), z.unknown()).optional(),
  actionType: actionTypeSchema.optional(),
  actionConfig: z.record(z.string(), z.unknown()).optional(),
  platforms: z.array(platformSchema).min(1).optional(),
  isActive: z.boolean().optional(),
  lastRunAt: dateStringSchema.nullable().optional(),
  runCount: z.number().int().min(0).optional(),
});

export const publishSchema = z.object({
  content: z.string().trim().min(1).max(5000),
  platforms: z.array(platformSchema).min(1),
  mediaUrls: z.array(z.string().url()).optional(),
});

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Use HH:mm format");

export const updateSettingsSchema = z.object({
  brandName: z.string().trim().min(1).max(80).optional(),
  brandTagline: z.string().trim().min(1).max(160).optional(),
  primaryColor: z.string().trim().min(3).max(80).optional(),
  timezone: z.string().trim().min(1).max(80).optional(),
  defaultPublishTime: timeSchema.optional(),
  enabledPlatforms: z.array(platformSchema).min(1).optional(),
  automationServiceUrl: z.string().url().optional(),
  mockPublish: z.boolean().optional(),
});

export function zodErrorResponse(error: z.ZodError) {
  return {
    error: "Validation failed",
    details: error.flatten(),
  };
}
