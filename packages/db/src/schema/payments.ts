import {
  pgTable,
  uuid,
  varchar,
  integer,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { bookings } from "./bookings";
import { users } from "./users";
import { paymentTypeEnum, paymentStatusEnum, paymentMethodEnum } from "./enums";

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
      .references(() => bookings.id)
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    amount: integer("amount").notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("INR"),
    type: paymentTypeEnum("type").notNull(),
    status: paymentStatusEnum("status").notNull(),
    method: paymentMethodEnum("method"),
    gatewayReference: varchar("gateway_reference", { length: 255 }),
    idempotencyKey: varchar("idempotency_key", { length: 255 }).unique().notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("idx_payments_booking").on(table.bookingId)]
);

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
