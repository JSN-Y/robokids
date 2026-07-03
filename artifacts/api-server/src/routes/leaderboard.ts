import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, attemptsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router = Router();

router.get("/leaderboard", async (_req, res) => {
  const students = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.role, "student"))
    .orderBy(desc(usersTable.coins));

  const allAttempts = await db
    .select({ userId: attemptsTable.userId, levelId: attemptsTable.levelId })
    .from(attemptsTable)
    .where(eq(attemptsTable.success, true));

  const completedMap = new Map<number, Set<number>>();
  for (const a of allAttempts) {
    if (!completedMap.has(a.userId)) completedMap.set(a.userId, new Set());
    completedMap.get(a.userId)!.add(a.levelId);
  }

  const result = students.map((u) => ({
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    coins: u.coins,
    completedLevels: completedMap.get(u.id)?.size ?? 0,
  }));

  return res.json(result);
});

export default router;
