import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, attemptsTable, inventoryTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

const MAX_HEARTS = 5;
const HEART_REGEN_MS = 10 * 60 * 1000; // 10 minutes per heart

async function autoRegenHearts(user: typeof usersTable.$inferSelect) {
  if (user.hearts >= MAX_HEARTS || !user.heartsLastLostAt) return user;
  const now = Date.now();
  const elapsed = now - user.heartsLastLostAt;
  const heartsToRegen = Math.min(
    Math.floor(elapsed / HEART_REGEN_MS),
    MAX_HEARTS - user.hearts
  );
  if (heartsToRegen <= 0) return user;

  const newHearts = Math.min(user.hearts + heartsToRegen, MAX_HEARTS);
  // If fully recharged, clear timestamp; otherwise advance it
  const newLastLostAt = newHearts >= MAX_HEARTS
    ? null
    : user.heartsLastLostAt + heartsToRegen * HEART_REGEN_MS;

  await db
    .update(usersTable)
    .set({ hearts: newHearts, heartsLastLostAt: newLastLostAt })
    .where(eq(usersTable.id, user.id));

  return { ...user, hearts: newHearts, heartsLastLostAt: newLastLostAt };
}

async function requireAuth(req: any, res: any, next: any) {
  const userId = (req.session as any)?.userId;
  if (!userId) return res.status(401).json({ error: "Not authenticated" });
  next();
}

router.get("/me", async (req, res) => {
  const userId = (req.session as any)?.userId;
  if (!userId) return res.status(401).json({ error: "Not authenticated" });

  let [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) return res.status(401).json({ error: "User not found" });

  user = await autoRegenHearts(user);

  return res.json({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    coins: user.coins,
    hearts: user.hearts,
    heartsLastLostAt: user.heartsLastLostAt,
    category: user.category,
    currentLevelId: user.currentLevelId,
    currentChapterId: user.currentChapterId,
  });
});

router.get("/me/progress", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;

  const successAttempts = await db
    .select({ levelId: attemptsTable.levelId })
    .from(attemptsTable)
    .where(and(eq(attemptsTable.userId, userId), eq(attemptsTable.success, true)));

  const uniqueIds = [...new Set(successAttempts.map((a) => a.levelId))];

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  return res.json({
    completedLevelIds: uniqueIds,
    totalCoins: user?.coins ?? 0,
    totalHearts: user?.hearts ?? 0,
  });
});

router.get("/me/inventory", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;

  const items = await db
    .select()
    .from(inventoryTable)
    .where(eq(inventoryTable.userId, userId));

  return res.json(
    items.map((item) => ({
      id: item.id,
      shopItemId: item.shopItemId,
      purchasedAt: item.purchasedAt?.toISOString(),
    }))
  );
});

export default router;
