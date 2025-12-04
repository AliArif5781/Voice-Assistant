import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const voiceInteractions = pgTable("voice_interactions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().default("anonymous"),
  transcript: text("transcript").notNull(),
  response: text("response").notNull(),
  firebaseDocId: text("firebase_doc_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertVoiceInteractionSchema = createInsertSchema(voiceInteractions).omit({
  id: true,
  createdAt: true,
});

export type InsertVoiceInteraction = z.infer<typeof insertVoiceInteractionSchema>;
export type VoiceInteraction = typeof voiceInteractions.$inferSelect;
