import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  numeric,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";
import { vehicleTypeEnum, fuelTypeEnum, transmissionEnum, vehicleStatusEnum } from "./enums";

export const vehicles = pgTable(
  "vehicles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    hostId: uuid("host_id")
      .references(() => users.id)
      .notNull(),

    make: varchar("make", { length: 100 }).notNull(),
    model: varchar("model", { length: 100 }).notNull(),
    year: integer("year").notNull(),
    variant: varchar("variant", { length: 100 }),
    vehicleType: vehicleTypeEnum("vehicle_type").notNull(),
    fuelType: fuelTypeEnum("fuel_type").notNull(),
    transmission: transmissionEnum("transmission").notNull(),
    seats: integer("seats").notNull(),
    color: varchar("color", { length: 50 }),
    registrationNumber: varchar("registration_number", { length: 30 })
      .unique()
      .notNull(),

    // Spatial queries use earthdistance + cube extensions with a GiST index
    // See migrations/0001_spatial_index.sql
    latitude: numeric("latitude", { precision: 10, scale: 7 }).notNull(),
    longitude: numeric("longitude", { precision: 10, scale: 7 }).notNull(),
    address: text("address"),
    city: varchar("city", { length: 100 }).notNull(),
    country: varchar("country", { length: 2 }).notNull().default("IN"),
    currency: varchar("currency", { length: 3 }).notNull().default("INR"),
    timezone: varchar("timezone", { length: 50 }).notNull().default("Asia/Kolkata"),

    baseDailyRate: integer("base_daily_rate").notNull(),
    weekendRate: integer("weekend_rate"),
    weeklyDiscountPct: integer("weekly_discount_pct").default(0),
    monthlyDiscountPct: integer("monthly_discount_pct").default(0),
    dynamicPricingEnabled: boolean("dynamic_pricing_enabled").default(true),
    minPrice: integer("min_price"),

    photos: jsonb("photos").$type<Array<{ url: string; position: number; isPrimary?: boolean }>>().default([]),
    features: jsonb("features").$type<string[]>().default([]),
    rules: jsonb("rules").$type<Record<string, unknown>>().default({}),
    description: text("description"),

    ratingAvg: numeric("rating_avg", { precision: 2, scale: 1 }).default("0.0"),
    tripCount: integer("trip_count").default(0),
    reviewCount: integer("review_count").default(0),

    status: vehicleStatusEnum("status").default("draft"),
    instantBooking: boolean("instant_booking").default(false),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_vehicles_search").on(
      table.city,
      table.vehicleType,
      table.status,
      table.baseDailyRate
    ),
    index("idx_vehicles_host").on(table.hostId),
  ]
);

export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;
