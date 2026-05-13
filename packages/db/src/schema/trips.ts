import {
  pgTable,
  uuid,
  varchar,
  integer,
  numeric,
  jsonb,
  timestamp,
  bigserial,
  index,
} from "drizzle-orm/pg-core";
import { bookings } from "./bookings";
import { tripStatusEnum } from "./enums";

export const trips = pgTable("trips", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id")
    .references(() => bookings.id)
    .unique()
    .notNull(),
  status: tripStatusEnum("status").default("pending"),
  actualStart: timestamp("actual_start", { withTimezone: true }),
  actualEnd: timestamp("actual_end", { withTimezone: true }),
  startOdometer: integer("start_odometer"),
  endOdometer: integer("end_odometer"),
  startFuelLevel: numeric("start_fuel_level", { precision: 3, scale: 2 }),
  endFuelLevel: numeric("end_fuel_level", { precision: 3, scale: 2 }),
  preInspection: jsonb("pre_inspection"),
  postInspection: jsonb("post_inspection"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const tripLocations = pgTable(
  "trip_locations",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    tripId: uuid("trip_id")
      .references(() => trips.id)
      .notNull(),
    latitude: numeric("latitude", { precision: 10, scale: 7 }).notNull(),
    longitude: numeric("longitude", { precision: 10, scale: 7 }).notNull(),
    speed: numeric("speed", { precision: 5, scale: 1 }),
    heading: numeric("heading", { precision: 5, scale: 1 }),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("idx_trip_locations").on(table.tripId, table.recordedAt),
  ]
);

export type Trip = typeof trips.$inferSelect;
export type NewTrip = typeof trips.$inferInsert;
export type TripLocation = typeof tripLocations.$inferSelect;
export type NewTripLocation = typeof tripLocations.$inferInsert;
