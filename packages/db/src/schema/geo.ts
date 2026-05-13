import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  jsonb,
  numeric,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { geofenceTypeEnum } from "./enums";

export const pickupPoints = pgTable(
  "pickup_points",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    latitude: numeric("latitude", { precision: 10, scale: 7 }).notNull(),
    longitude: numeric("longitude", { precision: 10, scale: 7 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    city: varchar("city", { length: 100 }).notNull(),
    country: varchar("country", { length: 2 }).notNull().default("IN"),
    scores: jsonb("scores").default({}),
    landmark: varchar("landmark", { length: 255 }),
    active: boolean("active").default(true),
  }
);

export const geofences = pgTable("geofences", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  type: geofenceTypeEnum("type").notNull(),
  // Boundary stored as GeoJSON string — parsed with PostGIS or app-level
  boundary: jsonb("boundary").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  country: varchar("country", { length: 2 }).notNull().default("IN"),
  rules: jsonb("rules"),
  active: boolean("active").default(true),
});

export type PickupPoint = typeof pickupPoints.$inferSelect;
export type NewPickupPoint = typeof pickupPoints.$inferInsert;
export type Geofence = typeof geofences.$inferSelect;
export type NewGeofence = typeof geofences.$inferInsert;
