import {
  pgTable,
  uuid,
  varchar,
  integer,
  date,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { payoutStatusEnum } from "./enums";

export const payouts = pgTable(
  "payouts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    hostId: uuid("host_id")
      .references(() => users.id)
      .notNull(),
    amount: integer("amount").notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("INR"),
    status: payoutStatusEnum("status").notNull().default("pending"),
    platformFee: integer("platform_fee").notNull(),
    netAmount: integer("net_amount").notNull(),
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),
    bookingIds: jsonb("booking_ids").$type<string[]>().notNull(),
    gatewayReference: varchar("gateway_reference", { length: 255 }),
    metadata: jsonb("metadata"),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("idx_payouts_host_status").on(table.hostId, table.status)]
);

export type Payout = typeof payouts.$inferSelect;
export type NewPayout = typeof payouts.$inferInsert;
