import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name"),
  role: text("role").notNull().default("student"),
  coins: integer("coins").notNull().default(0),
  hearts: integer("hearts").notNull().default(5),
  heartsLastLostAt: integer("hearts_last_lost_at"),
  category: integer("category"),
  currentLevelId: integer("current_level_id"),
  currentChapterId: integer("current_chapter_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chaptersTable = pgTable("chapters", {
  id: serial("id").primaryKey(),
  order: integer("order").notNull(),
  title: text("title").notNull(),
  description: text("description"),
});

export const levelsTable = pgTable("levels", {
  id: serial("id").primaryKey(),
  chapterId: integer("chapter_id").notNull(),
  order: integer("order").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  difficulty: text("difficulty").notNull().default("easy"),
  coinReward: integer("coin_reward").notNull().default(10),
  config: jsonb("config").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const attemptsTable = pgTable("attempts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  levelId: integer("level_id").notNull(),
  success: boolean("success").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const shopItemsTable = pgTable("shop_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  category: text("category").notNull(),
  icon: text("icon"),
  rarity: text("rarity").notNull().default("common"),
  statBonus: integer("stat_bonus"),
});

export const inventoryTable = pgTable("inventory", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  shopItemId: integer("shop_item_id").notNull(),
  purchasedAt: timestamp("purchased_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

export const insertChapterSchema = createInsertSchema(chaptersTable).omit({ id: true });
export type InsertChapter = z.infer<typeof insertChapterSchema>;
export type Chapter = typeof chaptersTable.$inferSelect;

export const insertLevelSchema = createInsertSchema(levelsTable).omit({ id: true, createdAt: true });
export type InsertLevel = z.infer<typeof insertLevelSchema>;
export type Level = typeof levelsTable.$inferSelect;

export const insertAttemptSchema = createInsertSchema(attemptsTable).omit({ id: true, createdAt: true });
export type InsertAttempt = z.infer<typeof insertAttemptSchema>;
export type Attempt = typeof attemptsTable.$inferSelect;

export const insertShopItemSchema = createInsertSchema(shopItemsTable).omit({ id: true });
export type InsertShopItem = z.infer<typeof insertShopItemSchema>;
export type ShopItem = typeof shopItemsTable.$inferSelect;

export const insertInventorySchema = createInsertSchema(inventoryTable).omit({ id: true, purchasedAt: true });
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Inventory = typeof inventoryTable.$inferSelect;
