import { z } from "zod";
import {
  CAMPAIGN_OBJECTIVES,
  CAMPAIGN_STATUSES,
  CONTENT_TYPES,
  IMAGE_SIZES,
  IMAGE_TEMPLATES,
  TONES,
} from "@/lib/marketing";
import { platformSchema } from "@/lib/validations";

export const createCampaignSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().max(1000).nullable().optional(),
  objective: z.enum(CAMPAIGN_OBJECTIVES),
  budget: z.number().min(0).max(10_000_000).optional().default(0),
  status: z.enum(CAMPAIGN_STATUSES).optional().default("planning"),
  platforms: z.array(platformSchema).min(1),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

export const updateCampaignSchema = createCampaignSchema.partial().extend({
  id: z.string().min(1),
});

export const aiContentSchema = z.object({
  type: z.enum(CONTENT_TYPES),
  platform: platformSchema,
  tone: z.enum(TONES),
  topic: z.string().trim().max(200).optional(),
});

export const aiImageSchema = z.object({
  template: z.enum(IMAGE_TEMPLATES),
  size: z.enum(IMAGE_SIZES),
  headline: z.string().trim().max(120).optional(),
});
