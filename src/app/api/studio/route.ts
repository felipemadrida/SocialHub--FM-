/**
 * Legacy studio API — proxies to /api/studio/media and /api/studio/upload.
 * Prefer those routes going forward.
 */
export {
  GET,
  POST,
  PATCH,
  DELETE,
} from "@/app/api/studio/media/route";
