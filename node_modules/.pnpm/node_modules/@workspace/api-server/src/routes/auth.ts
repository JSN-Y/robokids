import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "robokids_salt").digest("hex");
}

router.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const hash = hashPassword(password);
  if (hash !== user.passwordHash) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  (req.session as any).userId = user.id;

  return res.json({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    coins: user.coins,
    hearts: user.hearts,
    category: user.category,
    currentLevelId: user.currentLevelId,
    currentChapterId: user.currentChapterId,
  });
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {});
  return res.json({ ok: true });
});

export { hashPassword };
export default router;
