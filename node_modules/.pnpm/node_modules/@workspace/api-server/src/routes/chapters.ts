import { Router } from "express";
import { db } from "@workspace/db";
import { chaptersTable, levelsTable, attemptsTable, usersTable } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";

const router = Router();

router.get("/chapters", async (req, res) => {
  const chapters = await db
    .select()
    .from(chaptersTable)
    .orderBy(asc(chaptersTable.order));

  const levels = await db
    .select()
    .from(levelsTable)
    .orderBy(asc(levelsTable.order));

  const result = chapters.map((chapter) => ({
    id: chapter.id,
    title: chapter.title,
    description: chapter.description,
    order: chapter.order,
    levels: levels
      .filter((l) => l.chapterId === chapter.id)
      .map((l) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        difficulty: l.difficulty,
        coinReward: l.coinReward,
        order: l.order,
      })),
  }));

  return res.json(result);
});

router.get("/levels/:id", async (req, res) => {
  const levelId = parseInt(req.params.id, 10);
  if (isNaN(levelId)) return res.status(400).json({ error: "Invalid id" });

  const [level] = await db.select().from(levelsTable).where(eq(levelsTable.id, levelId)).limit(1);
  if (!level) return res.status(404).json({ error: "Level not found" });

  return res.json({
    id: level.id,
    title: level.title,
    description: level.description,
    chapterId: level.chapterId,
    difficulty: level.difficulty,
    coinReward: level.coinReward,
    config: level.config,
    order: level.order,
  });
});

router.post("/attempts", async (req, res) => {
  const userId = (req.session as any)?.userId;
  if (!userId) return res.status(401).json({ error: "Not authenticated" });

  const { levelId, success } = req.body;
  if (!levelId || typeof success !== "boolean") {
    return res.status(400).json({ error: "Invalid data" });
  }

  const [level] = await db.select().from(levelsTable).where(eq(levelsTable.id, levelId)).limit(1);
  if (!level) return res.status(404).json({ error: "Level not found" });

  await db.insert(attemptsTable).values({ userId, levelId, success });

  let coinsEarned = 0;
  let heartsRemaining = 5;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) return res.status(401).json({ error: "User not found" });

  if (success) {
    const existing = await db
      .select()
      .from(attemptsTable)
      .where(and(eq(attemptsTable.userId, userId), eq(attemptsTable.levelId, levelId), eq(attemptsTable.success, true)));

    if (existing.length === 1) {
      coinsEarned = level.coinReward;
      await db
        .update(usersTable)
        .set({
          coins: user.coins + coinsEarned,
          currentLevelId: levelId,
        })
        .where(eq(usersTable.id, userId));
    }
  } else {
    const newHearts = Math.max(0, user.hearts - 1);
    await db
      .update(usersTable)
      .set({
        hearts: newHearts,
        heartsLastLostAt: newHearts < (user.hearts) ? Date.now() : user.heartsLastLostAt,
      })
      .where(eq(usersTable.id, userId));
    heartsRemaining = newHearts;
  }

  const allLevels = await db.select().from(levelsTable).where(eq(levelsTable.chapterId, level.chapterId)).orderBy(asc(levelsTable.order));
  const idx = allLevels.findIndex((l) => l.id === levelId);
  const nextLevel = allLevels[idx + 1];

  let nextLevelId: number | null = null;
  if (success && nextLevel) {
    nextLevelId = nextLevel.id;
  } else if (success && !nextLevel) {
    const chapters = await db.select().from(chaptersTable).orderBy(asc(chaptersTable.order));
    const chapterIdx = chapters.findIndex((c) => c.id === level.chapterId);
    const nextChapter = chapters[chapterIdx + 1];
    if (nextChapter) {
      const nextChapterLevels = await db
        .select()
        .from(levelsTable)
        .where(eq(levelsTable.chapterId, nextChapter.id))
        .orderBy(asc(levelsTable.order))
        .limit(1);
      if (nextChapterLevels[0]) nextLevelId = nextChapterLevels[0].id;
    }
  }

  const updatedUser = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  return res.json({
    success,
    coinsEarned,
    heartsRemaining: updatedUser[0]?.hearts ?? heartsRemaining,
    nextLevelId,
  });
});

export default router;
