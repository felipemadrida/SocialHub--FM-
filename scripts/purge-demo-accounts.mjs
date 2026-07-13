/**
 * Purge demo / placeholder social accounts and force live publish.
 * Usage: node scripts/purge-demo-accounts.mjs
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const toRemove = await db.socialAccount.findMany({
    where: {
      OR: [
        { accessToken: null },
        { accessToken: { startsWith: "demo_" } },
        { accessToken: "" },
      ],
    },
    select: { id: true, platform: true, accountName: true, accessToken: true },
  });

  if (toRemove.length) {
    const ids = toRemove.map((a) => a.id);
    await db.analytics.deleteMany({ where: { accountId: { in: ids } } });
    await db.scheduledPost.deleteMany({ where: { accountId: { in: ids } } });
    const deleted = await db.socialAccount.deleteMany({
      where: { id: { in: ids } },
    });
    console.log(
      `Deleted ${deleted.count} placeholder/demo account(s):`,
      toRemove.map((d) => `${d.platform}/${d.accountName}`).join(", ")
    );
  } else {
    console.log("No placeholder/demo accounts found");
  }

  await db.appSettings.updateMany({ data: { mockPublish: false } });
  console.log("mockPublish forced to false");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
