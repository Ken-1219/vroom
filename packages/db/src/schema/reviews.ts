import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  jsonb,
  timestamp,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { bookings } from "./bookings";
import { users } from "./users";
import { vehicles } from "./vehicles";

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
      .references(() => bookings.id)
      .notNull(),
    reviewerId: uuid("reviewer_id")
      .references(() => users.id)
      .notNull(),
    revieweeId: uuid("reviewee_id").references(() => users.id),
    vehicleId: uuid("vehicle_id").references(() => vehicles.id),
    type: varchar("type", { length: 20 }).notNull(),
    rating: integer("rating").notNull(),
    subRatings: jsonb("sub_ratings"),
    text: text("text"),
    status: varchar("status", { length: 20 }).default("published"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_reviews_vehicle").on(table.vehicleId, table.createdAt),
    check("rating_check", sql`${table.rating} BETWEEN 1 AND 5`),
  ]
);

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
