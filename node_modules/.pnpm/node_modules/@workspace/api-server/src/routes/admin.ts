import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, attemptsTable, levelsTable } from "@workspace/db";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import { hashPassword } from "./auth";

const router = Router();

async function requireAdmin(req: any, res: any, next: any) {
  const userId = (req.session as any)?.userId;
  if (!userId) return res.status(401).json({ error: "Not authenticated" });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });

  next();
}

router.get("/admin/stats", requireAdmin, async (_req, res) => {
  const students = await db.select().from(usersTable).where(eq(usersTable.role, "student"));

  const totalStudents = students.length;
  const totalCoinsEarned = students.reduce((acc, s) => acc + s.coins, 0);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayAttempts = await db
    .select()
    .from(attemptsTable)
    .where(gte(attemptsTable.createdAt, todayStart));

  const totalAttemptsToday = todayAttempts.length;

  const studentsPerCategory = {
    category1: students.filter((s) => s.category === 1).length,
    category2: students.filter((s) => s.category === 2).length,
    category3: students.filter((s) => s.category === 3).length,
  };

  const recentAttempts = await db
    .select({
      userId: attemptsTable.userId,
      levelId: attemptsTable.levelId,
      success: attemptsTable.success,
      createdAt: attemptsTable.createdAt,
    })
    .from(attemptsTable)
    .orderBy(desc(attemptsTable.createdAt))
    .limit(10);

  const recentActivity = await Promise.all(
    recentAttempts.map(async (a) => {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, a.userId)).limit(1);
      const [level] = await db.select().from(levelsTable).where(eq(levelsTable.id, a.levelId)).limit(1);
      return {
        username: user?.username ?? "?",
        displayName: user?.displayName ?? null,
        levelTitle: level?.title ?? "?",
        success: a.success,
      };
    })
  );

  return res.json({
    totalStudents,
    totalCoinsEarned,
    totalAttemptsToday,
    studentsPerCategory,
    recentActivity,
  });
});

router.get("/admin/students", requireAdmin, async (_req, res) => {
  const students = await db.select().from(usersTable).where(eq(usersTable.role, "student"));

  const allAttempts = await db
    .select({ userId: attemptsTable.userId, levelId: attemptsTable.levelId })
    .from(attemptsTable)
    .where(eq(attemptsTable.success, true));

  const completedMap = new Map<number, Set<number>>();
  for (const a of allAttempts) {
    if (!completedMap.has(a.userId)) completedMap.set(a.userId, new Set());
    completedMap.get(a.userId)!.add(a.levelId);
  }

  return res.json(
    students.map((s) => ({
      id: s.id,
      username: s.username,
      displayName: s.displayName,
      category: s.category,
      coins: s.coins,
      completedLevels: completedMap.get(s.id)?.size ?? 0,
    }))
  );
});

router.post("/admin/students", requireAdmin, async (req, res) => {
  const { username, password, displayName, category, coins } = req.body;
  if (!username || !password) return res.status(400).json({ error: "username and password required" });

  const passwordHash = hashPassword(password);
  const [user] = await db
    .insert(usersTable)
    .values({ username, passwordHash, displayName, category, coins: coins ?? 0, role: "student" })
    .returning();

  return res.status(201).json({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    coins: user.coins,
    hearts: user.hearts,
    category: user.category,
  });
});

router.get("/admin/students/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user || user.role !== "student") return res.status(404).json({ error: "Not found" });

  const successAttempts = await db
    .select({ levelId: attemptsTable.levelId })
    .from(attemptsTable)
    .where(and(eq(attemptsTable.userId, id), eq(attemptsTable.success, true)));

  const uniqueIds = [...new Set(successAttempts.map((a) => a.levelId))];

  const recentAttempts = await db
    .select()
    .from(attemptsTable)
    .where(eq(attemptsTable.userId, id))
    .orderBy(desc(attemptsTable.createdAt))
    .limit(10);

  const recentWithTitles = await Promise.all(
    recentAttempts.map(async (a) => {
      const [level] = await db.select().from(levelsTable).where(eq(levelsTable.id, a.levelId)).limit(1);
      return {
        levelId: a.levelId,
        levelTitle: level?.title ?? "?",
        success: a.success,
        createdAt: a.createdAt?.toISOString() ?? "",
      };
    })
  );

  return res.json({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    category: user.category,
    coins: user.coins,
    hearts: user.hearts,
    completedLevelIds: uniqueIds,
    recentAttempts: recentWithTitles,
  });
});

router.put("/admin/students/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const { displayName, password, category, coins, hearts } = req.body;
  const updates: any = {};
  if (displayName !== undefined) updates.displayName = displayName;
  if (password) updates.passwordHash = hashPassword(password);
  if (category !== undefined) updates.category = category;
  if (coins !== undefined) updates.coins = coins;
  if (hearts !== undefined) updates.hearts = hearts;

  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, id))
    .returning();

  return res.json({
    id: updated.id,
    username: updated.username,
    displayName: updated.displayName,
    role: updated.role,
    coins: updated.coins,
    hearts: updated.hearts,
    category: updated.category,
  });
});

router.delete("/admin/students/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  await db.delete(usersTable).where(eq(usersTable.id, id));
  return res.status(204).send();
});

export default router;
