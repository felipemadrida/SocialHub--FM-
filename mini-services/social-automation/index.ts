import { createServer } from "http";

const PORT = Number(process.env.AUTOMATION_PORT || 3031);
const APP_URL = process.env.APP_URL || "http://localhost:3001";

// Simulated social media automation engine
// In production, this would connect to real social media APIs

interface AutomationTask {
  id: string;
  type: string;
  platform: string;
  config: Record<string, unknown>;
  status: string;
  result?: Record<string, unknown>;
  createdAt: string;
}

interface ScheduleRequest {
  postId: string;
  platforms: string[];
  scheduledAt: string;
  content: string;
  mediaUrls?: string[];
}

const activeTasks: Map<string, AutomationTask> = new Map();
const publishQueue: ScheduleRequest[] = [];

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Simulate posting to social media platforms.
// Live Graph/TikTok/X APIs are not wired; mockPublish=false fails closed.
async function publishToPlatform(
  platform: string,
  content: string,
  mediaUrls?: string[],
  mockPublish = true
): Promise<Record<string, unknown>> {
  await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000));

  if (!mockPublish) {
    return {
      platform,
      status: "failed",
      error: `Live API mode for ${platform} is not implemented yet`,
      retryable: false,
    };
  }

  const success = Math.random() > 0.1;

  if (success) {
    return {
      platform,
      status: "published",
      postId: `${platform}_${generateId()}`,
      publishedAt: new Date().toISOString(),
      engagement: {
        likes: Math.floor(Math.random() * 500),
        comments: Math.floor(Math.random() * 100),
        shares: Math.floor(Math.random() * 50),
        reaches: Math.floor(Math.random() * 5000),
      },
    };
  }

  return {
    platform,
    status: "failed",
    error: `Failed to publish to ${platform}: API rate limit exceeded`,
    retryable: true,
  };
}

// Process scheduled posts that are due
async function processScheduledPosts(): Promise<void> {
  const now = new Date();
  const duePosts = publishQueue.filter(
    (post) => new Date(post.scheduledAt) <= now
  );

  for (const post of duePosts) {
    const idx = publishQueue.indexOf(post);
    if (idx > -1) publishQueue.splice(idx, 1);

    const results: Record<string, unknown>[] = [];
    for (const platform of post.platforms) {
      const result = await publishToPlatform(
        platform,
        post.content,
        post.mediaUrls
      );
      results.push(result);
    }

    // Notify Next.js backend about results
    try {
      await fetch(
        `${APP_URL}/api/posts/update-status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postId: post.postId,
            results,
          }),
        }
      );
    } catch (e) {
      console.error("Failed to notify Next.js:", e);
    }
  }
}

// Run automation rule
async function runAutomationRule(
  rule: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const taskId = generateId();
  const task: AutomationTask = {
    id: taskId,
    type: rule.actionType as string,
    platform: (rule.platforms as string[])?.[0] || "unknown",
    config: rule,
    status: "running",
    createdAt: new Date().toISOString(),
  };

  activeTasks.set(taskId, task);

  // Simulate automation execution
  await new Promise((resolve) =>
    setTimeout(resolve, 1000 + Math.random() * 2000)
  );

  const success = Math.random() > 0.15;

  task.status = success ? "completed" : "failed";
  task.result = success
    ? {
        action: rule.actionType,
        platforms: rule.platforms,
        affectedItems: Math.floor(Math.random() * 50) + 1,
        timestamp: new Date().toISOString(),
      }
    : {
        error: "Automation rule execution failed",
        retryable: true,
      };

  return task as unknown as Record<string, unknown>;
}

// Generate mock analytics data
function generateAnalytics(
  platform: string,
  days: number
): Record<string, unknown>[] {
  const data: Record<string, unknown>[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const baseFollowers =
      platform === "instagram"
        ? 12000
        : platform === "facebook"
        ? 8500
        : platform === "tiktok"
        ? 25000
        : 5000;

    const growth = Math.floor((days - i) * (Math.random() * 20 + 5));

    data.push({
      date: date.toISOString().split("T")[0],
      platform,
      followers: baseFollowers + growth,
      following: Math.floor(Math.random() * 500 + 200),
      posts: Math.floor(Math.random() * 5 + 1),
      likes: Math.floor(Math.random() * 2000 + 100),
      comments: Math.floor(Math.random() * 300 + 20),
      shares: Math.floor(Math.random() * 150 + 10),
      reaches: Math.floor(Math.random() * 10000 + 500),
      impressions: Math.floor(Math.random() * 15000 + 2000),
      engagement: parseFloat((Math.random() * 8 + 2).toFixed(1)),
    });
  }

  return data;
}

// HTTP Server
const server = createServer(async (req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url || "/", `http://localhost:${PORT}`);
  const path = url.pathname;

  // Get request body
  const getBody = (): Promise<string> =>
    new Promise((resolve) => {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => resolve(body));
    });

  try {
    // Health check
    if (path === "/api/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", service: "social-automation", port: PORT }));
      return;
    }

    // Schedule a post for publishing
    if (path === "/api/schedule" && req.method === "POST") {
      const body = JSON.parse(await getBody()) as ScheduleRequest;
      publishQueue.push(body);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "scheduled",
          postId: body.postId,
          platforms: body.platforms,
          scheduledAt: body.scheduledAt,
          queueLength: publishQueue.length,
        })
      );
      return;
    }

    // Publish immediately
    if (path === "/api/publish" && req.method === "POST") {
      const body = JSON.parse(await getBody()) as {
        content: string;
        platforms: string[];
        mediaUrls?: string[];
        mockPublish?: boolean;
      };
      const results: Record<string, unknown>[] = [];
      for (const platform of body.platforms) {
        const result = await publishToPlatform(
          platform,
          body.content,
          body.mediaUrls,
          body.mockPublish !== false
        );
        results.push(result);
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ results }));
      return;
    }

    // Run automation rule
    if (path === "/api/automation/run" && req.method === "POST") {
      const body = JSON.parse(await getBody()) as Record<string, unknown>;
      const result = await runAutomationRule(body);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
      return;
    }

    // Get automation tasks status
    if (path === "/api/automation/tasks" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          tasks: Array.from(activeTasks.values()),
          queueLength: publishQueue.length,
        })
      );
      return;
    }

    // Get analytics data
    if (path === "/api/analytics" && req.method === "GET") {
      const platform = url.searchParams.get("platform") || "all";
      const days = parseInt(url.searchParams.get("days") || "30");

      let data: Record<string, unknown>[] = [];
      if (platform === "all") {
        ["facebook", "instagram", "tiktok", "x"].forEach((p) => {
          data = data.concat(generateAnalytics(p, days));
        });
      } else {
        data = generateAnalytics(platform, days);
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ data, platform, days }));
      return;
    }

    // Get publish queue
    if (path === "/api/queue" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          queue: publishQueue,
          length: publishQueue.length,
        })
      );
      return;
    }

    // 404
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  } catch (error) {
    console.error("Error:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Internal server error" }));
  }
});

// Process scheduled posts every 30 seconds
setInterval(processScheduledPosts, 30000);

server.listen(PORT, () => {
  console.log(`Social Automation service running on port ${PORT}`);
});
