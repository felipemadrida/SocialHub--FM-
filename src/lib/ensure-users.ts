import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function ensureDefaultUsers() {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@socialhub.local").toLowerCase();
  const retailEmail = (process.env.RETAIL_EMAIL || "retail@socialhub.local").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";
  const retailPassword = process.env.RETAIL_PASSWORD || "Retail123!";

  const existing = await db.user.count();
  if (existing > 0) return { created: false };

  const adminHash = await bcrypt.hash(adminPassword, 10);
  const retailHash = await bcrypt.hash(retailPassword, 10);

  await db.user.createMany({
    data: [
      {
        email: adminEmail,
        name: "Administrador",
        passwordHash: adminHash,
        role: "admin",
        isActive: true,
      },
      {
        email: retailEmail,
        name: "Usuario Retail",
        passwordHash: retailHash,
        role: "retail",
        isActive: true,
      },
    ],
  });

  return { created: true };
}
