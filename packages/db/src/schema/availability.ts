import {
  pgTable,
  uuid,
  text,
  date,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { vehicles } from "./vehicles";
import { vehicleAvailabilityEnum } from "./enums";

export const vehicleAvailability = pgTable(
  "vehicle_availability",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vehicleId: uuid("vehicle_id")
      .references(() => vehicles.id)
      .notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    type: vehicleAvailabilityEnum("type").notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_vehicle_availability_dates").on(
      table.vehicleId,
      table.startDate,
      table.endDate
    ),
  ]
);

export type VehicleAvailability = typeof vehicleAvailability.$inferSelect;
export type NewVehicleAvailability = typeof vehicleAvailability.$inferInsert;
