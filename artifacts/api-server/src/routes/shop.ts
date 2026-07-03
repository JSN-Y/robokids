import { Router } from "express";
import { db } from "@workspace/db";
import { shopItemsTable, inventoryTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/shop/items", async (_req, res) => {
  const items = await db.select().from(shopItemsTable).orderBy(shopItemsTable.price);
  return res.json(
    items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      icon: item.icon,
      rarity: item.rarity,
      statBonus: item.statBonus,
    }))
  );
});

router.post("/shop/purchase", async (req, res) => {
  const userId = (req.session as any)?.userId;
  if (!userId) return res.status(401).json({ error: "Not authenticated" });

  const { shopItemId } = req.body;
  if (!shopItemId) return res.status(400).json({ error: "shopItemId required" });

  const [item] = await db.select().from(shopItemsTable).where(eq(shopItemsTable.id, shopItemId)).limit(1);
  if (!item) return res.status(404).json({ error: "Item not found" });

  const [existing] = await db
    .select()
    .from(inventoryTable)
    .where(and(eq(inventoryTable.userId, userId), eq(inventoryTable.shopItemId, shopItemId)))
    .limit(1);

  if (existing) return res.status(400).json({ error: "Already owned" });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) return res.status(401).json({ error: "User not found" });

  if (user.coins < item.price) {
    return res.status(400).json({ error: "Insufficient coins" });
  }

  await db.update(usersTable).set({ coins: user.coins - item.price }).where(eq(usersTable.id, userId));
  await db.insert(inventoryTable).values({ userId, shopItemId });

  return res.json({ ok: true });
});

export default router;
