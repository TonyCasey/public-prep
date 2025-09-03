import { pgTable, varchar, timestamp, boolean } from "drizzle-orm/pg-core";

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  token: varchar("token", { length: 255 }).primaryKey(),
  email: varchar("email").notNull(), 
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});