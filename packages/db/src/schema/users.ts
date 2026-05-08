import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  numeric,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).unique(),
    phone: varchar("phone", { length: 20 }).unique(),
    name: varchar("name", { length: 255 }).notNull(),
    avatarUrl: text("avatar_url"),
    role: varchar("role", { length: 20 }).notNull().default("renter"),
    trustScore: numeric("trust_score", { precision: 3, scale: 2 }).default(
      "0.50"
    ),
    status: varchar("status", { length: 20 }).default("active"),
    emailVerified: boolean("email_verified").default(false),
    phoneVerified: boolean("phone_verified").default(false),
    documents: jsonb("documents").default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("idx_users_role_status").on(table.role, table.status)]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
