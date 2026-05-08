import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { vehicles } from "./vehicles";

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    renterId: uuid("renter_id")
      .references(() => users.id)
      .notNull(),
    vehicleId: uuid("vehicle_id")
      .references(() => vehicles.id)
      .notNull(),
    hostId: uuid("host_id")
      .references(() => users.id)
      .notNull(),

    status: varchar("status", { length: 20 }).notNull().default("pending"),

    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    pickupLatitude: numeric("pickup_latitude", { precision: 10, scale: 7 }),
    pickupLongitude: numeric("pickup_longitude", { precision: 10, scale: 7 }),
    pickupAddress: text("pickup_address"),
    dropoffLatitude: numeric("dropoff_latitude", { precision: 10, scale: 7 }),
    dropoffLongitude: numeric("dropoff_longitude", { precision: 10, scale: 7 }),
    dropoffAddress: text("dropoff_address"),

    totalAmount: integer("total_amount").notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("INR"),
    priceBreakdown: jsonb("price_breakdown").$type<Record<string, unknown>>().notNull(),

    cancellationReason: text("cancellation_reason"),
    cancelledBy: uuid("cancelled_by"),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),

    pickupOtp: varchar("pickup_otp", { length: 6 }),
    couponCode: varchar("coupon_code", { length: 50 }),
    addons: jsonb("addons").$type<string[]>().default([]),

    version: integer("version").default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_bookings_vehicle_dates").on(
      table.vehicleId,
      table.startDate,
      table.endDate
    ),
    index("idx_bookings_renter").on(table.renterId, table.status),
    index("idx_bookings_host").on(table.hostId, table.status),
  ]
);

export const bookingEvents = pgTable(
  "booking_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
      .references(() => bookings.id)
      .notNull(),
    eventType: varchar("event_type", { length: 50 }).notNull(),
    data: jsonb("data").notNull(),
    actorId: uuid("actor_id"),
    actorType: varchar("actor_type", { length: 20 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_booking_events").on(table.bookingId, table.createdAt),
  ]
);

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type BookingEvent = typeof bookingEvents.$inferSelect;
export type NewBookingEvent = typeof bookingEvents.$inferInsert;
